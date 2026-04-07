"""
Report Generation Service

Aggregates findings and assets from scan results and generates report content
in HTML or JSON format. Called from report_subrouter.py POST /generate.

Why services/ not utils/: Touches multiple models (Finding, Asset, ScanJob,
ScanTarget). Same pattern as assetmanager services/performance_service.py
which queries across multiple domain models.

Data sources:
- Finding (severity, category, title, description, remediation, compliance fields)
- Asset (type, value, host, port, service)
- ScanJob (security_score, severity counts, duration, scan_types_run)
- ScanTarget (name, target_value, target_type)

Report types:
- full — all findings grouped by severity, all assets, compliance mapping
- executive_summary — severity counts, top critical/high findings, security score
- compliance — findings grouped by CWE, OWASP, MITRE ATT&CK
- delta — compare latest 2 scan jobs, show new/resolved findings
"""

import json
import logging
from datetime import datetime, timezone
from html import escape

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc

from ..models.discovery_models import Finding, Asset
from ..models.execution_models import ScanJob
from ..models.infrastructure_models import ScanTarget

logger = logging.getLogger(__name__)


# ==========================================
# Severity ordering (for sorting)
# ==========================================

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}


# ==========================================
# Main entry point
# ==========================================

async def generate_report_content(
    target_id: int,
    scan_job_id: int | None,
    report_type: str,
    format: str,
    session: AsyncSession,
) -> dict:
    """
    Generate report content by aggregating findings and assets.

    Args:
        target_id: Scan target ID to report on
        scan_job_id: Specific scan job (optional — None for all jobs on target)
        report_type: "full", "executive_summary", "compliance", "delta"
        format: "html" or "json"
        session: Database session

    Returns:
        dict with keys: content, summary, total_findings, critical_count,
        high_count, medium_count, low_count, info_count
    """
    # Fetch target info
    target = await session.get(ScanTarget, target_id)
    target_name = target.name if target else f"Target #{target_id}"
    target_value = target.target_value if target else "unknown"

    # Fetch findings — for specific job or all jobs on target
    findings_query = select(Finding).join(ScanJob, Finding.scan_job_id == ScanJob.id)
    if scan_job_id:
        findings_query = findings_query.where(Finding.scan_job_id == scan_job_id)
    else:
        findings_query = findings_query.where(ScanJob.target_id == target_id)

    result = await session.execute(findings_query)
    findings = result.scalars().all()

    # Fetch assets — same filter logic
    assets_query = select(Asset).join(ScanJob, Asset.scan_job_id == ScanJob.id)
    if scan_job_id:
        assets_query = assets_query.where(Asset.scan_job_id == scan_job_id)
    else:
        assets_query = assets_query.where(ScanJob.target_id == target_id)

    result = await session.execute(assets_query)
    assets = result.scalars().all()

    # Fetch latest scan job for security score
    jobs_query = (
        select(ScanJob)
        .where(and_(ScanJob.target_id == target_id, ScanJob.status == "completed"))
        .order_by(desc(ScanJob.completed_at))
        .limit(5)
    )
    result = await session.execute(jobs_query)
    recent_jobs = result.scalars().all()

    # Count severities
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        sev = f.severity
        if sev in severity_counts:
            severity_counts[sev] += 1

    total_findings = len(findings)
    latest_score = recent_jobs[0].security_score if recent_jobs else None

    # Build content based on report type
    if report_type == "executive_summary":
        content = _build_executive_summary(target_name, target_value, findings, assets, severity_counts, latest_score, recent_jobs, format)
    elif report_type == "compliance":
        content = _build_compliance_report(target_name, target_value, findings, format)
    elif report_type == "delta":
        content = await _build_delta_report(target_name, target_value, target_id, session, format)
    else:
        # "full" is default
        content = _build_full_report(target_name, target_value, findings, assets, severity_counts, latest_score, format)

    # Build executive summary text
    summary = (
        f"Security assessment for {target_name} ({target_value}). "
        f"Found {total_findings} findings: "
        f"{severity_counts['critical']} critical, {severity_counts['high']} high, "
        f"{severity_counts['medium']} medium, {severity_counts['low']} low, {severity_counts['info']} info. "
        f"Security score: {latest_score}/100." if latest_score else
        f"Security assessment for {target_name} ({target_value}). "
        f"Found {total_findings} findings: "
        f"{severity_counts['critical']} critical, {severity_counts['high']} high, "
        f"{severity_counts['medium']} medium, {severity_counts['low']} low, {severity_counts['info']} info."
    )

    return {
        "content": content,
        "summary": summary,
        "total_findings": total_findings,
        "critical_count": severity_counts["critical"],
        "high_count": severity_counts["high"],
        "medium_count": severity_counts["medium"],
        "low_count": severity_counts["low"],
        "info_count": severity_counts["info"],
    }


