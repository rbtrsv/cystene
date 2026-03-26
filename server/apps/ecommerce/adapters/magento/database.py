from typing import List, Dict, Any
from sqlalchemy import text
from ..base import PlatformAdapter


class MagentoDatabaseAdapter(PlatformAdapter):
    """
    Magento database adapter.
    Queries Magento database: catalog_product_entity, sales_order, sales_order_item tables.
    """

    async def get_product_count(self) -> int:
        """Get total product count from Magento database"""
        query = text("""
            SELECT COUNT(*) as cnt
            FROM catalog_product_entity
            WHERE type_id IN ('simple', 'configurable', 'virtual', 'downloadable')
        """)
        async with self.engine.begin() as conn:
            result = await conn.execute(query)
            row = result.fetchone()
            return row.cnt if row else 0

    async def get_order_count(self, lookback_days: int = 365) -> int:
        """Get total order count from Magento database"""
        query = text("""
            SELECT COUNT(*) as cnt
            FROM sales_order
            WHERE status IN ('complete', 'processing')
            AND created_at >= DATE_SUB(NOW(), INTERVAL :lookback_days DAY)
        """)
        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"lookback_days": lookback_days})
            row = result.fetchone()
            return row.cnt if row else 0

    async def get_products(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get products from Magento database"""
        query = text("""
            SELECT
                cpe.entity_id as product_id,
                cpe.sku,
                cpev_name.value as title,
                cpe.type_id as product_type,
                CAST(cpd_price.value AS DECIMAL(10,2)) as price,
                csi.qty as inventory_quantity,
                cpe.created_at,
                cpe.updated_at
            FROM catalog_product_entity cpe
            LEFT JOIN catalog_product_entity_varchar cpev_name
                ON cpe.entity_id = cpev_name.entity_id
                AND cpev_name.attribute_id = (
                    SELECT attribute_id FROM eav_attribute
                    WHERE attribute_code = 'name' AND entity_type_id = 4
                )
            LEFT JOIN catalog_product_entity_decimal cpd_price
                ON cpe.entity_id = cpd_price.entity_id
                AND cpd_price.attribute_id = (
                    SELECT attribute_id FROM eav_attribute
                    WHERE attribute_code = 'price' AND entity_type_id = 4
                )
            LEFT JOIN cataloginventory_stock_item csi ON cpe.entity_id = csi.product_id
            WHERE cpe.type_id IN ('simple', 'configurable', 'virtual', 'downloadable')
            ORDER BY cpe.entity_id
            LIMIT :limit
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]

    async def get_orders(self, lookback_days: int = 30, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get orders from Magento database"""
        query = text("""
            SELECT
                entity_id as order_id,
                customer_id,
                CAST(grand_total AS DECIMAL(10,2)) as total_price,
                status,
                created_at as order_date
            FROM sales_order
            WHERE status IN ('complete', 'processing')
            AND created_at >= NOW() - INTERVAL ':lookback_days days'
            ORDER BY created_at DESC
            LIMIT :limit
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"lookback_days": lookback_days, "limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]

    async def get_order_items(self, lookback_days: int = 30, limit: int = 10000) -> List[Dict[str, Any]]:
        """Get order items from Magento database"""
        query = text("""
            SELECT
                soi.order_id,
                soi.product_id,
                soi.qty_ordered as quantity,
                CAST(soi.price AS DECIMAL(10,2)) as price,
                soi.name as product_title,
                so.created_at as order_date,
                so.customer_id
            FROM sales_order_item soi
            JOIN sales_order so ON soi.order_id = so.entity_id
            WHERE so.status IN ('complete', 'processing')
            AND so.created_at >= DATE_SUB(NOW(), INTERVAL :lookback_days DAY)
            AND soi.product_type IN ('simple', 'configurable', 'virtual', 'downloadable')
            ORDER BY so.created_at DESC
            LIMIT :limit
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"lookback_days": lookback_days, "limit": limit})
            return [dict(row._mapping) for row in result.fetchall()]

    async def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        """Get single product by ID"""
        query = text("""
            SELECT
                cpe.entity_id as product_id,
                cpe.sku,
                cpev_name.value as title,
                cpe.type_id as product_type,
                CAST(cpd_price.value AS DECIMAL(10,2)) as price,
                csi.qty as inventory_quantity
            FROM catalog_product_entity cpe
            LEFT JOIN catalog_product_entity_varchar cpev_name
                ON cpe.entity_id = cpev_name.entity_id
                AND cpev_name.attribute_id = (
                    SELECT attribute_id FROM eav_attribute
                    WHERE attribute_code = 'name' AND entity_type_id = 4
                )
            LEFT JOIN catalog_product_entity_decimal cpd_price
                ON cpe.entity_id = cpd_price.entity_id
                AND cpd_price.attribute_id = (
                    SELECT attribute_id FROM eav_attribute
                    WHERE attribute_code = 'price' AND entity_type_id = 4
                )
            LEFT JOIN cataloginventory_stock_item csi ON cpe.entity_id = csi.product_id
            WHERE cpe.entity_id = :product_id
            LIMIT 1
        """)

        async with self.engine.begin() as conn:
            result = await conn.execute(query, {"product_id": product_id})
            row = result.fetchone()
            return dict(row._mapping) if row else {}
