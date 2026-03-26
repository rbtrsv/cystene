=== Nudgio Technologies ===
Contributors: burarotechnologies, rbtrsv
Tags: woocommerce, recommendations, cross-sell, upsell, product recommendations
Requires at least: 6.1
Tested up to: 6.9
Requires PHP: 8.0
Stable tag: 1.3.5
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered product recommendations for WooCommerce — bestsellers, cross-sell, upsell, and similar products.

== Description ==

Nudgio Technologies connects your WooCommerce store to the Nudgio recommendation engine to display personalized product recommendations on your storefront.

**Features:**

* Bestseller recommendations based on real order data
* Cross-sell recommendations ("frequently bought together")
* Upsell recommendations (higher-priced alternatives)
* Similar product recommendations
* Simple `[nudgio]` shortcode with customizable attributes
* Gutenberg block with 35 visual settings in 8 organized groups — no shortcodes needed
* Auto-detects WooCommerce product ID on product pages
* HMAC-signed URLs — your API secret never appears in page source
* Full visual customization: widget container, title, layout, card, image, product title, price, and CTA button
* Iframe-based rendering — no CSS conflicts with your theme
* Auto-resizing iframes — content height adjusts automatically

**Requirements:**

* A Nudgio account with an active connection ([nudgio.tech](https://www.nudgio.tech))
* An API key generated from your Nudgio dashboard (Connection → API Keys tab)
* WooCommerce 7.0 or later
* PHP 8.0 or later

**Third-Party Service:**

This plugin connects to the Nudgio recommendation engine ([nudgio.tech](https://www.nudgio.tech)) to generate and display product recommendations. When a page containing a Nudgio shortcode or block is loaded, the plugin sends an HMAC-signed request to the Nudgio server with the Key ID, widget configuration parameters, and product ID (if applicable). No personal visitor data is collected or transmitted.

* [Terms of Service](https://www.nudgio.tech/legal/terms-of-service)
* [Privacy Policy](https://www.nudgio.tech/legal/privacy-policy)

== Installation ==

1. Upload the `nudgio` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings → Nudgio Technologies
4. Enter your Key ID and API Secret from the Nudgio dashboard
5. Click "Test Connection" to verify
6. Add recommendations using the Gutenberg block (recommended) or `[nudgio]` shortcodes

== Frequently Asked Questions ==

= How do I get an API key? =

1. Sign up at [nudgio.tech](https://www.nudgio.tech)
2. Create a WooCommerce connection
3. Go to the connection's "API Keys" tab
4. Click "Generate Key" — save the secret immediately (shown once)

= How do I use the Gutenberg block? =

1. Edit any page or product → click the "+" block inserter
2. Search for "Nudgio Technologies" (under WooCommerce category)
3. Select the block → configure 35 visual settings in the sidebar, organized in 8 groups
4. Publish — the widget renders automatically with your settings

= Is my API secret secure? =

Yes. The API secret is encrypted before storage in WordPress. It never appears in your page source — only the Key ID, timestamp, nonce, and HMAC signature are included in widget URLs.

= What shortcode attributes are available? =

**Algorithm / Data:**
* `type` — bestsellers, cross-sell, upsell, similar (default: bestsellers)
* `count` — number of products to show (default: 4)
* `product_id` — specific product ID (auto-detected on product pages)
* `lookback_days` — order data lookback period (default: 30)
* `method` — bestseller method: volume, value, balanced (default: volume)
* `min_price_increase_percent` — upsell price threshold (default: 10)

**Widget Container:**
* `widget_bg_color` — hex color for widget background (default: #FFFFFF)
* `widget_padding` — padding in pixels (default: 16)

**Widget Title:**
* `widget_title` — custom widget heading (leave empty for auto-default)
* `title_color` — hex color for title (default: #111827)
* `title_size` — font-size in pixels (default: 24)
* `title_alignment` — left, center (default: left)

**Layout:**
* `widget_style` — grid, carousel (default: grid)
* `widget_columns` — max columns at full width, 1-6 (default: 4)
* `gap` — gap between cards in pixels (default: 16)
* `card_min_width` — minimum card width in pixels (default: 200)
* `card_max_width` — maximum card width in pixels, 0 = no limit (default: 0)

**Product Card:**
* `card_bg_color` — hex color for card background (default: #FFFFFF)
* `card_border_radius` — border radius in pixels (default: 8)
* `card_border_width` — border width in pixels (default: 0)
* `card_border_color` — hex color for card border (default: #E5E7EB)
* `card_shadow` — none, sm, md, lg (default: md)
* `card_padding` — card content padding in pixels (default: 16)
* `card_hover` — none, lift, shadow, glow (default: lift)

**Product Image:**
* `image_aspect_w` — image aspect ratio width, 1-20 (default: 1)
* `image_aspect_h` — image aspect ratio height, 1-20 (default: 1)
* `image_fit` — cover, contain (default: cover)
* `image_radius` — image border radius in pixels (default: 8)

**Product Title:**
* `product_title_color` — hex color for product title (default: #1F2937)
* `product_title_size` — font-size in pixels (default: 14)
* `product_title_weight` — CSS font-weight 100-900 (default: 600)
* `product_title_lines` — max lines before truncation, 1-3 (default: 2)
* `product_title_alignment` — left, center (default: left)

**Price:**
* `show_price` — show product price: true/false (default: true)
* `price_color` — hex color for price (default: #111827)
* `price_size` — font-size in pixels (default: 18)

**CTA Button:**
* `button_text` — button text, e.g. View, Shop Now (default: View)
* `button_bg_color` — hex color for button background (default: #3B82F6)
* `button_text_color` — hex color for button text (default: #FFFFFF)
* `button_radius` — button border radius in pixels (default: 6)
* `button_size` — font-size in pixels (default: 14)
* `button_variant` — solid, outline, ghost (default: solid)
* `button_full_width` — stretch button to full width: true/false (default: false)

= Do cross-sell/upsell/similar work on non-product pages? =

These types require a product context. On non-product pages, the shortcode outputs nothing unless you specify a `product_id` attribute explicitly.

== Changelog ==

= 1.3.5 =
* Added Widget Container and Widget Title panels to Gutenberg block sidebar
* Widget Container panel includes widget_padding RangeControl
* Widget Title panel includes title, color, size, and alignment controls
* Version bump

= 1.3.4 =
* Converted 5 size enum fields from string to integer: title_size, product_title_size, product_title_weight, price_size, button_size
* Size fields now accept pixel values (e.g. title_size=24) instead of enum strings (sm/md/lg)
* Font weight accepts CSS font-weight values (100-900) instead of named weights (normal/semibold/bold)
* Gutenberg block uses RangeControl sliders for all size and weight fields
* Admin settings page uses number inputs with min/max validation

= 1.3.3 =
* Converted border radius and width fields from string to integer (card_border_radius, card_border_width, image_radius, button_radius)
* Settings now use number inputs with pixel values instead of CSS strings
* Gutenberg block uses RangeControl sliders for all border/radius fields
* Fixed stale activation defaults for widget_padding, gap, card_padding, image_aspect

= 1.3.2 =
* Allow single-column layout (widget_columns minimum lowered from 2 to 1)

= 1.3.1 =
* Renamed sync endpoints from /plugin-sync to /woocommerce-sync (requires server update deployed simultaneously)

= 1.3.0 =
* Added automatic WooCommerce data sync — products, orders, and order items are pushed to the Nudgio server via HMAC-authenticated endpoints
* New "Sync Data" button on Settings page with last sync status display
* WP-Cron scheduled sync every 6 hours
* Real-time sync on product create/update and order status changes (completed, processing)
* Single product and single order sync methods for granular real-time updates

= 1.2.3 =
* Added HTML debug comments visible in View Source for troubleshooting (credentials, product detection, guard triggers)
* Shows detected product_id and is_product_page status in HTML comments

= 1.2.2 =
* Fixed boolean serialization for show_price and button_full_width — sanitize_text_field(false) produced empty string which FastAPI rejected with 422

= 1.2.1 =
* Fixed short description exceeding 150-character limit for WordPress Plugin Directory

= 1.2.0 =
* Replaced 11-setting visual system with 35 individually configurable settings in 8 groups
* Widget Container: independent background color and padding control
* Widget Title: separate color, size, and alignment settings
* Layout: renamed style→widget_style, columns→widget_columns, added gap control
* Product Card: 7 new settings — background, border radius/width/color, shadow, padding, hover effect
* Product Image: added image fit (cover/contain) and image border radius
* Product Title: 5 new settings — color, size, weight, max lines, alignment
* Price: separate color and size controls
* CTA Button: 7 new settings — text, background color, text color, border radius, size, variant (solid/outline/ghost), full width
* Gutenberg block rewritten with 10 editor panels and 35 sidebar controls
* Admin settings page reorganized with reusable field helpers (color, select, text, number, boolean)
* Prominent Gutenberg block instructions added to settings page
* Uninstall cleanup updated for all new option names + legacy cleanup

= 1.1.0 =
* Added Gutenberg block with visual editor controls
* Added responsive columns setting (2-6)
* Added size setting (compact, default, spacious)
* Added widget_title, cta_text, show_price, image_aspect shortcode attributes
* Updated shortcode to pass all visual parameters through HMAC-signed URLs

= 1.0.0 =
* Initial release
* Shortcode with HMAC-signed iframe URLs
* Admin settings page with WP Settings API
* Test Connection functionality
* Auto-detection of WooCommerce product ID
* Encrypted API secret storage
* Auto-resizing iframes via postMessage

== Upgrade Notice ==

= 1.3.5 =
Gutenberg block now shows Widget Container and Widget Title panels in the sidebar.

= 1.3.4 =
Size and weight fields now use integer pixel values instead of enum strings. Existing shortcodes using sm/md/lg values must be updated.

= 1.3.3 =
Border radius and width fields now use integer pixel values. Gutenberg block uses slider controls.

= 1.3.2 =
Single-column layout support for grid and carousel widgets.

= 1.3.1 =
Sync endpoint rename — deploy server and plugin together.

= 1.3.0 =
Automatic WooCommerce data sync. Products, orders, and order items now push to Nudgio automatically (every 6 hours + real-time on changes). Manual "Sync Data" button added to Settings.

= 1.2.3 =
Added HTML debug comments for troubleshooting shortcode rendering issues.

= 1.2.2 =
Fixed boolean fields (show_price, button_full_width) causing 422 errors on the server.

= 1.2.1 =
Fixed short description for WordPress Plugin Directory compliance.

= 1.2.0 =
Major visual overhaul: 35 settings in 8 groups replace the old 11-setting system. Gutenberg block fully rewritten. All new shortcode attributes. See changelog for details.

= 1.1.0 =
Gutenberg block with full visual controls. New shortcode attributes: columns, size, widget_title, cta_text, show_price, image_aspect.

= 1.0.0 =
Initial release.
