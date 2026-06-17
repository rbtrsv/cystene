# Plugins / Skills / MCP — Quick Reference

Cele instalate, ordonate după ce folosim real în Nexotype. Notă: pentru Codex nu folosim `/codex:*` slash-commands, folosim MCP direct (`mcp__codex__codex`).

**Cum se folosesc:**
- `M` — tu scrii `/<command>` în chat
- `A` — Claude le invocă singur când matchează descrierea
- `MCP` — Claude le apelează direct ca tool calls (nu vezi `/`), tu le descrii ce vrei

---

## Tier 1 — Daily drivers (deja folosite în sesiunea curentă)

### MCP — Codex second-opinion

| Tool | Folosit pentru |
|---|---|
| `mcp__codex__codex` | Nou fir Codex cu prompt initial. Sesiunea curentă: am cerut review pe Issue 1/2/3 (race condition, hasResolved gate, latestFetchId) și verdict Spec-Kit. Returnează `threadId`. |
| `mcp__codex__codex-reply` | Continuă firul cu același `threadId`. Folosit pentru follow-up când Codex cere context suplimentar. |

**Când:** vreau second opinion înainte de commit, dispută arhitecturală, validare bug subtil. NU pentru chestii rutiniere — vezi `feedback_codex_usage_frequency.md`.

### MCP — Browser

| Tool | Folosit pentru |
|---|---|
| `mcp__playwright__browser_navigate` + `_snapshot` + `_network_requests` + `_console_messages` + `_wait_for` + `_click` | Headless browser testing. Sesiunea curentă: verificat că `/reports` face 2 req-uri (vs 61), `/genes/1` face 1 fetch (vs 6 retry loop), `/genes/9/details` cache hit. Văd request count + errors + DOM snapshot. |
| `mcp__claude-in-chrome__*` | Talks la extensia Claude din Brave (tu ai Brave, nu Chrome). Diferență vs playwright: vede tab-urile tale active, nu pornește browser nou. Util când vrei să verific ceva pe sesiunea ta logată fără să restart playwright. |

**Când playwright:** test E2E reproducibil, ai nevoie de browser curat headless, vrei să vezi network requests precise.
**Când claude-in-chrome:** vrei să verific ce e pe tab-ul tău acum, ai sesiunea logată deja, eviti re-auth.

### Auto-trigger Skill

| Skill | Folosit pentru |
|---|---|
| `frontend-design:frontend-design` | Auto-activează la "build component", "redesign this UI", "design landing page". Forțează direcție estetică deliberată (editorial / brutalist / glass-morphism) în loc de gradient-AI generic Tailwind. Recomandat: descrie tu direcția înainte, ca să nu aleagă pe nimereala. |

---

## Tier 2 — Pe situație

### MCP — Nexotype knowledge graph

| Tool | Folosit pentru |
|---|---|
| `mcp__nexotype__search_entities` | Caut entități după tip (gene, protein, market_organization, etc.). Filtre + paginare. |
| `mcp__nexotype__get_entity` | Detalii complete pentru o entitate (după `entity_type` + `id`). |
| `mcp__nexotype__explore_network` / `find_path` / `find_similar` | Traverse grafu — vecini, drumuri, entități similare. |
| `mcp__nexotype__company_deep_dive` / `drug_discovery` / `competitive_landscape` | Workflow-uri compuse (un company → portofoliu complet, un drug → targets+pathways+indicații). |
| `mcp__nexotype__ask_knowledge_graph` | AI agent care decide singur ce query-uri să facă pe graf pentru a răspunde unei întrebări în limbaj natural. |
| `mcp__nexotype__set_subject` + `list_user_variants` / `list_treatment_logs` / etc. | Personal health domain (necesită subject id setat). |
| `mcp__nexotype-remote__*` | Aceleași tool-uri prin server remote (mcp.nexotype.com cu OAuth). |

**Când:** verificare rapidă "există company X în KG?", "ce drug-uri sunt pe target Y?", "ce pathway-uri sunt în pipeline Z?".

### MCP — Database & IDE

| Tool | Folosit pentru |
|---|---|
| `mcp__postgres__query` | Query SQL direct pe Postgres-ul nostru (cite-only sau write). Util pentru verificare date din afara backend FastAPI. |
| `mcp__ide__getDiagnostics` | Citește erorile TS/ESLint din VS Code în timp real. |
| `mcp__ide__executeCode` | Rulează cod în kernel-ul Jupyter dacă-l deschidem (n-am folosit încă). |

### MCP — Research & PubMed

| Tool | Folosit pentru |
|---|---|
| `mcp__plugin_bio-research_pubmed__search_articles` / `get_article_metadata` / `get_full_text_article` | Caut articole, iau abstract / full text, related articles. Util pentru ingestion enrichment. |
| `mcp__plugin_bio-research_pubmed__lookup_article_by_citation` | Convertesc citation → PMID. |

### Skills user-invocable

| Cmd | Mod | Ce face |
|---|---|---|
| `/feature-dev <descriere>` | M | Workflow în 7 faze pentru feature nou (>1 fișier): code-explorer → code-architect → implementation → code-reviewer. Pentru edit simplu = overkill. |
| `/review` | M | Review pull request (citește diff + dă feedback). |
| `/security-review` | M | Audit security pe pending changes (branch curent). |
| `/init` | M | Generează CLAUDE.md pentru codebase. Doar la început de proiect. |
| `/find-skills <query>` | M+A | Caută skills noi în ecosistemul deschis (skills.sh). |
| `/less-permission-prompts` | M | Scanează transcripts și auto-allowlist comenzi Bash + MCP read-only frecvente. |
| `simplify` | A | Review pe cod schimbat pentru reuse / DRY / efficiency, apoi fix. |
| `claude-api` | A | Auto la cod care importă `anthropic` SDK. Adaugă prompt caching, migrare model versions. |

