"""
Shopify Session Token Utilities

Handles authentication for Shopify embedded apps via App Bridge session tokens.
Separate from the traditional OAuth flow (shopify_oauth_subrouter.py) which is
for manual connects from the standalone client.

Session Token Flow (embedded apps):
1. Shopify Admin loads app in iframe → App Bridge provides session token (JWT)
2. Frontend sends session token in Authorization header
3. Backend verifies JWT (signed with SHOPIFY_CLIENT_SECRET, audience = SHOPIFY_CLIENT_ID)
4. Backend extracts shop domain from `dest` claim → looks up EcommerceConnection

Token Exchange Flow (first install from App Store):
1. No EcommerceConnection exists for this shop
2. Exchange session token for offline access token via Shopify Token Exchange API
3. Query Shopify Shop API for shop info (name, email)
4. Auto-provision User + Organization + EcommerceConnection
5. Return connection data

Auto-Provisioning:
- Creates User with shop email + random password hash (no login needed — embedded only)
- Creates Organization with shop name
- Creates OrganizationMember with role=ADMIN
- Creates EcommerceConnection with platform=shopify, api_secret=access_token
- If User with same email already exists → reuses that User + their Organization
"""

import jwt
import secrets
import logging
from typing import Optional

import aiohttp
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.db import get_session
from apps.accounts.models import User, Organization, OrganizationMember
from ..models import EcommerceConnection

logger = logging.getLogger(__name__)

# Tells App Bridge to fetch a fresh session token and retry the request automatically.
# Must be included on all 401 responses from session-token-authenticated endpoints.
# See: https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens
SHOPIFY_RETRY_HEADER = {"X-Shopify-Retry-Invalid-Session-Request": "1"}

# OPTIONAL ENHANCEMENT — Server-Side Bounce Page Pattern:
# ─────────────────────────────────────────────────────────
# If Shopify's automated embedded app check ("Using session tokens for user authentication")
# doesn't pass with the current client-side-only approach (SPA via shopify.idToken()),
# we can add server-side session token validation in Next.js proxy.ts for /shopify routes:
#
# 1. On /shopify requests, extract `id_token` from URL params (Shopify sends it on initial load)
# 2. Validate the JWT server-side (HS256 with SHOPIFY_CLIENT_SECRET, audience = SHOPIFY_CLIENT_ID)
# 3. If invalid/missing → serve a minimal "bounce page" (just meta tag + App Bridge script)
#    App Bridge then refreshes the token and redirects back via `shopify-reload` param
# 4. If valid → continue to the SPA normally
#
# This follows the official Shopify bounce page pattern from:
# https://shopify.dev/docs/apps/build/authentication-authorization/set-embedded-app-authorization
#
# Currently not needed because our SPA handles session tokens client-side via shopify.idToken(),
# which is valid for single-page apps per Shopify docs.


# ==========================================
# Session Token Verification
# ==========================================

def verify_shopify_session_token(token: str) -> dict:
    """
    Verify a Shopify App Bridge session token (JWT).

    Shopify session tokens are:
    - Signed with SHOPIFY_CLIENT_SECRET (HS256)
    - Audience = SHOPIFY_CLIENT_ID
    - Expire after 1 minute (short-lived, refreshed by App Bridge)

    Payload structure:
    {
        "iss": "https://mystore.myshopify.com/admin",
        "dest": "https://mystore.myshopify.com",
        "aud": "SHOPIFY_CLIENT_ID",
        "sub": "SHOP_USER_ID",
        "exp": 1234567890,
        "nbf": 1234567890,
        "iat": 1234567890,
        "jti": "UNIQUE_ID",
        "sid": "SESSION_ID"
    }

    Args:
        token: JWT string from Authorization: Bearer header

    Returns:
        Decoded payload dict

    Raises:
        HTTPException 401 on any validation failure
    """
    if not settings.SHOPIFY_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Shopify Client Secret not configured",
        )

    if not settings.SHOPIFY_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Shopify Client ID not configured",
        )

    try:
        decoded = jwt.decode(
            token,
            settings.SHOPIFY_CLIENT_SECRET,
            algorithms=["HS256"],
            audience=settings.SHOPIFY_CLIENT_ID,
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token expired",
            headers=SHOPIFY_RETRY_HEADER,
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token audience mismatch",
            headers=SHOPIFY_RETRY_HEADER,
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid session token: {str(e)}",
            headers=SHOPIFY_RETRY_HEADER,
        )


