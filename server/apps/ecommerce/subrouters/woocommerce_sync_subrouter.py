"""
Nudgio Subrouter — WooCommerce Sync

HMAC-authenticated POST endpoints for WooCommerce plugin data sync.
The WordPress plugin pushes products, orders, and order items to these
endpoints using HMAC-SHA256 body signing (no JWT, no session token).

Security model:
- Plugin holds the API key_id + api_secret (same credentials as widget HMAC)
- POST body is signed: HMAC-SHA256(raw_body, api_secret)
- Auth headers: X-Nudgio-Key-Id, X-Nudgio-Timestamp, X-Nudgio-Nonce, X-Nudgio-Signature
- Server verifies signature, derives connection_id from the API key
- Timestamp window: 5 minutes (prevents replay attacks)

Endpoints:
- POST /woocommerce-sync/products — upsert products from WooCommerce
- POST /woocommerce-sync/orders — upsert orders from WooCommerce
- POST /woocommerce-sync/order-items — upsert order items from WooCommerce

All endpoints reuse existing upsert helpers from sync_utils.py and
existing schemas from data_schemas.py.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from ..schemas.data_schemas import (
    ProductData,
    OrderData,
    OrderItemData,
    DataImportResponse,
)
from ..utils.sync_utils import (
    upsert_products,
    upsert_orders,
    upsert_order_items,
)
from ..utils.widget_auth_utils import (
    verify_woocommerce_sync_signature,
    WidgetAuthError,
)

logger = logging.getLogger(__name__)

# Max items per sync request (prevents oversized payloads)
MAX_SYNC_BATCH_SIZE = 5000


# ==========================================
# WooCommerce Sync Router
# ==========================================

router = APIRouter(prefix="/woocommerce-sync", tags=["WooCommerce Sync"])


# ==========================================
# Request Schemas (no connection_id — derived from API key)
# ==========================================

from pydantic import BaseModel, Field


class WooCommerceSyncProductRequest(BaseModel):
    """Product sync payload from WooCommerce plugin — connection_id derived from API key"""
    products: list[ProductData] = Field(description="List of product records to sync")


class WooCommerceSyncOrderRequest(BaseModel):
    """Order sync payload from WooCommerce plugin — connection_id derived from API key"""
    orders: list[OrderData] = Field(description="List of order records to sync")


class WooCommerceSyncOrderItemRequest(BaseModel):
    """Order item sync payload from WooCommerce plugin — connection_id derived from API key"""
    order_items: list[OrderItemData] = Field(description="List of order item records to sync")


# ==========================================
# POST /products — Sync Products
# ==========================================

@router.post("/products", response_model=DataImportResponse)
async def sync_products(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Receive and upsert product data from WooCommerce plugin via HMAC auth.

    This endpoint:
    1. Read raw body bytes for HMAC verification
    2. Verify HMAC-SHA256 signature from headers
    3. Parse request body as WooCommerceSyncProductRequest
    4. Enforce batch size limit (max 5000 items)
    5. Build upsert rows with connection_id from the API key
    6. Upsert into ingested_products via shared helper
    7. Return DataImportResponse with processed count
    """
    try:
        # Step 1: Read raw body bytes for HMAC verification
        body_bytes = await request.body()

        # Step 2: Verify HMAC-SHA256 signature from headers
        headers = {k.lower(): v for k, v in request.headers.items()}
        api_key, connection = await verify_woocommerce_sync_signature(headers, body_bytes, db)

        # Step 3: Parse request body
        payload = WooCommerceSyncProductRequest.model_validate_json(body_bytes)

        # Step 4: Enforce batch size limit
        if len(payload.products) > MAX_SYNC_BATCH_SIZE:
            return DataImportResponse(
                success=False,
                error=f"Batch size exceeds limit of {MAX_SYNC_BATCH_SIZE} items",
                records_processed=0,
            )

        # Step 5: Build upsert rows with connection_id from the API key
        rows = []
        errors = []
        for product in payload.products:
            if not product.product_id or not product.title:
                errors.append(f"Product missing required fields: product_id={product.product_id}")
                continue

            rows.append({
                "connection_id": connection.id,
                "product_id": str(product.product_id),
                "title": product.title,
                "handle": product.handle,
                "product_type": product.product_type,
                "vendor": product.vendor,
                "sku": product.sku,
                "price": product.price,
                "image_url": product.image_url,
                "inventory_quantity": product.inventory_quantity,
                "status": product.status or "active",
                "platform_created_at": product.created_at,
                "platform_updated_at": product.updated_at,
            })

        # Step 6: Upsert into ingested_products (shared helper)
        count = await upsert_products(db, rows)
        await db.commit()

        # Step 6b: Stamp sync status on the connection — enables factory to
        # switch from live platform adapter to IngestAdapter (local PostgreSQL reads)
        connection.last_synced_at = datetime.now(timezone.utc)
        connection.last_sync_status = "success"
        await db.commit()

        # Step 7: Return results
        logger.info(
            "WooCommerce sync products: connection_id=%s, processed=%d, errors=%d",
            connection.id, count, len(errors),
        )
        return DataImportResponse(
            success=len(errors) == 0,
            message=f"Synced {count} products with {len(errors)} errors",
            records_processed=count,
            errors=errors,
        )

    except WidgetAuthError as e:
        logger.warning(f"WooCommerce sync products auth error: {str(e)}")
        return DataImportResponse(
            success=False,
            error=f"Authentication failed: {str(e)}",
            records_processed=0,
        )
    except Exception as e:
        logger.error(f"WooCommerce sync products error: {str(e)}")
        return DataImportResponse(
            success=False,
            error=f"Error syncing products: {str(e)}",
            records_processed=0,
        )


