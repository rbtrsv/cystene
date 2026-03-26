<?php
/**
 * Nudgio Technologies — Uninstall
 *
 * Cleanup on plugin deletion (not deactivation).
 * Removes all nudgio_* options from wp_options.
 *
 * This file is called by WordPress when the plugin is deleted via the admin UI.
 * It is NOT called on deactivation — only on full deletion.
 */

// Prevent direct access — must be called by WordPress uninstall process
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

// Remove all nudgio_* options from wp_options
$nudgio_options = array(
    // API Credentials
    'nudgio_key_id',
    'nudgio_api_secret',
    'nudgio_server_url',
    // Widget defaults
    'nudgio_default_type',
    'nudgio_default_count',
    'nudgio_default_device',
    // Group 1: Widget Container
    'nudgio_default_widget_bg_color',
    'nudgio_default_widget_padding',
    // Group 2: Widget Title
    'nudgio_default_widget_title',
    'nudgio_default_title_color',
    'nudgio_default_title_size',
    'nudgio_default_title_alignment',
    // Group 3: Layout
    'nudgio_default_widget_style',
    'nudgio_default_widget_columns',
    'nudgio_default_gap',
    'nudgio_default_card_min_width',
    'nudgio_default_card_max_width',
    // Group 4: Product Card
    'nudgio_default_card_bg_color',
    'nudgio_default_card_border_radius',
    'nudgio_default_card_border_width',
    'nudgio_default_card_border_color',
    'nudgio_default_card_shadow',
    'nudgio_default_card_padding',
    'nudgio_default_card_hover',
    // Group 5: Product Image
    'nudgio_default_image_aspect_w',
    'nudgio_default_image_aspect_h',
    'nudgio_default_image_fit',
    'nudgio_default_image_radius',
    // Group 6: Product Title in Card
    'nudgio_default_product_title_color',
    'nudgio_default_product_title_size',
    'nudgio_default_product_title_weight',
    'nudgio_default_product_title_lines',
    'nudgio_default_product_title_alignment',
    // Group 7: Price
    'nudgio_default_show_price',
    'nudgio_default_price_color',
    'nudgio_default_price_size',
    // Group 8: CTA Button
    'nudgio_default_button_text',
    'nudgio_default_button_bg_color',
    'nudgio_default_button_text_color',
    'nudgio_default_button_radius',
    'nudgio_default_button_size',
    'nudgio_default_button_variant',
    'nudgio_default_button_full_width',
    // Legacy options (from v1.0.0 / v1.1.0 / v1.2.0 — cleanup for upgrades)
    'nudgio_default_style',
    'nudgio_default_image_aspect',
    'nudgio_default_columns',
    'nudgio_default_size',
    'nudgio_default_primary_color',
    'nudgio_default_text_color',
    'nudgio_default_bg_color',
    'nudgio_default_border_radius',
    'nudgio_default_cta_text',
);

foreach ( $nudgio_options as $nudgio_option ) {
    delete_option( $nudgio_option );
}
