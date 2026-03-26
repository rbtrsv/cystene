<?php
/**
 * Nudgio Sync — WooCommerce Data Push
 *
 * Pushes WooCommerce products, orders, and order items to the Nudgio server
 * using HMAC-SHA256 body signing. The server derives the connection_id from
 * the API key — no connection_id needed in the request payload.
 *
 * HMAC auth headers:
 * - X-Nudgio-Key-Id — widget API key ID
 * - X-Nudgio-Timestamp — Unix timestamp
 * - X-Nudgio-Nonce — random hex string
 * - X-Nudgio-Signature — HMAC-SHA256(request_body_raw, api_secret)
 *
 * Used by:
 * - Manual "Sync Data" button on Settings → Nudgio Technologies
 * - WP-Cron scheduled sync (every 6 hours)
 * - WooCommerce hooks for real-time sync (product update, order status change)
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Nudgio_Sync {

    // ==========================================
    // Full Sync Orchestrator
    // ==========================================

    /**
     * Sync all WooCommerce data to the Nudgio server.
     * Orchestrates: products → orders → order items (sequential).
     *
     * @return array{success: bool, message: string, products: int, orders: int, order_items: int, errors: string[]}
     */
    public static function sync_all() {
        $results = array(
            'success'     => true,
            'message'     => '',
            'products'    => 0,
            'orders'      => 0,
            'order_items' => 0,
            'errors'      => array(),
        );

        // Check WooCommerce is active
        if ( ! class_exists( 'WooCommerce' ) ) {
            $results['success'] = false;
            $results['message'] = 'WooCommerce is not active.';
            return $results;
        }

        // Check credentials are configured
        $key_id    = absint( get_option( 'nudgio_key_id', 0 ) );
        $encrypted = get_option( 'nudgio_api_secret', '' );
        if ( ! $key_id || empty( $encrypted ) ) {
            $results['success'] = false;
            $results['message'] = 'API credentials not configured. Enter Key ID and API Secret in Settings.';
            return $results;
        }

        // Step 1: Sync products
        $product_result = self::sync_products();
        $results['products'] = $product_result['count'];
        if ( ! empty( $product_result['error'] ) ) {
            $results['errors'][] = 'Products: ' . $product_result['error'];
        }

        // Step 2: Sync orders
        $order_result = self::sync_orders();
        $results['orders'] = $order_result['count'];
        if ( ! empty( $order_result['error'] ) ) {
            $results['errors'][] = 'Orders: ' . $order_result['error'];
        }

        // Step 3: Sync order items
        $order_items_result = self::sync_order_items();
        $results['order_items'] = $order_items_result['count'];
        if ( ! empty( $order_items_result['error'] ) ) {
            $results['errors'][] = 'Order items: ' . $order_items_result['error'];
        }

        // Summary
        if ( ! empty( $results['errors'] ) ) {
            $results['success'] = false;
            $results['message'] = implode( '; ', $results['errors'] );
        } else {
            $results['message'] = sprintf(
                'Synced %d products, %d orders, %d order items.',
                $results['products'],
                $results['orders'],
                $results['order_items']
            );
        }

        return $results;
    }

    // ==========================================
    // Sync Products
    // ==========================================

    /**
     * Fetch all WooCommerce products and push to Nudgio server.
     *
     * @return array{count: int, error: string}
     */
    public static function sync_products() {
        $products = wc_get_products( array(
            'limit'  => -1,
            'status' => array( 'publish', 'draft', 'pending', 'private' ),
            'return' => 'objects',
        ) );

        if ( empty( $products ) ) {
            return array( 'count' => 0, 'error' => '' );
        }

        // Map WooCommerce product objects to Nudgio ProductData schema
        $items = array();
        foreach ( $products as $product ) {
            // Get the featured image URL
            $image_id  = $product->get_image_id();
            $image_url = $image_id ? wp_get_attachment_url( $image_id ) : null;

            $items[] = array(
                'product_id'         => (string) $product->get_id(),
                'title'              => $product->get_name(),
                'handle'             => $product->get_slug(),
                'product_type'       => $product->get_type(),
                'sku'                => $product->get_sku() ?: null,
                'price'              => (float) $product->get_price(),
                'image_url'          => $image_url,
                'inventory_quantity' => $product->get_stock_quantity(),
                'status'             => $product->get_status(),
            );
        }

        // Send in batches of 500 to stay within server limits
        $total_sent = 0;
        $batches    = array_chunk( $items, 500 );
        foreach ( $batches as $batch ) {
            $body   = wp_json_encode( array( 'products' => $batch ) );
            $result = self::sign_and_post( 'woocommerce-sync/products', $body );
            if ( is_wp_error( $result ) ) {
                return array( 'count' => $total_sent, 'error' => $result->get_error_message() );
            }
            $total_sent += count( $batch );
        }

        return array( 'count' => $total_sent, 'error' => '' );
    }

    // ==========================================
    // Sync Orders
    // ==========================================

    /**
     * Fetch all WooCommerce orders (last 365 days) and push to Nudgio server.
     *
     * @return array{count: int, error: string}
     */
    public static function sync_orders() {
        $orders = wc_get_orders( array(
            'limit'      => -1,
            'status'     => array( 'wc-completed', 'wc-processing', 'wc-on-hold' ),
            'date_after'  => gmdate( 'Y-m-d', strtotime( '-365 days' ) ),
            'return'     => 'objects',
        ) );

        if ( empty( $orders ) ) {
            return array( 'count' => 0, 'error' => '' );
        }

        // Map WooCommerce order objects to Nudgio OrderData schema
        $items = array();
        foreach ( $orders as $order ) {
            $date_created = $order->get_date_created();
            $items[] = array(
                'order_id'    => (string) $order->get_id(),
                'customer_id' => (string) $order->get_customer_id(),
                'total_price' => (float) $order->get_total(),
                'status'      => $order->get_status(),
                'order_date'  => $date_created ? $date_created->format( 'c' ) : gmdate( 'c' ),
            );
        }

        // Send in batches of 500
        $total_sent = 0;
        $batches    = array_chunk( $items, 500 );
        foreach ( $batches as $batch ) {
            $body   = wp_json_encode( array( 'orders' => $batch ) );
            $result = self::sign_and_post( 'woocommerce-sync/orders', $body );
            if ( is_wp_error( $result ) ) {
                return array( 'count' => $total_sent, 'error' => $result->get_error_message() );
            }
            $total_sent += count( $batch );
        }

        return array( 'count' => $total_sent, 'error' => '' );
    }

    // ==========================================
    // Sync Order Items
    // ==========================================

    /**
     * Fetch order items from all WooCommerce orders (last 365 days) and push to Nudgio server.
     *
     * @return array{count: int, error: string}
     */
    public static function sync_order_items() {
        $orders = wc_get_orders( array(
            'limit'      => -1,
            'status'     => array( 'wc-completed', 'wc-processing', 'wc-on-hold' ),
            'date_after'  => gmdate( 'Y-m-d', strtotime( '-365 days' ) ),
            'return'     => 'objects',
        ) );

        if ( empty( $orders ) ) {
            return array( 'count' => 0, 'error' => '' );
        }

        // Map WooCommerce order items to Nudgio OrderItemData schema
        $items = array();
        foreach ( $orders as $order ) {
            $date_created = $order->get_date_created();
            $order_date   = $date_created ? $date_created->format( 'c' ) : gmdate( 'c' );

            foreach ( $order->get_items() as $item ) {
                $quantity = $item->get_quantity();
                $items[]  = array(
                    'order_id'      => (string) $order->get_id(),
                    'product_id'    => (string) $item->get_product_id(),
                    'variant_id'    => $item->get_variation_id() ? (string) $item->get_variation_id() : null,
                    'quantity'      => $quantity,
                    'price'         => $quantity > 0 ? (float) $item->get_total() / $quantity : 0.0,
                    'product_title' => $item->get_name(),
                    'customer_id'   => (string) $order->get_customer_id(),
                    'order_date'    => $order_date,
                );
            }
        }

        if ( empty( $items ) ) {
            return array( 'count' => 0, 'error' => '' );
        }

        // Send in batches of 500
        $total_sent = 0;
        $batches    = array_chunk( $items, 500 );
        foreach ( $batches as $batch ) {
            $body   = wp_json_encode( array( 'order_items' => $batch ) );
            $result = self::sign_and_post( 'woocommerce-sync/order-items', $body );
            if ( is_wp_error( $result ) ) {
                return array( 'count' => $total_sent, 'error' => $result->get_error_message() );
            }
            $total_sent += count( $batch );
        }

        return array( 'count' => $total_sent, 'error' => '' );
    }

    // ==========================================
    // Sync Single Product (real-time hook)
    // ==========================================

    /**
     * Sync a single product to Nudgio server.
     * Called by WooCommerce product update hook via WP-Cron single event.
     *
     * @param int $product_id WooCommerce product ID.
     */
    public static function sync_single_product( $product_id ) {
        $product = wc_get_product( $product_id );
        if ( ! $product ) {
            return;
        }

        // Get the featured image URL
        $image_id  = $product->get_image_id();
        $image_url = $image_id ? wp_get_attachment_url( $image_id ) : null;

        $items = array(
            array(
                'product_id'         => (string) $product->get_id(),
                'title'              => $product->get_name(),
                'handle'             => $product->get_slug(),
                'product_type'       => $product->get_type(),
                'sku'                => $product->get_sku() ?: null,
                'price'              => (float) $product->get_price(),
                'image_url'          => $image_url,
                'inventory_quantity' => $product->get_stock_quantity(),
                'status'             => $product->get_status(),
            ),
        );

        $body = wp_json_encode( array( 'products' => $items ) );
        self::sign_and_post( 'woocommerce-sync/products', $body );
    }

    // ==========================================
    // Sync Single Order + Items (real-time hook)
    // ==========================================

    /**
     * Sync a single order and its items to Nudgio server.
     * Called by WooCommerce order status change hook via WP-Cron single event.
     *
     * @param int $order_id WooCommerce order ID.
     */
    public static function sync_single_order( $order_id ) {
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return;
        }

        $date_created = $order->get_date_created();
        $order_date   = $date_created ? $date_created->format( 'c' ) : gmdate( 'c' );

        // Sync the order
        $order_data = array(
            array(
                'order_id'    => (string) $order->get_id(),
                'customer_id' => (string) $order->get_customer_id(),
                'total_price' => (float) $order->get_total(),
                'status'      => $order->get_status(),
                'order_date'  => $order_date,
            ),
        );
        $body = wp_json_encode( array( 'orders' => $order_data ) );
        self::sign_and_post( 'woocommerce-sync/orders', $body );

        // Sync the order items
        $items = array();
        foreach ( $order->get_items() as $item ) {
            $quantity = $item->get_quantity();
            $items[]  = array(
                'order_id'      => (string) $order->get_id(),
                'product_id'    => (string) $item->get_product_id(),
                'variant_id'    => $item->get_variation_id() ? (string) $item->get_variation_id() : null,
                'quantity'      => $quantity,
                'price'         => $quantity > 0 ? (float) $item->get_total() / $quantity : 0.0,
                'product_title' => $item->get_name(),
                'customer_id'   => (string) $order->get_customer_id(),
                'order_date'    => $order_date,
            );
        }

        if ( ! empty( $items ) ) {
            $body = wp_json_encode( array( 'order_items' => $items ) );
            self::sign_and_post( 'woocommerce-sync/order-items', $body );
        }
    }

    // ==========================================
    // HMAC Sign + POST Helper
    // ==========================================

    /**
     * HMAC-sign a JSON body and POST it to the Nudgio server.
     *
     * Headers:
     * - X-Nudgio-Key-Id — widget API key ID
     * - X-Nudgio-Timestamp — Unix timestamp
     * - X-Nudgio-Nonce — random hex string
     * - X-Nudgio-Signature — HMAC-SHA256(body, api_secret)
     *
     * @param string $endpoint API endpoint path (e.g. 'woocommerce-sync/products').
     * @param string $body     JSON-encoded request body.
     * @return array|WP_Error  Decoded response body or WP_Error on failure.
     */
    private static function sign_and_post( $endpoint, $body ) {
        // Get stored credentials
        $key_id     = absint( get_option( 'nudgio_key_id', 0 ) );
        $encrypted  = get_option( 'nudgio_api_secret', '' );
        $server_url = esc_url_raw( get_option( 'nudgio_server_url', 'https://server.nudgio.tech' ) );

        if ( ! $key_id || empty( $encrypted ) ) {
            return new \WP_Error( 'nudgio_sync', 'API credentials not configured.' );
        }

        // Decrypt the stored secret
        $secret = Nudgio_Settings::decrypt_secret( $encrypted );
        if ( false === $secret ) {
            return new \WP_Error( 'nudgio_sync', 'Failed to decrypt API secret.' );
        }

        // Build HMAC auth headers
        $timestamp = time();
        $nonce     = bin2hex( random_bytes( 16 ) );
        $signature = hash_hmac( 'sha256', $body, $secret );

        // Build the full URL
        $url = trailingslashit( $server_url ) . 'ecommerce/' . $endpoint;

        // Make the POST request
        $response = wp_remote_post( $url, array(
            'timeout' => 60,
            'headers' => array(
                'Content-Type'       => 'application/json',
                'X-Nudgio-Key-Id'    => (string) $key_id,
                'X-Nudgio-Timestamp' => (string) $timestamp,
                'X-Nudgio-Nonce'     => $nonce,
                'X-Nudgio-Signature' => $signature,
            ),
            'body' => $body,
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code( $response );
        $body_text   = wp_remote_retrieve_body( $response );

        if ( $status_code >= 400 ) {
            return new \WP_Error(
                'nudgio_sync',
                sprintf( 'Server returned %d: %s', $status_code, wp_trim_words( wp_strip_all_tags( $body_text ), 30, '...' ) )
            );
        }

        // Decode the JSON response
        $decoded = json_decode( $body_text, true );
        if ( is_array( $decoded ) && isset( $decoded['success'] ) && ! $decoded['success'] ) {
            $error_msg = isset( $decoded['error'] ) ? $decoded['error'] : 'Unknown server error';
            return new \WP_Error( 'nudgio_sync', $error_msg );
        }

        return $decoded;
    }
}
