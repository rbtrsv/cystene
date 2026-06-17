# SOC2 + HIPAA Cheatsheet

Skim-friendly reference. Nu manual oficial. Pentru solo dev cu monorepo SaaS pe Coolify.

---

## TL;DR — cine, ce, când

| Framework | Ce e | Cine îl cere | Mandatory? | Cost real Year 1 |
|---|---|---|---|---|
| **SOC2 Type 1** | Snapshot — controale există la momentul X | Customers B2B enterprise | ❌ voluntary | ~$25-45k DIY |
| **SOC2 Type 2** | Perioadă — controale funcționează 3-12 luni continuous | Customers enterprise serioși ($25k+/an deals) | ❌ voluntary | ~$40-75k DIY |
| **HIPAA** | Lege US pentru date medicale (PHI) | Federal (HHS) | ✅ LEGAL dacă atingi PHI | $0 audit + penalties $50-1.5M dacă încalci |
| **GDPR** | Lege EU pentru date personale | EU autorități + customers EU | ✅ LEGAL dacă servești EU users | $0 audit + fines până la 4% revenue |
| **ISO 27001** | International security standard | Enterprise mai ales EU/UK/Asia | ❌ voluntary | ~$30-60k Year 1 |

---

## SOC2 vs HIPAA — diferența rapidă

```
                   ┌─────────────────┐         ┌─────────────────┐
                   │      SOC2       │         │      HIPAA      │
                   └─────────────────┘         └─────────────────┘
                            │                           │
              ┌─────────────┴──────┐         ┌──────────┴────────┐
              │                    │         │                   │
       voluntary audit        US standard   legal mandatory   US healthcare
       (CPA firm)           (AICPA-based)   (federal law)     (HHS enforced)
              │                    │         │                   │
       customer trust          security      Protected Health   medical data
       marker B2B            controls       Information (PHI)   = nume+diagnostic
                                  │                   │
                              ┌───┴───┐               │
                              │       │               │
                          Type 1   Type 2          breach = fines
                          snapshot perioadă         + criminal
                                                    charges possibile
```

**Cuvânt-cheie:**
- **SOC2** → "Ești sigur că nu pierzi datele mele financiare?" — B2B trust
- **HIPAA** → "Date medicale = date sacre, legea US zice așa"

---

## Trust principles SOC2 (5 categorii)

```
                          ┌───────────────────┐
                          │     SECURITY      │  ← MANDATORY (singura)
                          │  (Common Criteria)│
                          └───────────────────┘
                                    │
            ┌───────────┬───────────┼───────────┬───────────┐
            │           │           │           │           │
       Availability Confidenti-  Processing   Privacy
                    ality      Integrity
        (uptime,  (encryption (tranzacții   (PII handling
         backups, classification, corecte,    GDPR/CCPA)
         DR)      DPA-uri)    audit trail)
            │           │           │           │
         opțional    opțional   opțional    opțional
```

**Pentru tine:** Security + Confidentiality + Availability acoperă 95% din ce-ți cer customers B2B.

---

## Common Criteria SOC2 (CC1-CC9) — ce verifică auditor

| CC | Ce e | Aplicat la tine |
|---|---|---|
| **CC1** Control Environment | Cine ești, organizare, politici, training | Solo dev → policy docs scrise + signed |
| **CC2** Communication & Information | Cum comunicați riscuri, schimbări | Slack/email logs + GitHub issues |
| **CC3** Risk Assessment | Lista riscurilor + likelihood + mitigation | `risk_register.md` |
| **CC4** Monitoring Activities | Cum detectezi probleme | Uptime monitor + log alerts |
| **CC5** Control Activities | Procese tehnice (deploy, access, change) | Markdown procedures |
| **CC6** Logical & Physical Access | Auth, MFA, RBAC | JWT + OAuth + Coolify MFA |
| **CC7** System Operations | Operațiuni zilnice (backup, incident response) | Runbook + restore tests |
| **CC8** Change Management | Cum modifici production-ul | GitHub PR + Coolify deploy log |
| **CC9** Risk Mitigation | Vendor management + business continuity | `vendors.md` + DPA-uri |

