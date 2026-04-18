from urllib.parse import urlencode, parse_qs, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.db import get_session
from core.config import settings
from apps.accounts.models import User, OrganizationMember
from apps.accounts.utils.auth_utils import get_current_user

from ..models import EcommerceConnection
import logging

# ==========================================
# WooCommerce Auth Router
# ==========================================

router = APIRouter(prefix="/woocommerce", tags=["WooCommerce Auth"])
logger = logging.getLogger(__name__)


@router.get("/auth")
async def initiate_woocommerce_auth(
    store_url: str = Query(..., description="WooCommerce store URL (e.g., https://mystore.com)"),
    user: User = Depends(get_current_user),
):
    """
    Initiate WooCommerce auto-key generation flow

    This endpoint:
    1. Validates the store URL
    2. Builds the WooCommerce wc-auth authorization URL
    3. Returns the URL for the frontend to redirect the merchant

    The merchant visits the URL, clicks "Accept" on WooCommerce's permission screen,
    and WooCommerce POSTs API credentials to our callback endpoint.
    """
    try:
        # Normalize store URL
        store_url = store_url.rstrip("/")
        if not store_url.startswith("http"):
            store_url = f"https://{store_url}"

        # Build wc-auth authorization URL
        # Encode store_url into callback_url so we can persist it when WooCommerce POSTs back
        callback_params = urlencode({"store_url": store_url})
        params = {
            "app_name": "Nudgio",
            "scope": "read",
            "user_id": str(user.id),
            "return_url": f"{settings.FRONTEND_URL}/connections?wc_connected=true",
            "callback_url": f"{settings.SERVER_URL}/ecommerce/woocommerce/callback?{callback_params}",
        }
        auth_url = f"{store_url}/wc-auth/v1/authorize?{urlencode(params)}"

        return {"auth_url": auth_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to initiate woocommerce auth: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/callback")
async def woocommerce_auth_callback(
    request: Request,
    db: AsyncSession = Depends(get_session),
):
    """
    Handle WooCommerce auto-auth callback

    This endpoint:
    1. Receives API credentials POSTed by WooCommerce after merchant approval
    2. Validates the callback payload (key_id, user_id, consumer_key, consumer_secret)
    3. Gets the user's organization membership
    4. Creates or updates the EcommerceConnection with API credentials
    5. Returns success status

    WooCommerce sends a JSON body (not form data):
    {
        "key_id": 1,
        "user_id": "123",
        "consumer_key": "ck_xxx",
        "consumer_secret": "cs_xxx",
        "key_permissions": "read"
    }

    The store_url is passed via callback_url query parameter (set during /auth initiation).
    """
    try:
        # Read raw JSON body (WooCommerce sends JSON, not form data)
        body = await request.json()

        user_id = body.get("user_id")
        consumer_key = body.get("consumer_key")
        consumer_secret = body.get("consumer_secret")

        # store_url is passed via callback_url query parameter (set during /auth initiation)
        store_url = request.query_params.get("store_url")

        if not user_id or not consumer_key or not consumer_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: user_id, consumer_key, consumer_secret"
            )

        # Convert user_id to int (WooCommerce sends it as string)
        user_id = int(user_id)

        # Get user's organization
        org_result = await db.execute(
            select(OrganizationMember).where(OrganizationMember.user_id == user_id)
        )
        membership = org_result.scalar_one_or_none()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to an organization"
            )

        # Check if a WooCommerce connection already exists for this user with these credentials
        existing_result = await db.execute(
            select(EcommerceConnection).where(
                and_(
                    EcommerceConnection.user_id == user_id,
                    EcommerceConnection.platform == "woocommerce",
                    EcommerceConnection.api_key == consumer_key,
                )
            )
        )
        existing_connection = existing_result.scalar_one_or_none()

        if existing_connection:
            # Update existing connection with new credentials
            existing_connection.api_secret = consumer_secret
            if store_url:
                existing_connection.store_url = store_url
            existing_connection.is_active = True
            await db.commit()
        else:
            # Create new connection with store_url from callback query param
            new_connection = EcommerceConnection(
                user_id=user_id,
                organization_id=membership.organization_id,
                connection_name=f"WooCommerce (auto-connected)",
                platform="woocommerce",
                connection_method="api",
                store_url=store_url,
                api_key=consumer_key,
                api_secret=consumer_secret,
                is_active=False,
            )
            db.add(new_connection)
            await db.commit()

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.exception(f"Failed to woocommerce auth callback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
