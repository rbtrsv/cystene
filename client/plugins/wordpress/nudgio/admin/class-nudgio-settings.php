<?php
/**
 * Nudgio Settings — WP Admin Settings Page
 *
 * Registers the settings page under Settings → Nudgio Technologies.
 * Uses WordPress Settings API (register_setting, add_settings_section, add_settings_field).
 *
 * API secret is encrypted via openssl_encrypt() with a key derived from AUTH_KEY
 * (wp-config.php) before storing in wp_options. WP does NOT guarantee encryption at rest.
 *
 * Includes "Test Connection" functionality — generates a signed URL server-side
 * and calls it via wp_remote_get to verify the API key works.
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Nudgio_Settings {

    // ==========================================
    // Encryption Constants
    // ==========================================

    /** OpenSSL cipher for encrypting the API secret in wp_options */
    const CIPHER_METHOD = 'aes-256-cbc';

    // ==========================================
    // Constructor — Register Settings
    // ==========================================

    public function __construct() {
        add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );

        // Handle "Test Connection" AJAX request
        add_action( 'wp_ajax_nudgio_test_connection', array( $this, 'ajax_test_connection' ) );

        // Handle "Sync Data" AJAX request
        add_action( 'wp_ajax_nudgio_sync_data', array( $this, 'ajax_sync_data' ) );
    }

    // ==========================================
    // Admin Menu
    // ==========================================

    /**
     * Add settings page under Settings → Nudgio Technologies.
     */
    public function add_settings_page() {
        add_options_page(
            __( 'Nudgio Technologies', 'nudgio-technologies' ),
            __( 'Nudgio Technologies', 'nudgio-technologies' ),
            'manage_options',
            'nudgio',
            array( $this, 'render_settings_page' )
        );
    }

    // ==========================================
    // Enqueue Admin Scripts
    // ==========================================

    /**
     * Enqueue admin JavaScript on the Nudgio settings page only.
     * Passes nonces and i18n strings via wp_localize_script().
     *
     * @param string $hook_suffix The current admin page hook suffix.
     */
    public function enqueue_admin_scripts( $hook_suffix ) {
        // Only load on our settings page (Settings → Nudgio Technologies)
        if ( 'settings_page_nudgio' !== $hook_suffix ) {
            return;
        }

        wp_enqueue_script(
            'nudgio-admin',
            NUDGIO_PLUGIN_URL . 'admin/js/nudgio-admin.js',
            array(),
            NUDGIO_VERSION,
            true
        );

        wp_localize_script( 'nudgio-admin', 'nudgioAdmin', array(
            'ajaxurl'   => admin_url( 'admin-ajax.php' ),
            'testNonce' => wp_create_nonce( 'nudgio_test_connection' ),
            'syncNonce' => wp_create_nonce( 'nudgio_sync_data' ),
            'i18n'      => array(
                'testing'        => __( 'Testing...', 'nudgio-technologies' ),
                'testConnection' => __( 'Test Connection', 'nudgio-technologies' ),
                'syncing'        => __( 'Syncing...', 'nudgio-technologies' ),
                'syncData'       => __( 'Sync Data', 'nudgio-technologies' ),
                'requestFailed'  => __( 'Request failed.', 'nudgio-technologies' ),
            ),
        ) );
    }

    // ==========================================
    // Register Settings (WP Settings API)
    // ==========================================

    /**
     * Register all settings, sections, and fields.
     * Uses register_setting() with sanitization callbacks.
     */
    public function register_settings() {
        // --- API Credentials Section ---
        add_settings_section(
            'nudgio_credentials_section',
            __( 'API Credentials', 'nudgio-technologies' ),
            array( $this, 'credentials_section_callback' ),
            'nudgio'
        );

        register_setting( 'nudgio_settings', 'nudgio_key_id', array(
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'default'           => 0,
        ) );
        add_settings_field(
            'nudgio_key_id',
            __( 'Key ID', 'nudgio-technologies' ),
            array( $this, 'render_key_id_field' ),
            'nudgio',
            'nudgio_credentials_section'
        );

        register_setting( 'nudgio_settings', 'nudgio_api_secret', array(
            'type'              => 'string',
            'sanitize_callback' => array( $this, 'sanitize_api_secret' ),
            'default'           => '',
        ) );
        add_settings_field(
            'nudgio_api_secret',
            __( 'API Secret', 'nudgio-technologies' ),
            array( $this, 'render_api_secret_field' ),
            'nudgio',
            'nudgio_credentials_section'
        );

        register_setting( 'nudgio_settings', 'nudgio_server_url', array(
            'type'              => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default'           => 'https://server.nudgio.tech',
        ) );
        add_settings_field(
            'nudgio_server_url',
            __( 'Server URL', 'nudgio-technologies' ),
            array( $this, 'render_server_url_field' ),
            'nudgio',
            'nudgio_credentials_section'
        );

        // --- Default Widget Settings Section ---
        // Widget type and count are standalone fields; all 35 visual settings
        // are registered as generic text/color/select/boolean options and rendered
        // via reusable helper methods (render_color_field, render_select_field, etc.).
        add_settings_section(
            'nudgio_defaults_section',
            __( 'Default Widget Settings', 'nudgio-technologies' ),
            array( $this, 'defaults_section_callback' ),
            'nudgio'
        );

        register_setting( 'nudgio_settings', 'nudgio_default_type', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => 'bestsellers',
        ) );
        add_settings_field(
            'nudgio_default_type',
            __( 'Widget Type', 'nudgio-technologies' ),
            array( $this, 'render_default_type_field' ),
            'nudgio',
            'nudgio_defaults_section'
        );

        register_setting( 'nudgio_settings', 'nudgio_default_count', array(
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'default'           => 4,
        ) );
        add_settings_field(
            'nudgio_default_count',
            __( 'Number of Products', 'nudgio-technologies' ),
            array( $this, 'render_default_count_field' ),
            'nudgio',
            'nudgio_defaults_section'
        );

        // --- Group 1: Widget Container ---
        $this->register_color_setting( 'widget_bg_color', __( 'Widget Background', 'nudgio-technologies' ), '#FFFFFF' );
        $this->register_number_setting( 'widget_padding', __( 'Widget Padding (px)', 'nudgio-technologies' ), 16, 0, 48, __( 'Widget container padding in pixels.', 'nudgio-technologies' ) );

        // --- Group 2: Widget Title ---
        $this->register_text_setting( 'widget_title', __( 'Widget Title', 'nudgio-technologies' ), '', __( 'Leave empty for auto-default based on widget type.', 'nudgio-technologies' ) );
        $this->register_color_setting( 'title_color', __( 'Title Color', 'nudgio-technologies' ), '#111827' );
        $this->register_number_setting( 'title_size', __( 'Title Size (px)', 'nudgio-technologies' ), 24, 8, 48, __( 'Widget heading font-size in pixels.', 'nudgio-technologies' ) );
        $this->register_select_setting( 'title_alignment', __( 'Title Alignment', 'nudgio-technologies' ), 'left', array( 'left' => 'Left', 'center' => 'Center' ) );

        // --- Group 3: Layout ---
        $this->register_select_setting( 'widget_style', __( 'Layout Style', 'nudgio-technologies' ), 'grid', array( 'grid' => 'Card Grid', 'carousel' => 'Carousel' ) );
        $this->register_number_setting( 'widget_columns', __( 'Columns (1-6)', 'nudgio-technologies' ), 4, 1, 6, __( 'Max columns at full width. Responsive: 1→2→N.', 'nudgio-technologies' ) );
        $this->register_number_setting( 'gap', __( 'Gap (px)', 'nudgio-technologies' ), 16, 0, 48, __( 'Gap between cards in pixels.', 'nudgio-technologies' ) );
        $this->register_number_setting( 'card_min_width', __( 'Card Min Width (px)', 'nudgio-technologies' ), 200, 100, 500, __( 'Minimum card width in pixels. Prevents cards from shrinking below usable size.', 'nudgio-technologies' ) );
        $this->register_number_setting( 'card_max_width', __( 'Card Max Width (px)', 'nudgio-technologies' ), 0, 0, 800, __( 'Maximum card width in pixels. 0 = no limit.', 'nudgio-technologies' ) );

        // --- Group 4: Product Card ---
        $this->register_color_setting( 'card_bg_color', __( 'Card Background', 'nudgio-technologies' ), '#FFFFFF' );
        $this->register_number_setting( 'card_border_radius', __( 'Card Border Radius (px)', 'nudgio-technologies' ), 8, 0, 50, __( 'Card corner radius in pixels.', 'nudgio-technologies' ) );
        $this->register_number_setting( 'card_border_width', __( 'Card Border Width (px)', 'nudgio-technologies' ), 0, 0, 10, __( 'Card border width in pixels.', 'nudgio-technologies' ) );
        $this->register_color_setting( 'card_border_color', __( 'Card Border Color', 'nudgio-technologies' ), '#E5E7EB' );
        $this->register_select_setting( 'card_shadow', __( 'Card Shadow', 'nudgio-technologies' ), 'md', array( 'none' => 'None', 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large' ) );
        $this->register_number_setting( 'card_padding', __( 'Card Padding (px)', 'nudgio-technologies' ), 16, 0, 48, __( 'Card content padding in pixels.', 'nudgio-technologies' ) );
        $this->register_select_setting( 'card_hover', __( 'Card Hover', 'nudgio-technologies' ), 'lift', array( 'none' => 'None', 'lift' => 'Lift', 'shadow' => 'Shadow', 'glow' => 'Glow' ) );

        // --- Group 5: Product Image ---
        $this->register_number_setting( 'image_aspect_w', __( 'Image Aspect Width', 'nudgio-technologies' ), 1, 1, 20, __( 'Aspect ratio width (e.g. 1 for square, 16 for widescreen).', 'nudgio-technologies' ) );
        $this->register_number_setting( 'image_aspect_h', __( 'Image Aspect Height', 'nudgio-technologies' ), 1, 1, 20, __( 'Aspect ratio height (e.g. 1 for square, 9 for widescreen).', 'nudgio-technologies' ) );
        $this->register_select_setting( 'image_fit', __( 'Image Fit', 'nudgio-technologies' ), 'cover', array( 'cover' => 'Cover', 'contain' => 'Contain' ) );
        $this->register_number_setting( 'image_radius', __( 'Image Border Radius (px)', 'nudgio-technologies' ), 8, 0, 50, __( 'Image corner radius in pixels.', 'nudgio-technologies' ) );

        // --- Group 6: Product Title in Card ---
        $this->register_color_setting( 'product_title_color', __( 'Product Title Color', 'nudgio-technologies' ), '#1F2937' );
        $this->register_number_setting( 'product_title_size', __( 'Product Title Size (px)', 'nudgio-technologies' ), 14, 8, 36, __( 'Product title font-size in pixels.', 'nudgio-technologies' ) );
        $this->register_number_setting( 'product_title_weight', __( 'Product Title Weight', 'nudgio-technologies' ), 600, 100, 900, __( 'CSS font-weight (100–900, step 100).', 'nudgio-technologies' ) );
        $this->register_number_setting( 'product_title_lines', __( 'Product Title Max Lines', 'nudgio-technologies' ), 2, 1, 3 );
        $this->register_select_setting( 'product_title_alignment', __( 'Product Title Alignment', 'nudgio-technologies' ), 'left', array( 'left' => 'Left', 'center' => 'Center' ) );

        // --- Group 7: Price ---
        $this->register_boolean_setting( 'show_price', __( 'Show Price', 'nudgio-technologies' ), true, __( 'Display product price on widget cards.', 'nudgio-technologies' ) );
        $this->register_color_setting( 'price_color', __( 'Price Color', 'nudgio-technologies' ), '#111827' );
        $this->register_number_setting( 'price_size', __( 'Price Size (px)', 'nudgio-technologies' ), 18, 8, 36, __( 'Price font-size in pixels.', 'nudgio-technologies' ) );

        // --- Group 8: CTA Button ---
        $this->register_text_setting( 'button_text', __( 'Button Text', 'nudgio-technologies' ), 'View', __( 'Call-to-action text (e.g. View, Shop Now, Add to Cart).', 'nudgio-technologies' ) );
        $this->register_color_setting( 'button_bg_color', __( 'Button Color', 'nudgio-technologies' ), '#3B82F6' );
        $this->register_color_setting( 'button_text_color', __( 'Button Text Color', 'nudgio-technologies' ), '#FFFFFF' );
        $this->register_number_setting( 'button_radius', __( 'Button Border Radius (px)', 'nudgio-technologies' ), 6, 0, 50, __( 'Button corner radius in pixels.', 'nudgio-technologies' ) );
        $this->register_number_setting( 'button_size', __( 'Button Size (px)', 'nudgio-technologies' ), 14, 8, 24, __( 'Button font-size in pixels.', 'nudgio-technologies' ) );
        $this->register_select_setting( 'button_variant', __( 'Button Variant', 'nudgio-technologies' ), 'solid', array( 'solid' => 'Solid', 'outline' => 'Outline', 'ghost' => 'Ghost' ) );
        $this->register_boolean_setting( 'button_full_width', __( 'Button Full Width', 'nudgio-technologies' ), false, __( 'Stretch button to full card width.', 'nudgio-technologies' ) );
    }

    // ==========================================
    // Section Callbacks
    // ==========================================

    public function credentials_section_callback() {
        echo '<p>' . esc_html__(
            'Enter the Key ID and API Secret from your Nudgio dashboard (Connection → API Keys tab).',
            'nudgio-technologies'
        ) . '</p>';
    }

    public function defaults_section_callback() {
        echo '<p>' . esc_html__(
            'Default values used when shortcode attributes are not specified. Override per-shortcode with [nudgio type="..." count="..." widget_style="..."].',
            'nudgio-technologies'
        ) . '</p>';
    }

    // ==========================================
    // Field Renderers
    // ==========================================

    public function render_key_id_field() {
        $value = get_option( 'nudgio_key_id', 0 );
        echo '<input type="number" name="nudgio_key_id" value="' . esc_attr( $value ) . '" class="regular-text" min="1" />';
        echo '<p class="description">' . esc_html__( 'The numeric Key ID from your Nudgio API key (shown as "ID" in the dashboard).', 'nudgio-technologies' ) . '</p>';
    }

    public function render_api_secret_field() {
        // Show placeholder if secret is stored — never display the actual encrypted value
        $stored = get_option( 'nudgio_api_secret', '' );
        $placeholder = $stored ? '••••••••••••••••' : '';
        echo '<input type="password" name="nudgio_api_secret" value="" class="regular-text" placeholder="' . esc_attr( $placeholder ) . '" autocomplete="off" />';
        echo '<p class="description">' . esc_html__( 'The nk_... secret from key creation. Leave empty to keep current value. Encrypted before storage.', 'nudgio-technologies' ) . '</p>';
    }

    public function render_server_url_field() {
        $value = get_option( 'nudgio_server_url', 'https://server.nudgio.tech' );
        echo '<input type="url" name="nudgio_server_url" value="' . esc_attr( $value ) . '" class="regular-text" />';
        echo '<p class="description">' . esc_html__( 'Nudgio API server URL. Default: https://server.nudgio.tech', 'nudgio-technologies' ) . '</p>';
    }

    public function render_default_type_field() {
        $value = get_option( 'nudgio_default_type', 'bestsellers' );
        $types = array(
            'bestsellers' => __( 'Bestsellers', 'nudgio-technologies' ),
            'cross-sell'  => __( 'Cross-sell', 'nudgio-technologies' ),
            'upsell'      => __( 'Upsell', 'nudgio-technologies' ),
            'similar'     => __( 'Similar Products', 'nudgio-technologies' ),
        );
        echo '<select name="nudgio_default_type">';
        foreach ( $types as $k => $label ) {
            echo '<option value="' . esc_attr( $k ) . '"' . selected( $value, $k, false ) . '>' . esc_html( $label ) . '</option>';
        }
        echo '</select>';
    }

    public function render_default_count_field() {
        $value = get_option( 'nudgio_default_count', 4 );
        echo '<input type="number" name="nudgio_default_count" value="' . esc_attr( $value ) . '" class="small-text" min="1" max="20" />';
    }

    // ==========================================
    // Reusable Setting Registration Helpers
    // ==========================================

    /**
     * Register a color picker setting.
     * Option name: nudgio_default_{$name}
     */
    private function register_color_setting( $name, $label, $default ) {
        $option = 'nudgio_default_' . $name;
        register_setting( 'nudgio_settings', $option, array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_hex_color',
            'default'           => $default,
        ) );
        add_settings_field( $option, $label, array( $this, 'render_color_field' ), 'nudgio', 'nudgio_defaults_section', array( 'option' => $option, 'default' => $default ) );
    }

    /**
     * Register a select dropdown setting.
     * Option name: nudgio_default_{$name}
     */
    private function register_select_setting( $name, $label, $default, $options ) {
        $option = 'nudgio_default_' . $name;
        register_setting( 'nudgio_settings', $option, array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => $default,
        ) );
        add_settings_field( $option, $label, array( $this, 'render_select_field' ), 'nudgio', 'nudgio_defaults_section', array( 'option' => $option, 'default' => $default, 'options' => $options ) );
    }

    /**
     * Register a text input setting.
     * Option name: nudgio_default_{$name}
     */
    private function register_text_setting( $name, $label, $default, $description = '' ) {
        $option = 'nudgio_default_' . $name;
        register_setting( 'nudgio_settings', $option, array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => $default,
        ) );
        add_settings_field( $option, $label, array( $this, 'render_text_field' ), 'nudgio', 'nudgio_defaults_section', array( 'option' => $option, 'default' => $default, 'description' => $description ) );
    }

    /**
     * Register a number input setting.
     * Option name: nudgio_default_{$name}
     */
    private function register_number_setting( $name, $label, $default, $min = 1, $max = 100, $description = '' ) {
        $option = 'nudgio_default_' . $name;
        register_setting( 'nudgio_settings', $option, array(
            'type'              => 'integer',
            'sanitize_callback' => 'absint',
            'default'           => $default,
        ) );
        add_settings_field( $option, $label, array( $this, 'render_number_field' ), 'nudgio', 'nudgio_defaults_section', array( 'option' => $option, 'default' => $default, 'min' => $min, 'max' => $max, 'description' => $description ) );
    }

    /**
     * Register a boolean (checkbox) setting.
     * Option name: nudgio_default_{$name}
     */
    private function register_boolean_setting( $name, $label, $default, $description = '' ) {
        $option = 'nudgio_default_' . $name;
        register_setting( 'nudgio_settings', $option, array(
            'type'              => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default'           => $default,
        ) );
        add_settings_field( $option, $label, array( $this, 'render_boolean_field' ), 'nudgio', 'nudgio_defaults_section', array( 'option' => $option, 'default' => $default, 'description' => $description ) );
    }

    // ==========================================
    // Reusable Field Renderers
    // ==========================================

    /**
     * Render a color picker field.
     * Reusable for all hex color settings.
     */
    public function render_color_field( $args ) {
        $option  = $args['option'];
        $default = $args['default'];
        $value   = get_option( $option, $default );
        echo '<input type="color" name="' . esc_attr( $option ) . '" value="' . esc_attr( $value ) . '" />';
        echo '<code style="margin-left:8px;">' . esc_html( $value ) . '</code>';
    }

    /**
     * Render a select dropdown field.
     * Reusable for all enum-style settings.
     */
    public function render_select_field( $args ) {
        $option  = $args['option'];
        $default = $args['default'];
        $options = $args['options'];
        $value   = get_option( $option, $default );
        echo '<select name="' . esc_attr( $option ) . '">';
        foreach ( $options as $k => $label ) {
            echo '<option value="' . esc_attr( $k ) . '"' . selected( $value, $k, false ) . '>' . esc_html( $label ) . '</option>';
        }
        echo '</select>';
    }

    /**
     * Render a text input field.
     * Reusable for CSS values, titles, button text.
     */
    public function render_text_field( $args ) {
        $option      = $args['option'];
        $default     = $args['default'];
        $description = isset( $args['description'] ) ? $args['description'] : '';
        $value       = get_option( $option, $default );
        echo '<input type="text" name="' . esc_attr( $option ) . '" value="' . esc_attr( $value ) . '" class="regular-text" />';
        if ( $description ) {
            echo '<p class="description">' . esc_html( $description ) . '</p>';
        }
    }

    /**
     * Render a number input field.
     * Reusable for columns, max lines, etc.
     */
    public function render_number_field( $args ) {
        $option      = $args['option'];
        $default     = $args['default'];
        $min         = isset( $args['min'] ) ? $args['min'] : 1;
        $max         = isset( $args['max'] ) ? $args['max'] : 100;
        $description = isset( $args['description'] ) ? $args['description'] : '';
        $value       = get_option( $option, $default );
        echo '<input type="number" name="' . esc_attr( $option ) . '" value="' . esc_attr( $value ) . '" class="small-text" min="' . esc_attr( $min ) . '" max="' . esc_attr( $max ) . '" />';
        if ( $description ) {
            echo '<p class="description">' . esc_html( $description ) . '</p>';
        }
    }

    /**
     * Render a boolean (checkbox) field.
     * Reusable for show_price, button_full_width.
     */
    public function render_boolean_field( $args ) {
        $option      = $args['option'];
        $default     = $args['default'];
        $description = isset( $args['description'] ) ? $args['description'] : '';
        $value       = get_option( $option, $default );
        echo '<label><input type="checkbox" name="' . esc_attr( $option ) . '" value="1"' . checked( $value, true, false ) . ' /> ';
        echo esc_html( $description ) . '</label>';
    }

    // ==========================================
    // Sanitization — API Secret Encryption
    // ==========================================

    /**
     * Sanitize and encrypt the API secret before storing in wp_options.
     *
     * WP does NOT guarantee encryption at rest — we encrypt explicitly
     * using openssl_encrypt() with a key derived from AUTH_KEY (wp-config.php).
     *
     * If the input is empty, keep the existing stored value (user left field blank).
     */
    public function sanitize_api_secret( $input ) {
        // Empty input = keep current value
        if ( empty( $input ) ) {
            return get_option( 'nudgio_api_secret', '' );
        }

        // Encrypt the plaintext secret before storage
        return self::encrypt_secret( sanitize_text_field( $input ) );
    }

    // ==========================================
    // Encryption / Decryption Helpers
    // ==========================================

    /**
     * Derive an encryption key from WordPress AUTH_KEY salt.
     * AUTH_KEY is defined in wp-config.php — unique per installation.
     */
    private static function get_encryption_key() {
        // Use AUTH_KEY from wp-config.php as the base for key derivation
        $salt = defined( 'AUTH_KEY' ) ? AUTH_KEY : 'nudgio-fallback-key';
        // SHA-256 produces exactly 32 bytes (256 bits) — matches aes-256-cbc key length
        return hash( 'sha256', $salt, true );
    }

    /**
     * Encrypt a plaintext secret for storage in wp_options.
     *
     * @param string $plaintext The API secret to encrypt.
     * @return string Base64-encoded ciphertext (IV prepended).
     */
    public static function encrypt_secret( $plaintext ) {
        $key    = self::get_encryption_key();
        $iv_len = openssl_cipher_iv_length( self::CIPHER_METHOD );
        $iv     = openssl_random_pseudo_bytes( $iv_len );

        $encrypted = openssl_encrypt( $plaintext, self::CIPHER_METHOD, $key, OPENSSL_RAW_DATA, $iv );

        // Prepend IV to ciphertext (needed for decryption), then base64 encode
        // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
        return base64_encode( $iv . $encrypted );
    }

    /**
     * Decrypt a stored secret from wp_options.
     *
     * @param string $encrypted Base64-encoded ciphertext (IV prepended).
     * @return string|false Plaintext secret, or false on failure.
     */
    public static function decrypt_secret( $encrypted ) {
        if ( empty( $encrypted ) ) {
            return false;
        }

        $key    = self::get_encryption_key();
        $iv_len = openssl_cipher_iv_length( self::CIPHER_METHOD );

        // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
        $raw = base64_decode( $encrypted, true );
        if ( false === $raw || strlen( $raw ) < $iv_len ) {
            return false;
        }

        // Extract IV (first $iv_len bytes) and ciphertext (remainder)
        $iv         = substr( $raw, 0, $iv_len );
        $ciphertext = substr( $raw, $iv_len );

        return openssl_decrypt( $ciphertext, self::CIPHER_METHOD, $key, OPENSSL_RAW_DATA, $iv );
    }

    // ==========================================
    // Settings Page Renderer
    // ==========================================

    /**
     * Render the settings page HTML.
     * Includes the settings form + Test Connection button.
     */
    public function render_settings_page() {
        require_once NUDGIO_PLUGIN_DIR . 'admin/views/settings-page.php';
    }

    // ==========================================
    // Sync Data (AJAX Handler)
    // ==========================================

    /**
     * Handle "Sync Data" AJAX request.
     *
     * Calls Nudgio_Sync::sync_all() to push products, orders, and order items
     * to the Nudgio server. Stores sync status in wp_options for display.
     */
    public function ajax_sync_data() {
        // Verify nonce for AJAX security
        check_ajax_referer( 'nudgio_sync_data', 'nonce' );

        // Check user permissions
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( __( 'Permission denied.', 'nudgio-technologies' ) );
        }

        // Run the full sync
        $results = Nudgio_Sync::sync_all();

        // Store sync status in wp_options for display
        update_option( 'nudgio_last_sync_at', current_time( 'mysql' ) );
        update_option( 'nudgio_last_sync_status', $results['success'] ? 'success' : 'error' );
        update_option( 'nudgio_last_sync_message', $results['message'] );

        if ( $results['success'] ) {
            wp_send_json_success( $results['message'] );
        } else {
            wp_send_json_error( $results['message'] );
        }
    }

    // ==========================================
    // Test Connection (AJAX Handler)
    // ==========================================

    /**
     * Handle "Test Connection" AJAX request.
     *
     * Generates a signed URL server-side and calls the Nudgio API via wp_remote_get
     * to verify the API key is valid and the server is reachable.
     */
    public function ajax_test_connection() {
        // Verify nonce for AJAX security
        check_ajax_referer( 'nudgio_test_connection', 'nonce' );

        // Check user permissions
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( __( 'Permission denied.', 'nudgio-technologies' ) );
        }

        // Get stored credentials
        $key_id     = absint( get_option( 'nudgio_key_id', 0 ) );
        $encrypted  = get_option( 'nudgio_api_secret', '' );
        $server_url = esc_url_raw( get_option( 'nudgio_server_url', 'https://server.nudgio.tech' ) );

        if ( ! $key_id || empty( $encrypted ) ) {
            wp_send_json_error( __( 'Key ID and API Secret are required.', 'nudgio-technologies' ) );
        }

        // Decrypt the stored secret
        $secret = self::decrypt_secret( $encrypted );
        if ( false === $secret ) {
            wp_send_json_error( __( 'Failed to decrypt API secret. Try re-entering it.', 'nudgio-technologies' ) );
        }

        // Build signed URL for a simple bestsellers test
        $params = array(
            'key_id'       => $key_id,
            'ts'           => time(),
            'nonce'        => bin2hex( random_bytes( 8 ) ),
            'top'          => 2,
            'device'       => 'desktop',
            'widget_style' => 'grid',
        );

        // Sort alphabetically for canonical query string
        ksort( $params );
        $canonical = http_build_query( $params );

        // Compute HMAC-SHA256 signature
        $params['sig'] = hash_hmac( 'sha256', $canonical, $secret );

        // Build the full URL
        $url = trailingslashit( $server_url ) . 'ecommerce/widget/bestsellers?' . http_build_query( $params );

        // Make the request
        $response = wp_remote_get( $url, array(
            'timeout' => 15,
            'headers' => array(
                'Accept' => 'text/html',
            ),
        ) );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error(
                sprintf(
                    /* translators: %s: error message */
                    __( 'Connection failed: %s', 'nudgio-technologies' ),
                    $response->get_error_message()
                )
            );
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $body        = wp_remote_retrieve_body( $response );

        if ( 200 === $status_code && ! empty( $body ) ) {
            wp_send_json_success( __( 'Connection successful! Nudgio API is reachable and responding.', 'nudgio-technologies' ) );
        } else {
            wp_send_json_error(
                sprintf(
                    /* translators: %d: HTTP status code, %s: response body excerpt */
                    __( 'Server responded with status %1$d: %2$s', 'nudgio-technologies' ),
                    $status_code,
                    wp_trim_words( wp_strip_all_tags( $body ), 20, '...' )
                )
            );
        }
    }
}
