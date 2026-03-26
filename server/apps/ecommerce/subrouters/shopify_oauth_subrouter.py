import hmac
import hashlib
import secrets
from urllib.parse import urlencode
import re

import aiohttp
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.db import get_session
from core.config import settings
from apps.accounts.models import User, OrganizationMember
from apps.accounts.utils.auth_utils import get_current_user

from ..models import EcommerceConnection
from ..schemas.ecommerce_connection_schemas import (
    EcommerceConnectionDetail,
    EcommerceConnectionResponse,
)

# ==========================================
# Shopify OAuth Router
# ==========================================

router = APIRouter(prefix="/shopify", tags=["Shopify OAuth"])

# In-memory nonce store (replace with Redis/DB in production)
_oauth_nonces: dict[str, int] = {}

# Shopify hostname validation pattern
SHOPIFY_HOSTNAME_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$")


def _verify_hmac(query_params: dict[str, str], client_secret: str) -> bool:
    """
    Verify Shopify HMAC-SHA256 signature on OAuth callback.

    Procedure:
    1. Remove the 'hmac' parameter from query string
    2. Sort remaining parameters alphabetically
    3. Join as key=value with &
    4. Compute HMAC-SHA256 using Client Secret as key
    5. Compare hex digest to received hmac (timing-safe)
    """
    received_hmac = query_params.get("hmac", "")
    # Build message from sorted params (excluding hmac)
    filtered = {k: v for k, v in query_params.items() if k != "hmac"}
    sorted_params = "&".join(f"{k}={v}" for k, v in sorted(filtered.items()))
    computed = hmac.new(
        client_secret.encode("utf-8"),
        sorted_params.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(computed, received_hmac)


@router.get("/auth")
async def initiate_shopify_oauth(
    shop: str = Query(..., description="Shopify store domain (e.g., mystore.myshopify.com)"),
    user: User = Depends(get_current_user),
):
    """
    Initiate Shopify OAuth 2.0 authorization flow

    This endpoint:
    1. Validates the shop hostname format
    2. Generates a random nonce for CSRF protection
    3. Builds the Shopify authorization URL
    4. Returns the URL for the frontend to redirect the merchant
    """
    try:
        # Validate shop hostname
        if not SHOPIFY_HOSTNAME_RE.match(shop):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Shopify store domain. Must be like 'mystore.myshopify.com'"
            )

        # Validate Shopify OAuth is configured
        if not settings.SHOPIFY_CLIENT_ID or not settings.SHOPIFY_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Shopify OAuth is not configured"
            )

        # Generate nonce and store with user ID
        nonce = secrets.token_urlsafe(32)
        _oauth_nonces[nonce] = user.id

        # Build authorization URL
        params = {
            "client_id": settings.SHOPIFY_CLIENT_ID,
            "scope": settings.SHOPIFY_SCOPES,
            "redirect_uri": settings.SHOPIFY_REDIRECT_URI,
            "state": nonce,
        }
        auth_url = f"https://{shop}/admin/oauth/authorize?{urlencode(params)}"

        return {"auth_url": auth_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/callback")
async def shopify_oauth_callback(
    code: str = Query(...),
    hmac_param: str = Query(..., alias="hmac"),
    shop: str = Query(...),
    state: str = Query(...),
    timestamp: str = Query(...),
    host: str = Query(default=""),
    db: AsyncSession = Depends(get_session),
):
    """
    Handle Shopify OAuth callback after merchant approves

    This endpoint:
    1. Verifies the state nonce matches (CSRF protection)
    2. Validates the shop hostname format
    3. Verifies the HMAC-SHA256 signature using Client Secret
    4. Exchanges the authorization code for an access token
    5. Creates or updates the EcommerceConnection
    6. Redirects to the frontend connections page
    """
    try:
        # Step 1: Verify state nonce
        user_id = _oauth_nonces.pop(state, None)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired state parameter"
            )

        # Step 2: Validate shop hostname
        if not SHOPIFY_HOSTNAME_RE.match(shop):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Shopify store domain"
            )

        # Step 3: Verify HMAC signature
        query_params = {
            "code": code,
            "hmac": hmac_param,
            "host": host,
            "shop": shop,
            "state": state,
            "timestamp": timestamp,
        }
        # Remove empty params (host may be empty)
        query_params = {k: v for k, v in query_params.items() if v}

        if not _verify_hmac(query_params, settings.SHOPIFY_CLIENT_SECRET):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="HMAC verification failed"
            )

        # Step 4: Exchange authorization code for access token
        token_url = f"https://{shop}/admin/oauth/access_token"
        token_payload = {
            "client_id": settings.SHOPIFY_CLIENT_ID,
            "client_secret": settings.SHOPIFY_CLIENT_SECRET,
            "code": code,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(token_url, data=token_payload) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"Shopify token exchange failed: {error_text}"
                    )
                token_data = await response.json()

        access_token = token_data.get("access_token")
        granted_scope = token_data.get("scope", "")

        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Shopify did not return an access token"
            )

        # Verify granted scopes match requested scopes
        requested_scopes = set(settings.SHOPIFY_SCOPES.split(","))
        granted_scopes = set(granted_scope.split(","))
        if not requested_scopes.issubset(granted_scopes):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Shopify did not grant all requested scopes. Requested: {requested_scopes}, Granted: {granted_scopes}"
            )

        # Step 5: Get user's organization
        org_result = await db.execute(
            select(OrganizationMember).where(OrganizationMember.user_id == user_id)
        )
        membership = org_result.scalar_one_or_none()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must belong to an organization"
            )

        # Step 6: Check if a Shopify connection already exists for this shop
        existing_result = await db.execute(
            select(EcommerceConnection).where(
                and_(
                    EcommerceConnection.user_id == user_id,
                    EcommerceConnection.platform == "shopify",
                    EcommerceConnection.store_url == shop,
                )
            )
        )
        existing_connection = existing_result.scalar_one_or_none()

        if existing_connection:
            # Update existing connection with new token
            existing_connection.api_secret = access_token
            existing_connection.is_active = True
            await db.commit()
        else:
            # Create new connection
            new_connection = EcommerceConnection(
                user_id=user_id,
                organization_id=membership.organization_id,
                connection_name=f"Shopify - {shop.replace('.myshopify.com', '')}",
                platform="shopify",
                connection_method="api",
                store_url=shop,
                api_secret=access_token,
                is_active=True,
            )
            db.add(new_connection)
            await db.commit()

        # Step 7: Redirect to frontend
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/connections?shopify_connected=true",
            status_code=302,
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
