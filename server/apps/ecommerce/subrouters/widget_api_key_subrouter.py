"""
Widget API Key Subrouter

JWT-authenticated CRUD for managing widget API keys.
Keys are used for HMAC-signed public widget URLs (non-Shopify platforms).

Endpoints:
- POST /connections/{connection_id}/api-keys — Generate a new API key (plaintext shown once)
- GET /connections/{connection_id}/api-keys — List keys for a connection (prefix only, no secret)
- DELETE /connections/{connection_id}/api-keys/{key_id} — Soft delete a key

Auth: JWT (same as all gated endpoints).
Pattern: follows ecommerce_connection_subrouter.py
"""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ..models import WidgetAPIKey
from ..schemas.widget_api_key_schemas import (
    WidgetAPIKeyCreate,
    WidgetAPIKeyCreatedDetail,
    WidgetAPIKeyCreatedResponse,
    WidgetAPIKeyDetail,
    WidgetAPIKeyListResponse,
    MessageResponse,
)
from ..utils.dependency_utils import get_user_connection
from ..utils.encryption_utils import encrypt_password
import logging

# ==========================================
# Widget API Key Router
# ==========================================

router = APIRouter(
    prefix="/connections/{connection_id}/api-keys",
    tags=["Widget API Keys"],
)
logger = logging.getLogger(__name__)


# ==========================================
# POST / — Generate New API Key
# ==========================================

@router.post("/", response_model=WidgetAPIKeyCreatedResponse)
async def create_api_key(
    connection_id: int,
    payload: WidgetAPIKeyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Generate a new widget API key for a connection.

    This endpoint:
    1. Validate the user owns the connection
    2. Generate a cryptographically random secret (32 hex chars)
    3. Build the display prefix ("nk_" + first 8 hex chars)
    4. Encrypt the full secret via Fernet before storing
    5. Create the WidgetAPIKey record
    6. Return the plaintext secret ONCE (never retrievable again)
    """
    try:
        # Step 1: Validate ownership
        connection = await get_user_connection(connection_id, user.id, db)

        # Step 2: Generate secret — 16 bytes = 32 hex chars
        raw_secret = secrets.token_hex(16)
        plaintext_key = f"nk_{raw_secret}"

        # Step 3: Build display prefix — "nk_" + first 8 hex chars
        api_key_prefix = f"nk_{raw_secret[:8]}"

        # Step 4: Encrypt the full secret via Fernet
        encrypted = encrypt_password(plaintext_key)

        # Step 5: Create the record
        new_key = WidgetAPIKey(
            connection_id=connection.id,
            api_key_encrypted=encrypted,
            api_key_prefix=api_key_prefix,
            name=payload.name,
            allowed_domains=payload.allowed_domains,
            is_active=True,
            created_by=user.id,
        )
        db.add(new_key)
        await db.commit()
        await db.refresh(new_key)

        # Step 6: Return plaintext key ONCE
        return WidgetAPIKeyCreatedResponse(
            success=True,
            data=WidgetAPIKeyCreatedDetail(
                id=new_key.id,
                name=new_key.name,
                api_key=plaintext_key,
                api_key_prefix=api_key_prefix,
                created_at=new_key.created_at,
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to create api key: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# GET / — List API Keys
# ==========================================

@router.get("/", response_model=WidgetAPIKeyListResponse)
async def list_api_keys(
    connection_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List all widget API keys for a connection.

    This endpoint:
    1. Validate the user owns the connection
    2. Query all active, non-deleted keys for this connection
    3. Return keys with prefix only (no secret)
    """
    try:
        # Step 1: Validate ownership
        await get_user_connection(connection_id, user.id, db)

        # Step 2: Query keys (exclude soft-deleted)
        result = await db.execute(
            select(WidgetAPIKey).where(
                and_(
                    WidgetAPIKey.connection_id == connection_id,
                    WidgetAPIKey.deleted_at.is_(None),
                )
            ).order_by(WidgetAPIKey.created_at.desc())
        )
        keys = result.scalars().all()

        # Step 3: Return list with prefix only
        return WidgetAPIKeyListResponse(
            success=True,
            data=[
                WidgetAPIKeyDetail(
                    id=k.id,
                    name=k.name,
                    api_key_prefix=k.api_key_prefix,
                    allowed_domains=k.allowed_domains,
                    is_active=k.is_active,
                    created_at=k.created_at,
                )
                for k in keys
            ],
            count=len(keys),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to list api keys: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==========================================
# DELETE /{key_id} — Soft Delete API Key
# ==========================================

@router.delete("/{key_id}", response_model=MessageResponse)
async def delete_api_key(
    connection_id: int,
    key_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft-delete a widget API key.

    This endpoint:
    1. Validate the user owns the connection
    2. Look up the key (must belong to this connection, not already deleted)
    3. Set deleted_at + deleted_by, deactivate
    4. Return success message
    """
    try:
        # Step 1: Validate ownership
        await get_user_connection(connection_id, user.id, db)

        # Step 2: Look up the key
        result = await db.execute(
            select(WidgetAPIKey).where(
                and_(
                    WidgetAPIKey.id == key_id,
                    WidgetAPIKey.connection_id == connection_id,
                    WidgetAPIKey.deleted_at.is_(None),
                )
            )
        )
        api_key = result.scalar_one_or_none()
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )

        # Step 3: Soft delete
        label = api_key.name
        api_key.deleted_at = datetime.now(timezone.utc)
        api_key.deleted_by = user.id
        api_key.is_active = False
        await db.commit()

        # Step 4: Return success
        return MessageResponse(
            success=True,
            message=f"API key '{label}' has been deleted"
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to delete api key: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
