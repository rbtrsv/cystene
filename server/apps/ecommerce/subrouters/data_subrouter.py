import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ..schemas.data_schemas import (
    ProductImportRequest,
    OrderImportRequest,
    OrderItemImportRequest,
    DataImportResponse,
    ConnectionStatsDetail,
    ConnectionStatsResponse,
)
from ..adapters.factory import get_adapter
from ..utils.dependency_utils import get_active_connection
from ..utils.sync_utils import (
    upsert_products,
    upsert_orders,
    upsert_order_items,
    sync_connection_data as run_sync,
)

logger = logging.getLogger(__name__)

# Max items per import request (prevents oversized payloads)
MAX_IMPORT_BATCH_SIZE = 1000

# ==========================================
# Data Management Router
# ==========================================

router = APIRouter(prefix="/data", tags=["Data Management"])


@router.post("/import/products", response_model=DataImportResponse)
async def import_products(
    payload: ProductImportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Import product data for a connection via upsert (INSERT ON CONFLICT UPDATE).

    This endpoint:
    1. Validates the user owns an active connection
    2. Enforces batch size limit (max 1000 items)
    3. Validates each product record (product_id + title required)
    4. Upserts valid records into ingested_products by (connection_id, product_id)
    5. Returns import results with processed count and errors
    """
    try:
        # Step 1: Validate user owns an active connection
        await get_active_connection(payload.connection_id, user.id, db)

        # Step 2: Enforce batch size limit
        if len(payload.products) > MAX_IMPORT_BATCH_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Batch size exceeds limit of {MAX_IMPORT_BATCH_SIZE} items",
            )

        # Step 3: Validate product data, build upsert rows
        processed = 0
        errors = []
        rows = []
        for product in payload.products:
            if not product.product_id or not product.title:
                errors.append(f"Product missing required fields: {product.model_dump()}")
                continue

            rows.append({
                "connection_id": payload.connection_id,
                "product_id": product.product_id,
                "title": product.title,
                "handle": product.handle,
                "product_type": product.product_type,
                "vendor": product.vendor,
                "sku": product.sku,
                "price": product.price,
                "image_url": None,  # Not in ProductData schema — set via platform sync
                "inventory_quantity": product.inventory_quantity,
                "status": product.status or "active",
                "platform_created_at": product.created_at,
                "platform_updated_at": product.updated_at,
            })
            processed += 1

        # Step 4: Upsert into ingested_products (shared helper)
        await upsert_products(db, rows)
        await db.commit()

        # Step 5: Return results
        return DataImportResponse(
            success=len(errors) == 0,
            message=f"Processed {processed} products with {len(errors)} errors",
            records_processed=processed,
            errors=errors,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing products: {str(e)}")


@router.post("/import/orders", response_model=DataImportResponse)
async def import_orders(
    payload: OrderImportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Import order data for a connection via upsert (INSERT ON CONFLICT UPDATE).

    This endpoint:
    1. Validates the user owns an active connection
    2. Enforces batch size limit (max 1000 items)
    3. Validates each order record (order_id + total_price required)
    4. Upserts valid records into ingested_orders by (connection_id, order_id)
    5. Returns import results with processed count and errors
    """
    try:
        # Step 1: Validate user owns an active connection
        await get_active_connection(payload.connection_id, user.id, db)

        # Step 2: Enforce batch size limit
        if len(payload.orders) > MAX_IMPORT_BATCH_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Batch size exceeds limit of {MAX_IMPORT_BATCH_SIZE} items",
            )

        # Step 3: Validate order data, build upsert rows
        processed = 0
        errors = []
        rows = []
        for order in payload.orders:
            if not order.order_id or not order.total_price:
                errors.append(f"Order missing required fields: {order.model_dump()}")
                continue

            rows.append({
                "connection_id": payload.connection_id,
                "order_id": order.order_id,
                "customer_id": order.customer_id,
                "total_price": order.total_price,
                "status": order.status,
                "order_date": order.order_date,
            })
            processed += 1

        # Step 4: Upsert into ingested_orders (shared helper)
        await upsert_orders(db, rows)
        await db.commit()

        # Step 5: Return results
        return DataImportResponse(
            success=len(errors) == 0,
            message=f"Processed {processed} orders with {len(errors)} errors",
            records_processed=processed,
            errors=errors,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing orders: {str(e)}")


@router.post("/import/order-items", response_model=DataImportResponse)
async def import_order_items(
    payload: OrderItemImportRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Import order item data for a connection via upsert (INSERT ON CONFLICT UPDATE).

    This endpoint:
    1. Validates the user owns an active connection
    2. Enforces batch size limit (max 1000 items)
    3. Validates each order item record (order_id + product_id + quantity required)
    4. Upserts valid records into ingested_order_items by (connection_id, order_id, product_id, variant_id)
    5. Returns import results with processed count and errors
    """
    try:
        # Step 1: Validate user owns an active connection
        await get_active_connection(payload.connection_id, user.id, db)

        # Step 2: Enforce batch size limit
        if len(payload.order_items) > MAX_IMPORT_BATCH_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Batch size exceeds limit of {MAX_IMPORT_BATCH_SIZE} items",
            )

        # Step 3: Validate order items data, build upsert rows
        processed = 0
        errors = []
        rows = []
        for item in payload.order_items:
            if not item.order_id or not item.product_id or not item.quantity:
                errors.append(f"Order item missing required fields: {item.model_dump()}")
                continue

            rows.append({
                "connection_id": payload.connection_id,
                "order_id": item.order_id,
                "product_id": item.product_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "price": item.price,
                "product_title": item.product_title,
                "customer_id": item.customer_id,
                "order_date": item.order_date,
            })
            processed += 1

        # Step 4: Upsert into ingested_order_items (shared helper)
        await upsert_order_items(db, rows)
        await db.commit()

        # Step 5: Return results
        return DataImportResponse(
            success=len(errors) == 0,
            message=f"Processed {processed} order items with {len(errors)} errors",
            records_processed=processed,
            errors=errors,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing order items: {str(e)}")


# ==========================================
# GET /products/{connection_id} — Product List for Dropdown
# ==========================================

@router.get("/products/{connection_id}")
async def get_products(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get a simplified product list for the standalone Components page dropdown.

    Returns product_id, title, and image_url for each active product.

    This endpoint:
    1. Validate the user owns an active connection
    2. Get adapter for the connection
    3. Fetch products from the store (limit=250)
    4. Return simplified list: product_id, title, image_url
    """
    try:
        # Step 1: Validate user owns an active connection
        connection = await get_active_connection(connection_id, user.id, db)

        # Step 2–3: Fetch products from store adapter
        adapter = get_adapter(connection, db)
        raw_products = await adapter.get_products(limit=250)

        # Step 4: Return simplified list for dropdown
        products = [
            {
                "product_id": p.get("product_id", ""),
                "title": p.get("title", ""),
                "image_url": p.get("image_url", ""),
            }
            for p in raw_products
        ]

        return {"products": products, "count": len(products)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Products list error for connection_id=%s: %s", connection_id, str(e))
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")


@router.get("/stats/{connection_id}", response_model=ConnectionStatsResponse)
async def get_connection_stats(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get data statistics for a connection

    This endpoint:
    1. Validates the user owns an active connection
    2. Queries product, order, and order item counts via the adapter
    3. Returns the connection statistics
    """
    try:
        # Validate user owns an active connection
        connection = await get_active_connection(connection_id, user.id, db)

        # Get data counts via adapter (lightweight count queries, no full data fetch)
        adapter = get_adapter(connection, db)
        products_count = await adapter.get_product_count()
        orders_count = await adapter.get_order_count(lookback_days=365)

        return ConnectionStatsResponse(
            success=True,
            data=ConnectionStatsDetail(
                connection_id=connection.id,
                connection_name=connection.connection_name,
                platform=connection.platform,
                products_count=products_count,
                orders_count=orders_count,
                last_sync=connection.updated_at,
                data_freshness_days=30,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting connection stats: {str(e)}")


@router.post("/sync/{connection_id}", response_model=ConnectionStatsResponse)
async def sync_connection_data(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Trigger data sync for a connection — pulls from platform adapter and upserts into local tables.

    This endpoint:
    1. Validates the user owns an active connection
    2. Runs sync_connection_data() — fetches products/orders/items from platform, upserts locally
    3. Returns sync stats and current connection statistics
    """
    try:
        # Step 1: Validate user owns an active connection
        connection = await get_active_connection(connection_id, user.id, db)

        # Step 2: Run sync — pulls from platform, upserts into local ingested tables
        sync_stats = await run_sync(connection, db)

        # Step 3: Return sync results as connection stats
        return ConnectionStatsResponse(
            success=len(sync_stats["errors"]) == 0,
            data=ConnectionStatsDetail(
                connection_id=connection.id,
                connection_name=connection.connection_name,
                platform=connection.platform,
                products_count=sync_stats["products_synced"],
                orders_count=sync_stats["orders_synced"],
                last_sync=connection.updated_at,
                data_freshness_days=0,  # Just synced
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing connection data: {str(e)}")
