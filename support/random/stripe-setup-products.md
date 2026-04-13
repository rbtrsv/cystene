# Stripe Setup — Products, Webhooks & Portal

General guide for configuring Stripe products via CLI. Applies to any project (Cystene, Nudgio, Nexotype, FinPy).

---

## 1. Login to Correct Stripe Account

**Stripe CLI is logged into ONE account at a time.** When you login to a new account, the previous one is replaced. To work on a different project, you must login again and select that project's account.

```bash
stripe login
```

Browser opens → select the account you want to work on → approve.

Verify:
```
Done! The Stripe CLI is configured for [PROJECT NAME] with account id acct_xxx
```

**Accounts:**

| Project | Account ID |
|---|---|
| Cystene | `acct_1TFIscCgafRZki0X` |
| FinPy | `acct_1MEJyvHWFITcvVBv` |
| Nudgio | check `stripe login` output |
| Nexotype | check `stripe login` output |

**To switch:** just run `stripe login` again, select the other account. All subsequent CLI commands will target that account.

---

## 2. Update .env Files with Correct Keys

Get keys from: `dashboard.stripe.com` → Developers → API keys

**.env (local development — test mode):**
```
STRIPE_SECRET_KEY=sk_test_51TFIsc...  (from Stripe Dashboard → Test mode → Secret key)
STRIPE_WEBHOOK_SECRET=whsec_...       (from `stripe listen` — see step 5)
```

**.env.production (Coolify — live mode):**
```
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY  (from Stripe Dashboard → Live mode → Secret key)
STRIPE_WEBHOOK_SECRET=whsec_...       (from webhook endpoint created in step 4)
```

---

## 3. Create Products + Prices

### Test mode (CLI default):

```bash
# Pro — $49/month
stripe products create \
  --name="Pro" \
  --description="Security scanning platform for growing teams. 10 targets, 500 scans/month, internal scanners, compliance reports, scheduled scans." \
  -d "metadata[tier]=PRO" \
  -d "metadata[tier_order]=1" \
  -d "metadata[features]=10 targets,500 scans/mo,Internal scanners (SSH Cloud),Compliance reports,Scheduled scans,API access"

# Copy the product ID from output (prod_xxx), then:
stripe prices create \
  --product="prod_xxx" \
  -d "unit_amount=4900" \
  -d "currency=usd" \
  -d "recurring[interval]=month"

# Enterprise — $199/month
stripe products create \
  --name="Enterprise" \
  --description="Full security posture management. Unlimited targets, 5000 scans/month, all scanners including AD audit, all report types." \
  -d "metadata[tier]=ENTERPRISE" \
  -d "metadata[tier_order]=2" \
  -d "metadata[features]=Unlimited targets,5000 scans/mo,All 12 scanners,All report types,Hourly scheduling,Priority support"

# Copy product ID, then:
stripe prices create \
  --product="prod_xxx" \
  -d "unit_amount=19900" \
  -d "currency=usd" \
  -d "recurring[interval]=month"
```

### Live mode (pass live secret key):

```bash
STRIPE_API_KEY=sk_live_YOUR_LIVE_KEY stripe products create \
  --name="Pro" \
  --description="Security scanning platform for growing teams. 10 targets, 500 scans/month, internal scanners, compliance reports, scheduled scans." \
  -d "metadata[tier]=PRO" \
  -d "metadata[tier_order]=1" \
  -d "metadata[features]=10 targets,500 scans/mo,Internal scanners (SSH Cloud),Compliance reports,Scheduled scans,API access"

STRIPE_API_KEY=sk_live_YOUR_LIVE_KEY stripe prices create \
  --product="prod_xxx" \
  -d "unit_amount=4900" \
  -d "currency=usd" \
  -d "recurring[interval]=month"

STRIPE_API_KEY=sk_live_YOUR_LIVE_KEY stripe products create \
  --name="Enterprise" \
  --description="Full security posture management. Unlimited targets, 5000 scans/month, all scanners including AD audit, all report types." \
  -d "metadata[tier]=ENTERPRISE" \
  -d "metadata[tier_order]=2" \
  -d "metadata[features]=Unlimited targets,5000 scans/mo,All 12 scanners,All report types,Hourly scheduling,Priority support"

STRIPE_API_KEY=sk_live_YOUR_LIVE_KEY stripe prices create \
  --product="prod_xxx" \
  -d "unit_amount=19900" \
  -d "currency=usd" \
  -d "recurring[interval]=month"
```

### Metadata explained:

| Key | Value | Why |
|---|---|---|
| `tier` | `PRO` or `ENTERPRISE` | accounts webhook reads this → saves as `Subscription.plan_name` → cybersecurity `subscription_utils.py` matches against `TIER_LIMITS` |
| `tier_order` | `1` or `2` | Frontend sorts plans on pricing page |
| `features` | Comma-separated | Frontend displays on pricing page |

**FREE tier has no Stripe product** — it's the default when no Subscription record exists.

---

## 4. Create Webhook Endpoints

### Test mode (for Coolify deployed server):

```bash
stripe webhook_endpoints create \
  --url="https://server.cystene.com/accounts/subscriptions/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted"
```

Output gives you `Secret: whsec_xxx` → this goes in Coolify env vars as `STRIPE_WEBHOOK_SECRET`.

