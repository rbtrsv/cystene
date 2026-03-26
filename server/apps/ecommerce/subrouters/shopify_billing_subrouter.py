"""
Shopify Billing Subrouter

Manages Shopify app subscription charges for Shopify merchants.
Non-Shopify merchants (WooCommerce, Magento) continue using Stripe.

Endpoints:
- POST /shopify/billing/subscribe — create a subscription charge (JWT auth)
- GET  /shopify/billing/callback  — handle Shopify redirect after approval (no JWT)
- POST /shopify/billing/cancel    — cancel an active subscription (JWT auth)
- GET  /shopify/billing/status    — get billing status for a connection (JWT auth)

Mixed auth gating — subscribe/cancel/status require JWT, callback is a redirect
from Shopify (secured via DB record verification instead).
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from core.config import settings
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ..models import EcommerceConnection, ShopifyBilling
from ..utils.dependency_utils import get_user_connection
from ..utils.shopify_billing_utils import (
    SHOPIFY_PLAN_PRICES,
    create_shopify_subscription,
    cancel_shopify_subscription,
    get_shopify_subscription_status,
    map_shopify_plan_to_tier,
)

logger = logging.getLogger(__name__)

# ==========================================
# Shopify Billing Router
# ==========================================

router = APIRouter(prefix="/shopify/billing", tags=["Shopify Billing"])


# ==========================================
# Subscribe
# ==========================================

@router.post("/subscribe")
async def subscribe(
    connection_id: int = Query(..., description="Ecommerce connection ID"),
    plan_name: str = Query(..., description="Plan tier: PRO or ENTERPRISE"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a Shopify app subscription charge for a connection.

    This endpoint:
    1. Validate plan_name is exactly PRO or ENTERPRISE
    2. Get connection via get_user_connection (ownership + soft-delete check)
    3. Verify connection.platform is "shopify"
    4a. Block if ACTIVE billing already exists for this connection
    4b. Clean up stale PENDING records from abandoned billing flows
    5. Call create_shopify_subscription with return_url pointing to callback
    6. Create ShopifyBilling record with PENDING status and stored GID
    7. Return confirmation_url for frontend to redirect merchant
    """
    try:
        # Step 1: Validate plan_name
        if plan_name not in SHOPIFY_PLAN_PRICES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan_name: '{plan_name}'. Must be one of: {list(SHOPIFY_PLAN_PRICES.keys())}",
            )

        # Step 2: Get connection (ownership + soft-delete check)
        connection = await get_user_connection(connection_id, user.id, db)

        # Step 3: Verify platform is Shopify
        if connection.platform != "shopify":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shopify billing is only available for Shopify connections",
            )

        # Step 4a: Block if ACTIVE billing already exists
        active_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection_id,
                    ShopifyBilling.billing_status == "ACTIVE",
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        if active_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Connection already has an ACTIVE billing record",
            )

        # Step 4b: Clean up stale PENDING records (abandoned billing flows)
        # Merchant may have started a billing flow and closed the tab —
        # the old PENDING record would block re-subscription attempts.
        stale_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection_id,
                    ShopifyBilling.billing_status == "PENDING",
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        stale_pending = stale_result.scalars().all()
        for stale in stale_pending:
            await db.delete(stale)
        if stale_pending:
            await db.flush()
            logger.info(
                "Shopify billing: cleaned up %d stale PENDING record(s) for connection_id=%s",
                len(stale_pending), connection_id,
            )

        # Step 5: Create Shopify subscription charge
        return_url = f"{settings.SERVER_URL}/ecommerce/shopify/billing/callback?connection_id={connection_id}"

        subscription_result = await create_shopify_subscription(
            store_domain=connection.store_url,
            access_token=connection.api_secret,
            plan_name=plan_name,
            return_url=return_url,
            test=settings.DEBUG,
        )

        # Step 6: Create ShopifyBilling record with PENDING status
        billing = ShopifyBilling(
            connection_id=connection_id,
            organization_id=connection.organization_id,
            shopify_subscription_gid=subscription_result["subscription_gid"],
            plan_name=plan_name,
            billing_status="PENDING",
            test=settings.DEBUG,
        )
        db.add(billing)
        await db.commit()

        logger.info(
            "Shopify billing: created PENDING record for connection_id=%s, plan=%s, gid=%s",
            connection_id, plan_name, subscription_result["subscription_gid"],
        )

        # Step 7: Return confirmation URL
        return {
            "success": True,
            "confirmation_url": subscription_result["confirmation_url"],
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# ==========================================
# Callback (No JWT — redirect from Shopify)
# ==========================================

@router.get("/callback")
async def billing_callback(
    connection_id: int = Query(..., description="Ecommerce connection ID"),
    charge_id: int = Query(..., description="Shopify charge ID appended by Shopify"),
    shop: str = Query(default=None, description="Shop domain appended by Shopify"),
    embedded: bool = Query(default=False, description="Whether this billing flow was initiated from the embedded app"),
    db: AsyncSession = Depends(get_session),
):
    """
    Handle Shopify billing redirect after merchant approves or declines.

    No JWT auth — this is a redirect from Shopify. Secured via DB record verification:
    - connection_id must reference a real connection
    - shop param (if present) must match connection.store_url
    - There must be a PENDING ShopifyBilling record that WE created in POST /subscribe
    - charge_id must match the numeric ID from our stored shopify_subscription_gid
    - We verify the actual status from Shopify's API (don't trust the redirect alone)

    This endpoint:
    1. Get connection by connection_id (no ownership check — redirect, no JWT)
    2. Verify shop param matches connection.store_url if present
    3. Look up PENDING ShopifyBilling for this connection_id
    4. Verify charge_id matches stored shopify_subscription_gid numeric ID
    5. Query Shopify via get_shopify_subscription_status to verify actual status
    6. If ACTIVE → update to ACTIVE, set start_date
    7. If not ACTIVE → update to CANCELED, set end_date
    8. Redirect to frontend with result query param
    """
    try:
        # Redirect base path depends on whether this billing flow was initiated
        # from the embedded app (Polaris UI inside Shopify Admin) or standalone (shadcn UI)
        redirect_base = f"{settings.FRONTEND_URL}/shopify/billing" if embedded else f"{settings.FRONTEND_URL}/connections"

        # Step 1: Get connection (no ownership check — this is a redirect)
        result = await db.execute(
            select(EcommerceConnection).where(
                and_(
                    EcommerceConnection.id == connection_id,
                    EcommerceConnection.deleted_at == None,
                )
            )
        )
        connection = result.scalar_one_or_none()
        if not connection:
            logger.warning("Shopify billing callback: connection_id=%s not found", connection_id)
            return RedirectResponse(
                url=f"{redirect_base}?shopify_billing=error",
                status_code=302,
            )

        # Step 2: Verify shop param matches connection.store_url
        if shop and shop != connection.store_url:
            logger.warning(
                "Shopify billing callback: shop mismatch. Expected=%s, received=%s",
                connection.store_url, shop,
            )
            return RedirectResponse(
                url=f"{redirect_base}?shopify_billing=error",
                status_code=302,
            )

        # Step 3: Look up PENDING ShopifyBilling for this connection
        billing_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection_id,
                    ShopifyBilling.billing_status == "PENDING",
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        billing = billing_result.scalar_one_or_none()
        if not billing:
            logger.warning("Shopify billing callback: no PENDING record for connection_id=%s", connection_id)
            return RedirectResponse(
                url=f"{redirect_base}?shopify_billing=error",
                status_code=302,
            )

        # Step 4: Verify charge_id matches stored GID numeric ID
        # GID format: "gid://shopify/AppSubscription/12345" → extract "12345"
        stored_gid = billing.shopify_subscription_gid or ""
        stored_numeric_id = stored_gid.split("/")[-1] if stored_gid else ""
        if str(charge_id) != stored_numeric_id:
            logger.warning(
                "Shopify billing callback: charge_id mismatch. charge_id=%s, stored_gid=%s",
                charge_id, stored_gid,
            )
            return RedirectResponse(
                url=f"{redirect_base}?shopify_billing=error",
                status_code=302,
            )

        # Step 5: Query Shopify to verify actual subscription status
        subscription_status = await get_shopify_subscription_status(
            store_domain=connection.store_url,
            access_token=connection.api_secret,
            subscription_gid=billing.shopify_subscription_gid,
        )

        now = datetime.now(timezone.utc)

        if subscription_status and subscription_status.get("status") == "ACTIVE":
            # Step 6: Merchant approved — update to ACTIVE
            billing.billing_status = "ACTIVE"
            billing.start_date = now
            billing.end_date = None

            # Map Shopify plan name to our tier
            shopify_plan_name = subscription_status.get("name")
            if shopify_plan_name:
                billing.plan_name = map_shopify_plan_to_tier(shopify_plan_name)

            await db.commit()

            logger.info(
                "Shopify billing callback: ACTIVE for connection_id=%s, plan=%s",
                connection_id, billing.plan_name,
            )

            return RedirectResponse(
                url=f"{redirect_base}?shopify_billing=success&plan={billing.plan_name}",
                status_code=302,
            )
        else:
            # Step 7: Merchant declined or subscription expired
            billing.billing_status = "CANCELED"
            billing.end_date = now
            await db.commit()

            logger.info(
                "Shopify billing callback: declined/expired for connection_id=%s",
                connection_id,
            )

            return RedirectResponse(
                url=f"{redirect_base}?shopify_billing=declined",
                status_code=302,
            )

    except Exception as e:
        await db.rollback()
        logger.error("Shopify billing callback error: %s", str(e))
        error_base = f"{settings.FRONTEND_URL}/shopify/billing" if embedded else f"{settings.FRONTEND_URL}/connections"
        return RedirectResponse(
            url=f"{error_base}?shopify_billing=error",
            status_code=302,
        )


# ==========================================
# Cancel
# ==========================================

@router.post("/cancel")
async def cancel(
    connection_id: int = Query(..., description="Ecommerce connection ID"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Cancel an active Shopify app subscription for a connection.

    This endpoint:
    1. Get connection via get_user_connection (ownership check)
    2. Get ShopifyBilling for this connection, verify billing_status is ACTIVE
    3. Call cancel_shopify_subscription with stored shopify_subscription_gid
    4. Update DB: billing_status=CANCELED, end_date=now()
    """
    try:
        # Step 1: Get connection (ownership check)
        connection = await get_user_connection(connection_id, user.id, db)

        # Step 2: Get active ShopifyBilling
        billing_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection_id,
                    ShopifyBilling.billing_status == "ACTIVE",
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        billing = billing_result.scalar_one_or_none()
        if not billing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active Shopify billing found for this connection",
            )

        # Step 3: Cancel on Shopify
        await cancel_shopify_subscription(
            store_domain=connection.store_url,
            access_token=connection.api_secret,
            subscription_gid=billing.shopify_subscription_gid,
        )

        # Step 4: Update DB
        billing.billing_status = "CANCELED"
        billing.end_date = datetime.now(timezone.utc)
        await db.commit()

        logger.info(
            "Shopify billing: canceled for connection_id=%s, gid=%s",
            connection_id, billing.shopify_subscription_gid,
        )

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# ==========================================
# Status
# ==========================================

@router.get("/status")
async def billing_status(
    connection_id: int = Query(..., description="Ecommerce connection ID"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get Shopify billing status for a connection.

    This endpoint:
    1. Get connection via get_user_connection (ownership check)
    2. Get ShopifyBilling for this connection
    3. Return billing details from DB
    4. If no record exists → return FREE tier with has_subscription=false
    """
    try:
        # Step 1: Get connection (ownership check)
        connection = await get_user_connection(connection_id, user.id, db)

        # Step 2: Get ShopifyBilling (exclude soft-deleted)
        billing_result = await db.execute(
            select(ShopifyBilling).where(
                and_(
                    ShopifyBilling.connection_id == connection_id,
                    ShopifyBilling.deleted_at == None,
                )
            )
        )
        billing = billing_result.scalar_one_or_none()

        # Step 3/4: Return billing details or FREE defaults
        if not billing:
            return {
                "has_subscription": False,
                "plan_name": "FREE",
                "billing_status": None,
                "start_date": None,
                "end_date": None,
                "test": False,
            }

        return {
            "has_subscription": True,
            "plan_name": billing.plan_name or "FREE",
            "billing_status": billing.billing_status,
            "start_date": billing.start_date.isoformat() if billing.start_date else None,
            "end_date": billing.end_date.isoformat() if billing.end_date else None,
            "test": billing.test,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
