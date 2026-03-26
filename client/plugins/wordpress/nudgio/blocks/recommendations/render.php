<?php
/**
 * Nudgio Technologies — Gutenberg Block Frontend Render
 *
 * Called by WordPress when displaying the block on the frontend.
 * Maps block attributes to shortcode-compatible array and delegates
 * to Nudgio_Shortcode::render_shortcode() — reuses ALL existing logic:
 * credential decryption, HMAC signing, product auto-detection, guards, iframe + auto-resize JS.
 *
 * @var array    $attributes Block attributes (from block.json defaults + editor).
 * @var string   $content    Inner block content (empty for this block).
 * @var WP_Block $block      Block instance.
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Map block attributes to shortcode-compatible array
// URL param name = DB column name = block attribute name (no mapping table needed)
$nudgio_atts = array(
    // Algorithm / data
    'type'                       => $attributes['type'],
    'count'                      => $attributes['count'],
    'product_id'                 => $attributes['product_id'],
    'lookback_days'              => $attributes['lookback_days'],
    'method'                     => $attributes['method'],
    'min_price_increase_percent' => $attributes['min_price_increase_percent'],
    // Group 1: Widget Container
    'widget_bg_color'            => $attributes['widget_bg_color'],
    'widget_padding'             => $attributes['widget_padding'],
    // Group 2: Widget Title
    'widget_title'               => $attributes['widget_title'],
    'title_color'                => $attributes['title_color'],
    'title_size'                 => $attributes['title_size'],
    'title_alignment'            => $attributes['title_alignment'],
    // Group 3: Layout
    'widget_style'               => $attributes['widget_style'],
    'widget_columns'             => $attributes['widget_columns'],
    'gap'                        => $attributes['gap'],
    'card_min_width'             => $attributes['card_min_width'],
    'card_max_width'             => $attributes['card_max_width'],
    // Group 4: Product Card
    'card_bg_color'              => $attributes['card_bg_color'],
    'card_border_radius'         => $attributes['card_border_radius'],
    'card_border_width'          => $attributes['card_border_width'],
    'card_border_color'          => $attributes['card_border_color'],
    'card_shadow'                => $attributes['card_shadow'],
    'card_padding'               => $attributes['card_padding'],
    'card_hover'                 => $attributes['card_hover'],
    // Group 5: Product Image
    'image_aspect_w'             => $attributes['image_aspect_w'],
    'image_aspect_h'             => $attributes['image_aspect_h'],
    'image_fit'                  => $attributes['image_fit'],
    'image_radius'               => $attributes['image_radius'],
    // Group 6: Product Title in Card
    'product_title_color'        => $attributes['product_title_color'],
    'product_title_size'         => $attributes['product_title_size'],
    'product_title_weight'       => $attributes['product_title_weight'],
    'product_title_lines'        => $attributes['product_title_lines'],
    'product_title_alignment'    => $attributes['product_title_alignment'],
    // Group 7: Price
    'show_price'                 => $attributes['show_price'],
    'price_color'                => $attributes['price_color'],
    'price_size'                 => $attributes['price_size'],
    // Group 8: CTA Button
    'button_text'                => $attributes['button_text'],
    'button_bg_color'            => $attributes['button_bg_color'],
    'button_text_color'          => $attributes['button_text_color'],
    'button_radius'              => $attributes['button_radius'],
    'button_size'                => $attributes['button_size'],
    'button_variant'             => $attributes['button_variant'],
    'button_full_width'          => $attributes['button_full_width'],
);

// Render using the existing shortcode pipeline
$nudgio_output = Nudgio_Shortcode::render_shortcode( $nudgio_atts );

// Product-dependent types on non-product pages — show friendly message in block wrapper
$nudgio_product_required_types = array( 'cross-sell', 'upsell', 'similar' );
if ( empty( $nudgio_output ) && in_array( $attributes['type'], $nudgio_product_required_types, true ) ) {
    $nudgio_output = '<p style="padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;color:#6b7280;font-size:14px;text-align:center;">'
        . esc_html__( 'This widget requires a product page. Add it to a WooCommerce product page or specify a Product ID in the block settings.', 'nudgio-technologies' )
        . '</p>';
}

// Wrap in block wrapper div (adds alignment classes from supports.align)
if ( ! empty( $nudgio_output ) ) {
    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() returns sanitized HTML attributes, $nudgio_output is pre-escaped by Nudgio_Shortcode::render_shortcode()
    echo '<div ' . get_block_wrapper_attributes() . '>' . $nudgio_output . '</div>';
}
