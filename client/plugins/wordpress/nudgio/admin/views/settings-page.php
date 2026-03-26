<?php
/**
 * Nudgio Settings Page Template
 *
 * Rendered by Nudgio_Settings::render_settings_page().
 * Uses WordPress Settings API sections + fields, plus a "Test Connection" button.
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div class="wrap">
    <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

    <form method="post" action="options.php">
        <?php
        // Output nonce, action, and option_page fields for the settings page
        settings_fields( 'nudgio_settings' );

        // Output all settings sections and their fields
        do_settings_sections( 'nudgio' );

        // Submit button
        submit_button( __( 'Save Settings', 'nudgio-technologies' ) );
        ?>
    </form>

    <hr />

    <!-- Test Connection -->
    <h2><?php esc_html_e( 'Test Connection', 'nudgio-technologies' ); ?></h2>
    <p class="description">
        <?php esc_html_e(
            'Verify that the Key ID and API Secret are valid by making a test request to the Nudgio API.',
            'nudgio-technologies'
        ); ?>
    </p>
    <p>
        <button type="button" id="nudgio-test-connection" class="button button-secondary">
            <?php esc_html_e( 'Test Connection', 'nudgio-technologies' ); ?>
        </button>
        <span id="nudgio-test-result" style="margin-left: 10px;"></span>
    </p>

    <hr />

    <!-- Data Sync -->
    <h2><?php esc_html_e( 'Data Sync', 'nudgio-technologies' ); ?></h2>
    <p class="description">
        <?php esc_html_e(
            'Push your WooCommerce products, orders, and order items to the Nudgio server. This enables cross-sell, upsell, and similar product recommendations. Syncs automatically every 6 hours and on product/order changes. The timestamp below updates only when new or changed data is detected.',
            'nudgio-technologies'
        ); ?>
    </p>
    <?php
    // Display last sync status if available
    $nudgio_last_sync_at      = get_option( 'nudgio_last_sync_at', '' );
    $nudgio_last_sync_status  = get_option( 'nudgio_last_sync_status', '' );
    $nudgio_last_sync_message = get_option( 'nudgio_last_sync_message', '' );
    if ( $nudgio_last_sync_at ) : ?>
        <p>
            <strong><?php esc_html_e( 'Last sync:', 'nudgio-technologies' ); ?></strong>
            <?php echo esc_html( $nudgio_last_sync_at ); ?>
            &mdash;
            <span style="color: <?php echo 'success' === $nudgio_last_sync_status ? '#00a32a' : '#d63638'; ?>;">
                <?php echo esc_html( $nudgio_last_sync_message ); ?>
            </span>
        </p>
    <?php endif; ?>
    <p>
        <button type="button" id="nudgio-sync-data" class="button button-secondary">
            <?php esc_html_e( 'Sync Data', 'nudgio-technologies' ); ?>
        </button>
        <span id="nudgio-sync-result" style="margin-left: 10px;"></span>
    </p>

    <hr />

    <!-- Visual Editing (Gutenberg) — Recommended approach -->
    <div class="notice notice-info inline" style="margin: 20px 0; padding: 16px 20px; border-left-width: 4px;">
        <h2 style="margin-top: 0;"><?php esc_html_e( 'Recommended: Visual Editing (Gutenberg Block)', 'nudgio-technologies' ); ?></h2>
        <p style="font-size: 14px; color: #1d2327;">
            <?php esc_html_e(
                'The easiest way to add Nudgio recommendations is with the Gutenberg block editor. No shortcodes, no code — just drag, drop, and customize visually.',
                'nudgio-technologies'
            ); ?>
        </p>
        <p style="font-size: 14px; color: #1d2327; margin-bottom: 4px;"><strong><?php esc_html_e( 'How to use:', 'nudgio-technologies' ); ?></strong></p>
        <ol style="font-size: 14px; color: #1d2327; margin: 4px 0 12px 20px;">
            <li><?php esc_html_e( 'Edit any page or product → click the "+" block inserter.', 'nudgio-technologies' ); ?></li>
            <li><?php esc_html_e( 'Search for "Nudgio Technologies" (under WooCommerce category).', 'nudgio-technologies' ); ?></li>
            <li><?php esc_html_e( 'Select the block → configure 35 visual settings in the sidebar, organized in 8 groups: Widget Container, Title, Layout, Card, Image, Product Title, Price, and CTA Button.', 'nudgio-technologies' ); ?></li>
            <li><?php esc_html_e( 'Publish — the widget renders automatically with your settings.', 'nudgio-technologies' ); ?></li>
        </ol>
        <p class="description" style="margin-bottom: 0;">
            <?php esc_html_e(
                'The Gutenberg block supports all the same options as the shortcode below — widget type, layout style, columns, card shadows, button variants, colors, and more. Each setting can be customized independently.',
                'nudgio-technologies'
            ); ?>
        </p>
    </div>

    <hr />

    <!-- Shortcode Usage -->
    <h2><?php esc_html_e( 'Shortcode Usage', 'nudgio-technologies' ); ?></h2>
    <p class="description">
        <?php esc_html_e(
            'Add the [nudgio] shortcode to any page or post. Attributes override default settings above.',
            'nudgio-technologies'
        ); ?>
    </p>
    <table class="widefat fixed" style="max-width: 800px;">
        <thead>
            <tr>
                <th><?php esc_html_e( 'Example', 'nudgio-technologies' ); ?></th>
                <th><?php esc_html_e( 'Description', 'nudgio-technologies' ); ?></th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><code>[nudgio]</code></td>
                <td><?php esc_html_e( 'Uses all default settings.', 'nudgio-technologies' ); ?></td>
            </tr>
            <tr>
                <td><code>[nudgio type="bestsellers" count="6"]</code></td>
                <td><?php esc_html_e( 'Show 6 bestsellers.', 'nudgio-technologies' ); ?></td>
            </tr>
            <tr>
                <td><code>[nudgio type="cross-sell"]</code></td>
                <td><?php esc_html_e( 'Cross-sell on product pages (auto-detects product ID).', 'nudgio-technologies' ); ?></td>
            </tr>
            <tr>
                <td><code>[nudgio type="upsell" style="carousel"]</code></td>
                <td><?php esc_html_e( 'Upsell carousel on product pages.', 'nudgio-technologies' ); ?></td>
            </tr>
            <tr>
                <td><code>[nudgio type="similar" product_id="123"]</code></td>
                <td><?php esc_html_e( 'Similar products for a specific product ID.', 'nudgio-technologies' ); ?></td>
            </tr>
            <tr>
                <td><code>[nudgio button_text="Shop Now" show_price="false"]</code></td>
                <td><?php esc_html_e( 'Custom button text, hide prices.', 'nudgio-technologies' ); ?></td>
            </tr>
            <tr>
                <td><code>[nudgio image_aspect_w="3" image_aspect_h="4" widget_title="Our Picks"]</code></td>
                <td><?php esc_html_e( 'Portrait images (3:4) with custom title.', 'nudgio-technologies' ); ?></td>
            </tr>
            <tr>
                <td><code>[nudgio card_shadow="lg" button_variant="outline"]</code></td>
                <td><?php esc_html_e( 'Large card shadows with outline buttons.', 'nudgio-technologies' ); ?></td>
            </tr>
        </tbody>
    </table>
    <p class="description" style="margin-top: 8px;">
        <?php esc_html_e(
            'Available attributes: type, count, device, product_id, lookback_days, method, min_price_increase_percent, widget_bg_color, widget_padding, widget_title, title_color, title_size, title_alignment, widget_style, widget_columns, gap, card_min_width, card_max_width, card_bg_color, card_border_radius, card_border_width, card_border_color, card_shadow, card_padding, card_hover, image_aspect_w, image_aspect_h, image_fit, image_radius, product_title_color, product_title_size, product_title_weight, product_title_lines, product_title_alignment, show_price, price_color, price_size, button_text, button_bg_color, button_text_color, button_radius, button_size, button_variant, button_full_width.',
            'nudgio-technologies'
        ); ?>
    </p>

    <hr />

    <!-- Account & Subscription -->
    <h2><?php esc_html_e( 'Account & Subscription', 'nudgio-technologies' ); ?></h2>
    <p class="description">
        <?php esc_html_e(
            'Manage your subscription, view usage, configure recommendations, and preview widget components from the Nudgio dashboard.',
            'nudgio-technologies'
        ); ?>
    </p>
    <p>
        <a href="https://client.nudgio.tech" target="_blank" rel="noopener noreferrer" class="button button-secondary">
            <?php esc_html_e( 'Open Nudgio Dashboard', 'nudgio-technologies' ); ?>
        </a>
    </p>
</div>

