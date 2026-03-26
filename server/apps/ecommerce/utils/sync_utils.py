"""
Nudgio Utils — Data Sync

Shared upsert helpers for ingested tables + full sync orchestration.

Upsert Helpers (single source of truth for INSERT ON CONFLICT UPDATE):
    - upsert_products(db, rows) — by (connection_id, product_id)
    - upsert_orders(db, rows) — by (connection_id, order_id)
    - upsert_order_items(db, rows) — by (connection_id, order_id, product_id, variant_id)

Used by:
    - data_subrouter.py import endpoints (Push API — custom sites)
    - sync_connection_data() below (Auto-Sync — pulls from platform adapters)

Sync Orchestration:
    - sync_connection_data(connection, db) — fetches from platform adapter, upserts locally,
      prunes ghost rows (products/orders deleted on platform)
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import func
from sqlalchemy import and_, delete

from ..models import EcommerceConnection, IngestedProduct, IngestedOrder, IngestedOrderItem
from ..adapters.factory import get_adapter

logger = logging.getLogger(__name__)


# ==========================================
# Upsert Helpers — Single Source of Truth
# ==========================================

async def upsert_products(db: AsyncSession, rows: List[Dict]) -> int:
    """
    Upsert product rows into ingested_products by (connection_id, product_id).

    Each row dict must contain: connection_id, product_id, title, handle, product_type,
    vendor, sku, price, image_url, inventory_quantity, status, platform_created_at,
    platform_updated_at.

    Args:
        db: Database session
        rows: List of dicts — one per product

    Returns:
        Number of rows upserted
    """
    if not rows:
        return 0

    stmt = pg_insert(IngestedProduct).values(rows)
    stmt = stmt.on_conflict_do_update(
        constraint="uq_ingested_products_connection_product",
        set_={
            "title": stmt.excluded.title,
            "handle": stmt.excluded.handle,
            "product_type": stmt.excluded.product_type,
            "vendor": stmt.excluded.vendor,
            "sku": stmt.excluded.sku,
            "price": stmt.excluded.price,
            "image_url": stmt.excluded.image_url,
            "inventory_quantity": stmt.excluded.inventory_quantity,
            "status": stmt.excluded.status,
            "platform_created_at": stmt.excluded.platform_created_at,
            "platform_updated_at": stmt.excluded.platform_updated_at,
            "ingested_at": func.now(),  # Refresh timestamp so pruning can detect stale rows
        },
    )
    await db.execute(stmt)
    return len(rows)


async def upsert_orders(db: AsyncSession, rows: List[Dict]) -> int:
    """
    Upsert order rows into ingested_orders by (connection_id, order_id).

    Each row dict must contain: connection_id, order_id, customer_id,
    total_price, status, order_date.

    Args:
        db: Database session
        rows: List of dicts — one per order

    Returns:
        Number of rows upserted
    """
    if not rows:
        return 0

    stmt = pg_insert(IngestedOrder).values(rows)
    stmt = stmt.on_conflict_do_update(
        constraint="uq_ingested_orders_connection_order",
        set_={
            "customer_id": stmt.excluded.customer_id,
            "total_price": stmt.excluded.total_price,
            "status": stmt.excluded.status,
            "order_date": stmt.excluded.order_date,
            "ingested_at": func.now(),  # Refresh timestamp so pruning can detect stale rows
        },
    )
    await db.execute(stmt)
    return len(rows)


async def upsert_order_items(db: AsyncSession, rows: List[Dict]) -> int:
    """
    Upsert order item rows into ingested_order_items by
    (connection_id, order_id, product_id, variant_id).

    Each row dict must contain: connection_id, order_id, product_id, variant_id,
    quantity, price, product_title, customer_id, order_date.

    Args:
        db: Database session
        rows: List of dicts — one per order item

    Returns:
        Number of rows upserted
    """
    if not rows:
        return 0

    stmt = pg_insert(IngestedOrderItem).values(rows)
    stmt = stmt.on_conflict_do_update(
        constraint="uq_ingested_order_items_connection_order_product_variant",
        set_={
            "quantity": stmt.excluded.quantity,
            "price": stmt.excluded.price,
            "product_title": stmt.excluded.product_title,
            "customer_id": stmt.excluded.customer_id,
            "order_date": stmt.excluded.order_date,
            "ingested_at": func.now(),  # Refresh timestamp so pruning can detect stale rows
        },
    )
    await db.execute(stmt)
    return len(rows)


# ==========================================
# Full Sync Orchestration
# ==========================================

async def sync_connection_data(
    connection: EcommerceConnection,
    db: AsyncSession,
    lookback_days: int = 365,
) -> Dict:
    """
    Pull data from platform adapter and upsert into ingested tables.
    Used by: manual sync endpoint + future periodic task.

    This function:
    1. Record sync_started_at timestamp
    2. Create platform adapter for the connection
    3. Fetch products from the platform (limit=10000)
    4. Upsert products into ingested_products
    5. Fetch orders from the platform (lookback configurable, default 365 days)
    6. Upsert orders into ingested_orders
    7. Fetch order items from the platform
    8. Upsert order items into ingested_order_items
    9. Commit and update connection.updated_at as last_sync marker
    10. Prune ghost rows — delete products/orders/items not touched by this sync
    11. Return sync statistics

    Args:
        connection: The EcommerceConnection to sync
        db: Database session
        lookback_days: How far back to fetch orders (default 365)

    Returns:
        Dict with products_synced, orders_synced, order_items_synced, errors
    """
    # Record start time — rows with ingested_at < this after upserts are ghost data
    sync_started_at = datetime.now(timezone.utc)

    # Don't pass db here — we want the PLATFORM adapter, not IngestAdapter
    adapter = get_adapter(connection)
    stats = {
        "products_synced": 0,
        "orders_synced": 0,
        "order_items_synced": 0,
        "errors": [],
    }

    # Step 1: Fetch and upsert products
    try:
        products = await adapter.get_products(limit=10000)
        if products:
            rows = [
                {
                    "connection_id": connection.id,
                    "product_id": p.get("product_id", ""),
                    "title": p.get("title", ""),
                    "handle": p.get("handle"),
                    "product_type": p.get("product_type"),
                    "vendor": p.get("vendor"),
                    "sku": p.get("sku"),
                    "price": float(p.get("price", 0)),
                    "image_url": p.get("image_url"),
                    "inventory_quantity": p.get("inventory_quantity"),
                    "status": p.get("status", "active"),
                    "platform_created_at": _parse_datetime(p.get("created_at")),
                    "platform_updated_at": _parse_datetime(p.get("updated_at")),
                }
                for p in products
                if p.get("product_id")
            ]
            stats["products_synced"] = await upsert_products(db, rows)
    except Exception as e:
        logger.error("Sync products error for connection_id=%s: %s", connection.id, str(e))
        stats["errors"].append(f"Products: {str(e)}")

    # Step 2: Fetch and upsert orders
    try:
        orders = await adapter.get_orders(lookback_days=lookback_days, limit=50000)
        if orders:
            rows = [
                {
                    "connection_id": connection.id,
                    "order_id": o.get("order_id", ""),
                    "customer_id": o.get("customer_id"),
                    "total_price": float(o.get("total_price", 0)),
                    "status": o.get("status", "unknown"),
                    "order_date": _parse_datetime(o.get("order_date")) or datetime.now(timezone.utc),
                }
                for o in orders
                if o.get("order_id")
            ]
            stats["orders_synced"] = await upsert_orders(db, rows)
    except Exception as e:
        logger.error("Sync orders error for connection_id=%s: %s", connection.id, str(e))
        stats["errors"].append(f"Orders: {str(e)}")

    # Step 3: Fetch and upsert order items
    try:
        order_items = await adapter.get_order_items(lookback_days=lookback_days, limit=100000)
        if order_items:
            rows = [
                {
                    "connection_id": connection.id,
                    "order_id": oi.get("order_id", ""),
                    "product_id": oi.get("product_id", ""),
                    "variant_id": oi.get("variant_id"),
                    "quantity": int(oi.get("quantity", 0)),
                    "price": float(oi.get("price", 0)),
                    "product_title": oi.get("product_title"),
                    "customer_id": oi.get("customer_id"),
                    "order_date": _parse_datetime(oi.get("order_date")) or datetime.now(timezone.utc),
                }
                for oi in order_items
                if oi.get("order_id") and oi.get("product_id")
            ]
            stats["order_items_synced"] = await upsert_order_items(db, rows)
    except Exception as e:
        logger.error("Sync order items error for connection_id=%s: %s", connection.id, str(e))
        stats["errors"].append(f"Order items: {str(e)}")

    # Step 4: Commit all upserts and update sync metadata
    try:
        connection.updated_at = func.now()
        # Set sync status fields — visible on frontend and used by scheduler
        connection.last_synced_at = datetime.now(timezone.utc)
        connection.last_sync_status = "error" if stats["errors"] else "success"
        # If auto-sync is enabled, schedule the next sync based on interval
        if connection.auto_sync_enabled:
            from .sync_scheduler import compute_next_sync_at
            connection.next_sync_at = compute_next_sync_at(connection.sync_interval)
        await db.commit()
    except Exception as e:
        logger.error("Sync commit error for connection_id=%s: %s", connection.id, str(e))
        stats["errors"].append(f"Commit: {str(e)}")

    # Step 5: Prune ghost rows — products/orders/items deleted on the platform
    # Any row with ingested_at < sync_started_at was NOT in the latest pull → stale
    try:
        await _prune_stale_rows(db, connection.id, sync_started_at)
        await db.commit()
    except Exception as e:
        logger.error("Prune error for connection_id=%s: %s", connection.id, str(e))
        stats["errors"].append(f"Prune: {str(e)}")

    # Close platform adapter (disposes external engine)
    try:
        await adapter.close()
    except Exception:
        pass

    logger.info(
        "Sync complete for connection_id=%s: %d products, %d orders, %d items, %d errors",
        connection.id,
        stats["products_synced"],
        stats["orders_synced"],
        stats["order_items_synced"],
        len(stats["errors"]),
    )

    return stats


async def _prune_stale_rows(
    db: AsyncSession, connection_id: int, sync_started_at: datetime
) -> None:
    """
    Delete ingested rows not touched by the current sync (ghost data).

    Rows with ingested_at < sync_started_at were not upserted during this sync,
    meaning the platform no longer has them (deleted/archived products, cancelled orders, etc.).

    Only called by sync_connection_data() — Push API imports do NOT prune
    because partial uploads are expected.
    """

    # Prune products
    await db.execute(
        delete(IngestedProduct).where(
            and_(
                IngestedProduct.connection_id == connection_id,
                IngestedProduct.ingested_at < sync_started_at,
            )
        )
    )

    # Prune orders
    await db.execute(
        delete(IngestedOrder).where(
            and_(
                IngestedOrder.connection_id == connection_id,
                IngestedOrder.ingested_at < sync_started_at,
            )
        )
    )

    # Prune order items
    await db.execute(
        delete(IngestedOrderItem).where(
            and_(
                IngestedOrderItem.connection_id == connection_id,
                IngestedOrderItem.ingested_at < sync_started_at,
            )
        )
    )

    logger.info("Pruned stale rows for connection_id=%s (before %s)", connection_id, sync_started_at)


def _parse_datetime(value) -> datetime | None:
    """Parse a datetime value from adapter output — handles str, datetime, and None"""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None
    return None
