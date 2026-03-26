<?php
/**
 * Nudgio Shortcode — [nudgio]
 *
 * Generates HMAC-signed iframe URLs for displaying Nudgio recommendation widgets.
 * The API secret never appears in the HTML output — only key_id, ts, nonce, sig, and widget params.
 *
 * Signed URL format:
 *   /ecommerce/widget/{type}?key_id=5&ts=1709913600&nonce=a1b2c3&top=4&style=card&sig=<HMAC>
 *
 * Signature covers ALL query params (not just auth params) — prevents tampering.
 * Same pattern as Shopify Theme App Extension (iframe + auto-resize JS).
 *
 * Auto-detects WooCommerce product ID on product pages for cross-sell/upsell/similar.
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Nudgio_Shortcode {

    // ==========================================
    // Constructor — Register Shortcode
    // ==========================================

    public function __construct() {
        add_shortcode( 'nudgio', array( __CLASS__, 'render_shortcode' ) );
    }

    // ==========================================
    // Shortcode Handler
    // ==========================================

    /**
     * Render the [nudgio] shortcode.
     *
     * This function:
     * 1. Merge shortcode attributes with defaults from wp_options
     * 2. Read and decrypt API credentials from wp_options
     * 3. Auto-detect WooCommerce product ID on product pages (if applicable)
     * 4. Guard: product-dependent types on non-product pages output nothing
     * 5. Build params array with ALL widget params + key_id + ts + nonce
     * 6. Sort alphabetically → canonical query → HMAC-SHA256 → append sig
     * 7. Output iframe with signed URL + auto-resize JS
     *
     * @param array|string $atts Shortcode attributes.
     * @return string HTML output (iframe + resize script).
     */
    public static function render_shortcode( $atts ) {
        // Step 1: Merge attributes with defaults from wp_options
        $atts = shortcode_atts(
            array(
                // Algorithm / data
                'type'                       => get_option( 'nudgio_default_type', 'bestsellers' ),
                'count'                      => get_option( 'nudgio_default_count', 4 ),
                'device'                     => get_option( 'nudgio_default_device', 'desktop' ),
                'product_id'                 => '',
                'lookback_days'              => '30',
                'method'                     => 'volume',
                'min_price_increase_percent' => '10',
                // Group 1: Widget Container
                'widget_bg_color'            => get_option( 'nudgio_default_widget_bg_color', '#FFFFFF' ),
                'widget_padding'             => get_option( 'nudgio_default_widget_padding', 16 ),
                // Group 2: Widget Title
                'widget_title'               => get_option( 'nudgio_default_widget_title', '' ),
                'title_color'                => get_option( 'nudgio_default_title_color', '#111827' ),
                'title_size'                 => get_option( 'nudgio_default_title_size', 24 ),
                'title_alignment'            => get_option( 'nudgio_default_title_alignment', 'left' ),
                // Group 3: Layout
                'widget_style'               => get_option( 'nudgio_default_widget_style', 'grid' ),
                'widget_columns'             => get_option( 'nudgio_default_widget_columns', 4 ),
                'gap'                        => get_option( 'nudgio_default_gap', 16 ),
                'card_min_width'             => get_option( 'nudgio_default_card_min_width', 200 ),
                'card_max_width'             => get_option( 'nudgio_default_card_max_width', 0 ),
                // Group 4: Product Card
                'card_bg_color'              => get_option( 'nudgio_default_card_bg_color', '#FFFFFF' ),
                'card_border_radius'         => get_option( 'nudgio_default_card_border_radius', 8 ),
                'card_border_width'          => get_option( 'nudgio_default_card_border_width', 0 ),
                'card_border_color'          => get_option( 'nudgio_default_card_border_color', '#E5E7EB' ),
                'card_shadow'                => get_option( 'nudgio_default_card_shadow', 'md' ),
                'card_padding'               => get_option( 'nudgio_default_card_padding', 16 ),
                'card_hover'                 => get_option( 'nudgio_default_card_hover', 'lift' ),
                // Group 5: Product Image
                'image_aspect_w'             => get_option( 'nudgio_default_image_aspect_w', 1 ),
                'image_aspect_h'             => get_option( 'nudgio_default_image_aspect_h', 1 ),
                'image_fit'                  => get_option( 'nudgio_default_image_fit', 'cover' ),
                'image_radius'               => get_option( 'nudgio_default_image_radius', 8 ),
                // Group 6: Product Title in Card
                'product_title_color'        => get_option( 'nudgio_default_product_title_color', '#1F2937' ),
                'product_title_size'         => get_option( 'nudgio_default_product_title_size', 14 ),
                'product_title_weight'       => get_option( 'nudgio_default_product_title_weight', 600 ),
                'product_title_lines'        => get_option( 'nudgio_default_product_title_lines', 2 ),
                'product_title_alignment'    => get_option( 'nudgio_default_product_title_alignment', 'left' ),
                // Group 7: Price
                'show_price'                 => get_option( 'nudgio_default_show_price', true ) ? 'true' : 'false',
                'price_color'                => get_option( 'nudgio_default_price_color', '#111827' ),
                'price_size'                 => get_option( 'nudgio_default_price_size', 18 ),
                // Group 8: CTA Button
                'button_text'                => get_option( 'nudgio_default_button_text', 'View' ),
                'button_bg_color'            => get_option( 'nudgio_default_button_bg_color', '#3B82F6' ),
                'button_text_color'          => get_option( 'nudgio_default_button_text_color', '#FFFFFF' ),
                'button_radius'              => get_option( 'nudgio_default_button_radius', 6 ),
                'button_size'                => get_option( 'nudgio_default_button_size', 14 ),
                'button_variant'             => get_option( 'nudgio_default_button_variant', 'solid' ),
                'button_full_width'          => get_option( 'nudgio_default_button_full_width', false ) ? 'true' : 'false',
            ),
            $atts,
            'nudgio'
        );

        // Step 2: Read and decrypt API credentials
        $key_id     = absint( get_option( 'nudgio_key_id', 0 ) );
        $encrypted  = get_option( 'nudgio_api_secret', '' );
        $server_url = esc_url_raw( get_option( 'nudgio_server_url', 'https://server.nudgio.tech' ) );

        // No credentials configured — output HTML comment for debugging (View Source)
        if ( ! $key_id || empty( $encrypted ) ) {
            return '<!-- Nudgio: No API credentials configured. Go to Settings → Nudgio Technologies. -->';
        }

        // Decrypt the stored secret
        $secret = Nudgio_Settings::decrypt_secret( $encrypted );
        if ( false === $secret ) {
            return '<!-- Nudgio: Failed to decrypt API secret. Re-enter your API secret in Settings → Nudgio Technologies. -->';
        }

        // Sanitize type to allowed values
        $type = sanitize_text_field( $atts['type'] );
        $allowed_types = array( 'bestsellers', 'cross-sell', 'upsell', 'similar' );
        if ( ! in_array( $type, $allowed_types, true ) ) {
            $type = 'bestsellers';
        }

        // Step 3: Auto-detect WooCommerce product ID on product pages
        $product_id = sanitize_text_field( $atts['product_id'] );
        if ( empty( $product_id ) && function_exists( 'wc_get_product' ) ) {
            global $product;
            if ( $product instanceof WC_Product ) {
                $product_id = (string) $product->get_id();
            }
        }

        // Debug: output detected product context as HTML comment (visible in View Source)
        $debug_output = '<!-- Nudgio: type="' . esc_html( $type ) . '" | product_id="' . esc_html( $product_id ) . '" | is_product_page=' . ( is_singular( 'product' ) ? 'yes' : 'no' ) . ' -->';

        // Step 4: Guard — product-dependent types on non-product pages output nothing
        $product_required_types = array( 'cross-sell', 'upsell', 'similar' );
        if ( in_array( $type, $product_required_types, true ) && empty( $product_id ) ) {
            return $debug_output . '<!-- Nudgio: type="' . esc_html( $type ) . '" requires a product page or explicit product_id attribute. No product context detected. -->';
        }

        // Step 5: Build params array with ALL widget params + auth params
        // URL param name = DB column name (no mapping needed)
        $params = array(
            'key_id'                  => $key_id,
            'ts'                      => time(),
            'nonce'                   => bin2hex( random_bytes( 8 ) ),
            // Algorithm / data
            'top'                     => absint( $atts['count'] ),
            'device'                  => sanitize_text_field( $atts['device'] ),
            // Group 1: Widget Container
            'widget_bg_color'         => sanitize_hex_color( $atts['widget_bg_color'] ),
            'widget_padding'          => absint( $atts['widget_padding'] ),
            // Group 2: Widget Title
            'title_color'             => sanitize_hex_color( $atts['title_color'] ),
            'title_size'              => absint( $atts['title_size'] ),
            'title_alignment'         => sanitize_text_field( $atts['title_alignment'] ),
            // Group 3: Layout
            'widget_style'            => sanitize_text_field( $atts['widget_style'] ),
            'widget_columns'          => absint( $atts['widget_columns'] ),
            'gap'                     => absint( $atts['gap'] ),
            'card_min_width'          => absint( $atts['card_min_width'] ),
            'card_max_width'          => absint( $atts['card_max_width'] ),
            // Group 4: Product Card
            'card_bg_color'           => sanitize_hex_color( $atts['card_bg_color'] ),
            'card_border_radius'      => absint( $atts['card_border_radius'] ),
            'card_border_width'       => absint( $atts['card_border_width'] ),
            'card_border_color'       => sanitize_hex_color( $atts['card_border_color'] ),
            'card_shadow'             => sanitize_text_field( $atts['card_shadow'] ),
            'card_padding'            => absint( $atts['card_padding'] ),
            'card_hover'              => sanitize_text_field( $atts['card_hover'] ),
            // Group 5: Product Image
            'image_aspect_w'          => absint( $atts['image_aspect_w'] ),
            'image_aspect_h'          => absint( $atts['image_aspect_h'] ),
            'image_fit'               => sanitize_text_field( $atts['image_fit'] ),
            'image_radius'            => absint( $atts['image_radius'] ),
            // Group 6: Product Title in Card
            'product_title_color'     => sanitize_hex_color( $atts['product_title_color'] ),
            'product_title_size'      => absint( $atts['product_title_size'] ),
            'product_title_weight'    => intval( $atts['product_title_weight'] ),
            'product_title_lines'     => absint( $atts['product_title_lines'] ),
            'product_title_alignment' => sanitize_text_field( $atts['product_title_alignment'] ),
            // Group 7: Price
            // Boolean → 'true'/'false' string (sanitize_text_field(false) returns '' which FastAPI rejects)
            'show_price'              => filter_var( $atts['show_price'], FILTER_VALIDATE_BOOLEAN ) ? 'true' : 'false',
            'price_color'             => sanitize_hex_color( $atts['price_color'] ),
            'price_size'              => absint( $atts['price_size'] ),
            // Group 8: CTA Button
            'button_text'             => sanitize_text_field( $atts['button_text'] ),
            'button_bg_color'         => sanitize_hex_color( $atts['button_bg_color'] ),
            'button_text_color'       => sanitize_hex_color( $atts['button_text_color'] ),
            'button_radius'           => absint( $atts['button_radius'] ),
            'button_size'             => absint( $atts['button_size'] ),
            'button_variant'          => sanitize_text_field( $atts['button_variant'] ),
            // Boolean → 'true'/'false' string (sanitize_text_field(false) returns '' which FastAPI rejects)
            'button_full_width'       => filter_var( $atts['button_full_width'], FILTER_VALIDATE_BOOLEAN ) ? 'true' : 'false',
        );

        // Only include widget_title if non-empty (empty = server auto-defaults)
        $widget_title = sanitize_text_field( $atts['widget_title'] );
        if ( ! empty( $widget_title ) ) {
            $params['widget_title'] = $widget_title;
        }

        // Add type-specific params
        if ( 'bestsellers' === $type ) {
            $params['lookback_days'] = absint( $atts['lookback_days'] );
            $params['method']        = sanitize_text_field( $atts['method'] );
        } elseif ( 'cross-sell' === $type ) {
            $params['product_id']    = $product_id;
            $params['lookback_days'] = absint( $atts['lookback_days'] );
        } elseif ( 'upsell' === $type ) {
            $params['product_id']                 = $product_id;
            $params['min_price_increase_percent']  = absint( $atts['min_price_increase_percent'] );
        } elseif ( 'similar' === $type ) {
            $params['product_id'] = $product_id;
        }

        // Step 6: Sort alphabetically → canonical query → HMAC-SHA256 → append sig
        ksort( $params );
        $canonical    = http_build_query( $params );
        $params['sig'] = hash_hmac( 'sha256', $canonical, $secret );

        // Build the full signed URL
        $url = trailingslashit( $server_url ) . 'ecommerce/widget/' . $type . '?' . http_build_query( $params );

        // Step 7: Output iframe with signed URL + auto-resize JS
        // Unique frame ID per shortcode instance (for resize targeting)
        $frame_id = 'nudgio-frame-' . wp_rand( 100000, 999999 );

        // Enqueue the auto-resize script (once per page, printed in wp_footer)
        wp_enqueue_script(
            'nudgio-resize',
            NUDGIO_PLUGIN_URL . 'assets/nudgio-resize.js',
            array(),
            NUDGIO_VERSION,
            true
        );

        $output  = '<iframe';
        $output .= ' id="' . esc_attr( $frame_id ) . '"';
        $output .= ' class="nudgio-frame"';
        $output .= ' src="' . esc_url( $url ) . '"';
        $output .= ' style="width:100%;border:none;overflow:hidden;min-height:200px;"';
        $output .= ' loading="lazy"';
        $output .= ' title="' . esc_attr__( 'Nudgio Product Recommendations', 'nudgio-technologies' ) . '"';
        $output .= '></iframe>';

        return $debug_output . $output;
    }
}
