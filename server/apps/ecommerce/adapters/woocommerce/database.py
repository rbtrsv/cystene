from typing import List, Dict, Any
from sqlalchemy import text
from ..base import PlatformAdapter


class WooCommerceDatabaseAdapter(PlatformAdapter):
    """
    WooCommerce database adapter.
    Queries WordPress database: wp_posts, wp_postmeta, woocommerce_order_items tables.
    """

    async def get_product_count(self) -> int:
        """Get total product count from WooCommerce database"""
        query = text("""
            SELECT COUNT(*) as cnt
            FROM wp_posts
            WHERE post_type = 'product'
            AND post_status = 'publish'
        """)
        async with self.engine.begin() as conn:
            result = await conn.execute(query)
            row = result.fetchone()
            return row.cnt if row else 0

    async def get_order_count(self, lookback_days: int = 365) -> int:
        """Get total order count from WooCommerce HPOS database"""
        query = text("""
            SELECT COUNT(*) as cnt
            FROM wp_wc_orders
            WHERE status IN ('wc-completed', 'wc-processing')
            AND date_created_gmt >= DATE_SUB(NOW(), INTERVAL :lookback_days DAY)
        """)
        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"lookback_days": lookback_days})
            row = result.fetchone()
            return row.cnt if row else 0

    async def get_products(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get products from WooCommerce/WordPress database"""
        query = text("""
            SELECT
                p.ID as product_id,
                p.post_title as title,
                p.post_name as handle,
                pm_price.meta_value as price,
                pm_sku.meta_value as sku,
                pm_stock.meta_value as inventory_quantity,
                pm_type.meta_value as product_type,
                p.post_date as created_at,
                p.post_modified as updated_at
            FROM wp_posts p
            LEFT JOIN wp_postmeta pm_price ON p.ID = pm_price.post_id AND pm_price.meta_key = '_price'
            LEFT JOIN wp_postmeta pm_sku ON p.ID = pm_sku.post_id AND pm_sku.meta_key = '_sku'
            LEFT JOIN wp_postmeta pm_stock ON p.ID = pm_stock.post_id AND pm_stock.meta_key = '_stock'
            LEFT JOIN wp_postmeta pm_type ON p.ID = pm_type.post_id AND pm_type.meta_key = '_product_type'
            WHERE p.post_type = 'product'
            AND p.post_status = 'publish'
            ORDER BY p.ID
            LIMIT :limit
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]

    async def get_orders(self, lookback_days: int = 30, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get orders from WooCommerce HPOS database"""
        query = text("""
            SELECT
                o.id as order_id,
                o.customer_id,
                o.total_amount as total_price,
                o.status,
                o.date_created_gmt as order_date
            FROM wp_wc_orders o
            WHERE o.status IN ('wc-completed', 'wc-processing')
            AND o.date_created_gmt >= DATE_SUB(NOW(), INTERVAL :lookback_days DAY)
            ORDER BY o.date_created_gmt DESC
            LIMIT :limit
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"lookback_days": lookback_days, "limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]

    async def get_order_items(self, lookback_days: int = 30, limit: int = 10000) -> List[Dict[str, Any]]:
        """Get order items from WooCommerce HPOS database"""
        query = text("""
            SELECT
                opl.order_id,
                opl.product_id,
                opl.variation_id as variant_id,
                opl.product_qty as quantity,
                p.post_title as product_title,
                o.date_created_gmt as order_date,
                o.customer_id
            FROM wp_wc_order_product_lookup opl
            JOIN wp_wc_orders o ON opl.order_id = o.id
            LEFT JOIN wp_posts p ON opl.product_id = p.ID
            WHERE o.status IN ('wc-completed', 'wc-processing')
            AND o.date_created_gmt >= DATE_SUB(NOW(), INTERVAL :lookback_days DAY)
            ORDER BY o.date_created_gmt DESC
            LIMIT :limit
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"lookback_days": lookback_days, "limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]

    async def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        """Get single product by ID"""
        query = text("""
            SELECT
                p.ID as product_id,
                p.post_title as title,
                p.post_name as handle,
                pm_price.meta_value as price,
                pm_sku.meta_value as sku,
                pm_stock.meta_value as inventory_quantity,
                pm_type.meta_value as product_type
            FROM wp_posts p
            LEFT JOIN wp_postmeta pm_price ON p.ID = pm_price.post_id AND pm_price.meta_key = '_price'
            LEFT JOIN wp_postmeta pm_sku ON p.ID = pm_sku.post_id AND pm_sku.meta_key = '_sku'
            LEFT JOIN wp_postmeta pm_stock ON p.ID = pm_stock.post_id AND pm_stock.meta_key = '_stock'
            LEFT JOIN wp_postmeta pm_type ON p.ID = pm_type.post_id AND pm_type.meta_key = '_product_type'
            WHERE p.post_type = 'product'
            AND p.post_status = 'publish'
            AND p.ID = :product_id
            LIMIT 1
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"product_id": product_id})
            row = result.fetchone()
            return dict(row._mapping) if row else {}
