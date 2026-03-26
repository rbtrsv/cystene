"""
Permissions Subrouter

Single endpoint that computes the authenticated user's access map based on
their organization's subscription tier. Returns read/write booleans for
every domain and every entity override.

This is the SINGLE SOURCE OF TRUTH for the frontend — no tier maps or
permission logic should exist client-side. The frontend calls this once
on mount and uses the response to:
  - Conditionally initialize only accessible providers (avoids 403 noise)
  - Grey out inaccessible sidebar items
  - Hide/show write controls (create/edit/delete buttons)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...utils.dependency_utils import get_user_organization_id
from ...utils.subscription_utils import (
    DOMAIN_TIER_MAP,
    ENTITY_TIER_MAP,
    ROUTE_PERMISSION_MAP,
    get_org_subscription,
    tier_is_sufficient,
)

# ==========================================
# Permissions Router
# ==========================================

router = APIRouter(tags=["Permissions"])


@router.get("/")
async def get_permissions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get the authenticated user's access permissions.

    Computes read/write access for every domain and every entity override
    based on the user's organization subscription tier.

    Returns:
        {
            "success": true,
            "data": {
                "tier": "PRO",
                "domains": {
                    "standardization": {"can_read": true, "can_write": true},
                    "commercial": {"can_read": false, "can_write": false},
                    ...
                },
                "entities": {
                    "gene": {"can_read": true, "can_write": true},
                    "subject": {"can_read": true, "can_write": true},
                    ...
                }
            }
        }
    """
    try:
        # Get the user's organization
        org_id = await get_user_organization_id(user.id, db)

        # Determine the user's current tier from their subscription
        current_tier = "FREE"
        if org_id:
            subscription = await get_org_subscription(org_id, db)
            if subscription and subscription.subscription_status in ("ACTIVE", "TRIALING"):
                current_tier = subscription.plan_name or "FREE"

        # Compute domain-level access
        domains = {}
        for domain, tier_map in DOMAIN_TIER_MAP.items():
            domains[domain] = {
                "can_read": tier_is_sufficient(current_tier, tier_map["read"]),
                "can_write": tier_is_sufficient(current_tier, tier_map["write"]),
                "read_tier": tier_map["read"],
                "write_tier": tier_map["write"],
            }

        # Compute entity-level overrides
        entities = {}
        for entity, tier_map in ENTITY_TIER_MAP.items():
            entities[entity] = {
                "can_read": tier_is_sufficient(current_tier, tier_map["read"]),
                "can_write": tier_is_sufficient(current_tier, tier_map["write"]),
                "read_tier": tier_map["read"],
                "write_tier": tier_map["write"],
            }

        # Compute per-route access (used by PageGate and sidebar hints)
        routes = {}
        for route, config in ROUTE_PERMISSION_MAP.items():
            domain = config["domain"]
            entity = config.get("entity")
            # Why: same logic as get_required_tier() — entity override first, then domain
            tier_map = ENTITY_TIER_MAP[entity] if entity and entity in ENTITY_TIER_MAP else DOMAIN_TIER_MAP[domain]
            routes[route] = {
                "can_read": tier_is_sufficient(current_tier, tier_map["read"]),
                "can_write": tier_is_sufficient(current_tier, tier_map["write"]),
                "read_tier": tier_map["read"],
                "write_tier": tier_map["write"],
                "display_name": config["display_name"],
            }

        return {
            "success": True,
            "data": {
                "tier": current_tier,
                "domains": domains,
                "entities": entities,
                "routes": routes,
            },
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": None,
        }
