# Cystene — Market & Inspiration: Vibe-Coding Security Scanners

Adjacent-market analysis. A new category of "scan-your-vibe-coded-app" security tools exists for non-engineers shipping AI-generated apps (Lovable, Bolt, v0, Cursor, Replit, Copilot). They are narrower than Cystene (single-app, mostly URL or repo scanning) but their **packaging, funnel, and AI-fix UX** are directly relevant. This file captures what they do and what Cystene should adopt.

**Where Cystene sits:** Cystene is an **ESPM platform** — it scans infrastructure from the outside (network/web) AND inside (SSH, cloud API keys, domain credentials), with business context, compliance mapping (CWE/OWASP/MITRE), and audit-ready reports. These tools scan a single deployed app or repo. **The vibe-coding-app segment is an adjacent funnel, not the core.** Cystene already has the engine (12 scanners, findings, remediation, reports) to serve it; what's missing is a few app-layer checks + the packaging.

---

## 1. Primary references (the two the user flagged)

### vibeappscanner.com — live-app (URL/DAST) scanner
Scans the **deployed app** for mistakes common in AI-generated code. Output is **copy-paste fixes formatted for an AI assistant** + an embeddable trust badge after a clean scan.

Six check categories:
1. **Exposed Secrets & API Keys** — leaked OpenAI/Anthropic/Stripe/AWS/GCP creds; 150+ secret patterns (incl. secrets baked into JS bundles).
2. **Authentication & Authorization** — session hijacking, OAuth misconfig, brute-force protection, auth bypass.
3. **Database Security** — Supabase/Firebase **Row-Level Security (RLS)** verification; SQL injection points.
4. **File Exposure** — accessible `.env`, public `.git`, source maps, sensitive client-side data.
5. **Security Headers & TLS** — XSS/clickjacking prevention, SSL/TLS config, cookie security.
6. **AI-Specific Patterns** — known mistakes from Lovable, Bolt, v0, Cursor.

Pricing: one-time $5–$19 scans + $99/mo continuous (daily scans, breach monitoring). Free side tools (SSL checker, breach checker, password strength) as funnel.

### safeweave.dev — code-side (SAST/repo) scanner with MCP-native integration
"8 scanners, 12 seconds, zero config." Wraps established OSS engines and integrates **inside the AI editor**.

Eight scanners:
1. **SAST** — Semgrep
2. **Secrets** — Gitleaks
3. **Dependencies** — npm audit + OSV
4. **IaC** — Checkov
5. **Containers** — Trivy
6. **DAST** — OWASP ZAP-based
7. **License compliance**
8. **Posture assessment**

Integration: **MCP-native** (Cursor, Claude Code, VS Code, Windsurf), CLI (`npx safeweave-mcp`), CI/CD (GitHub Actions, GitLab, CircleCI, Jenkins), **pre-commit "secure-before-push" skill** (auto-scan before commit/push). Security score (e.g. 61/100), compliance profiles (SOC 2, HIPAA, PCI-DSS, OWASP), trend dashboard, self-hosted option (code stays local). Pricing: Free (10 scans) → $15 self-hosted → $29 cloud → $99 team.

---

## 2. Broader landscape

| Tool | Type | Scan surface | Notable |
|---|---|---|---|
| Vibe App Scanner | Web | Live URL + source | 150+ secret patterns, AI-fix prompts, trust badge |
| SafeWeave | MCP/CLI/CI | Source repo | 8 OSS engines, pre-commit skill, self-hosted |
| VibeCheck | Web (free) | URL + repo | Free, no signup, AI-fix prompts |
| Aikido Security | Platform | Source (no live) | Full AppSec: SAST/DAST/SCA/secrets — broadest |
| VibeChecker | Chrome ext | Real-time in editor | Local-only flagging during generation |
| amihackable.dev | Web (free) | URL only | Headers/config only, no code analysis |
| ChakraView | CLI / OSS | Source | Terminal-first, open source |
| Lovable 2.0 (built-in) | Platform | Generated app | RLS analysis, schema checks, dependency audit |
| SafeToShip | Web (free) | Live URL | 60-second URL scans, funnel-style |

**Common checks across all:** hardcoded secrets/API keys · SQL injection · missing auth/authz logic · RLS misconfiguration · security headers · dependency CVEs · CORS exposure.

**Key differentiator (from the 2026 comparison):** no single scanner catches everything. The split that matters is **static (source/SAST)** vs **dynamic (live URL/DAST)**. Logic errors — inverted auth middleware, IDOR — are invisible to URL scanners that only see successful responses; none of the reviewed tools do genuine request-based auth-flow validation. **Cystene's edge:** it already runs both external (DAST-style) and internal (credentialed) scans — the two halves these tools sell separately.

---

## 3. What Cystene should adopt (inspiration → roadmap)

Cystene already has the heavy machinery (12 scanners, fingerprint dedup, `Finding.remediation_script`, reports, FREE tier, scheduling). The gap is a handful of **app-layer checks** + **packaging for the vibe-coding funnel**. Mapped to existing entities:

