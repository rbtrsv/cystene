"""
Ingest Adapter — reads from locally ingested tables instead of external APIs.

Used for connections that receive data via Push API (custom sites) or Auto-Sync
(existing platform adapters synced to local tables).

Unlike other adapters that create their own database engines, IngestAdapter uses
the shared AsyncSession from FastAPI's dependency injection — it reads from our
own PostgreSQL, not an external database.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..models import EcommerceConnection, IngestedProduct, IngestedOrder, IngestedOrderItem

logger = logging.getLogger(__name__)


class IngestAdapter:
    """
    Adapter that reads from locally ingested tables instead of external APIs.
    Used for connections that receive data via Push API or Auto-Sync.

    Does NOT extend PlatformAdapter — no external engine needed.
    Implements the same interface (get_products, get_orders, etc.) so the
    recommendation engine can use it interchangeably.
    """

    def __init__(self, connection: EcommerceConnection, db: AsyncSession):
        self.connection = connection
        self.db = db  # Uses our PostgreSQL, not external DB

    async def get_products(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get products from ingested_products table"""
        result = await self.db.execute(
            select(IngestedProduct)
            .where(IngestedProduct.connection_id == self.connection.id)
            .order_by(IngestedProduct.ingested_at.desc())
            .limit(limit)
        )
        rows = result.scalars().all()

        return [
            {
                "product_id": row.product_id,
                "title": row.title,
                "handle": row.handle or "",
                "product_type": row.product_type or "",
                "vendor": row.vendor or "",
                "sku": row.sku or "",
                "price": row.price,
                "image_url": row.image_url or "",
                "inventory_quantity": row.inventory_quantity or 0,
                "status": row.status or "active",
            }
            for row in rows
        ]

    async def get_orders(self, lookback_days: int = 30, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get orders from ingested_orders table"""
        since = datetime.now(timezone.utc) - timedelta(days=lookback_days)

        result = await self.db.execute(
            select(IngestedOrder)
            .where(
                IngestedOrder.connection_id == self.connection.id,
                IngestedOrder.order_date >= since,
            )
            .order_by(IngestedOrder.order_date.desc())
            .limit(limit)
        )
        rows = result.scalars().all()

        return [
            {
                "order_id": row.order_id,
                "customer_id": row.customer_id or "",
                "total_price": row.total_price,
                "status": row.status,
                "order_date": row.order_date.isoformat() if row.order_date else "",
            }
            for row in rows
        ]

    async def get_order_items(self, lookback_days: int = 30, limit: int = 10000) -> List[Dict[str, Any]]:
        """Get order line items from ingested_order_items table"""
        since = datetime.now(timezone.utc) - timedelta(days=lookback_days)

        result = await self.db.execute(
            select(IngestedOrderItem)
            .where(
                IngestedOrderItem.connection_id == self.connection.id,
                IngestedOrderItem.order_date >= since,
            )
            .order_by(IngestedOrderItem.order_date.desc())
            .limit(limit)
        )
        rows = result.scalars().all()

        return [
            {
                "order_id": row.order_id,
                "product_id": row.product_id,
                "variant_id": row.variant_id or "",
                "quantity": row.quantity,
                "price": row.price,
                "product_title": row.product_title or "",
                "customer_id": row.customer_id or "",
                "order_date": row.order_date.isoformat() if row.order_date else "",
            }
            for row in rows
        ]

    async def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        """Get single product by platform product ID from ingested_products"""
        result = await self.db.execute(
            select(IngestedProduct)
            .where(
                IngestedProduct.connection_id == self.connection.id,
                IngestedProduct.product_id == product_id,
            )
        )
        row = result.scalar_one_or_none()

        if not row:
            return {}

        return {
            "product_id": row.product_id,
            "title": row.title,
            "handle": row.handle or "",
            "product_type": row.product_type or "",
            "vendor": row.vendor or "",
            "sku": row.sku or "",
            "price": row.price,
            "image_url": row.image_url or "",
            "inventory_quantity": row.inventory_quantity or 0,
            "status": row.status or "active",
        }

    async def get_product_count(self) -> int:
        """Get total ingested product count for this connection"""
        result = await self.db.execute(
            select(func.count(IngestedProduct.id))
            .where(IngestedProduct.connection_id == self.connection.id)
        )
        return result.scalar() or 0

    async def get_order_count(self, lookback_days: int = 365) -> int:
        """Get total ingested order count for this connection within lookback window"""
        since = datetime.now(timezone.utc) - timedelta(days=lookback_days)
        result = await self.db.execute(
            select(func.count(IngestedOrder.id))
            .where(
                IngestedOrder.connection_id == self.connection.id,
                IngestedOrder.order_date >= since,
            )
        )
        return result.scalar() or 0

    async def test_connection(self) -> bool:
        """Always succeeds — reads from our own database"""
        return True

    async def close(self):
        """No engine to dispose — uses shared session"""
        pass
