from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text

from core.db import get_session
from apps.accounts.models import User, OrganizationMember
from apps.accounts.utils.auth_utils import get_current_user

from ..models import EcommerceConnection
from ..schemas.ecommerce_connection_schemas import (
    PlatformType,
    ConnectionMethod,
    EcommerceConnectionCreate,
    EcommerceConnectionUpdate,
    EcommerceConnectionDetail,
    EcommerceConnectionResponse,
    EcommerceConnectionListResponse,
    EcommerceConnectionTestResponse,
    MessageResponse,
)
from ..adapters.factory import get_adapter
from ..utils.dependency_utils import get_user_connection
from ..utils.encryption_utils import encrypt_password
from ..utils.subscription_utils import get_org_subscription, is_over_connection_limit
from ..utils.sync_scheduler import compute_next_sync_at
import logging

# ==========================================
# Ecommerce Connections Router
# ==========================================

router = APIRouter(prefix="/connections", tags=["Ecommerce Connections"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=EcommerceConnectionResponse)
async def create_connection(
    payload: EcommerceConnectionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new ecommerce platform connection

    This endpoint:
    1. Validates the user belongs to an organization
    2. Checks connection limit for the organization's tier
    3. Checks for duplicate connection names
    4. Encrypts sensitive credentials before saving
    5. Creates the connection record
    6. Returns the created connection details
    """
    try:
        # Get user's organization ID from membership
        org_result = await db.execute(
            select(OrganizationMember).where(OrganizationMember.user_id == user.id)
        )
        membership = org_result.scalar_one_or_none()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to an organization"
            )

        # Check connection limit for the organization's subscription tier
        subscription = await get_org_subscription(membership.organization_id, db)
        if await is_over_connection_limit(membership.organization_id, db, subscription):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Connection limit reached for your plan. Upgrade to add more connections."
            )

        # Check if connection name already exists for this user (exclude soft-deleted)
        existing = await db.execute(
            select(EcommerceConnection).where(
                and_(
                    EcommerceConnection.user_id == user.id,
                    EcommerceConnection.connection_name == payload.connection_name,
                    EcommerceConnection.deleted_at == None,
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Connection name already exists"
            )

        # Create new connection — encrypt sensitive fields before saving
        new_connection = EcommerceConnection(
            user_id=user.id,
            organization_id=membership.organization_id,
            connection_name=payload.connection_name,
            platform=payload.platform.value,
            connection_method=payload.connection_method.value,
            store_url=payload.store_url,
            api_key=encrypt_password(payload.api_key) if payload.api_key else None,
            api_secret=encrypt_password(payload.api_secret) if payload.api_secret else None,
            db_host=payload.db_host,
            db_name=payload.db_name,
            db_user=payload.db_user,
            db_password=encrypt_password(payload.db_password) if payload.db_password else None,
            db_port=payload.db_port,
            # Ingest connections are auto-activated (no credentials to test)
            is_active=(payload.connection_method == ConnectionMethod.INGEST),
            created_by=user.id,
        )
        db.add(new_connection)
        await db.commit()
        await db.refresh(new_connection)

        return EcommerceConnectionResponse(
            success=True,
            data=EcommerceConnectionDetail.model_validate(new_connection, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to create connection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=EcommerceConnectionListResponse)
async def list_connections(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List all ecommerce connections for the current user

    This endpoint:
    1. Queries all connections owned by the user
    2. Returns a paginated list ordered by creation date
    """
    try:
        # Get all active connections for the user (exclude soft-deleted)
        result = await db.execute(
            select(EcommerceConnection).where(
                and_(
                    EcommerceConnection.user_id == user.id,
                    EcommerceConnection.deleted_at == None,
                )
            ).order_by(EcommerceConnection.created_at.desc())
        )
        connections = result.scalars().all()

        return EcommerceConnectionListResponse(
            success=True,
            data=[EcommerceConnectionDetail.model_validate(conn, from_attributes=True) for conn in connections],
            count=len(connections),
        )
    except Exception as e:
        logger.exception(f"Failed to list connections: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{connection_id}", response_model=EcommerceConnectionResponse)
async def get_connection(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific ecommerce connection

    This endpoint:
    1. Retrieves a connection by ID (enforces ownership)
    2. Returns the connection details
    """
    try:
        connection = await get_user_connection(connection_id, user.id, db)

        return EcommerceConnectionResponse(
            success=True,
            data=EcommerceConnectionDetail.model_validate(connection, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get connection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{connection_id}/test", response_model=EcommerceConnectionTestResponse)
async def test_connection(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Test an ecommerce connection and return sample data

    This endpoint:
    1. Retrieves the connection (enforces ownership)
    2. Creates the platform adapter
    3. Explores database structure (for database connections)
    4. Fetches sample products to verify connectivity
    5. Marks the connection as active on success
    """
    connection = await get_user_connection(connection_id, user.id, db)

    try:
        # Create adapter based on platform — force_platform=True ensures we always
        # verify live credentials against the external API, even if synced data exists
        adapter = get_adapter(connection, db, force_platform=True)

        # NOTE: Do NOT remove this table exploration block.
        # It is essential for debugging database connections — shows what tables
        # exist in the merchant's database, grouped by platform patterns (MySQL SHOW TABLES).
        table_info = ""
        try:
            # Skip table exploration for API-based adapters (like Shopify)
            if not hasattr(adapter, 'engine'):
                table_info = f" | {connection.platform} uses API access (no direct database tables)"
            else:
                async with adapter.engine.begin() as conn:
                    # Define table patterns based on platform
                    if connection.platform == PlatformType.WOOCOMMERCE.value:
                        patterns = [
                            ('%wc_%', 'HPOS tables'),
                            ('%woocommerce%', 'Legacy tables'),
                            ('%order%', 'Order tables'),
                        ]
                    elif connection.platform == PlatformType.SHOPIFY.value:
                        patterns = [
                            ('%shop_%', 'Shop tables'),
                            ('%product%', 'Product tables'),
                            ('%customer%', 'Customer tables'),
                            ('%order%', 'Order tables'),
                        ]
                    elif connection.platform == PlatformType.MAGENTO.value:
                        patterns = [
                            ('%sales_%', 'Sales tables'),
                            ('%catalog_%', 'Catalog tables'),
                            ('%quote%', 'Quote tables'),
                            ('%customer%', 'Customer tables'),
                        ]
                    else:
                        patterns = [('%_%', 'All tables')]

                    # Collect tables for each pattern
                    table_groups = {}
                    for pattern, label in patterns:
                        result = await conn.execute(text(f"SHOW TABLES LIKE '{pattern}'"))
                        tables = [row[0] for row in result.fetchall()]
                        if tables:
                            table_groups[label] = tables

                    # Format table info
                    if table_groups:
                        table_parts = [f"{label}: {tables}" for label, tables in table_groups.items()]
                        table_info = f" | {' | '.join(table_parts)}"
                    else:
                        table_info = f" | No {connection.platform} tables found"

        except Exception as e:
            table_info = f" | Table exploration failed: {str(e)}"

        # Test by getting sample products
        products = []
        product_error = None
        try:
            products = await adapter.get_products(limit=10)
        except Exception as e:
            product_error = str(e)

        if products:
            # Mark connection as active
            connection.is_active = True
            await db.commit()

            return EcommerceConnectionTestResponse(
                success=True,
                message=f"Connection successful! Found {len(products)} products.{table_info}",
                sample_products_count=len(products),
            )
        else:
            error_detail = f" Product query failed: {product_error}" if product_error else " No products found."
            return EcommerceConnectionTestResponse(
                success=False,
                message=f"Connection successful but{error_detail} Check your database schema.{table_info}",
                sample_products_count=0,
            )

    except Exception as e:
        return EcommerceConnectionTestResponse(
            success=False,
            message=f"Connection failed: {str(e)}",
            sample_products_count=0,
        )


@router.put("/{connection_id}", response_model=EcommerceConnectionResponse)
async def update_connection(
    connection_id: int,
    payload: EcommerceConnectionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an existing ecommerce connection

    This endpoint:
    1. Retrieves the connection by ID (enforces ownership)
    2. Checks for duplicate connection names (excluding self)
    3. Encrypts sensitive fields if they were updated
    4. Updates only provided fields (partial update)
    5. Resets active status if connection details changed (user must re-test)
    6. Returns the updated connection details
    """
    try:
        connection = await get_user_connection(connection_id, user.id, db)

        # Only update fields that were actually provided
        update_data = payload.model_dump(exclude_unset=True)

        # Check if new connection name conflicts with existing ones (excluding self and soft-deleted)
        if "connection_name" in update_data and update_data["connection_name"] != connection.connection_name:
            existing = await db.execute(
                select(EcommerceConnection).where(
                    and_(
                        EcommerceConnection.user_id == user.id,
                        EcommerceConnection.connection_name == update_data["connection_name"],
                        EcommerceConnection.id != connection_id,
                        EcommerceConnection.deleted_at == None,
                    )
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Connection name already exists"
                )

        # Encrypt sensitive fields if they were updated
        sensitive_fields = {"api_key", "api_secret", "db_password"}
        for field in sensitive_fields:
            if field in update_data and update_data[field]:
                update_data[field] = encrypt_password(update_data[field])

        # Apply updates — convert enum values to their string representation
        for field, value in update_data.items():
            if hasattr(value, 'value'):
                value = value.value
            setattr(connection, field, value)

        # Compute next_sync_at when auto-sync settings change
        # If enabled → schedule next sync based on interval
        # If disabled → clear next_sync_at
        if "auto_sync_enabled" in update_data or "sync_interval" in update_data:
            if connection.auto_sync_enabled:
                connection.next_sync_at = compute_next_sync_at(connection.sync_interval)
            else:
                connection.next_sync_at = None

        # Reset active status when connection details change (user must re-test)
        # Only reset if connection-critical fields changed (not sync settings)
        connection_fields = {"platform", "connection_method", "store_url", "api_key", "api_secret", "db_host", "db_name", "db_user", "db_password", "db_port"}
        if update_data.keys() & connection_fields:
            connection.is_active = False
        connection.updated_by = user.id

        await db.commit()
        await db.refresh(connection)

        return EcommerceConnectionResponse(
            success=True,
            data=EcommerceConnectionDetail.model_validate(connection, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to update connection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{connection_id}", response_model=MessageResponse)
async def delete_connection(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft-delete an ecommerce connection

    This endpoint:
    1. Retrieves the connection by ID (enforces ownership)
    2. Sets deleted_at and deleted_by (soft delete — record preserved in DB)
    3. Deactivates the connection
    4. Returns a success message
    """
    try:
        connection = await get_user_connection(connection_id, user.id, db)

        # Soft delete — mark as deleted, preserve record in DB
        label = connection.connection_name
        connection.deleted_at = datetime.now(timezone.utc)
        connection.deleted_by = user.id
        connection.is_active = False
        await db.commit()

        return MessageResponse(
            success=True,
            message=f"Connection '{label}' has been deleted"
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to delete connection: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
