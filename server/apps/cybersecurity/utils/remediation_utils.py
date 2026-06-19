"""
Remediation Utils — AI-ready fix prompts

Builds a copy-paste prompt block from a Finding so the user can paste it straight
into an AI coding tool (Cursor, Claude Code) and get the fix applied.

Why a single util (not per-scanner): the prompt is composed from a Finding's existing
fields (title, severity, location, description, remediation, remediation_script, evidence),
so it works for EVERY scanner automatically — no scanner needs to hand-write prompts.

Why read-time (not stored): the prompt is a derived view over the finding. It has no
persistence need, so we build it on demand in the finding detail endpoint and in reports.
Single source of truth for both surfaces.
"""


# ==========================================
# AI FIX PROMPT
# ==========================================

def build_ai_fix_prompt(finding) -> str:
    """
    Compose an AI-ready, copy-paste fix prompt from a Finding.

    Args:
        finding: a Finding ORM instance (or any object exposing the same attributes).

    Returns:
        A prompt string an AI coding tool can act on. Lines whose source field is
        empty are omitted, so sparse findings still produce a clean prompt.
    """
    # Why location precedence url → host:port → host: the most specific identifier first,
    # so the AI knows exactly where the issue is.
    location = finding.url or ""
    if not location and finding.host:
        location = f"{finding.host}:{finding.port}" if finding.port else finding.host

    lines = [
        "Fix this security vulnerability in my app. Apply the change and explain what you did.",
        "",
        f"VULNERABILITY: {finding.title}",
        f"SEVERITY: {finding.severity}",
    ]
    if location:
        lines.append(f"LOCATION: {location}")
    lines.append(f"WHAT IT IS: {finding.description}")
    if finding.remediation:
        lines.append(f"HOW TO FIX: {finding.remediation}")
    if finding.remediation_script:
        lines.append("FIX SNIPPET:")
        lines.append(finding.remediation_script)
    if finding.evidence:
        lines.append(f"EVIDENCE: {finding.evidence}")
    lines.append("")
    lines.append("Apply this fix to my codebase and confirm the vulnerability is resolved.")

    return "\n".join(lines)
