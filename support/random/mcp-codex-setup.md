# MCP Codex pentru Claude Code

Codex CLI expus ca server MCP în Claude Code. E un simplu wrapper stdio peste binarul `codex` instalat local.

## Configurat de noi în `~/.claude.json`

Fișier: `/Users/rbtrsv/.claude.json` (linia ~1696). Conținut:

```json
"codex": {
  "type": "stdio",
  "command": "codex",
  "args": ["mcp-server"],
  "env": {}
}
```

Asta spune Claude Code să pornească `codex mcp-server` ca proces stdio. Server-ul expune automat două tool-uri (hardcoded în binarul `codex`, nu definite extern):

| Tool MCP | Ce face |
|---|---|
| `mcp__codex__codex` | Pornește un thread nou Codex. Returnează `threadId`. |
| `mcp__codex__codex-reply` | Continuă un thread existent cu `threadId`. |

**Verificare:**
```bash
claude mcp list           # codex: codex mcp-server - ✓ Connected
```

**Prerequisite:** `codex --version` (instalat via `brew install --cask codex`). Auth: `codex` o dată în terminal.

---

## Două moduri de continuare a unei discuții cu Codex

### Mod 1 — Thread inițiat de Claude (MCP server, in-process)

**Într-o sesiune de Claude Code, dacă AI inițiez thread-ul, TOATE întrebările merg în UN SINGUR thread.** Nu deschid thread nou per întrebare.

1. **Primul apel** în sesiune:
   ```
   mcp__codex__codex(prompt="<întrebarea inițială>")
   ```
   Răspuns: `{"threadId": "<UUID>", "content": "..."}`. Memorez UUID-ul.

2. **Toate apelurile următoare** în aceeași sesiune:
   ```
   mcp__codex__codex-reply(threadId="<UUID>", prompt="<următoarea întrebare>")
   ```
   Codex are deja contextul anterior. Nu repet setup-ul, nu repet rolul, nu re-paste context.

3. **Thread nou** doar dacă user-ul cere explicit "deschide fir nou la Codex" sau dacă sesiunea Claude Code anterioară s-a închis.

**Limitare:** MCP server keep thread state in-process. Dacă procesul MCP moare (Claude Code restart, `/mcp` reconnect), thread-ul expiră → `codex-reply` returnează "Session not found". Disk persist-ul există (`~/.codex/sessions/<year>/<month>/<day>/rollout-*.jsonl`), dar nu se rehidratează automat în MCP.

### Mod 2 — User inițiază thread în CLI, Claude continuă

**Workflow user-driven:** user pornește o sesiune în terminal, dă UUID-ul, Claude continuă prin Bash (nu MCP).

**De ce NU prin `mcp__codex__codex-reply`:** MCP server NU vede thread-uri create de alt proces (CLI separat). Returnează "Session not found".

**Soluția corectă — `codex exec resume` via Bash:** comanda CLI citește JSONL de pe disc → poate continua ORICE thread (creat de CLI sau de MCP).

**Pașii utilizatorului:**
```bash
# 1. Pornește sesiune în terminal
cd /Users/rbtrsv/Developer/main/nexotype
codex

# 2. Discută în TUI. La exit (Ctrl+C sau Ctrl+D) TUI afișează:
#    Token usage: total=...
#    To continue this session, run codex resume <UUID>
#    (copiezi UUID-ul din linia aia)

# 3. Dă UUID-ul în chat Claude Code, sau continui singur:
codex exec resume <UUID> "<următorul prompt>"
```

**Fallback** (dacă pierzi output-ul TUI):
```bash
tail -n 1 ~/.codex/session_index.jsonl | jq -r .id
```

**Comanda mea (Claude) pentru a continua:**
```bash
codex exec resume <UUID> "<prompt-ul nou>"
```

**Variante utile:**
```bash
# Cu CWD explicit (recomandat pentru repo-uri multi-folder)
codex exec -C /Users/rbtrsv/Developer/main/nexotype/server resume <UUID> "<prompt>"

# Output JSONL (events stream)
codex exec resume <UUID> --json "<prompt>"

# Salvează doar răspunsul final într-un fișier
codex exec resume <UUID> "<prompt>" --output-last-message /tmp/codex-last.txt

# Cu stdin (pentru prompt-uri lungi multi-linie)
printf '%s\n' "<prompt lung>" | codex exec resume <UUID> -
```

**Regulă:** într-o sesiune Claude Code, dacă user-a m-a dat UUID în primul mesaj, folosesc ACEL UUID pentru toate apelurile ulterioare prin `codex exec resume`. Nu deschid thread MCP nou paralel.

---

## Cum returnez răspunsul lui Codex către user

Răspunsul vine **verbatim** ca blockquote markdown. Niciun cuvânt schimbat, niciun pasaj omis.

**Format obligatoriu:**