---

## HIPAA — când te atinge

```
Atingi date medicale = "Protected Health Information" (PHI)?
                        │
            ┌───────────┴───────────┐
           DA                       NU
            │                       │
    ┌───────┴────────┐               │
    │                │               │
  Covered           Business     Nu ești HIPAA-bound
  Entity?           Associate?   (Factor Markets,
   (clinici,        (vendor      AssetManager)
   asigurători,     pentru CE,
   providers)       cum ești tu
                    pentru pharma)
        │                │
        │                │
   HIPAA full       BAA contract
   requirements     + HIPAA partial
```

**Ce e PHI (Protected Health Information):**
- Nume + diagnostic / treatment / payment medical
- Genomic data + identitate (23andMe upload + email)
- Biomarker readings + identitate
- Treatment logs + identitate

**Ce NU e PHI:**
- Date anonimizate (zero re-identification possible)
- Date publice (DrugBank, PubMed)
- Date corporative (financials, valuation, pipeline)

**Pentru produsele tale:**

| Produs | PHI? | HIPAA? |
|---|---|---|
| Factor Markets | NU (date publice + portfolio personal) | ❌ |
| Finpy AssetManager | NU (date financiare cap-table) | ❌ |
| Nexotype Health (B2C consumer) | DA dacă useri reali încarcă 23andMe + biomarkers | ⚠️ MAYBE (gray area dacă tu nu ești healthcare provider) |
| Nexotype Intelligence (B2B pharma) | DEPINDE — dacă pharma încarcă patient data → DA | ✅ DA dacă semnezi BAA cu pharma |

**BAA = Business Associate Agreement.** Contract obligatoriu cu cei care atinge PHI. Fără BAA semnat = poți primi fines automat.

---

## Stack-ul tehnic SOC2-ready (Coolify-friendly)

```
                    Customer Browser
                          │
                          │ HTTPS (TLS 1.3)
                          ▼
                  ┌──────────────────┐
                  │     Traefik      │ ← certificate auto Let's Encrypt
                  │  (Coolify-managed)│
                  └──────────────────┘
                          │
                ┌─────────┴──────────┐
                │                    │
                ▼                    ▼
        ┌──────────────┐      ┌──────────────┐
        │  Backend     │      │  Frontend    │
        │  FastAPI     │      │  Next.js     │
        └──────────────┘      └──────────────┘
                │                    │
                │ encrypted env vars │
                ▼                    │
        ┌──────────────┐             │
        │  PostgreSQL  │             │
        │  (Coolify)   │             │
        └──────────────┘             │
                │                    │
                │ daily backup       │
                ▼                    │
        ┌──────────────┐             │
        │  S3 / B2     │             │
        │  encrypted   │             │
        │  Object Lock │             │
        └──────────────┘             │
                                     │
                ┌────────────────────┘
                │
                ▼
        ┌──────────────┐
        │  BetterStack │ ← log streaming persistent + tamper-evident
        │   / Loki     │
        └──────────────┘
```

---

## Controale tehnice — cu / fără tu ai

### ✅ Ai DEJA (în Nexotype + Finpy)

```
Multi-tenant isolation         → OwnableMixin + organization_id filter
Audit logs                     → nexotype_audit_logs + accounts_audit_logs
Soft delete + recovery         → deleted_at + filters
Auth multi-strategy            → JWT + OAuth + MFA (Coolify)
TLS in transit                 → Coolify + Traefik
Secrets management             → Coolify encrypted env vars
Code review trail              → GitHub history + branch protection
Source control                 → GitHub private repo
```

### ❌ LIPSESC (mandatory pentru SOC2)

