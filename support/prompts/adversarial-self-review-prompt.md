# Adversarial Self-Review Prompt

Use at the end of any session — or before declaring work "done" — to find
bugs, edge cases, and bad practices you missed during implementation.

Treat your own recent work as if it were code you've never seen, written by
someone you don't trust. The goal isn't to feel good about what you shipped;
it's to surface what would embarrass you in a real code review.

---

## Prompt template

```
ROLE: Senior code reviewer with adversarial mindset. Treat your own recent
work as code you've never seen, written by someone you don't trust. Find
every bug, edge case, security hole, race condition, and bad practice you
missed during implementation. Be brutal. Don't pad. Don't defend.

CONTEXT: <one-paragraph plain-English summary of the session goal>.

WORKSTREAMS (enumerate every file you modified and what you changed):
  Backend
  - <path:line range> — <what changed and why>
  - ...

  Frontend
  - <path:line range> — <what changed and why>
  - ...

  External (DB, third-party APIs, dashboards)
  - <change> — <impact>

  Reverted mid-session (NOT in current code — list for completeness)
  - <what>
  - ...

REVIEW DIMENSIONS — for each, name file:line and the concrete issue:

  1. CORRECTNESS / LOGIC BUGS
     - Race conditions, TOCTOU, concurrent mutation paths.
     - Edge cases at boundaries: empty collections, None/null, off-by-one,
       overflow, max/min sentinels.
     - State machine completeness — every status/event/branch accounted for?
     - Order of operations: sync vs async, await placement, transaction
       boundaries.
     - Return-value contracts: caller honors signature changes?
     - Idempotency — does the operation produce the same result if replayed?

  2. SECURITY
     - Authentication / signature verification still in place after refactor.
     - Authorization — does every code path check the user can do this?
     - SQL injection, ORM safety (parameterized queries, no f-strings).
     - Trusted vs untrusted input — user-supplied data through validation?
     - Cross-tenant / cross-org leaks — data of org A surfaced in org B view?
     - Secrets handling — never logged, never returned in error messages.

  3. UX / DATA INTEGRITY
     - Loading races — UI decides before data arrives, hits wrong code path.
     - Stale form fields after dependent state changes.
     - Inconsistent state shown to user (banner says X, button says Y).
     - Foreign-key staleness after parent change.
     - Empty / fallback states — `undefined` or `[object Object]` in UI?
     - Sentinel values displayed raw (NaN, Infinity, very large/small).
     - Currency / unit / locale assumptions (only EUR/USD, only en-US dates).

  4. CODE QUALITY / PATTERN ADHERENCE
     - Naming consistency across stack (snake_case backend ↔ frontend).
     - Architecture layer respected (utils vs schemas vs subrouters)?
     - Magic strings/numbers that should be named constants.
     - Duplicate logic that should call a shared helper.
     - Comments preserved + new ones explain WHY (not WHAT).
     - In-code restrictions from project guidelines obeyed (em-dash in UI,
       hardcoded paths, etc.).

  5. TEST COVERAGE GAPS
     - List what your tests cover. Then list what they DON'T cover that
       reasonable users will hit:
       - Happy path / sad path / error path / replay / race / boundary.
     - Tests for code you DIDN'T write but that wraps your code (callers).

  6. ARCHITECTURE FIT
     - Built anything that duplicates an existing utility?
     - Added a new abstraction layer not present elsewhere in the codebase?
     - Tests in correct location per project convention?
     - Migrations / config files match project naming rules?

  7. DEPLOYABILITY
     - Migrations / DB changes applied to PROD — rollback path documented?
     - Dependencies added in correct group (dev vs runtime)?
     - Env vars / secrets needed by new code documented?
     - Touched code paths that affect other apps / services in the monorepo?

  8. THINGS YOU DIDN'T LOOK AT BUT SHOULD
     - Adjacent code paths that share the same bug class you fixed.
     - Reverse operations (you fixed create — what about update/delete?).
     - Other consumers of a function/endpoint whose contract you changed.
     - Production-only systems your tests don't exercise.

  9. UX COMPLETENESS / ORPHANED FLOWS (review as a hostile first-time user)
     Core question — for EVERY feature, option, enum value, button, and route that
     exists: "Can a real user complete this start-to-end with no prior knowledge,
     and does every choice they can make have a working path behind it?"
     - ORPHANED OPTIONS — an option you can pick but cannot use. For every enum
       value / checkbox / dropdown option, find the REQUIRED input it needs and
       confirm the UI lets the user provide it. Canonical bug: `mobile_scan` is a
       selectable scan type but there is NO APK upload UI — the user picks it and
       asks "where do I upload?!". If selecting X needs a file/URL/credential/consent
       and there's no field for it → CRITICAL.
     - RAW IDs — any `*_id` shown as a number `<Input>` ("1") instead of a
       pick-by-name entity selector. Users don't know IDs.
     - FREE TEXT WHERE STRUCTURED — comma-separated strings / JSON blobs / free text
       where the value is a fixed set (user forced to memorize valid values).
     - UNEXPLAINED UI — an option whose meaning the user can't know (no description,
       not self-evident). "Does the user know what this does?"
     - MISSING STATES — loading, empty ("no X yet — create one"), error, submitting.
       A blank screen or silent failure is a finding.
     - DEAD ENDS — links to unbuilt routes, buttons that go nowhere, "select a
       target" with no targets and no create link, create-flows that silently
       require prior setup.
     - COLD START — brand-new user, empty everything: can they reach a first
       successful scan, then a report? Walk it and name every wall they hit.
     - LEAKING CONCEPTS — plumbing shown to a solo user that should be hidden (org
       switcher / org nav when the workspace is auto-created and meant to be invisible).
     - FAKED / HARDCODED DATA shown as real (plan prices/features must come from
       Stripe; descriptions must match real backend behavior, not aspirational copy).
     - INCONSISTENCY — same concept rendered differently across pages; an enum value
       missing in one of the places it's surfaced (picker vs help-text vs label vs filter).
     For each: state WHAT a real user experiences, in plain words, from their POV
     ("I picked Mobile Scan and there's nowhere to upload the APK"). Verify against the
     backend before claiming something works or is missing. Fix direction = mirror the
     reference (nexotype/finpy) or remove the orphaned option — never invent UX.

OUTPUT FORMAT (strict):

  For each finding:
    [SEVERITY: CRITICAL | HIGH | MEDIUM | LOW]
    [DIMENSION: 1-8]
    FILE: <path:line>
    ISSUE: <one line>
    PROOF: <code snippet or trace showing why>
    FIX: <concrete code change OR "needs design decision">

  Group by severity, critical first. Skip dimensions where you find nothing
  — do not pad. End with a one-table verdict + counts, then a short
  "COLD-START WALKTHROUGH": narrate a brand-new user from signup → first
  scan target → first scan job → first finding → first report, calling out
  every wall, dead end, or "wtf this has no logic" moment in order.
```

