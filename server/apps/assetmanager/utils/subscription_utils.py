"""
AssetManager Subscription Utilities — Billing & Write-Lock
==========================================================

Quantity-based Stripe billing for entity access.

Architecture Overview:
    One Stripe product, one price. Quantity = number of entities owned by the org.
    Every entity costs the same regardless of entity_type (fund, company, individual).

    Entity.organization_id = the BILLING OWNER org. This is the org that created
    the entity and pays for it. This is NOT the same as entity_access.organization_id
    (the access org through which a user operates). See __init__.py docstring for
    the full distinction.

Free Tier:
    FREE_ENTITY_LIMIT = 1. The first entity is free — no subscription required.
    Once an org creates a second entity, they need an active subscription.
    Billable quantity = total entities - FREE_ENTITY_LIMIT.
    Example: org has 3 entities → Stripe quantity = 2.

Write-Lock Mechanism:
    is_org_write_locked(org_id, session) → bool
    An org is write-locked when ALL of these are true:
    - Entity count > FREE_ENTITY_LIMIT (they've used paid features)
    - Subscription is not ACTIVE or TRIALING (canceled, past_due, etc.)
    - manual_override is not set

    When write-locked:
    - All READ operations still work (list, get, export)
    - All WRITE operations are blocked with HTTP 403
    - Enforced by ensure_entity_subscription() in dependency_utils.py

    manual_override flag: set on Subscription for invoice/bank transfer clients
    who pay outside of Stripe. Bypasses all Stripe status checks.

Stripe Sync Flow:
    Only triggered from entity_subrouter.py on entity create/delete:

    Entity CREATE:
        1. Entity created → entity count increases
        2. sync_stripe_quantity(subscription, new_count) called
        3. Stripe subscription quantity updated → proration applied automatically

    Entity DELETE (soft delete):
        1. Entity soft-deleted → entity count decreases
        2. sync_stripe_quantity(subscription, new_count) called
        3. Stripe subscription quantity updated → credit applied at next invoice

    No other model triggers Stripe sync — only entities affect billing.

Integration Points:
    - dependency_utils.ensure_entity_subscription() calls is_org_write_locked()
    - dependency_utils.check_entity_subscription() calls is_org_write_locked()
    - entity_subrouter.py create/delete calls sync_stripe_quantity()

Helpers:
    get_org_entity_count(org_id, session)  — count non-deleted entities for billing
    get_org_subscription(org_id, session)  — fetch org's Subscription record
    sync_stripe_quantity(subscription, n)  — update Stripe quantity (returns bool)
    is_org_write_locked(org_id, session)   — check if org writes are blocked

These are pure helpers — not FastAPI dependencies. The dependencies that
use them live in dependency_utils.py (ensure_entity_subscription,
check_entity_subscription).

Stripe Dashboard setup (required once):
    1. Products → Create product:
       - Name: "Entity", Unit label: "entity"
       - Pricing: Recurring, per-unit (e.g. $6/month)
       - Description: "Per-entity access to Finpy platform"
       - Metadata key "features" →
         "Unlimited data per entity,Full financial reporting,Portfolio management,Cap table tracking"
         (code reads product.metadata.features and displays on subscription page)
    2. Settings → Billing → Customer Portal:
       - "Customers can switch plans" → ON
       - "Customers can change quantity of their plan" → ON
       - Add the Entity product to eligible subscription products
       - "When customers change plans or quantities" → "Prorate charges and credits"
         (mid-cycle entity creation charges proportionally, not next billing cycle)
       - Cancellations → Allow customers to cancel → ON
"""

import stripe
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.entity_models import Entity
from apps.accounts.models import Subscription

logger = logging.getLogger(__name__)

# ==========================================
# Constants
# ==========================================

# First entity is free — no subscription required.
# Once org needs a second entity, subscription required.
# Change to 0 to charge from the first entity.
FREE_ENTITY_LIMIT = 1

# ==========================================
# Query Helpers
# ==========================================

async def get_org_entity_count(org_id: int, session: AsyncSession) -> int:
    """
    Count non-deleted entities owned by an organization.

    This is the billing quantity — each entity costs money
    (after FREE_ENTITY_LIMIT).

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Number of active (non-deleted) entities
    """
    result = await session.execute(
        select(func.count(Entity.id))
        .filter(
            Entity.organization_id == org_id,
            Entity.deleted_at.is_(None)
        )
    )
    return result.scalar() or 0


async def get_org_subscription(org_id: int, session: AsyncSession):
    """
    Get the organization's subscription record.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        Subscription or None
    """
    result = await session.execute(
        select(Subscription).filter(Subscription.organization_id == org_id)
    )
    return result.scalar_one_or_none()


# ==========================================
# Stripe Sync
# ==========================================

async def sync_stripe_quantity(subscription, new_entity_count: int) -> bool:
    """
    Update Stripe subscription quantity to match entity count.

    Called after entity create (increment) or delete (decrement).
    Stripe handles proration automatically.

    Billable quantity = total entities - FREE_ENTITY_LIMIT.
    Example: 3 entities with FREE_ENTITY_LIMIT=1 → Stripe quantity=2.

    Args:
        subscription: Subscription model instance (needs stripe_subscription_id)
        new_entity_count: Total entity count after the create/delete

    Returns:
        True if sync succeeded, False otherwise
    """
    if not subscription or not subscription.stripe_subscription_id:
        return False

    # Only bill for entities beyond the free tier
    billable_count = max(0, new_entity_count - FREE_ENTITY_LIMIT)

    try:
        # Retrieve subscription to get the item ID
        # (single product = single item, always index 0)
        stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
        items = stripe_sub.get('items', {}).get('data', [])
        if not items:
            logger.error(f"No items found on Stripe subscription: {subscription.stripe_subscription_id}")
            return False

        item_id = items[0]['id']
        stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            items=[{
                'id': item_id,
                'quantity': billable_count,
            }]
        )
        logger.info(
            f"Stripe quantity synced: org={subscription.organization_id}, "
            f"entities={new_entity_count}, billable={billable_count}"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to sync Stripe quantity: {str(e)}")
        return False


# ==========================================
# Write Lock Check
# ==========================================

async def is_org_write_locked(org_id: int, session: AsyncSession) -> bool:
    """
    Check if organization is in read-only mode (soft lock).

    An org is write-locked when:
    - Entity count > FREE_ENTITY_LIMIT (they've used paid features)
    - AND subscription is not ACTIVE or TRIALING (canceled, past_due, etc.)

    Within free tier (entity count <= FREE_ENTITY_LIMIT), no subscription
    needed — always writable.

    Args:
        org_id: Organization ID
        session: Database session

    Returns:
        True if writes should be blocked, False if allowed
    """
    entity_count = await get_org_entity_count(org_id, session)

    # Within free tier — no subscription needed
    if entity_count <= FREE_ENTITY_LIMIT:
        return False

    # Over free tier — need active subscription
    subscription = await get_org_subscription(org_id, session)
    if not subscription:
        return True

    # Manual override bypasses Stripe status checks (invoice/bank transfer clients)
    if subscription.manual_override:
        return False

    return subscription.subscription_status not in ('ACTIVE', 'TRIALING')
