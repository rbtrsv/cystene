# Stripe Subscription Flow - Nexotype Platform

## Frontend → Backend → Stripe Flow

### 1. Loading Plans (`/pricing` page)

```
// Frontend calls
useSubscriptions() → fetchPlans() → getSubscriptionPlans()
↓
// Backend endpoint
GET /accounts/subscriptions/plans
↓
// Backend calls Stripe API
get_stripe_prices() + get_stripe_products()
↓
// Returns formatted plan data to frontend
{success: true, data: {prices: [...], products: [...]}}
```

### 2. Creating Checkout ("Get Started" button)

```
// User clicks "Get Started" button
handleSubscribe(priceId) → createCheckoutSession(priceId)
↓
// Backend endpoint
POST /accounts/subscriptions/checkout?price_id=price_123
↓
// Backend creates Stripe session
stripe.checkout.sessions.create({
  success_url: "https://app.nexotype.com/?session_id={CHECKOUT_SESSION_ID}"
})
↓
// Frontend redirects user to Stripe
window.location.href = checkoutUrl
```

### 3. After Payment (Stripe redirects back)

```
// User lands on: /?session_id=cs_abc123
// Middleware allows access due to session_id
↓
// StripeSuccessHandler component detects session_id in URL
// Located in: /modules/accounts/components/stripe-success-handler.tsx
// Rendered in: /app/(nexotype)/layout.tsx and /app/dashboard/layout.tsx
↓
// 1. Cleans session_id from URL (no page refresh)
// 2. Calls handleWebhookSuccess(sessionId) to confirm subscription on backend
// 3. Calls initialize() to refresh auth/subscription state
```

### 4. Managing Subscription ("Manage" button)

```
// User clicks "Manage Subscription"
createCustomerPortalSession()
↓
// Backend endpoint
POST /accounts/subscriptions/portal
↓
// Backend creates Stripe portal session
stripe.billingPortal.sessions.create({
  customer: subscription.stripe_customer_id,
  return_url: "https://app.nexotype.com/"
})
↓
// Frontend redirects to Stripe portal
window.location.href = portalUrl
```

### 5. Webhooks (Stripe → Backend only)

```
// Stripe sends webhooks directly to backend
POST /accounts/subscriptions/webhook
↓
// Backend processes Stripe events
handle_webhook(payload, signature)
↓
// Updates subscription status in database
subscription.subscription_status = "ACTIVE"
```

## Key Integration Points

1. **Frontend never talks to Stripe directly** - all Stripe operations go through your backend
2. **Backend handles all Stripe API calls** - creates sessions, verifies payments, processes webhooks
3. **Database stores subscription state** - synced via Stripe webhooks
4. **Frontend displays UI based on database state** - fetched via your API

## Implementation Status

**✅ All flows are fully implemented and working:**

- StripeSuccessHandler extracted to reusable component in `/modules/accounts/components/stripe-success-handler.tsx`
- Rendered in both `(nexotype)/layout.tsx` and `dashboard/layout.tsx`
- Stripe webhooks handle payment verification automatically
- Frontend refreshes data after successful payment return

---

## Subscription Tier Gating

### How Tiers Work

Subscription tiers are fetched **dynamically from Stripe** at server startup.

**File:** `server/apps/accounts/utils/dependency_utils.py`

`get_stripe_subscription_tiers()` calls `stripe.Product.list(active=True)` and reads
two metadata fields from each product:

- `tier` — the tier name (e.g. `PRO`, `ENTERPRISE`), gets uppercased
- `tier_order` — sort order integer (lower = higher priority in the hierarchy)

The function builds an ordered list like `['FREE', 'PRO', 'ENTERPRISE']`.
If the Stripe API call fails, it falls back to `['FREE', 'BASIC', 'PRO', 'ENTERPRISE']`.

### Stripe Dashboard Setup

Each product in Stripe Dashboard needs metadata so the code can discover it:

```
Product: "Pro"
  → Metadata:
    tier = PRO
    tier_order = 1

Product: "Enterprise"
  → Metadata:
    tier = ENTERPRISE
    tier_order = 2
```

**Why metadata is required:** The code does not hardcode tier names. It reads them
from Stripe products at runtime. Without `tier` and `tier_order` metadata, the
product is invisible to the permission system.

`FREE` is always inserted at position 0 automatically (no Stripe product needed for it).

### Gating Routes by Subscription Tier

Three FastAPI dependency factories are available:

**1. Tier only** — any org member with sufficient subscription:
```python
from apps.accounts.utils.dependency_utils import require_subscription_tier

@router.post('/organizations/{organization_id}/premium-feature')
async def premium_feature(
    organization_id: int,
    user: User = Depends(get_current_user),
    org: Organization = Depends(require_subscription_tier('ENTERPRISE'))
):
    # Only ENTERPRISE subscribers reach here
    ...
```

**2. Role only** — any subscription, but specific org role:
```python
from apps.accounts.utils.dependency_utils import require_organization_role

@router.delete('/organizations/{organization_id}')
async def delete_org(
    organization_id: int,
    user: User = Depends(get_current_user),
    org: Organization = Depends(require_organization_role('OWNER'))
):
    # Only org OWNERs reach here
    ...
```

**3. Role + Tier** — both checks combined:
```python
from apps.accounts.utils.dependency_utils import require_organization_role_and_subscription

@router.post('/organizations/{organization_id}/admin-feature')
async def admin_feature(
    organization_id: int,
    user: User = Depends(get_current_user),
    org: Organization = Depends(require_organization_role_and_subscription('ENTERPRISE', ['ADMIN', 'OWNER']))
):
    # Only ADMIN/OWNER with ENTERPRISE subscription reach here
    ...
```

### How the Tier Check Works

1. Verifies user is a member of the organization
2. Loads the organization's subscription from database
3. Checks subscription status is `ACTIVE`
4. Compares the subscription's `plan_name` against `SUBSCRIPTION_TIERS` list
5. If user's tier index >= required tier index → access granted
6. No subscription at all → treated as `FREE` (index 0)