```
MFA pe Coolify admin           → 5 min setup
Disk encryption at rest        → LUKS pe VPS, sau Hetzner storage cert
Backup encryption + restore    → Coolify backup config + quarterly test
Dependabot                     → 30 sec GitHub checkbox
Vulnerability scanning         → Snyk free / Trivy CI
Persistent log streaming       → BetterStack free / self-hosted Loki
Penetration test anual         → freelancer security $3-8k
Branch protection main         → GitHub settings 5 min
Health endpoints documented    → already in code, doar doc
Incident detection alerts      → BetterStack alerts on uptime/error
```

### ❌ LIPSESC (procedural — markdown docs)

```
Access Control Policy           ← cine + ce + when revocate
Incident Response Plan          ← ce facem la breach
Data Classification Policy      ← ce e PII vs public
Vendor Management Policy        ← cum evaluezi noi vendors
Change Management Policy        ← cum modificați prod
Backup & Recovery Policy        ← schedule + restore + retention
Business Continuity Plan        ← disaster recovery
Security Awareness Training     ← pentru tine + future hires
Risk Register                   ← lista riscurilor + mitigation
Quarterly Access Reviews        ← cine are acces, încă-i necesar?
```

---

## DIY SOC2 — folder structure

```
finpy/
└── compliance/
    ├── README.md                       ← cum se citește totul, pentru auditor
    │
    ├── policies/
    │   ├── access_control.md
    │   ├── incident_response.md
    │   ├── data_classification.md
    │   ├── vendor_management.md
    │   ├── change_management.md
    │   ├── backup_recovery.md
    │   ├── business_continuity.md
    │   └── security_awareness.md
    │
    ├── procedures/
    │   ├── deploy_checklist.md
    │   ├── incident_runbook.md
    │   ├── quarterly_access_review.md
    │   ├── secret_rotation.md
    │   └── disaster_recovery_drill.md
    │
    ├── vendors/
    │   ├── stripe.md                   (DPA + SOC2 report link)
    │   ├── coolify.md
    │   ├── hetzner.md
    │   ├── brevo.md
    │   ├── github.md
    │   ├── anthropic.md
    │   ├── openai.md
    │   └── cloudflare.md
    │
    ├── evidence/
    │   ├── 2026-Q1/
    │   │   ├── access_review_signed.md
    │   │   ├── backup_restore_test.md
    │   │   ├── dependabot_scan_results.png
    │   │   ├── coolify_mfa_screenshot.png
    │   │   ├── tls_cert_validity.png
    │   │   └── secret_rotation_log.md
    │   ├── 2026-Q2/
    │   ├── 2026-Q3/
    │   └── 2026-Q4/
    │
    ├── risk_register.md
    │
    └── audits/
        ├── 2026_soc2_type1.md
        └── 2027_soc2_type2.md
```

---

## Cost real Year 1

```
                  ┌──────────────────────┐
                  │     SOC2 cu Vanta    │
                  └──────────────────────┘
                            │
            Year 1: $50,000 - $90,000
            ├── Vanta SaaS         $10-15k/an
            ├── Auditor extern     $30-50k Type 2
            ├── Penetration test    $5-15k
            ├── Lawyer policies     $3-8k
            └── Time investment    100-150 ore tu
            
                  ┌──────────────────────┐
                  │      SOC2 DIY        │
                  └──────────────────────┘
                            │
            Year 1: $30,000 - $50,000
            ├── Compliance platform     $0
            ├── Auditor extern         $25-40k
            ├── Penetration test        $3-8k
            ├── Lawyer (optional)       $0-3k
            └── Time investment       300-500 ore tu
```

**Trade-off:** economisești $20-40k cu DIY, plătești cu 200-300 ore extra.

---

## Decision tree — ai nevoie de SOC2?

