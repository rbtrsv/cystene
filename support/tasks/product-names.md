# Product Naming Structure

## Brand Architecture

```
Finpy (Parent Company - Quantitative Investing Platform)

├─ Factor Markets (Public equities, ETFs, futures)
├─ FIVE (Private equity/VC - Factor Investing Venture Equity)
└─ Nexotype (Longevity intelligence)
   ├─ Intelligence (B2B investment analysis)
   └─ Health (B2C genetics)
```

---

## Product Definitions

### **Finpy Factor Markets**
**What:** Systematic factor strategies for public markets
**Methodology:** Multi-factor models (Value, Momentum, Quality, Size, Low Volatility)
**Target:** Quant traders, RIAs, hedge funds
**Revenue:** $500-2,000/mo

**Tagline:** *Systematic alpha in public markets*

---

### **Finpy FIVE**
**Name Meaning:** **F**actor **I**nvesting **V**enture **E**quity
**What:** Factor-based portfolio management for PE/VC
**Methodology:** Same factors as public markets, applied to private companies
**Target:** PE/VC funds applying quantitative methods
**Revenue:** $3,000-5,000/mo base

**Core Features:**
- Factor-based deal scoring (Value, Momentum, Quality)
- Portfolio construction & optimization
- Cap table management
- LP reporting (TVPI, DPI, RVPI, IRR)
- Financial statements (P&L, balance sheet, cash flow)
- Entity management (funds, companies, stakeholders)

**Tagline:** *Factor discipline for private equity*

---

### **Nexotype Intelligence**
**What:** Longevity-specific investment analysis (add-on for FIVE)
**Methodology:** Pathway analysis, clinical trial tracking, IP validation
**Target:** Biotech/longevity VCs using FIVE
**Revenue:** +$1,000/mo (requires FIVE subscription)

**Core Features:**
- Technology pathway mapping (mTOR, AMPK, NAD+, etc.)
- Clinical trial status tracking (NCT IDs, phases, endpoints)
- Intellectual property analysis (patent coverage, expiry)
- Scientific publication validation (PubMed, citations)
- Founder track record analysis
- Competitive landscape mapping

**Tagline:** *Longevity investment edge*

**Neo4j Queries:**
```cypher
// Find NAD+ companies with strong IP
(:Company)-[:DEVELOPS]->(:Technology)-[:TARGETS]->(:Pathway {name: 'NAD+'})
(:Company)-[:OWNS]->(:Patent {expiry > '2030'})

// Identify under-invested pathways
(:Pathway)<-[:VALIDATED_BY]-(:Publication {citations > 100})
WHERE few companies targeting pathway
```

---

### **Nexotype Health**
**What:** Consumer genetics & longevity platform (standalone B2C)
**Methodology:** Genetic variant analysis → personalized pathway recommendations
**Target:** Biohackers, longevity enthusiasts, longevity clinics
**Revenue:** $99-199/mo per user

**Core Features:**
- Genetics upload (23andMe, WGS, VCF files)
- Variant annotation & pathway impact scoring
- Personalized treatment recommendations (NMN, Metformin, etc.)
- Biomarker tracking over time (NAD+, HbA1c, hs-CRP)
- Treatment protocol adherence monitoring
- Tier S/A/B/C pathway scoring

**Tagline:** *Your genomic longevity roadmap*

**Neo4j Queries:**
```cypher
// Personalized recommendations
(:User)-[:HAS_VARIANT]->(v:Variant)-[:IN]->(:Gene)-[:PART_OF]->(:Pathway {tier: 'S'})
(:Treatment)-[:ENHANCES]->(:Pathway)
WHERE v.impact = 'negative'
RETURN personalized treatments
```

---

## Shared Technology

### **Factor Engine** (Factor Markets + FIVE)
```python
Shared scoring methodology:
├─ Value score (P/B for stocks, Valuation/ARR for PE)
├─ Momentum score (12m return for stocks, growth rate for PE)
├─ Quality score (margins, profitability, governance)
├─ Size score (market cap for stocks, company stage for PE)
└─ Volatility score (price volatility for stocks, revenue stability for PE)
```