```markdown
**Codex** *(sesiune `<primele-8-caractere-din-threadId>`)*:

> [textul răspunsului, integral, ca blockquote multi-linie cu `>` pe fiecare linie]

[scurt context propriu dacă e relevant, 1-2 propoziții, după o linie goală]
```

**Reguli:**
- Cod în răspuns: păstrez code fence-urile originale **în interiorul** blockquote-ului
- Paragrafe multiple: fiecare linie începe cu `>`
- Tabele: păstrate ca atare, fiecare linie cu `>` prefix

**Ce NU fac:**
- Rezumat („Codex a confirmat...")
- Parafrazare („Codex spune că...")
- Ghilimele simple în loc de blockquote
- Truncare cu „..." sau „[restul răspunsului]"

---

## Prompt material în `support/plugins/codex-plugin-cc/`

Director cu prompt templates trimise prin `mcp__codex__codex`. Root: `support/plugins/codex-plugin-cc/`.

| Fișier (relativ la root) | Când îl folosesc |
|---|---|
| `prompts/adversarial-review.md` | Template XML pentru review adversarial (role, attack_surface, finding_bar, grounding_rules, structured_output_contract). Înlocuiesc `{{TARGET_LABEL}}`, `{{USER_FOCUS}}`, `{{REVIEW_INPUT}}` înainte de send. |
| `prompts/stop-review-gate.md` | Stop-gate review pe ultima tură Claude. Înlocuiesc `{{CLAUDE_RESPONSE_BLOCK}}`. Răspunde `ALLOW:` / `BLOCK:`. |
| `skills/gpt-5-4-prompting/SKILL.md` | Reguli core prompting: când adaugi `completeness_contract`, `verification_loop`, `grounding_rules`, `action_safety`. Checklist asamblare prompt. |
| `references/prompt-blocks.md` | Blocks XML reutilizabile (task, structured_output_contract, completeness_contract, verification_loop, missing_context_gating, grounding_rules, action_safety, research_mode, dig_deeper_nudge). Copy-paste în prompt. |
| `references/codex-prompt-recipes.md` | Template-uri end-to-end: diagnosis, narrow fix, root-cause review, research/recommendation, prompt-patching. |
| `references/codex-prompt-antipatterns.md` | Failure modes prompting (vague task, missing output contract, no follow-through default, "think harder" etc.). |
| `schemas/review-output.schema.json` | JSON Schema pentru output review structurat (verdict, findings cu severity/file/line_start/line_end/confidence/recommendation, next_steps). Atașez constraint în prompt când vreau output validabil. |

**Flow tipic la primul apel:**
1. Identific tipul de task (diagnosis / fix / review / research).
2. Copiez recipe din `codex-prompt-recipes.md`.
3. Trim / adaug blocks din `prompt-blocks.md`.
4. Pentru review structurat: atașez constraint pe `review-output.schema.json`.
5. Send la `mcp__codex__codex`. Memorez threadId. Toate follow-up-urile pe `codex-reply`.

---

## Vizualizare locală (user-side)

Sesiunile MCP sunt salvate în `~/.codex/sessions/<year>/<month>/<day>/rollout-...jsonl`.

**Reia thread specific** (UUID-ul pe care l-am primit la primul apel):
```bash
codex resume <UUID>
```

**Picker din toate sesiunile** (inclusiv non-interactive marcate de MCP):
```bash
codex resume --include-non-interactive
```
Flag-ul `--include-non-interactive` e obligatoriu pentru a vedea sesiunile MCP în picker — default-ul le ascunde.

**Aliasing thread** (din Codex CLI interactiv):
- În sesiunea interactivă rulează comanda de rename → threadul primește alias prietenos (ex. "nexotype")
- Apoi: `codex resume nexotype` în loc de UUID

**Caut UUID-ul după nume:**
```bash
grep -i "thread_name" ~/.codex/session_index.jsonl | tail -10
```

**Stream live** (urmărești sesiunea curentă în timp ce rulează):
```bash
tail -F "$(ls -t ~/.codex/sessions/$(date +%Y/%m/%d)/*.jsonl | head -1)"
```

---

## Troubleshooting

| Problemă | Soluție |
|---|---|
| Tool-urile `mcp__codex__*` nu apar | Restart Claude Code (Cmd-Q + repornire) |
| `failed` la conectare în `/mcp` | Verifică path: `which codex` → trebuie `/opt/homebrew/bin/codex` sau `~/.local/bin/codex` |
| Auth fail la primul apel | `codex` o dată în terminal (ChatGPT login sau API key) |
| `codex-reply` returnează "Session not found" | Thread-ul a fost creat în CLI separat, nu în MCP. MCP server vede doar thread-urile pe care le-a creat el. Folosește `codex resume <UUID>` local. |
| Sesiunile MCP nu apar în picker | Adaugă `--include-non-interactive` la `codex resume` |
