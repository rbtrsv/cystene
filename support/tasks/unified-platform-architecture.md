# Unified Platform Architecture: Factor Investing + PE/VC + Longevity

## Current State (January 2025)

| Module | Location | Status |
|--------|----------|--------|
| **Nexotype** (Longevity B2C) | `/server/apps/nexotype/models.py` (Domains 8–9) | ✅ Done |
| **Nexotype** (Longevity B2B) | `/server/apps/nexotype/models.py` (Domain 10) | ✅ Done |
| **Nexotype** (SurrealDB Graph) | `/server/apps/nexotype/surrealdb/` | ✅ Done |
| **FIVE** (PE/VC) | `/server/apps/assetmanager/` | ✅ Done |
| **Factor Markets** (Public Stocks) | — | 🔜 Planned |
| **Accounts** | `/server/apps/accounts/` | ✅ Done |
| **CryptoBot** | `/server/apps/cryptobot/` | ✅ Done |
| **AlgoBot** | `/server/apps/algobot/` | ✅ Done |
| **Ecommerce** | `/server/apps/ecommerce/` | ✅ Done |
| **Docker** | `/support/docker/` | ✅ Done |

---

## Strategy

**Don't build**: Aqurate (commodity SQL, no moat)
**Do build**: Factor Markets (public) → FIVE (private) → Nexotype (longevity)

**Priority**: Factor Markets first (80% done with existing yfinance scripts, fastest to revenue)

---

## Database Architecture

```
PostgreSQL (Transactional)       SurrealDB (Knowledge Graph)
├─ Multi-tenant (org_id)      ├─ Shared: Pathways, Genes, Treatments
├─ Users, billing, auth       ├─ B2C: User genetics, biomarkers
├─ Entities, deals, cap table └─ B2B: Companies, trials, patents
├─ Financials, portfolio
└─ Genetics, biomarkers
```

---

## Postgres Models

### 🆕 ADD (Factor Markets - PUBLIC STOCKS)
**factor_markets_models.py** (NEW - PRIORITY 1):
- `Stock` - symbol, exchange, sector, industry
- `Fundamentals` - quarterly/yearly financial data from yfinance
- `FactorScore` - value, momentum, quality, size, volatility scores
- `Portfolio` - user's stock holdings, position sizes
- `Trade` - buy/sell orders, execution prices

**Reuse existing scripts**:
- `fundamentals_downloader.py` - already downloads yfinance data to JSON
- `value_analysis.py` - DCF, FCFF, Greenwald EPV calculations (80% done)

### ✅ KEEP (Existing - FIVE/PE Platform)
- `entity_models.py`: Entity, Stakeholder, Syndicate
- `deal_models.py`: Deal, DealCommitment, EntityDealProfile
- `captable_models.py`: FundingRound, Security, CapTableEntry

### ⚠️ ADD (From v7capital - FIVE/PE Platform)
**portfolio_models.py** (NEW):
- `PortfolioInvestment` - fund → company links, MOIC, IRR
- `PortfolioCashFlow` - capital calls, distributions (debit/credit)
- `PortfolioPerformance` - TVPI, DPI, RVPI snapshots

**financial_models.py** (EXTEND):
- `IncomeStatement` - P&L (revenue, EBITDA, net income)
- `BalanceSheet` - assets, liabilities, equity
- `CashFlowStatement` - operating, investing, financing

### ✅ DONE (Longevity B2C — models.py Domains 8–9)
- `UserVariant` - detected genotype per user (Subject → Variant)
- `UserBiomarkerReading` - longitudinal biomarker history (Subject → Biomarker)
- `UserTreatmentLog` - intervention adherence (Subject → Asset)
- `PathwayScore` - algorithm output per pathway (Subject → Pathway)
- `Recommendation` - action plan output (UserProfile → Asset)
- `DataSource` - integration origins (Oura Ring, LabCorp)
- `GenomicFile` - uploaded genetic files (23andMe raw)
- Plus Domain 9 knowledge graph relations: DrugTargetMechanism, BioActivity, TherapeuticEfficacy, DrugInteraction, BiomarkerAssociation, GenomicAssociation, VariantPhenotype, PathwayMembership, BiologicalRelationship, Source, EvidenceAssertion, ContextAttribute

