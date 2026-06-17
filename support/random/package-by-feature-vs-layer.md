# Numele arhitecturii la nivel de folder — comparatie

Doua moduri de a organiza un codebase la nivel de folder. Restul proiectului tau (`server/apps/`, `client/src/modules/`) foloseste primul. Folder-ul `ingestion/` foloseste al doilea (anti-pattern la scala).

---

## 1. Package by Feature + Layered Inside ✅ (ce ai tu)

Top-level = vertical (per domeniu/feature). Inside = horizontal (per layer tehnic).

### Exemplu — `server/apps/<app>/`

```
server/apps/
├── nexotype/                    # feature/domeniu
│   ├── models/                  # layer
│   ├── schemas/                 # layer
│   ├── services/                # layer
│   ├── subrouters/              # layer
│   └── utils/                   # layer
├── accounts/                    # feature/domeniu
│   ├── models/
│   ├── schemas/
│   └── services/
└── billing/                     # feature/domeniu
    └── ...
```

### Exemplu — `client/src/modules/<x>/`

```
client/src/modules/
├── nexotype/                    # feature
│   ├── components/              # layer
│   ├── hooks/                   # layer
│   ├── providers/               # layer
│   ├── schemas/                 # layer
│   ├── service/                 # layer
│   ├── store/                   # layer
│   └── utils/                   # layer
└── assetmanager/
    └── ...
```

### Alte nume industry-standard pentru acelasi pattern

- **Modular Monolith** (la nivel arhitectural global — fiecare app = modul)
- **Domain-Module Layered Architecture**
- **Bounded Context with Layered Internals** (terminologie DDD)
- **Feature-Sliced Design (FSD)** (termen frontend, vezi feature-sliced.design)
- **Django App pattern** (in lumea Python — fiecare `app/` = bounded context)
- **"Feature folders"** (termen scurt, conversational)

### Avantaje

- **Cohesion:** tot ce tine de un domeniu intr-un singur loc.
- **Discoverability:** un dev nou vede modulele si stie ce face fiecare.
- **Independenta:** poti activa/dezactiva un modul fara sa atingi restul.
- **Scalabilitate:** functioneaza la 10, 50, 200 de domenii.

---

## 2. Package by Layer (Horizontal / Tiered) ❌ (ce e ingestion/ acum)

Top-level = layer-uri tehnice. Inside = totul amestecat (sau plat).

### Exemplu — `ingestion/` actual

```
ingestion/
├── config.py                    # layer: configuratie (toate entitatile)
├── sources/                     # layer: API fetchers (toate entitatile)
│   ├── ensembl.py
│   ├── uniprot.py
│   ├── clinvar.py
│   ├── chembl.py
│   ├── drugbank.py
│   └── ...
├── fixtures/                    # layer: seed JSON (toate entitatile)
│   ├── peptides.json
│   ├── companies.json
│   └── indications.json
├── seed.py                      # layer: bootstrap
├── deep_dive.py                 # layer: enrichment
└── run.py                       # layer: entry point
```

### Alte nume pentru acelasi pattern

- **Package by Layer**
- **Horizontal slicing**
- **Tiered / N-tier organization**
- **Layered architecture** (la nivel de folder, nu de cod)

### Probleme

- **Pierzi cohesion-ul:** ce tine de `gene` e in 5 foldere diferite.
- **Cross-cutting changes:** o modificare la `gene` te trimite in `config.py`, `sources/ensembl.py`, `fixtures/`, `seed.py`.
- **Scaleaza prost:** pana la 5 entitati merge, peste devine haos.
- **Discoverability slaba:** un dev nou nu vede ce entitati ingereaza app-ul fara sa citeasca fiecare fisier.

---

## Verdict

| Criteriu | Package by Feature | Package by Layer |
|----------|-------------------|------------------|
| Cohesion | High | Low |
| Discoverability | High | Low |
| Scalabilitate | Buna (10-200 domenii) | Buna doar pana la ~5 entitati |
| Modificare per-domeniu | Un singur folder | Cross-cutting (3-5 foldere) |
| Folosit in proiectul tau | `apps/`, `modules/` ✅ | `ingestion/` (de migrat) ❌ |

## Formula scurta pentru CV / interviuri

Daca cineva te intreaba "cum e organizat codebase-ul?", raspunsul corect e:

> "Modular monolith, package-by-feature top-level cu layered internals."