---

## How to use

1. **Mid-stream**: when you complete a coherent unit of work (a feature, a
   refactor, a bug fix), pause and run this against your own changes before
   declaring done.
2. **Pre-commit**: between "tests pass" and `git commit`, run this. Tests
   confirm what you tested. This finds what you forgot to test.
3. **Post-review**: after another reviewer (human or LLM) has weighed in,
   run this anyway. Independent angles catch different things.

## Severity calibration

- **CRITICAL** — data loss, security hole, silent corruption, broken
  contract that a caller relies on, regression of a previously-fixed bug.
- **HIGH** — user-visible bug under common conditions (race, wrong amount,
  wrong org), or a latent bug guaranteed to fire when a feature is enabled.
- **MEDIUM** — UX confusion, edge case under uncommon conditions, code
  smell that will compound.
- **LOW** — naming, comments, test polish, future-proofing.

## Anti-patterns to avoid in your own review

- **Padding**: never list a finding just to hit a quota per dimension.
- **Defensiveness**: never explain why a bug you find "isn't really a bug
  because…". If it would surprise a reader, it is one.
- **Bundling**: one finding per issue. Don't merge unrelated problems into
  a single bullet because they live in the same file.
- **Vague proof**: every finding cites file:line OR a code snippet OR a
  reproducible trace. Not "there might be a race condition somewhere".
- **No-action findings**: every finding ends with a FIX. If you can't
  propose one, say "needs design decision" — but don't leave it open.

## When to escalate to the user vs fix yourself

| Severity | Action |
|---|---|
| CRITICAL | Stop. Report to user. Propose fix. Get approval. Implement. |
| HIGH | Report. Propose fix. Implement after acknowledgement. |
| MEDIUM | Report grouped with others. Batch-fix on user approval. |
| LOW | Mention in summary. Fix only if user explicitly requests. |

## UX seed findings (calibration bar — every finding should be this concrete)

Real gaps surfaced in the app. Confirm each is fixed or still open, and match this
level of user-grounded specificity for new findings:
- **`mobile_scan` selectable with no APK upload UI** — the only way to feed it is
  hand-typing `{"apk_url": "..."}` into engine_params JSON. *(OPEN — decide: remove
  from template checkboxes vs build a real upload/URL flow.)*
- **FK `*_id` rendered as raw number inputs** — "Target ID: 1" instead of pick-by-name.
  *(Fixed on the 4 create forms; edit pages + reports + scan-jobs start still to audit.)*
- **scan_types as comma-separated text** — replaced with grouped checkboxes + per-scanner
  descriptions + needs-credential/consent badges.
- **Scan types with no explanation** — fixed via `SCAN_TYPE_DESCRIPTIONS`.
- **Org switcher / "Organizations" nav shown to a solo user** — removed; the workspace
  is auto-created at registration and hidden; Subscription is now a direct top-level page.

The bar: every finding should be as concrete and from-the-user's-POV as the `mobile_scan` one.

## Sources of inspiration

- Static analyzers can't see intent — this prompt covers what they miss.
- Adapted from real session post-mortems where bugs slipped past tests +
  type checks + first-pass review because they lived at the boundary of
  two correct subsystems.
- The UX-completeness dimension (orphaned options, cold-start, leaking concepts)
  comes from real "wtf this has no logic" moments a user hit walking the app.