### Live mode:

```bash
STRIPE_API_KEY=sk_live_YOUR_LIVE_KEY stripe webhook_endpoints create \
  --url="https://server.cystene.com/accounts/subscriptions/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted"
```

Output gives `Secret: whsec_xxx` → this goes in `.env.production` as `STRIPE_WEBHOOK_SECRET`.

---

## 5. Local Development — stripe listen

For local testing, Stripe can't reach `localhost`. Use `stripe listen` to forward events:

```bash
stripe listen --forward-to localhost:8003/accounts/subscriptions/webhook
```

Output:
```
Ready! Your webhook signing secret is whsec_57980964a90d...
```

Put this `whsec_` in `.env` as `STRIPE_WEBHOOK_SECRET`. Keep the terminal running while testing.

**When you stop `stripe listen`, the whsec_ expires.** Next time you run it, you get a new one — update `.env` again.

---

## 6. Customer Portal (Manual — Stripe Dashboard)

This can't be done via CLI. Go to `dashboard.stripe.com`:

**Settings → Billing → Customer portal:**

1. **Subscriptions** → "Allow customers to update subscriptions" → ON
   - Add Pro + Enterprise to eligible products
2. **Switch plans** → "When customers change plans" → **Prorate charges and credits**
3. **Cancellations** → Allow customers to cancel → ON
   - Cancel at end of billing period
   - Collect cancellation reason
4. **Payment methods** → Allow customers to update → ON
5. **Invoice history** → Show invoice history → ON

**Do this on BOTH test mode and live mode** (toggle in top-right corner of Dashboard).

Save changes.

---

## 7. Verify Setup

### List products:
```bash
# Test mode
stripe products list -d "active=true"

# Live mode
STRIPE_API_KEY=sk_live_YOUR_LIVE_KEY stripe products list -d "active=true"
```

### Test checkout flow:
1. Start server: `python main.py`
2. Start stripe listen: `stripe listen --forward-to localhost:8003/accounts/subscriptions/webhook`
3. Create checkout via API or frontend
4. Pay with test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. Check webhook received in stripe listen terminal
6. Check `Subscription.plan_name` updated in database

---

## Current IDs

### Cystene (`acct_1TFIscCgafRZki0X`)

### Test mode:
| Product | Product ID | Price ID | Price |
|---|---|---|---|
| Pro | `prod_UHtkTudcLF0bm0` | `price_1TJJwwCgafRZki0XbeHa92Jx` | $49/mo |
| Enterprise | `prod_UHtkANQ2EyzyGm` | `price_1TJJxQCgafRZki0XhUqfmcn2` | $199/mo |

### Live mode:
| Product | Product ID | Price ID | Price |
|---|---|---|---|
| Pro | `prod_UHttD2WjWWJM0Y` | `price_1TJK6LCgafRZki0X4CfIFPBV` | $49/mo |
| Enterprise | `prod_UHtuTH3Tyx0UdY` | `price_1TJK6mCgafRZki0XVvueH9KQ` | $199/mo |

### Webhooks:
| Mode | Webhook ID | Secret | URL |
|---|---|---|---|
| Test | `we_1TJK7eCgafRZki0XLLGrZCSI` | `whsec_YOUR_TEST_WEBHOOK_SECRET` | server.cystene.com |
| Live | `we_1TJK7pCgafRZki0XK0xB3tye` | `whsec_YOUR_LIVE_WEBHOOK_SECRET` | server.cystene.com |
| Local | — | from `stripe listen` output | localhost:8003 |

---

## Flow Summary (How Billing Works Across All Projects)

```
User clicks "Upgrade to Pro"
  → Frontend POST /accounts/subscriptions/checkout {price_id}
  → accounts/stripe_utils.py → Stripe Checkout Session
  → User pays on Stripe hosted page
  → Stripe fires webhook → POST /accounts/subscriptions/webhook
  → accounts/stripe_utils.py → reads product.metadata.tier (e.g. "PRO")
  → saves Subscription.plan_name = "PRO"
  → {module}/subscription_utils.py → reads plan_name → applies TIER_LIMITS
```

Each module (cybersecurity, ecommerce, nexotype, assetmanager) has its own `subscription_utils.py` that reads `Subscription.plan_name` and applies module-specific limits. Stripe integration is shared in `accounts/`.

---

## Notes

- **⚠️ BIG NOTE — Local test subscription blocks live verification:** If you subscribe on local (test mode), the Subscription record is saved in the **same database** (Coolify PostgreSQL). When you then test on live (production), the org already has an active subscription from test mode, so the checkout flow won't behave as expected for a fresh user. To properly test live checkout after local testing: either use a different organization, or manually delete/reset the test Subscription record from the database.
- **Currency:** Cystene uses USD. Stripe converts to EUR on payout automatically (~1-2% spread). No need for USD bank account at current volume.
- **Stripe CLI login is per-account:** `stripe login` connects to ONE account. To work on another project, run `stripe login` again and select that account.
- **FREE tier:** No Stripe product. Default when no Subscription record exists. Each module defines its own free tier limits.
- **Don't change currency on existing products:** Stripe doesn't allow it. You'd need new prices + subscription migration. Set currency correctly at creation time.