# ==========================================
# POST /orders — Sync Orders
# ==========================================

@router.post("/orders", response_model=DataImportResponse)
async def sync_orders(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Receive and upsert order data from WooCommerce plugin via HMAC auth.

    This endpoint:
    1. Read raw body bytes for HMAC verification
    2. Verify HMAC-SHA256 signature from headers
    3. Parse request body as WooCommerceSyncOrderRequest
    4. Enforce batch size limit (max 5000 items)
    5. Build upsert rows with connection_id from the API key
    6. Upsert into ingested_orders via shared helper
    7. Return DataImportResponse with processed count
    """
    try:
        # Step 1: Read raw body bytes for HMAC verification
        body_bytes = await request.body()

        # Step 2: Verify HMAC-SHA256 signature from headers
        headers = {k.lower(): v for k, v in request.headers.items()}
        api_key, connection = await verify_woocommerce_sync_signature(headers, body_bytes, db)

        # Step 3: Parse request body
        payload = WooCommerceSyncOrderRequest.model_validate_json(body_bytes)

        # Step 4: Enforce batch size limit
        if len(payload.orders) > MAX_SYNC_BATCH_SIZE:
            return DataImportResponse(
                success=False,
                error=f"Batch size exceeds limit of {MAX_SYNC_BATCH_SIZE} items",
                records_processed=0,
            )

        # Step 5: Build upsert rows with connection_id from the API key
        rows = []
        errors = []
        for order in payload.orders:
            if not order.order_id:
                errors.append(f"Order missing required fields: order_id={order.order_id}")
                continue

            rows.append({
                "connection_id": connection.id,
                "order_id": str(order.order_id),
                "customer_id": order.customer_id,
                "total_price": order.total_price,
                "status": order.status,
                "order_date": order.order_date or datetime.now(timezone.utc),
            })

        # Step 6: Upsert into ingested_orders (shared helper)
        count = await upsert_orders(db, rows)
        await db.commit()

        # Step 6b: Stamp sync status on the connection — enables factory to
        # switch from live platform adapter to IngestAdapter (local PostgreSQL reads)
        connection.last_synced_at = datetime.now(timezone.utc)
        connection.last_sync_status = "success"
        await db.commit()

        # Step 7: Return results
        logger.info(
            "WooCommerce sync orders: connection_id=%s, processed=%d, errors=%d",
            connection.id, count, len(errors),
        )
        return DataImportResponse(
            success=len(errors) == 0,
            message=f"Synced {count} orders with {len(errors)} errors",
            records_processed=count,
            errors=errors,
        )

    except WidgetAuthError as e:
        logger.warning(f"WooCommerce sync orders auth error: {str(e)}")
        return DataImportResponse(
            success=False,
            error=f"Authentication failed: {str(e)}",
            records_processed=0,
        )
    except Exception as e:
        logger.error(f"WooCommerce sync orders error: {str(e)}")
        return DataImportResponse(
            success=False,
            error=f"Error syncing orders: {str(e)}",
            records_processed=0,
        )


# ==========================================
# POST /order-items — Sync Order Items
# ==========================================

@router.post("/order-items", response_model=DataImportResponse)
async def sync_order_items(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Receive and upsert order item data from WooCommerce plugin via HMAC auth.

    This endpoint:
    1. Read raw body bytes for HMAC verification
    2. Verify HMAC-SHA256 signature from headers
    3. Parse request body as WooCommerceSyncOrderItemRequest
    4. Enforce batch size limit (max 5000 items)
    5. Build upsert rows with connection_id from the API key
    6. Upsert into ingested_order_items via shared helper
    7. Return DataImportResponse with processed count
    """
    try:
        # Step 1: Read raw body bytes for HMAC verification
        body_bytes = await request.body()

        # Step 2: Verify HMAC-SHA256 signature from headers
        headers = {k.lower(): v for k, v in request.headers.items()}
        api_key, connection = await verify_woocommerce_sync_signature(headers, body_bytes, db)

        # Step 3: Parse request body
        payload = WooCommerceSyncOrderItemRequest.model_validate_json(body_bytes)

        # Step 4: Enforce batch size limit
        if len(payload.order_items) > MAX_SYNC_BATCH_SIZE:
            return DataImportResponse(
                success=False,
                error=f"Batch size exceeds limit of {MAX_SYNC_BATCH_SIZE} items",
                records_processed=0,
            )

        # Step 5: Build upsert rows with connection_id from the API key
        rows = []
        errors = []
        for item in payload.order_items:
            if not item.order_id or not item.product_id:
                errors.append(f"Order item missing required fields: order_id={item.order_id}, product_id={item.product_id}")
                continue

            rows.append({
                "connection_id": connection.id,
                "order_id": str(item.order_id),
                "product_id": str(item.product_id),
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "price": item.price,
                "product_title": item.product_title,
                "customer_id": item.customer_id,
                "order_date": item.order_date or datetime.now(timezone.utc),
            })

        # Step 6: Upsert into ingested_order_items (shared helper)
        count = await upsert_order_items(db, rows)
        await db.commit()

        # Step 6b: Stamp sync status on the connection — enables factory to
        # switch from live platform adapter to IngestAdapter (local PostgreSQL reads)
        connection.last_synced_at = datetime.now(timezone.utc)
        connection.last_sync_status = "success"
        await db.commit()

        # Step 7: Return results
        logger.info(
            "WooCommerce sync order items: connection_id=%s, processed=%d, errors=%d",
            connection.id, count, len(errors),
        )
        return DataImportResponse(
            success=len(errors) == 0,
            message=f"Synced {count} order items with {len(errors)} errors",
            records_processed=count,
            errors=errors,
        )

    except WidgetAuthError as e:
        logger.warning(f"WooCommerce sync order items auth error: {str(e)}")
        return DataImportResponse(
            success=False,
            error=f"Authentication failed: {str(e)}",
            records_processed=0,
        )
    except Exception as e:
        logger.error(f"WooCommerce sync order items error: {str(e)}")
        return DataImportResponse(
            success=False,
            error=f"Error syncing order items: {str(e)}",
            records_processed=0,
        )