def extract_shop_domain(decoded_token: dict) -> str:
    """
    Extract shop domain from decoded session token.

    The `dest` claim contains the shop URL: "https://mystore.myshopify.com"
    We strip the protocol to get: "mystore.myshopify.com"

    Args:
        decoded_token: Decoded JWT payload

    Returns:
        Shop domain string (e.g., "mystore.myshopify.com")

    Raises:
        HTTPException 401 if dest claim is missing
    """
    dest = decoded_token.get("dest")
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token missing dest claim",
            headers=SHOPIFY_RETRY_HEADER,
        )
    return dest.replace("https://", "").replace("http://", "").rstrip("/")


# ==========================================
# Token Exchange
# ==========================================

async def exchange_session_for_access_token(
    shop_domain: str,
    session_token: str,
) -> str:
    """
    Exchange a Shopify session token for an offline access token.

    Uses Shopify's Token Exchange API (RFC 8693). This replaces the traditional
    OAuth authorization code exchange for embedded apps with managed installation
    (use_legacy_install_flow = false in shopify.app.toml).

    The offline access token persists beyond the session and is used for:
    - GraphQL API calls (products, orders, billing)
    - Webhook verification context
    - Background data fetching

    Args:
        shop_domain: Shopify store domain (e.g., "mystore.myshopify.com")
        session_token: JWT session token from App Bridge

    Returns:
        Offline access token string

    Raises:
        Exception on HTTP error or missing access_token in response
    """
    url = f"https://{shop_domain}/admin/oauth/access_token"
    payload = {
        "client_id": settings.SHOPIFY_CLIENT_ID,
        "client_secret": settings.SHOPIFY_CLIENT_SECRET,
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "subject_token": session_token,
        "subject_token_type": "urn:ietf:params:oauth:token-type:id_token",
        "requested_token_type": "urn:shopify:params:oauth:token-type:offline-access-token",
    }

    async with aiohttp.ClientSession() as http_session:
        async with http_session.post(
            url,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(
                    f"Shopify Token Exchange failed (HTTP {response.status}): {error_text}"
                )

            data = await response.json()

    access_token = data.get("access_token")
    if not access_token:
        raise Exception("Shopify Token Exchange response missing access_token")

    granted_scope = data.get("scope", "")
    logger.info(
        "Shopify Token Exchange successful for %s, scope: %s",
        shop_domain, granted_scope,
    )

    return access_token


# ==========================================
# Shop Info Query
# ==========================================

async def get_shopify_shop_info(
    shop_domain: str,
    access_token: str,
) -> dict:
    """
    Query Shopify Shop API for shop name and email via GraphQL.

    Used only during auto-provisioning (first install) to get the shop
    owner's email and store name for creating User + Organization records.

    Args:
        shop_domain: Shopify store domain
        access_token: Shopify offline access token

    Returns:
        Dict with "name", "email", "myshopifyDomain"

    Raises:
        Exception on GraphQL error or HTTP failure
    """
    url = f"https://{shop_domain}/admin/api/{settings.SHOPIFY_API_VERSION}/graphql.json"
    headers = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": access_token,
    }
    query = """
    query {
        shop {
            name
            email
            myshopifyDomain
        }
    }
    """

    async with aiohttp.ClientSession() as http_session:
        async with http_session.post(
            url,
            json={"query": query},
            headers=headers,
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(
                    f"Shopify Shop API failed (HTTP {response.status}): {error_text}"
                )

            body = await response.json()

    errors = body.get("errors")
    data = body.get("data")

    if errors and data is None:
        # Normalize errors: can be str, dict, or list of dicts
        if isinstance(errors, str):
            error_messages = errors
        elif isinstance(errors, dict):
            error_messages = errors.get("message", str(errors))
        elif isinstance(errors, list):
            error_messages = "; ".join(
                e.get("message", str(e)) if isinstance(e, dict) else str(e)
                for e in errors
            )
        else:
            error_messages = str(errors)
        raise Exception(f"Shopify Shop API error: {error_messages}")

    shop = data.get("shop", {})
    return {
        "name": shop.get("name", ""),
        "email": shop.get("email", ""),
        "myshopifyDomain": shop.get("myshopifyDomain", ""),
    }


# ==========================================
# Auto-Provisioning
# ==========================================

async def auto_provision_shopify_merchant(
    shop_domain: str,
    access_token: str,
    db: AsyncSession,
) -> EcommerceConnection:
    """
    Auto-provision User + Organization + EcommerceConnection for a new Shopify install.

    Called when a merchant installs the app from the Shopify App Store and
    no EcommerceConnection exists for their shop domain.

    This function:
    1. Query Shopify Shop API for shop name + email
    2. Check if User exists by email (reuse if found)
    3. If no User → create User, Organization, OrganizationMember
    4. Create EcommerceConnection linked to User + Organization
    5. Commit all records in one transaction

    Args:
        shop_domain: Shopify store domain (e.g., "mystore.myshopify.com")
        access_token: Shopify offline access token (from Token Exchange)
        db: Database session

    Returns:
        Newly created EcommerceConnection

    Raises:
        Exception on Shopify API failure or DB error
    """
    # Step 1: Get shop info from Shopify
    shop_info = await get_shopify_shop_info(shop_domain, access_token)
    shop_name = shop_info["name"] or shop_domain.replace(".myshopify.com", "")
    shop_email = shop_info["email"]

    if not shop_email:
        # Fallback email if shop has no email configured
        shop_email = f"{shop_domain.replace('.myshopify.com', '')}@shopify-merchant.nudgio.tech"

    # Step 2: Check if User exists by email
    result = await db.execute(
        select(User).where(
            User.email == shop_email,
            User.deleted_at == None,
        )
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Reuse existing User — find their organization
        user = existing_user
        # Use .first() instead of .scalar_one_or_none() —
        # user may belong to multiple organizations (e.g. registered on standalone
        # AND auto-provisioned via Shopify). scalar_one_or_none() would raise
        # MultipleResultsFound in that case.
        org_result = await db.execute(
            select(OrganizationMember).where(
                OrganizationMember.user_id == user.id,
            )
        )
        membership = org_result.scalars().first()

        if membership:
            org_id = membership.organization_id
        else:
            # User exists but has no organization — create one
            organization = Organization(name=shop_name)
            db.add(organization)
            await db.flush()  # Get organization.id

            member = OrganizationMember(
                user_id=user.id,
                organization_id=organization.id,
                role="ADMIN",
            )
            db.add(member)
            await db.flush()

            org_id = organization.id

        logger.info(
            "Auto-provision: reusing existing user %s (id=%s) for shop %s",
            shop_email, user.id, shop_domain,
        )
    else:
        # Step 3: Create User + Organization + OrganizationMember
        user = User(
            email=shop_email,
            name=shop_name,
            password_hash=secrets.token_hex(32),  # Random hash — no login via password
            email_verified=True,
            role="MEMBER",
        )
        db.add(user)
        await db.flush()  # Get user.id

        organization = Organization(name=shop_name)
        db.add(organization)
        await db.flush()  # Get organization.id

        member = OrganizationMember(
            user_id=user.id,
            organization_id=organization.id,
            role="ADMIN",
        )
        db.add(member)
        await db.flush()

        org_id = organization.id

        logger.info(
            "Auto-provision: created user %s (id=%s), org %s (id=%s) for shop %s",
            shop_email, user.id, shop_name, org_id, shop_domain,
        )

    # Step 4: Create EcommerceConnection
    connection = EcommerceConnection(
        user_id=user.id,
        organization_id=org_id,
        connection_name=f"Shopify - {shop_name}",
        platform="shopify",
        connection_method="api",
        store_url=shop_domain,
        api_secret=access_token,
        is_active=True,
    )
    db.add(connection)

    # Step 5: Commit all records
    await db.commit()
    await db.refresh(connection)

    logger.info(
        "Auto-provision: created connection id=%s for shop %s",
        connection.id, shop_domain,
    )

    return connection


# ==========================================
# FastAPI Dependency
# ==========================================

# ⚠️ SHOPIFY EMBEDDED ONLY — used by all /shopify/embedded/* endpoints.
# Standalone endpoints use get_active_connection (dependency_utils.py) instead.
# Changes here do NOT affect standalone auth flow.
async def get_shopify_connection(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> EcommerceConnection:
    """
    FastAPI dependency — resolves Shopify session token to EcommerceConnection.

    Used by all embedded endpoints except POST /init (which creates the connection).

    This function:
    1. Extract session token from Authorization: Bearer header
    2. Verify JWT signature, expiration, audience
    3. Extract shop domain from dest claim
    4. Look up active EcommerceConnection by store_url + platform

    Args:
        request: FastAPI request (for Authorization header)
        db: Database session

    Returns:
        EcommerceConnection for this shop

    Raises:
        HTTPException 401 if token is missing or invalid
        HTTPException 404 if no active connection found for this shop
    """
    # Step 1: Extract token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers=SHOPIFY_RETRY_HEADER,
        )
    token = auth_header[7:]  # Strip "Bearer "

    # Step 2: Verify session token
    decoded = verify_shopify_session_token(token)

    # Step 3: Extract shop domain
    shop_domain = extract_shop_domain(decoded)

    # Step 4: Look up connection
    result = await db.execute(
        select(EcommerceConnection).where(
            and_(
                EcommerceConnection.store_url == shop_domain,
                EcommerceConnection.platform == "shopify",
                EcommerceConnection.is_active == True,
                EcommerceConnection.deleted_at == None,
            )
        )
        .order_by(EcommerceConnection.created_at.desc())
        .limit(1)
    )
    connection = result.scalar_one_or_none()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active connection found for this shop. Call POST /init first.",
        )

    return connection