1. **Supabase/Firebase RLS check + SQLi confirmation** — extend `web_scan` / `active_web_scan`. The single most-cited vibe-coded vulnerability (public Supabase tables with no RLS).
2. **Secrets in client-side bundles / source maps / `.git` / `.env`** — extend `web_scan` file-discovery. Grep JS bundles + sourcemaps for OpenAI/Anthropic/Stripe/AWS key patterns (150+ regexes). New `Finding.category = "exposed_secret"`.
3. **AI-fix-prompt formatting on `remediation_script`** — the field already exists; standardize its content as a copy-paste prompt block ("Fix this in your app: …") so users paste it straight into Cursor/Claude Code.
4. **Verifiable trust badge** — embeddable badge after a scan with zero critical/high findings. Marketing funnel; ties to `security_score` and target verification (already built).
5. **MCP server** (already in backlog) — match SafeWeave's MCP-native angle: expose Cystene scan/triage as MCP tools for Claude Code / Cursor. This is the highest-leverage packaging move.
6. **Platform-specific finding category** — tag findings as Lovable/Bolt/v0/Cursor/Replit patterns (`Finding.finding_type`). Lets reports speak the vibe-coder's language.
7. **Free instant URL scan, no signup** — top-of-funnel. The FREE tier + external scanners already cover this; needs a frictionless single-URL entry path.

**What NOT to copy:** these tools are single-app point solutions. Cystene's value is the platform (infrastructure context, internal/credentialed audit, compliance reports, multi-target, scheduling). Adopt the checks and the funnel UX; do not narrow the product down to "another vibe scanner."

---

## 4. Wiz Research — the 4 systemic vibe-coded misconfigs (technical detail)

Wiz scanned vibe-coding platforms (Lovable et al.) and found **1 in 5 organizations** exposed to the same four high-impact, easily-preventable misconfigurations. These are the canonical, research-backed checks Cystene should detect. Each maps to a concrete detection method + remediation.

### 4.1 Authentication logic living entirely in the browser
The whole login (password entry + validation) runs client-side, no backend call. The password is embedded in the JS and the session is a predictable flag in `localStorage`.
- **Pattern A (hardcoded string):** `login: s => s === "welcometoredacted" ? (localStorage.setItem("app-auth-token","authenticated"),!0):!1`
- **Pattern B (variable):** `const pC = "marketingdocs2025"` then compared to user input.
- **Second attack path:** attacker reads the expected `localStorage` value and sets it manually in devtools → instant unauthorized access, bypassing the form entirely.
- **Detect:** fetch + parse JS bundles for client-side credential comparison + predictable `localStorage` auth flags (`"authenticated"`, `"true"`).
- **Remediation:** server-side auth (OAuth/Cognito); treat all client-side code as publicly exposed.

### 4.2 API keys & secrets in client-side code
Third-party keys hardcoded in JS: `const h$ = "sk-proj-FSAF…OVY7EfDD-XIMrVayZub7TakA"`.
- **Detect:** grep JS bundles + source maps for 150+ secret patterns (OpenAI `sk-proj-`, Anthropic, Stripe, AWS/GCP, Supabase anon JWT).
- **Remediation:** proxy third-party calls through a backend (e.g. Supabase Edge Functions + Secrets); keys never reach the browser.

### 4.3 Database tables wide-open (Supabase RLS missing/permissive)
Anon Supabase key in JS (`const IR="https://…supabase.co", MR="eyJ…"`) → attacker enumerates and reads tables. Wiz's actual methodology (this is the `baas_scan` blueprint):
```
# 1. Discover all tables via the OpenAPI schema
GET https://PROJECT.supabase.co/rest/v1/   (apikey + Authorization: Bearer <anon>)
# 2. Probe each table
GET /rest/v1/<table>?limit=5
#    200 + rows  → ACCESSIBLE
#    flag sensitive fields: email|phone|password|token|secret|ip|address
```
- **Remediation:** RLS **deny-by-default**, then explicit per-user/role policies. (Firebase equivalent: Firestore/RTDB rules.)

### 4.4 Internal apps publicly facing without auth
Admin dashboards, internal tools, staging — deployed to the public internet, no auth. Found by **fingerprinting** (`lovable.app` + identifying strings) → mock sites with real data, internal KBs, chatbots on sensitive data.
- **Detect:** fingerprint vibe-platform markers + probe for sensitive endpoints reachable without authentication.
- **Remediation:** enforce auth on anything handling sensitive/internal data; inventory all vibe-coded apps.

---

## 5. Gap analysis — VAS/Wiz capabilities → Cystene

What Cystene already has vs what's missing. Drives the roadmap items in `support/to-do/0_order.md`.