```
Targetezi enterprise customers > $25k/an?
        │
   ┌────┴────┐
  DA         NU
   │         │
   │         └─→ NU SOC2 acum. Focus pe product-market-fit.
   │
   │
Te-a întrebat primul prospect "ai SOC2?"
        │
   ┌────┴────┐
  DA         NU
   │         │
   │         └─→ Marketing OK fără. Reconsiderăm la al 3-lea customer care întreabă.
   │
   │
Pot închide deal de $25k+ doar dacă am SOC2?
        │
   ┌────┴────┐
  DA         NU
   │         │
   │         └─→ Marketing-able "SOC2 audit underway, target Qx 2027"
   │
   │
   └─→ START SOC2 prep acum.
       Vanta sau DIY = decizie cash vs time.
```

---

## Decision tree — ai nevoie de HIPAA?

```
Userii încarcă PHI (genomic + biomarkers + diagnostic)?
        │
   ┌────┴────┐
  DA         NU
   │         │
   │         └─→ NU HIPAA. Doar GDPR dacă servești EU.
   │
   │
Servești healthcare providers (clinici, pharma cu patient data)?
        │
   ┌────┴────┐
  DA         NU
   │         │
   │         └─→ Maybe gray area dacă consumer face self-upload.
   │             Verifică cu lawyer specializat HIPAA.
   │
   │
Vrei să semnezi BAA cu un cunsumer covered entity?
        │
   ┌────┴────┐
  DA         NU
   │         │
   │         └─→ Refuză BAA semnare până nu ești HIPAA-compliant.
   │
   │
   └─→ HIPAA compliance MANDATORY:
       ├── Encryption at rest (LUKS / database-level)
       ├── Encryption in transit (TLS — ai deja)
       ├── Access logs persistent + tamper-evident
       ├── BAA cu fiecare vendor care atinge PHI (Stripe, Coolify, etc.)
       ├── Risk assessment annual
       ├── Workforce training
       ├── Privacy notice pentru users
       └── Breach notification process (60 zile la HHS dacă breach)
```

---

## Coolify-specific quick wins

### Setup global Coolify (one-time, 1 oră total)

| Acțiune | Effort | Impact |
|---|---|---|
| MFA pe Coolify admin (TOTP) | 5 min | Toate produsele |
| Backup schedule per DB + S3 encrypted | 30 min | Per DB |
| BetterStack Logs free tier integration | 30 min | Toate apps |
| GitHub Dependabot enable pe TOATE repos | 5 min | Toate |
| GitHub branch protection main | 5 min/repo | Per repo |
| Calendar quarterly: secret rotation + backup restore test | 5 min | Recurent |

### Setup per produs (Finpy, Nexotype, ...)

| Acțiune | Effort | Impact |
|---|---|---|
| Verify backup restore quarterly | 1 oră/trimestru | Per DB |
| Document Coolify config screenshot | 10 min | One-time + when changed |
| Rotate JWT_SECRET + DB password | 10 min/quarter | Per produs |

---

## Common vendors + SOC2 status

| Vendor | SOC2? | DPA disponibil? | Notes |
|---|---|---|---|
| **Stripe** | ✅ Type 2 | ✅ | Standard PCI + SOC2 |
| **Coolify** | ❌ (open-source, self-hosted) | N/A | Tu ești responsible pentru deployment-ul tău |
| **Hetzner Cloud** | ❌ SOC2, ✅ ISO 27001 | ✅ | ISO 27001 acceptat ca alternative de majoritatea auditorilor |
| **Brevo (email)** | ✅ Type 2 | ✅ | Standard SOC2 |
| **GitHub** | ✅ Type 2 | ✅ | Microsoft owned, full enterprise compliance |
| **Cloudflare** | ✅ Type 2 | ✅ | |
| **Anthropic** | ✅ Type 2 | ✅ | Claude API |
| **OpenAI** | ✅ Type 2 | ✅ | |
| **Vanta** | ✅ Type 2 | ✅ | Compliance platform itself |
| **BetterStack** | ✅ Type 2 | ✅ | Log streaming |

**Regula vendor management:** orice vendor cu acces la customer data → trebuie SOC2 cert SAU ISO 27001 + DPA semnat. Documentat în `compliance/vendors/`.

---