---

## Tier 3 — Domeniu (folosește doar dacă tema se aliniază)

### Bio-research (relevant pentru Nexotype biomed angle, dar nu folosit încă)

| Skill | Mod | Util pentru |
|---|---|---|
| `bio-research:start` | M | Setup environment + descoperă tool-uri bio. |
| `bio-research:single-cell-rna-qc` | A | QC pe single-cell RNA-seq (.h5ad/.h5) cu MAD filtering — scverse best practices. |
| `bio-research:scvi-tools` | A | scVI/scANVI/totalVI/PeakVI — deep learning single-cell (batch correction, multi-modal). |
| `bio-research:nextflow-development` | A | nf-core pipelines (rnaseq, sarek, atacseq) pe FASTQ / GEO / SRA. |
| `bio-research:instrument-data-to-allotrope` | A | Convertește output lab (PDF/CSV/Excel) → ASM JSON pentru LIMS. |
| `bio-research:scientific-problem-selection` | A | Evaluare proiecte de research / decizii strategice. |

### Design (dacă faci UI/UX dedicat — auzi cu auto-trigger)

| Skill | Util pentru |
|---|---|
| `design:design-critique` | Review pe design (usability, hierarchy). |
| `design:design-handoff` | Specs pentru developeri din design. |
| `design:accessibility-review` | WCAG 2.1 AA audit. |
| `design:user-research` | Planning interview / surveys. |
| `design:design-system-management` | Design tokens, component library. |
| `design:ux-writing` | Microcopy, errors, empty states, CTAs. |

### Productivity

| Skill | Util pentru |
|---|---|
| `productivity:start` / `update` | Inițializează + sync sistem productivitate. |
| `productivity:task-management` | TASKS.md partajat pentru commitments. (Avem deja `support/to-do/0_order.md` deci probabil redundant.) |
| `productivity:memory-management` | Two-tier memory (CLAUDE.md + memory/). (Avem deja sistem propriu.) |

### Finance (irelevant pentru Nexotype, dar instalate)

`finance:journal-entry-prep`, `finance:reconciliation`, `finance:financial-statements`, `finance:variance-analysis`, `finance:audit-support`, `finance:close-management` — accounting/SOX work. Aplicabil în Finpy/V7, nu Nexotype.

### Utility

| Skill | Util pentru |
|---|---|
| `update-config` | Editare programatică `.claude/settings.json` (permissions, env vars, hooks). |
| `keybindings-help` | Shortcuts în `~/.claude/keybindings.json`. |
| `/loop <interval> <prompt>` | Task recurent (ex: `/loop 5m check deploy`). |
| `/schedule` | Cron-style remote agents. |

---

## MCP servers externi (necesită OAuth în chat)

`mcp__claude_ai_Finpy__*`, `mcp__claude_ai_V7__*` — asset manager apps separate, login prin CLI.

`Gmail`, `Google_Calendar`, `Google_Drive`, `Notion`, `Figma`, `Supabase`, `BigQuery`, `ms365`, `slack`, `biorender`, `owkin`, `synapse`, `wiley` — toate au `__authenticate` + `__complete_authentication`. Nu le-am folosit încă în această sesiune.

---

## Recomandări concrete pentru fluxul tău

1. **Înainte de commit important:** roagă-mă "second opinion pe diff cu MCP Codex" → `mcp__codex__codex` cu prompt-ul de reviewer din `support/prompts/ai-reviewer-prompt.md`.

2. **Verificare bug fix sau perf improvement:** roagă-mă "verifică cu Playwright pe /<page>" → eu navighez + iau network/console + raportez.

3. **Feature nou care atinge >1 fișier:** `/feature-dev <descrierea feature-ului>`. Pentru edit punctual e overkill.

4. **UI nou:** descrie tu direcția (ex: "minimalist editorial, sans-serif heavy, fără gradient") apoi cere componenta — `frontend-design` se auto-activează și aplică consistent.

5. **Bug greu pe care nu-l înțelegi în 5 min:** roagă-mă să rulez `mcp__codex__codex` cu repro steps — Codex face investigație în paralel.

6. **Periodic:** `/less-permission-prompts` să reducem accept-urile manuale.

---

## Plugin-uri marketplace neinstalate, candidați buni

| Plugin | Sursă | Util pentru |
|---|---|---|
| `code-review` (Anthropic official) | `anthropics/claude-code` | 5 agenți Sonnet paraleli pe PR — bug detection, CLAUDE.md compliance, historical context. Mai puternic decât `/review`. |
| `ralph-loop` (Anthropic official) | `anthropics/claude-code` | Autonomous iteration — Claude rezolvă același task până e gata. Util pentru migrări mecanice mari. |
| `figma` (extern oficial) | Figma | Citește mockups Figma și generează cod respectând layout-ul. Util dacă primești designs Figma. |

Install: `/plugin marketplace add anthropics/claude-code` + `/plugin install <name>`.
