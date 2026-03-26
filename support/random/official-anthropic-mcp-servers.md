# Official Anthropic MCP Servers

**Repository:** https://github.com/modelcontextprotocol/servers

## Official Servers (Maintained by Anthropic)

### 1. Memory ✅ PRODUCTION-READY
**What it does:** Knowledge graph-based persistent memory system. Remember context across conversations and sessions.

**Install:**
```bash
# Local scope (default - project-specific)
claude mcp add --transport stdio memory -- npx -y @modelcontextprotocol/server-memory

# User scope (available across all projects)
claude mcp add --transport stdio --scope user memory -- npx -y @modelcontextprotocol/server-memory
```

**Link:** https://github.com/modelcontextprotocol/servers/tree/main/src/memory

**Memory storage:** Location varies by OS (check `~/Library/Application Support/` or `~/.local/share/`)

---

### 2. Fetch ✅ PRODUCTION-READY
**What it does:** Fetch web content and convert it for efficient LLM usage. Access documentation, APIs, and web pages directly.

**Note:** ⚠️ Claude Code has built-in fetch capability (`mcp__fetch__fetch` tool). This MCP server may be redundant.

**Type:** Python-based (requires `uvx`)

**Install:**
```bash
# First ensure uv is installed:
# curl -LsSf https://astral.sh/uv/install.sh | sh

# Local scope (default)
claude mcp add --transport stdio fetch -- uvx mcp-server-fetch

# User scope
claude mcp add --transport stdio --scope user fetch -- uvx mcp-server-fetch
```

**Link:** https://github.com/modelcontextprotocol/servers/tree/main/src/fetch

---

### 3. Sequential Thinking ✅ PRODUCTION-READY
**What it does:** Dynamic problem-solving with structured reasoning. Break down complex problems step-by-step.

**Note:** ⚠️ Claude has built-in chain-of-thought reasoning. This MCP may not add significant value.

**Install:**
```bash
# Local scope (default)
claude mcp add --transport stdio sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking

# User scope
claude mcp add --transport stdio --scope user sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

**Link:** https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking

---

### 4. Filesystem ❌ ARCHIVED - NOT PRODUCTION-READY
**What it does:** Secure file operations with configurable access controls. Read, write, and edit files in specified directories.

**Status:** Reference implementation only. Archived at https://github.com/modelcontextprotocol/servers-archived

**Note:**
- Not available as pre-built npm package
- Requires manual compilation from source
- Claude Code already has built-in file operations (Read, Write, Edit tools)
- Not recommended for production use

---

### 5. Git ❌ ARCHIVED - NOT PRODUCTION-READY
**What it does:** Read, search, and manipulate Git repositories. Access commit history, diffs, and repository information.

**Status:** Reference implementation only. Archived at https://github.com/modelcontextprotocol/servers-archived

**Note:**
- Not available as pre-built npm package
- Requires manual compilation from source
- Claude Code already has git integration via Bash tool
- Not recommended for production use

---

## Management Commands

```bash
# List all configured servers
claude mcp list

# Check server status in Claude Code
/mcp

# Remove a server
claude mcp remove <name>

# View server details
claude mcp get <name>
```

---

## Notes

### Official Servers Status
- **3 production-ready:** Memory, Fetch, Sequential Thinking
- **2 archived (reference only):** Filesystem, Git
- All other MCP servers (Sentry, Notion, GitHub, Stripe, etc.) are third-party integrations

### Installation Scopes
- **Local scope (default):** Project-specific, stored in `.claude.json` under `projects["/path/to/project"].mcpServers`
- **User scope (`--scope user`):** Available across all projects
- **Project scope (`--scope project`):** Shared with team via `.mcp.json` file (requires version control)

### Configuration Storage
- **Main config:** `/Users/rbtrsv/.claude.json` (stores user settings + per-project configs)
- **MCP servers:** Nested under `projects["/path/to/project"].mcpServers` for each project
- **Memory data:** Location varies by OS and may not exist until first use

### Transport Types
- **stdio:** For local processes (npx, uvx commands) - required for Memory, Fetch, Sequential Thinking
- **HTTP:** Recommended for remote servers (Stripe, Notion, GitHub, etc.)
- **SSE:** Deprecated, use HTTP instead

### Built-in Capabilities
- Claude Code has **built-in fetch** (`mcp__fetch__fetch` tool) - Fetch MCP may be redundant
- Claude Code has **built-in file operations** (Read, Write, Edit) - Filesystem MCP not needed
- Claude Code has **built-in git integration** via Bash tool - Git MCP not needed

### Requirements
- **Fetch MCP:** Requires `uv` Python package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Memory MCP:** Works out-of-box with npx
- **Sequential Thinking MCP:** Works out-of-box with npx

### Restart Required
After adding/removing MCP servers, **restart Claude Code** for changes to take effect.
