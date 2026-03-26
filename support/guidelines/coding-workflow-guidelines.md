# Coding Workflow Guidelines

## Quick Reference

| Approach | Tool | Speed | Consistency | Best For |
|----------|------|-------|-------------|----------|
| Multi-tool writes | `Write` (x5) | ⚡ Fast | ✅ Guaranteed | Single model, related files |
| Task agents | `Task` (x3) | ⚡⚡ Faster | ⚠️ May differ | Independent tasks, research |
| Progress tracking | `TodoWrite` | - | - | Visibility, multi-step tasks |

---

## When to Use What

| Scenario | Approach |
|----------|----------|
| 5 related files for 1 feature | Multi-tool writes |
| Same feature for 3 models | Multi-tool writes x3 (sequential) |
| Unrelated research tasks | Task agents parallel |
| Exploring codebase | Task agent with `Explore` type |
| Big new feature | Planning mode (`/plan`) first |

---

## Context Management

**When context fills up:**
1. Have Claude dump progress to `.md` file
2. `/clear` the context
3. New session, read the `.md` and continue

---

## CLAUDE.md Tips

- Keep it short - guardrails, not a manual
- Document what Claude gets wrong
- Don't @-mention files (bloats context)
- Provide alternatives, not just "never do X"