### ✅ DONE (Longevity B2B / Commercial Intelligence — models.py Domain 10)
- `MarketOrganization` - biotech market players (ISIN, ticker, exchange)
- `Patent` - IP instruments (jurisdiction, filing/expiry dates)
- `PatentClaim` - IP → asset coverage (composition, method)
- `PatentAssignee` - rights holders (co-ownership support)
- `AssetOwnership` - organization → asset ownership (originator, licensee)
- `Transaction` - M&A / licensing deals (buyer, seller, value)
- `DevelopmentPipeline` - clinical status per indication (Phase I–III, NCT ID)

---

## Shared Factor Engine

**Universal Methodology** (Factor Markets + FIVE):

```python
# Same factor logic, different asset classes

# VALUE SCORE
if asset_class == "public":
    value_score = book_value / market_cap  # P/B ratio (higher = cheaper)
elif asset_class == "private":
    value_score = arr / valuation  # ARR multiple (higher = cheaper)

# MOMENTUM SCORE
if asset_class == "public":
    momentum_score = (price_12m_ago - price_today) / price_12m_ago
elif asset_class == "private":
    momentum_score = (revenue_growth_rate + user_growth_rate) / 2

# QUALITY SCORE
if asset_class == "public":
    quality_score = (gross_margin + operating_margin + roe) / 3
elif asset_class == "private":
    quality_score = (gross_margin + revenue_retention + unit_economics) / 3

# SIZE SCORE
if asset_class == "public":
    size_score = log(market_cap)  # Smaller = higher score
elif asset_class == "private":
    size_score = log(valuation)  # Earlier stage = higher score

# VOLATILITY SCORE
if asset_class == "public":
    volatility_score = 1 / std_dev(daily_returns)  # Lower vol = higher score
elif asset_class == "private":
    volatility_score = revenue_stability + customer_concentration
```

**Composite Score**: `(Value × 0.3) + (Momentum × 0.2) + (Quality × 0.3) + (Size × 0.1) + (Volatility × 0.1)`

---

## SurrealDB Graph Schema

### SHARED CORE (No org_id)
```sql
-- Nodes
CREATE pathway SET name = 'mTOR Signaling', tier = 'S';
CREATE gene SET symbol = 'FOXO3', chr = '6';
CREATE treatment SET name = 'NMN', dosage = '500mg';
CREATE biomarker SET name = 'NAD+/NADH', unit = 'ratio';
CREATE source SET pubmed_id = 'PMID:345678';

-- Relationships (RELATE syntax)
RELATE gene:FOXO3 -> part_of -> pathway:mTOR_Signaling;
RELATE treatment:NMN -> enhances -> pathway:NAD_Metabolism;
RELATE biomarker:NAD_NADH -> indicates -> pathway:NAD_Metabolism;
```

### B2C LONGEVITY (org_id property)
```sql
-- Nodes
CREATE subject SET id = $user_id, org_id = $org_id;
CREATE user_variant SET rsid = 'rs429358', genotype = 'CT', org_id = $org_id;

-- Relationships
RELATE subject:user_1 -> has_variant -> user_variant:uv_1;
RELATE user_variant:uv_1 -> maps_to -> variant:rs429358;

-- Query: Personalized recommendations
SELECT ->has_variant->user_variant->maps_to->variant<-in<-gene->part_of->pathway.*
FROM subject:{$user_id}
WHERE pathway.longevity_tier = 'S';
```