# ==========================================
# Full Report
# ==========================================

def _build_full_report(target_name, target_value, findings, assets, severity_counts, latest_score, format):
    """
    Full report — all findings grouped by severity, all assets, compliance mapping.
    """
    if format == "json":
        return json.dumps({
            "target": {"name": target_name, "value": target_value},
            "security_score": latest_score,
            "severity_counts": severity_counts,
            "findings": [_finding_to_dict(f) for f in sorted(findings, key=lambda x: SEVERITY_ORDER.get(x.severity, 4))],
            "assets": [_asset_to_dict(a) for a in assets],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }, indent=2)

    # HTML format
    html = f"""<div class="report">
<h1>Security Assessment Report</h1>
<p class="meta">Target: <strong>{escape(target_name)}</strong> ({escape(target_value)})</p>
<p class="meta">Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>
{f'<p class="score">Security Score: <strong>{latest_score}/100</strong></p>' if latest_score is not None else ''}

<h2>Severity Summary</h2>
<table>
<tr><th>Severity</th><th>Count</th></tr>
<tr class="critical"><td>Critical</td><td>{severity_counts['critical']}</td></tr>
<tr class="high"><td>High</td><td>{severity_counts['high']}</td></tr>
<tr class="medium"><td>Medium</td><td>{severity_counts['medium']}</td></tr>
<tr class="low"><td>Low</td><td>{severity_counts['low']}</td></tr>
<tr class="info"><td>Info</td><td>{severity_counts['info']}</td></tr>
</table>

<h2>Findings ({len(findings)})</h2>
"""

    # Group findings by severity
    for severity in ["critical", "high", "medium", "low", "info"]:
        sev_findings = [f for f in findings if f.severity == severity]
        if not sev_findings:
            continue

        html += f'<h3 class="{severity}">{severity.upper()} ({len(sev_findings)})</h3>\n'
        for f in sev_findings:
            html += f"""<div class="finding {severity}">
<h4>{escape(f.title)}</h4>
<p>{escape(f.description)}</p>
{f'<p class="location">Location: {escape(f.host or "")}{f":{f.port}" if f.port else ""}{f" ({escape(f.protocol)})" if f.protocol else ""}</p>' if f.host else ''}
{f'<p class="remediation"><strong>Remediation:</strong> {escape(f.remediation)}</p>' if f.remediation else ''}
{f'<pre class="script">{escape(f.remediation_script)}</pre>' if f.remediation_script else ''}
{f'<p class="compliance">CVE: {escape(f.cve_id or "")} | CWE: {escape(f.cwe_id or "")} | MITRE: {escape(f.mitre_tactic or "")} {escape(f.mitre_technique or "")}</p>' if any([f.cve_id, f.cwe_id, f.mitre_tactic]) else ''}
</div>
"""

    # Assets section
    if assets:
        html += f"\n<h2>Discovered Assets ({len(assets)})</h2>\n<table>\n"
        html += "<tr><th>Type</th><th>Value</th><th>Host</th><th>Port</th><th>Service</th></tr>\n"
        for a in assets:
            html += f"<tr><td>{escape(a.asset_type)}</td><td>{escape(a.value)}</td><td>{escape(a.host or '')}</td><td>{a.port or ''}</td><td>{escape(a.service_name or '')}</td></tr>\n"
        html += "</table>\n"

    html += "</div>"
    return html


# ==========================================
# Executive Summary
# ==========================================

def _build_executive_summary(target_name, target_value, findings, assets, severity_counts, latest_score, recent_jobs, format):
    """
    Executive summary — severity counts, top critical/high findings, security score.
    """
    # Top 10 critical + high findings
    top_findings = sorted(
        [f for f in findings if f.severity in ("critical", "high")],
        key=lambda x: SEVERITY_ORDER.get(x.severity, 4)
    )[:10]

    if format == "json":
        return json.dumps({
            "target": {"name": target_name, "value": target_value},
            "security_score": latest_score,
            "severity_counts": severity_counts,
            "total_findings": len(findings),
            "total_assets": len(assets),
            "top_findings": [_finding_to_dict(f) for f in top_findings],
            "recent_scans": [{"id": j.id, "score": j.security_score, "completed_at": j.completed_at.isoformat() if j.completed_at else None} for j in recent_jobs],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }, indent=2)

    # HTML format
    html = f"""<div class="report executive-summary">
<h1>Executive Security Summary</h1>
<p class="meta">Target: <strong>{escape(target_name)}</strong> ({escape(target_value)})</p>
<p class="meta">Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>
{f'<p class="score">Security Score: <strong>{latest_score}/100</strong></p>' if latest_score is not None else ''}

<h2>Overview</h2>
<p>{len(findings)} total findings across {len(assets)} discovered assets.</p>
<table>
<tr><th>Critical</th><th>High</th><th>Medium</th><th>Low</th><th>Info</th></tr>
<tr><td>{severity_counts['critical']}</td><td>{severity_counts['high']}</td><td>{severity_counts['medium']}</td><td>{severity_counts['low']}</td><td>{severity_counts['info']}</td></tr>
</table>
"""

    if top_findings:
        html += f"\n<h2>Top Critical & High Findings ({len(top_findings)})</h2>\n"
        for f in top_findings:
            html += f'<div class="finding {f.severity}"><strong>[{f.severity.upper()}]</strong> {escape(f.title)}</div>\n'

    html += "</div>"
    return html


