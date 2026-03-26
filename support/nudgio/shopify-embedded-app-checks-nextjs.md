# Shopify Embedded App Checks — Fix for Next.js App Router

## The Problem

When submitting a Shopify embedded app built with **Next.js App Router** (v15/v16), the automated embedded app checks fail:

- "Using the latest App Bridge script loaded from Shopify's CDN"
- "Using session tokens for user authentication"

The checks are auto-checked every 2 hours. Even after logging in, interacting with the app on a dev store multiple times, and waiting days — they don't pass.

The app works perfectly inside the Shopify Admin iframe. Session tokens work. App Bridge loads. Everything functions correctly. But the automated check refuses to pass.

## The Root Cause

The automated check validates not just that App Bridge loads, but that **the backend correctly signals App Bridge to handle session token refresh on 401 responses**.

When your backend returns a `401 Unauthorized` (e.g., expired session token), it **must** include this response header:

```
X-Shopify-Retry-Invalid-Session-Request: 1
```

This header tells App Bridge: "The token was invalid, but get a fresh one and retry the request automatically."

Without this header, App Bridge doesn't know to retry, and Shopify's telemetry doesn't register proper session token usage — causing the automated check to fail.

## The Fix

Add `X-Shopify-Retry-Invalid-Session-Request: 1` to **every 401 response** from your session-token-authenticated endpoints.

### FastAPI (Python)

```python
# Constant — include on all 401 responses from session-token endpoints
SHOPIFY_RETRY_HEADER = {"X-Shopify-Retry-Invalid-Session-Request": "1"}

# Usage — pass as headers parameter to HTTPException
raise HTTPException(
    status_code=401,
    detail="Session token expired",
    headers=SHOPIFY_RETRY_HEADER,
)
```

Apply this to every `HTTPException(401)` in your session token verification:
- Expired token
- Invalid audience
- Invalid signature
- Missing Authorization header
- Missing/invalid claims

**Do NOT** add this header to non-session-token 401s (e.g., webhook HMAC verification).

### Express.js (Node.js)

```javascript
res.status(401)
   .set('X-Shopify-Retry-Invalid-Session-Request', '1')
   .json({ error: 'Session token expired' });
```

### Django / Flask

```python
response = JsonResponse({'error': 'Session token expired'}, status=401)
response['X-Shopify-Retry-Invalid-Session-Request'] = '1'
return response
```

## Full Checklist for Next.js App Router

For a complete embedded app setup that passes the automated checks:

### 1. Root Layout (`layout.tsx`) — App Bridge CDN Script

```tsx
<head>
  <meta name="shopify-api-key" content="YOUR_CLIENT_ID" />
  {/* eslint-disable-next-line @next/next/no-sync-scripts */}
  <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
</head>
```

**Important:**
- Do NOT use `next/script` with `strategy="beforeInteractive"` — it adds `async` attribute, which Shopify rejects
- The `<meta>` tag must appear before the `<script>` tag
- Next.js App Router injects its chunk scripts before your `<head>` content, but they have `async` so App Bridge still loads synchronously
- The meta + script must be on ALL routes (root layout ensures this)

### 2. Frontend — Session Token Usage

```typescript
// Get fresh session token from App Bridge
const token = await window.shopify.idToken();

// Include in Authorization header for all backend requests
const response = await fetch('https://your-backend.com/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### 3. Backend — JWT Verification

Verify the session token on every request:
- Algorithm: `HS256`
- Secret: Your app's `SHOPIFY_CLIENT_SECRET`
- Audience (`aud`): Your app's `SHOPIFY_CLIENT_ID`
- Check `exp` (expiration) — tokens live 1 minute
- Extract shop domain from `dest` claim

### 4. Backend — Token Exchange

Exchange session tokens for offline access tokens:

```
POST https://{shop}.myshopify.com/admin/oauth/access_token

Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
grant_type=urn:ietf:params:oauth:grant-type:token-exchange
subject_token=THE_SESSION_TOKEN
subject_token_type=urn:ietf:params:oauth:token-type:id_token
requested_token_type=urn:shopify:params:oauth:token-type:offline-access-token
```

### 5. Backend — Retry Header on 401 (THE KEY FIX)

```
X-Shopify-Retry-Invalid-Session-Request: 1
```

Add this header to every 401 response from session-token-authenticated endpoints.

### 6. `shopify.app.toml`

```toml
embedded = true

[access_scopes]
use_legacy_install_flow = false
```

## What Didn't Work (Save Yourself Time)

- `document.write()` to force App Bridge before Next.js chunks — causes React hydration warnings, no benefit
- Placing `<meta>` + `<script>` before `<head>` in JSX — Next.js ignores the ordering
- `next/script` with `beforeInteractive` — adds `async` attribute, Shopify rejects it
- Waiting and re-interacting with the app on dev store — doesn't help without the retry header

## References

- [Shopify App Bridge Library](https://shopify.dev/docs/api/app-bridge-library)
- [Set up session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens)
- [Set up embedded app authorization](https://shopify.dev/docs/apps/build/authentication-authorization/set-embedded-app-authorization)
- [Token Exchange](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange)
- [GitHub Issue #311 — Can't load AppBridge v4 using NextJS app router](https://github.com/Shopify/shopify-app-bridge/issues/311)
- [Community: App Bridge CDN check not passing in Next.js](https://community.shopify.dev/t/app-bridge-cdn-automated-check-not-passing-in-hybrid-next-js-app-pages-app-router/28960)
- [Community: App fails "Using the latest App Bridge script" check](https://community.shopify.dev/t/shopify-app-fails-using-the-latest-app-bridge-script-check-even-when-loading-from-cdn/22168)

## Tech Stack

This was tested with:
- Next.js 16 (App Router, Turbopack)
- FastAPI (Python backend)
- Shopify App Bridge v4 (CDN)
- Polaris Web Components (CDN)

---

*If this helped you, star the repo. This took days to figure out.*