### B2B INVESTMENT (org_id property)
```sql
-- Nodes
CREATE market_organization SET name = 'ChromaDex', org_id = $org_id;
CREATE technology SET mechanism = 'NAD+ precursor', clinical_stage = 'Phase III', org_id = $org_id;
CREATE patent SET number = 'US11234567', expiry_date = '2035-01-01';

-- Relationships
RELATE market_organization:chromadex -> develops -> technology:nad_precursor;
RELATE technology:nad_precursor -> targets -> pathway:NAD_Metabolism;
RELATE market_organization:chromadex -> owns -> patent:US11234567;

-- Query: NAD+ companies with strong IP
SELECT * FROM market_organization
WHERE ->develops->technology->targets->pathway.name = 'NAD+ Metabolism'
AND ->owns->patent.expiry_date > '2030-01-01';
```

### GRAPH TRAVERSAL PATTERNS (tested in mock_sync_test.py)
```sql
-- Pattern: RELATE source_table:uid -> edge_table -> target_table:uid
RELATE gene:001 -> encodes -> protein:101;
RELATE gene:001 -> associated_with -> disease:201 CONTENT {
    association_type: 'causative',
    odds_ratio: 10.5
};
RELATE treatment:301 -> treats -> disease:201 CONTENT {
    mechanism_type: 'p53_activation',
    efficacy_score: 0.7
};

-- Multi-hop traversal: gene -> disease <- treatment
SELECT ->associated_with->disease<-treats<-treatment.name FROM gene:001;
```

---

## Revenue Model

| Product | Customer | Use Case | Revenue | Priority |
|---------|----------|----------|---------|----------|
| **Factor Markets** | Quant traders, RIAs | Public stock factor strategies | $99-499/mo per user | 🔥 Phase 0 |
| **FIVE** | PE/VC funds | Factor-based PE portfolio mgmt | $3-5k/mo per fund | Phase 1 |
| **Nexotype Health** | Consumers, clinics | B2C genetics & longevity | $99-199/mo per user | Phase 2 |
| **Nexotype Intelligence** | Longevity VCs | B2B pathway investment analysis | +$1k/mo (requires FIVE) | Phase 3 |

---

## Implementation Phases

### Phase 0: Factor Markets MVP (1-2 months) - **START HERE**
- 🆕 Add Stock, Fundamentals, FactorScore models
- ⚠️ Integrate existing `fundamentals_downloader.py` (yfinance → Postgres)
- ⚠️ Integrate existing `value_analysis.py` (DCF, FCFF, Greenwald)
- 🆕 Add Momentum, Quality, Size, Volatility calculations
- 🆕 Build composite factor score ranking
- 🆕 Portfolio construction (top 20-50 stocks)
- 🆕 Subscription billing ($99-499/mo tiers)
- **Outcome**: Factor Markets launch → $10k MRR (100 users × $99)
- **Why first**: 80% done, fastest to revenue, builds credibility

**Greenblatt Magic Formula**: Use for screening only (Earnings Yield + ROCE). Your DCF/FCFF/Greenwald already more sophisticated for valuation.

### Phase 1: Complete FIVE Platform (2-3 months)
- ✅ Keep existing models (Entity, Deal, CapTable already superior to v7capital)
- ⚠️ Add PortfolioInvestment, PortfolioCashFlow, PortfolioPerformance
- ⚠️ Add IncomeStatement, BalanceSheet, CashFlowStatement
- 🆕 Apply Factor Engine to PE/VC (value = valuation/ARR, momentum = growth rate)
- **Outcome**: Full PE/VC platform with quant factor scoring
- **Revenue**: $3-5k/mo per fund

### Phase 2: Add Nexotype Health (3 months)
- ✅ Longevity B2C models done (Domain 8: UserVariant, UserBiomarkerReading, PathwayScore, Recommendation, etc.)
- ✅ Knowledge graph relation models done (Domain 9: DrugTargetMechanism, BioActivity, TherapeuticEfficacy, etc.)
- ✅ SurrealDB sync service done (`/server/apps/nexotype/surrealdb/`)
- 🆕 Seed SurrealDB shared knowledge graph (Pathways, Genes, Treatments)
- 🆕 Genetics upload + variant annotation pipeline
- 🆕 Recommendation engine (SurrealQL graph queries)
- 🆕 Build out API endpoints and frontend dashboard
- **Outcome**: B2C longevity SaaS
- **Revenue**: $99-199/mo × 1k users = $1.2M ARR