# ==========================================
# Compliance Report
# ==========================================

def _build_compliance_report(target_name, target_value, findings, format):
    """
    Compliance report — findings grouped by CWE, OWASP, MITRE ATT&CK.
    """
    # Group by CWE
    cwe_groups = {}
    owasp_groups = {}
    mitre_groups = {}

    for f in findings:
        if f.cwe_id:
            cwe_groups.setdefault(f.cwe_id, []).append(f)
        if f.owasp_category:
            owasp_groups.setdefault(f.owasp_category, []).append(f)
        if f.mitre_technique:
            key = f"{f.mitre_tactic or 'Unknown'} / {f.mitre_technique}"
            mitre_groups.setdefault(key, []).append(f)

    if format == "json":
        return json.dumps({
            "target": {"name": target_name, "value": target_value},
            "cwe_mapping": {k: [_finding_to_dict(f) for f in v] for k, v in cwe_groups.items()},
            "owasp_mapping": {k: [_finding_to_dict(f) for f in v] for k, v in owasp_groups.items()},
            "mitre_mapping": {k: [_finding_to_dict(f) for f in v] for k, v in mitre_groups.items()},
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }, indent=2)

    # HTML format
    html = f"""<div class="report compliance">
<h1>Compliance Report</h1>
<p class="meta">Target: <strong>{escape(target_name)}</strong> ({escape(target_value)})</p>
<p class="meta">Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>

<h2>CWE Mapping ({len(cwe_groups)} categories)</h2>
"""
    for cwe_id, cwe_findings in sorted(cwe_groups.items()):
        html += f"<h3>{escape(cwe_id)} ({len(cwe_findings)} findings)</h3>\n<ul>\n"
        for f in cwe_findings:
            html += f'<li>[{f.severity.upper()}] {escape(f.title)}</li>\n'
        html += "</ul>\n"

    html += f"\n<h2>OWASP Mapping ({len(owasp_groups)} categories)</h2>\n"
    for owasp, owasp_findings in sorted(owasp_groups.items()):
        html += f"<h3>{escape(owasp)} ({len(owasp_findings)} findings)</h3>\n<ul>\n"
        for f in owasp_findings:
            html += f'<li>[{f.severity.upper()}] {escape(f.title)}</li>\n'
        html += "</ul>\n"

    html += f"\n<h2>MITRE ATT&CK Mapping ({len(mitre_groups)} techniques)</h2>\n"
    for mitre, mitre_findings in sorted(mitre_groups.items()):
        html += f"<h3>{escape(mitre)} ({len(mitre_findings)} findings)</h3>\n<ul>\n"
        for f in mitre_findings:
            html += f'<li>[{f.severity.upper()}] {escape(f.title)}</li>\n'
        html += "</ul>\n"

    html += "</div>"
    return html


# ==========================================
# Delta Report
# ==========================================

