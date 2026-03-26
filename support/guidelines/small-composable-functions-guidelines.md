# Small Composable Functions Guidelines

## Goal

Keep code fast to change, easy to review, and easy to debug.

## Core rule

Keep orchestration explicit in routes/services.  
Extract repeated logic into small, composable functions.

In practice:
- Routes/services show the full business flow.
- Utility functions handle repeated building blocks.
- Avoid hiding core behavior behind heavy abstractions by default.

## What to extract into shared functions

Extract logic that is:
- repeated across many modules
- stable and policy-like
- independent and single-purpose

Examples:
- ownership-filtered record lookup
- uniqueness checks
- audit logging wrappers
- soft-delete mutation helpers
- common validation/conversion logic

## What should stay explicit

Keep these in route/service code:
- endpoint definition and dependencies
- operation flow order (read -> validate -> mutate -> audit -> commit)
- response shape
- endpoint-specific edge cases

## Local example

Preferred style:
- `server/apps/nexotype/subrouters/standardization/ontology_term_subrouter.py`
- `server/apps/nexotype/utils/crud_utils.py`

Pattern:
- router remains readable and explicit
- shared helpers remove repetitive ownership/audit/soft-delete code

## Factory/class usage rule

Factory/class abstractions are allowed, but not default.

Use them only when behavior is truly uniform:
- no special query logic
- no special auth/permission branches
- no custom response behavior
- minimal per-route exceptions expected

If those conditions are not true, prefer explicit routes + shared functions.

## Anti-pattern signals

Treat abstraction as a smell when:
- it needs framework introspection hacks to work
- stack traces become hard to map back to endpoint behavior
- adding one edge case requires changing a global abstraction
- reviewers cannot quickly see business flow from the route file

## Benefits of this approach

- Faster safe changes to cross-cutting concerns
- Lower risk during framework upgrades
- Better onboarding and code reviews
- Clearer blast radius when modifying shared behavior

## Practical checklist (before introducing abstraction)

1. Is the logic repeated in at least 3 places?
2. Is it stable enough to centralize?
3. Can it be a small single-purpose function?
4. Will route-level flow remain readable after extraction?

If yes, extract to utility function.  
If no, keep it local and explicit.

## Naming

Use existing project convention:
- `*_utils.py` for shared utility modules (for example, `crud_utils.py`).