### **Longevity Knowledge Graph** (Nexotype Intelligence + Health)
```cypher
Shared Neo4j nodes:
├─ Pathway (mTOR, AMPK, Sirtuins, NAD+)
├─ Gene (FOXO3, MTOR, SIRT1, NMNAT1)
├─ Treatment (NMN, Metformin, Rapamycin)
├─ Biomarker (NAD+/NADH, HbA1c, hs-CRP)
└─ Publication (PubMed papers, citations)

B2C: (:User)-[:HAS_VARIANT]->(:Gene)-[:PART_OF]->(:Pathway)
B2B: (:Company)-[:DEVELOPS]->(:Technology)-[:TARGETS]->(:Pathway)
```

---

## Customer Segmentation

### **Traditional Quant Trader**
Buys: **Factor Markets** only
Use case: Systematic stock/ETF strategies

### **Quantitative PE Fund**
Buys: **FIVE** only
Use case: Factor-based private market investing (any sector)

### **Longevity VC Fund**
Buys: **FIVE** + **Nexotype Intelligence**
Use case: PE management + longevity-specific deal analysis

### **Longevity Clinic**
Buys: **Nexotype Health** only
Use case: Patient genetics, biomarker tracking

### **Your Own Fund**
Uses: **FIVE** + **Nexotype Intelligence** + **Nexotype Health**
Edge: Consumer genetics data informs B2B investment thesis

---

## Pricing Summary

| Product | Price | Market | Requires |
|---------|-------|--------|----------|
| **Factor Markets** | $500-2k/mo | Public markets | Standalone |
| **FIVE** | $3-5k/mo | PE/VC (any sector) | Standalone |
| **Nexotype Intelligence** | +$1k/mo | Longevity biotech | FIVE subscription |
| **Nexotype Health** | $99-199/mo | Consumers/clinics | Standalone |

---

## Competitive Positioning

### **Factor Markets**
Competes with: QuantConnect, Alpaca, AQR
Differentiation: Unified platform with private markets (FIVE)

### **FIVE**
Competes with: Carta, Preqin, Chronograph
Differentiation: Factor-based quant approach to PE (competitors are operational tools, not quant)

### **Nexotype Intelligence**
Competes with: None (unique)
Differentiation: Only platform mapping longevity pathways to investment opportunities

### **Nexotype Health**
Competes with: InsideTracker, Function Health
Differentiation: Graph-based pathway discovery vs static reports

---

## Cross-Sell Strategy

```
Entry → Upsell
─────────────────────────────────────────────────
Factor Markets → FIVE (expand to private markets)
FIVE → Nexotype Intelligence (investing in longevity? add pathway analysis)
Nexotype Health → none (different customer base, no upsell path)
```

---

## Brand Identity

### **Finpy**
**Personality:** Quantitative, systematic, data-driven
**Colors:** Blue (trust), green (growth), black (sophistication)
**Tone:** Analytical, precise, institutional

### **Nexotype**
**Personality:** Scientific, forward-looking, personalized
**Colors:** Purple (innovation), cyan (biotech), white (clinical)
**Tone:** Accessible science, human longevity, evidence-based

---

## Tagline Summary

**Company:**
*Finpy: Quantitative investing across all asset classes*

**Products:**
- *Factor Markets: Systematic alpha in public markets*
- *FIVE: Factor discipline for private equity*
- *Nexotype Intelligence: Longevity investment edge*
- *Nexotype Health: Your genomic longevity roadmap*

---

## Key Insight

**Factor investing** = universal methodology (value, momentum, quality, size, volatility)

**Applied to:**
- Public markets (stocks) = **Factor Markets**
- Private markets (PE/VC) = **FIVE**

**Specialized vertical:**
- Longevity biotech = **Nexotype** (adds pathway analysis on top of factors)

**One platform, multiple asset classes, unified quantitative framework.**
