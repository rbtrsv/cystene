# AI Discoverability — All Projects

Make all project websites structured for AI crawlers (ChatGPT/GPTBot, Claude/ClaudeBot, Perplexity/PerplexityBot) to understand, index, and surface our content.

**Applies to all projects:**
- **Cystene** — `cystene/website/` → cystene.com
- **Nudgio** — `nudgio/website/` → nudgio.tech
- **Nexotype** — `nexotype/website/` → nexotype.com
- **FinPy** — `finpy/website/` → finpy.tech

Each project needs the same 4 changes, adapted to its own domain and product description.

---

## Task 1: Create `/llms.txt`

**What:** A Markdown file at the root of the site describing the product in plain language. Follows the [llmstxt.org spec](https://llmstxt.org/). 844K+ sites already use it (Anthropic, Cloudflare, Stripe).

**Where:** `{project}/website/public/llms.txt` (Next.js serves `public/` files at root)

**Format (from spec):**
- H1 with project name (required)
- Blockquote with short summary (required)
- Sections with links to key pages (optional but recommended)
- Key features list

**Example (Cystene):**
```markdown
# Cystene

> Cystene is a SaaS cybersecurity scanning platform built by Buraro Technologies. It scans infrastructure targets (domains, IPs, IP ranges, URLs) for vulnerabilities across four dimensions: port scanning, DNS enumeration, SSL/TLS analysis, and web security checks. Users get prioritized findings with severity ratings and actionable remediation guidance.

## Links

- [Homepage](https://www.cystene.com)
- [Blog](https://www.cystene.com/blog)
- [Features](https://www.cystene.com/#features)
- [How It Works](https://www.cystene.com/#how-it-works)
- [Contact](https://www.cystene.com/#contact)
- [Terms of Service](https://www.cystene.com/legal/terms-of-service)
- [Privacy Policy](https://www.cystene.com/legal/privacy-policy)

## Key Features

- Port Scanning — TCP connect scans, banner grabbing, service identification
- DNS Enumeration — subdomain discovery, DNS record analysis, SPF/DKIM/DMARC checks
- SSL/TLS Analysis — certificate validation, cipher suite analysis, protocol version checks
- Web Security — security header checks, misconfiguration detection, information disclosure
- Scheduled Scans — automated recurring assessments (daily, weekly, custom)
- Exportable Reports — PDF and JSON reports for compliance and stakeholder briefings
- Analytics Dashboard — vulnerability trends and security posture tracking over time
```

**Per-project:** Each project writes its own `/llms.txt` with its own product name, description, links, and features.

| Project | Status |
|---|---|
| Cystene | ❌ |
| Nudgio | ❌ |
| Nexotype | ❌ |
| FinPy | ❌ |

---

## Task 2: Update `robots.txt` — Explicitly Allow AI Crawlers

**What:** Add explicit user-agent rules for AI bots. Some AI crawlers only respect their own user-agent entry, not the wildcard `*`.

**Where:** `{project}/website/src/app/robots.ts`

**Target state:**
```typescript
rules: [
  {
    userAgent: '*',
    allow: '/',
    disallow: '/private/',
  },
  {
    userAgent: 'GPTBot',
    allow: '/',
  },
  {
    userAgent: 'ClaudeBot',
    allow: '/',
  },
  {
    userAgent: 'PerplexityBot',
    allow: '/',
  },
],
```

**Per-project:** Same rules for all projects. Only the sitemap URL changes per domain.

| Project | Status |
|---|---|
| Cystene | ❌ |
| Nudgio | ❌ |
| Nexotype | ❌ |
| FinPy | ❌ |

---

## Task 3: Add JSON-LD Structured Data to Homepage

**What:** Schema.org structured data so Google and AI crawlers understand what the product is (type, features, company).

**Where:** `{project}/website/src/app/page.tsx` — add a `<script type="application/ld+json">` inside the page component.

**Schema type:** `SoftwareApplication` (or `WebApplication`)

**Example (Cystene):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Cystene",
  "url": "https://www.cystene.com",
  "description": "Cybersecurity scanning platform for infrastructure security. Port scanning, DNS enumeration, SSL/TLS analysis, and web security assessments with prioritized findings and remediation guidance.",
  "applicationCategory": "SecurityApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free tier available"
  },
  "creator": {
    "@type": "Organization",
    "name": "Buraro Technologies",
    "url": "https://www.cystene.com"
  },
  "featureList": [
    "Port Scanning",
    "DNS Enumeration",
    "SSL/TLS Analysis",
    "Web Security Checks",
    "Scheduled Scans",
    "Exportable Reports",
    "Analytics Dashboard"
  ]
}
```

**Per-project:** Each project adapts `name`, `url`, `description`, `applicationCategory`, `featureList` to its own product.

| Project | Status |
|---|---|
| Cystene | ❌ |
| Nudgio | ❌ |
| Nexotype | ❌ |
| FinPy | ❌ |

---

## Task 4: H1 Audit — All Projects

**What:** Ensure the primary `<h1>` on each homepage clearly answers: what is this, who is it for, and what problem does it solve. The animated/decorative branding headline should NOT be the `<h1>` — the descriptive sentence should be.

**Common pattern across all projects:** All projects use the same HeroSectionAnimated component with a stylistic animated headline as `<h1>` and a descriptive subtitle as `<h2>`. This is backwards for SEO and AI crawlers. The fix is the same everywhere:
- Animated branding text: change from `<h1>` to `<p>`
- Descriptive subtitle: change from `<h2>` to `<h1>`

**Where:** `{project}/website/src/modules/main/components/HeroSectionAnimated/HeroSectionAnimated.tsx`

| Project | Status |
|---|---|
| Cystene | ✅ Done |
| Nudgio | ❌ Same fix needed |
| Nexotype | ❌ Same fix needed |
| FinPy | ❌ Same fix needed |

---

## Summary

| Task | Cystene | Nudgio | Nexotype | FinPy |
|---|---|---|---|---|
| 1. `/llms.txt` | ✅ | ❌ | ❌ | ❌ |
| 2. `robots.txt` AI bots | ✅ | ❌ | ❌ | ❌ |
| 3. JSON-LD structured data | ✅ | ❌ | ❌ | ❌ |
| 4. H1 audit | ✅ | ❌ | ❌ | ❌ |

## References

- [llmstxt.org — The /llms.txt spec](https://llmstxt.org/)
- [Schema.org — SoftwareApplication](https://schema.org/SoftwareApplication)
- [Google — Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data)
- [OpenAI — GPTBot documentation](https://platform.openai.com/docs/bots)