## Penetration test — what to expect

```
Freelancer security ($3-8k) sau Bugcrowd:
        │
        ├── 1 săptămână discovery (recon)
        ├── 1 săptămână testing (OWASP Top 10)
        │       ├── SQL injection
        │       ├── XSS
        │       ├── CSRF
        │       ├── Auth bypass
        │       ├── IDOR (insecure direct object reference)
        │       ├── Broken access control
        │       └── Misconfigured headers/CORS/CSP
        ├── 1 săptămână reporting
        └── Output:
            ├── Executive summary
            ├── Detailed findings (Critical/High/Medium/Low)
            ├── Remediation recommendations
            └── Re-test la 30 zile (optional, +$1-2k)
```

**Frequency:** annual mandatory pentru SOC2 Type 2. Anumiți customers enterprise cer biannual sau triannual.

---

## Quarterly review checklist

```
Q1, Q2, Q3, Q4 — fiecare trimestru:

  ┌─ Access Review
  │  ├── Cine are acces la production DB?
  │  ├── Cine are acces la Coolify admin?
  │  ├── Cine are acces la AWS/S3 backup buckets?
  │  ├── Cine are acces la GitHub repo private?
  │  └── Revocate cei care nu mai au nevoie
  │
  ├─ Backup Restore Test
  │  ├── Pick random snapshot din last 30 days
  │  ├── Restore în finpy_test DB
  │  ├── Verify row counts match
  │  ├── Run app conectată la finpy_test, smoke test
  │  └── Document în compliance/evidence/{Q}/backup_restore_test.md
  │
  ├─ Secret Rotation
  │  ├── JWT_SECRET_KEY rotate
  │  ├── DB passwords rotate (toate environments)
  │  ├── Stripe webhook secrets rotate
  │  ├── 3rd party API keys rotate (Anthropic, OpenAI, etc.)
  │  └── Document în compliance/evidence/{Q}/secret_rotation_log.md
  │
  ├─ Dependency Updates
  │  ├── Review Dependabot PRs
  │  ├── Update major versions where safe
  │  └── Test în replica înainte de production
  │
  └─ Risk Register Review
     ├── New risks since last quarter?
     ├── Old risks resolved?
     └── Mitigation plans still valid?
```

---

## Resources

```
SOC2:
├── Trust Services Criteria (AICPA official)
├── strongdm/comply         (open-source SOC2 templates)
├── jackalope/jackalope-soc2 (GitHub awesome list)
├── Vanta blog              (vendor-neutral SOC2 guides)
└── Drata academy

HIPAA:
├── HHS.gov/hipaa            (official)
├── Compliancy Group HIPAA   (BAA templates)
└── HIPAA Journal            (news + breach analysis)

GDPR:
├── GDPR.eu                  (official)
└── EDPB guidelines

Audit firms (mid-tier, accept manual evidence):
├── Sensiba San Mateo
├── Schellman               (one of largest, but expensive)
├── Risk3sixty
├── A-LIGN
└── Local CPA cu IT audit specialization (cheaper, regional)

Penetration testing:
├── Bugcrowd                 (bug bounty platform)
├── HackerOne                (similar)
├── Cobalt.io                (penetration test as service)
├── Local freelancer pe Upwork (specific OWASP experience)
└── Pentest.com              (managed)
```

---

## Mantra final

```
                ┌──────────────────────────────────┐
                │                                  │
                │   SOC2 = procese documentate     │
                │   HIPAA = lege federală          │
                │                                  │
                │   Cod-ul tău e ~70% ready        │
                │   Procesele sunt ~10% ready      │
                │                                  │
                │   Investește în procese, NU în   │
                │   refactor cod.                  │
                │                                  │
                │   Așteaptă primul customer care  │
                │   cere SOC2 înainte să cheltui   │
                │   pe audit. Marketing-able       │
                │   "SOC2 in progress" pentru      │
                │   funds mici.                    │
                │                                  │
                └──────────────────────────────────┘
```