async def _build_delta_report(target_name, target_value, target_id, session, format):
    """
    Delta report — compare latest 2 completed scan jobs. Show new and resolved findings.
    """
    # Get latest 2 completed jobs
    result = await session.execute(
        select(ScanJob)
        .where(and_(ScanJob.target_id == target_id, ScanJob.status == "completed"))
        .order_by(desc(ScanJob.completed_at))
        .limit(2)
    )
    jobs = result.scalars().all()

    if len(jobs) < 2:
        if format == "json":
            return json.dumps({"error": "Need at least 2 completed scans for delta report", "target": {"name": target_name, "value": target_value}})
        return f'<div class="report delta"><h1>Delta Report</h1><p>Need at least 2 completed scans for {escape(target_name)} to generate a delta report.</p></div>'

    latest_job = jobs[0]
    previous_job = jobs[1]

    # Get fingerprints for each job
    latest_fps = set()
    result = await session.execute(select(Finding.fingerprint).where(Finding.scan_job_id == latest_job.id))
    for row in result.all():
        latest_fps.add(row[0])

    previous_fps = set()
    result = await session.execute(select(Finding.fingerprint).where(Finding.scan_job_id == previous_job.id))
    for row in result.all():
        previous_fps.add(row[0])

    # New findings = in latest but not in previous
    new_fps = latest_fps - previous_fps
    # Resolved findings = in previous but not in latest
    resolved_fps = previous_fps - latest_fps
    # Persistent = in both
    persistent_fps = latest_fps & previous_fps

    # Fetch new finding details
    new_findings = []
    if new_fps:
        result = await session.execute(
            select(Finding).where(and_(Finding.scan_job_id == latest_job.id, Finding.fingerprint.in_(new_fps)))
        )
        new_findings = result.scalars().all()

    # Fetch resolved finding details
    resolved_findings = []
    if resolved_fps:
        result = await session.execute(
            select(Finding).where(and_(Finding.scan_job_id == previous_job.id, Finding.fingerprint.in_(resolved_fps)))
        )
        resolved_findings = result.scalars().all()

    if format == "json":
        return json.dumps({
            "target": {"name": target_name, "value": target_value},
            "latest_job_id": latest_job.id,
            "previous_job_id": previous_job.id,
            "latest_score": latest_job.security_score,
            "previous_score": previous_job.security_score,
            "new_findings": [_finding_to_dict(f) for f in new_findings],
            "resolved_findings": [_finding_to_dict(f) for f in resolved_findings],
            "persistent_count": len(persistent_fps),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }, indent=2)

    # HTML format
    score_change = ""
    if latest_job.security_score is not None and previous_job.security_score is not None:
        diff = latest_job.security_score - previous_job.security_score
        direction = "improved" if diff > 0 else "declined" if diff < 0 else "unchanged"
        score_change = f'<p>Score: {previous_job.security_score} → {latest_job.security_score} ({direction}{f" by {abs(diff)}" if diff != 0 else ""})</p>'

    html = f"""<div class="report delta">
<h1>Delta Report</h1>
<p class="meta">Target: <strong>{escape(target_name)}</strong> ({escape(target_value)})</p>
<p class="meta">Comparing scan #{latest_job.id} vs #{previous_job.id}</p>
{score_change}

<h2>New Findings ({len(new_findings)})</h2>
"""
    if new_findings:
        for f in sorted(new_findings, key=lambda x: SEVERITY_ORDER.get(x.severity, 4)):
            html += f'<div class="finding {f.severity} new"><strong>[{f.severity.upper()}] [NEW]</strong> {escape(f.title)}</div>\n'
    else:
        html += "<p>No new findings.</p>\n"

    html += f"\n<h2>Resolved Findings ({len(resolved_findings)})</h2>\n"
    if resolved_findings:
        for f in sorted(resolved_findings, key=lambda x: SEVERITY_ORDER.get(x.severity, 4)):
            html += f'<div class="finding {f.severity} resolved"><strong>[{f.severity.upper()}] [RESOLVED]</strong> {escape(f.title)}</div>\n'
    else:
        html += "<p>No resolved findings.</p>\n"

    html += f"\n<p>Persistent findings (unchanged): {len(persistent_fps)}</p>\n</div>"
    return html


# ==========================================
# Serialization helpers
# ==========================================

def _finding_to_dict(f) -> dict:
    """Convert a Finding model to a serializable dict for JSON reports."""
    return {
        "id": f.id,
        "severity": f.severity,
        "category": f.category,
        "finding_type": f.finding_type,
        "title": f.title,
        "description": f.description,
        "remediation": f.remediation,
        "remediation_script": f.remediation_script,
        "host": f.host,
        "port": f.port,
        "protocol": f.protocol,
        "url": f.url,
        "cve_id": f.cve_id,
        "cvss_score": f.cvss_score,
        "cwe_id": f.cwe_id,
        "owasp_category": f.owasp_category,
        "mitre_tactic": f.mitre_tactic,
        "mitre_technique": f.mitre_technique,
        "status": f.status,
        "is_new": f.is_new,
        "discovered_at": f.discovered_at.isoformat() if f.discovered_at else None,
    }


def _asset_to_dict(a) -> dict:
    """Convert an Asset model to a serializable dict for JSON reports."""
    return {
        "id": a.id,
        "asset_type": a.asset_type,
        "value": a.value,
        "host": a.host,
        "port": a.port,
        "protocol": a.protocol,
        "service_name": a.service_name,
        "service_version": a.service_version,
        "confidence": a.confidence,
    }