### Phase 3: Add Nexotype Intelligence (3 months)
- ✅ Commercial Intelligence models done (Domain 10: MarketOrganization, Patent, DevelopmentPipeline, etc.)
- 🆕 Seed SurrealDB with Company, Technology, ClinicalTrial graph nodes
- 🆕 Investment diligence queries (SurrealQL pathway analysis)
- 🆕 Deal flow pipeline integration
- 🆕 Build out API endpoints and frontend
- **Outcome**: B2B add-on for FIVE customers investing in longevity
- **Revenue**: +$1k/mo per fund (requires FIVE subscription)

### Phase 4: Launch Fund (12+ months)
- Use Factor Markets track record + Nexotype data as edge
- Raise $10-50M longevity fund
- Deploy with quantitative + biological advantage
- **Outcome**: Management fees (2% AUM) + carry (20%)

---

## Competitive Advantage

**Factor Markets**:
- **vs QuantConnect/Alpaca**: We integrate with FIVE (private markets), not just public
- **vs AQR/BlackRock**: We're accessible ($99/mo vs millions AUM minimum)
- **Moat**: Unified factor methodology across public + private markets

**FIVE**:
- **vs Carta**: We add quantitative factor scoring, not just cap table management
- **vs Preqin**: We provide deal scoring, not just market data
- **Moat**: Only PE platform with quant factor-based portfolio construction

**Nexotype**:
- **vs InsideTracker/Function**: We have investment intelligence on same pathways
- **vs Bio VCs**: We have consumer genetics data + quant diligence tools
- **Moat**: Only platform with BOTH consumer genetics data AND investment intelligence on same longevity pathways

---

## Key Metrics

**Factor Markets (Phase 0 - Months 1-4)**:
- Month 2: Launch at $99/mo
- Month 4: 100 users = $10k MRR = $120k ARR
- Month 6: 200 users = $20k MRR = $240k ARR
- **Use revenue to fund FIVE development**

**FIVE (Phase 1 - Months 5-8)**:
- 5 PE/VC funds @ $3k/mo = $15k MRR = $180k ARR
- 10 funds @ $3k/mo = $30k MRR = $360k ARR

**Nexotype Health (Phase 2 - Months 9-12)**:
- 100 users @ $99/mo = $10k MRR (Month 12)
- 1,000 users = $100k MRR = $1.2M ARR (Year 2)

**Nexotype Intelligence (Phase 3 - Year 2)**:
- 3 longevity VCs @ $1k/mo add-on = $3k MRR = $36k ARR

**Total Year 1**: $240k (Factor Markets) + $180k (FIVE) = $420k ARR
**Total Year 2**: $420k + $1.2M (Nexotype Health) + $36k (Intelligence) = $1.66M ARR

---

## Why This Works

**Unified factor methodology**:
- Same factors (Value, Momentum, Quality, Size, Volatility)
- Applied to public stocks (Factor Markets) AND private PE/VC (FIVE)
- Cross-asset class diversification with consistent quant framework

**Progressive revenue**:
- Factor Markets → fast launch, proves track record
- Track record → credibility for FIVE sales (enterprise)
- FIVE revenue → funds Nexotype development
- Nexotype data → edge for your own fund

**Same pathways, different queries** (Nexotype):
- Consumer: "What should I take?" → Treatment recommendations
- Investor: "What should I fund?" → Company/technology opportunities

**Data flywheel**:
- B2C users → validate pathway importance → inform investment thesis
- B2B investments → access to clinical data → improve B2C recommendations
- Each side makes the other better

**Unique positioning**:
- Traditional quants: Only public markets → You: Public + Private
- Bio VCs: Strong on science, weak on quant → You: Quant + Bio
- PE platforms: Operational tools → You: Quant factor scoring
- Consumer genomics: Static reports → You: Investment intelligence on same pathways