| Capability | Cystene today | Action |
|---|---|---|
| Secrets in JS bundles + source maps (150+ patterns) | `web_scan` finds `/.git`, `/.env` paths; does NOT grep bundle/`.map` content | **EXTEND** `web_scan` (§4.2) |
| Supabase/Firebase RLS + table enumeration | — | **NEW** `baas_scan` external scanner — general, not vendor-locked (§4.3) |
| SQL injection | `active_web_scan` ✅ | keep; add "exact SQL to fix" remediation |
| Client-side auth logic (hardcoded pw, localStorage flag) | — | **NEW** check in `web_scan`/`active_web_scan` (§4.1) |
| Internal app public + platform fingerprint | — | **NEW** check (§4.4) |
| Security headers / SSL-TLS / cookie hardening | `web_scan` + `ssl_scan` ✅ | — |
| Auth bypass / session / OAuth misconfig / brute-force | `password_audit` (brute) + `api_scan` (CORS/JWT) partial | **ENHANCE** |
| Email security SPF/DMARC/MX | `dns_scan` does SPF/DKIM/DMARC ✅ | + MX note |
| Breach checker (HaveIBeenPwned) | — | optional, low priority |
| AI-ready copy-paste fix format | `Finding.remediation_script` exists | roadmap (standardize) |
| Trust badge | — | roadmap (Nice To Have) |
| Daily scans + alerts + issue lifecycle | scheduling ✅; alerts = 4F; `Finding.status` lifecycle ✅ | finish 4F |
| Free URL scan, no signup | FREE tier + external scanners | roadmap (Long Term funnel) |
| Vibe-coded scan preset | `ScanTemplate` is generic | **NEW** seed a template preset |
| MCP + CLI | — | Long Term — `nexotype/mcp` pattern (UI-first; revisit as the company grows) |
| Content (guides/glossary/vuln DB) | website | website/marketing — out of scanner scope |

**Domain placement:** the new external checks (`baas_scan`, secret-grep, client-side-auth, public-app fingerprint) all live in `scanners/external/` (no credentials needed). A **"Vibe-Coded App" `ScanTemplate` preset** bundles them — the product stays a general ESPM platform; the vibe-coding angle is a scan *profile*, not a separate product.

---

## 6. Round 2 — cross-referenced checks (Aikido / OWASP-for-Vibe / Serenities 25)

Three more checklists cross-referenced. Cystene **already covers** a lot: SQLi/XSS/cmd/LFI (`active_web_scan`), security headers + `.git`/`.env` + redirect analysis (`web_scan`), TLS (`ssl_scan`), CORS/JWT/GraphQL/rate-limit (`api_scan`), service-version CVE (`vuln_scan`), brute-force (`password_audit`), SPF/DKIM/DMARC (`dns_scan`) — plus A1–A5 above. The genuinely **new, external/DAST-detectable** gaps worth adding:

| ID | New check | OWASP-for-Vibe | Why it matters | How (in Cystene) |
|---|---|---|---|---|
| **A6** | IDOR / Broken Access Control probe | A01 (#1 risk) | The static-vs-dynamic gap URL scanners miss — modify an ID → read another user's data. No tool reviewed does real request-based authz validation. | NEW active check, gated like `active_web_scan` (consent). Sequential/owned-ID tampering on API endpoints. |
| **A7** | SSRF detection | A10 | URL/webhook param that fetches internal resources without validation. | Extend `active_web_scan` with safe payloads (`169.254.169.254`, `localhost`). |
| **A8** | Info disclosure / debug mode | A05 | Stack traces, DB schema, verbose errors, debug endpoints leak internals. | Extend `web_scan` (info-disclosure already partial). |
| **A9** | Client-side dependency exposure | A06 | Exposed `package.json`/`package-lock.json`, outdated front-end JS libs (retire.js-style), missing **SRI**, untrusted CDNs. | Extend `web_scan`. |
| — | OWASP-Top-10-for-Vibe mapping | all | Reports that speak the vibe-coder's language. | Tag findings via existing `Finding.owasp_category` — zero schema change. |

**Explicitly OUT-OF-SCOPE for the scanner** (process / code-review / runtime-hardening — these are advisory/website guidance, NOT scan findings, because they can't be detected by an external DAST scan): git & `.gitignore` & branch hygiene, CI/CD + SAST in pipeline, Docker base-image updates + container privileges, secrets manager (Vault/AWS SM), "don't roll your own auth/crypto", lockfiles, DB backups, SDLC/peer-review, webhook signature verification (code-level), server-side payment-logic validation (business logic), file-upload validation (hard generically from outside). This **reinforces §3's "what NOT to copy"** — Cystene scans, it does not lint your repo or your process.

---

## Sources
- https://vibeappscanner.com/
- https://safeweave.dev/
- https://www.wiz.io/blog/common-security-risks-in-vibe-coded-applications (Wiz Research — 1-in-5 vibe-coded apps; the 4 systemic misconfigs)
- https://dev.to/solobillions/i-tested-every-vibe-coding-security-scanner-2026-heres-what-actually-works-p9k (2026 comparison of 8 scanners)
- https://safetoship.dev/blog/best-vibe-coding-security-scanners
- https://www.aikido.dev/blog/vibe-check-the-vibe-coders-security-checklist (Aikido — 23-item checklist, 3 maturity levels)
- https://vibeappscanner.com/owasp-top-10-vibe-coding (OWASP Top 10 for Vibe Coding)
- https://serenitiesai.com/articles/vibe-coding-security-checklist-2026 (Serenities — 25 checks before launch)
- Google "scan your vibe coded app" — Level Up Coding (7-point check), VibeEval, Wagtail, StackHawk (natural-language DAST)
