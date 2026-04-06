"""
Cybersecurity Models — Discovery Domain

What the scanners found and what we generated from it.
Finding and Asset are append-only (NO BaseMixin). Report is CRUD (BaseMixin).
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Float, Boolean, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from core.db import Base
from .mixin_models import BaseMixin


# ==========================================
# 7. FINDINGS
# ==========================================

class Finding(Base):
    """
    A vulnerability, misconfiguration, or security issue discovered during a scan.
    Append-only — scanner writes once, never user-edited or soft-deleted.

    Why no BaseMixin: Findings represent a point-in-time discovery. Status field tracks
    triage workflow (open → acknowledged → resolved) but that is business state, not CRUD lifecycle.
    Same pattern as APIUsageTracking and RecommendationAnalytics in ecommerce.
    """
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    scan_job_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_jobs.id", ondelete="CASCADE"), nullable=False)

    # Deduplication — tracks recurring findings across scans
    # Why: SHA-256 hash of (category + finding_type + host + port + protocol + url).
    # Without this, recurring scans produce duplicate noise and dashboard counts are meaningless.
    fingerprint: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    is_new: Mapped[bool] = mapped_column(Boolean, default=True)  # False if same fingerprint existed in previous scan
    first_found_job_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("scan_jobs.id", ondelete="SET NULL"), nullable=True)
    # Why: links back to FIRST scan that discovered this vulnerability. Enables "age of vulnerability" tracking.

    # Classification
    severity: Mapped[str] = mapped_column(String(50), nullable=False)  # "critical", "high", "medium", "low", "info"
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # "open_port", "ssl_weakness", etc.
    finding_type: Mapped[str] = mapped_column(String(100), nullable=False)  # Specific finding within category
    # Why both: category groups findings in UI, finding_type is the specific check

    # Finding details
    title: Mapped[str] = mapped_column(String(500), nullable=False)  # "SSH Server Running Outdated Version"
    description: Mapped[str] = mapped_column(Text, nullable=False)
    remediation: Mapped[str | None] = mapped_column(Text, nullable=True)  # How to fix (explanation)
    remediation_script: Mapped[str | None] = mapped_column(Text, nullable=True)  # Copiable fix command/snippet
    # Why separate: remediation is explanation, remediation_script is actionable ("chmod 600", "add_header X-Frame-Options DENY;")
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)  # Raw evidence (banner, headers, DNS records)

    # Location — where the finding was discovered
    # Why all nullable: not all findings have all fields (DNS finding has host but no port)
    host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protocol: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "tcp", "udp"
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # CVE reference
    cve_id: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "CVE-2016-6210"
    cvss_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0.0 - 10.0

    # Compliance mapping — required for SOC2/ISO27001 audit-ready reports
    cwe_id: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "CWE-89" (SQL Injection)
    owasp_category: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "A03:2021-Injection"
    mitre_tactic: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "Initial Access"
    mitre_technique: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "T1190"

    # Triage status — user workflow for handling findings
    # Why status on append-only: this is business state (triage), not CRUD lifecycle
    status: Mapped[str] = mapped_column(String(50), default="open")  # "open", "acknowledged", "resolved", "false_positive"

    # Accountability — who fixed it (for compliance audits)
    resolved_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID

    # Timestamps
    discovered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    scan_job: Mapped["ScanJob"] = relationship(back_populates="findings", foreign_keys=[scan_job_id])
    first_found_job: Mapped["ScanJob | None"] = relationship(foreign_keys=[first_found_job_id])


# ==========================================
# 8. ASSETS
# ==========================================

class Asset(Base):
    """
    Discovered infrastructure — an IP, hostname, service, or technology found during scanning.
    Append-only — scanner discovers infrastructure, writes once. Upsert prevents duplicates.

    Why no BaseMixin: Same reasoning as Finding. Scanner writes, never user-edited.
    """
    __tablename__ = "assets"
    __table_args__ = (
        UniqueConstraint("scan_job_id", "asset_type", "value", name="uq_assets_job_type_value"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    scan_job_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_jobs.id", ondelete="CASCADE"), nullable=False)

    # Asset classification
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "host", "service", "technology", "certificate", "dns_record"
    value: Mapped[str] = mapped_column(String(500), nullable=False)  # "192.168.1.10", "nginx/1.24.0", "TLS 1.3"

    # Context — where/how the asset was discovered
    host: Mapped[str | None] = mapped_column(String(255), nullable=True)
    port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    protocol: Mapped[str | None] = mapped_column(String(20), nullable=True)  # "tcp", "udp"

    # Service details (for asset_type = "service")
    service_name: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "http", "ssh", "ftp"
    service_version: Mapped[str | None] = mapped_column(String(255), nullable=True)  # "OpenSSH 8.9", "nginx/1.24.0"
    banner: Mapped[str | None] = mapped_column(Text, nullable=True)  # Raw service banner

    # Deep discovery metadata — full details for blast radius analysis
    # Why: banners, cipher suites, SSH keys, HTTP headers. A port number alone is not actionable.
    service_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string

    # Metadata
    confidence: Mapped[str] = mapped_column(String(50), default="confirmed")  # "confirmed", "probable", "possible"
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scan_job: Mapped["ScanJob"] = relationship(back_populates="assets")


# ==========================================
# 9. REPORTS
# ==========================================

class Report(Base, BaseMixin):
    """
    A generated report document summarizing scan results for a target.
    CRUD entity — users generate, rename, soft-delete reports.
    """
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    target_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_targets.id", ondelete="CASCADE"), nullable=False)
    scan_job_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("scan_jobs.id", ondelete="SET NULL"), nullable=True)
    # Why SET NULL: report survives even if the source scan job is deleted

    # Report identification
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # "March 2024 Security Assessment"
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "full", "executive_summary", "compliance", "delta"
    format: Mapped[str] = mapped_column(String(50), default="pdf")  # "pdf", "html", "json"

    # Report content
    # Why Text not file path: store generated content directly in DB. File storage (S3) is optimization.
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)  # Executive summary text

    # Report statistics — snapshot at generation time
    total_findings: Mapped[int] = mapped_column(Integer, default=0)
    critical_count: Mapped[int] = mapped_column(Integer, default=0)
    high_count: Mapped[int] = mapped_column(Integer, default=0)
    medium_count: Mapped[int] = mapped_column(Integer, default=0)
    low_count: Mapped[int] = mapped_column(Integer, default=0)
    info_count: Mapped[int] = mapped_column(Integer, default=0)

    # Generation metadata
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    generated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # User ID who triggered generation

    # Relationships
    target: Mapped["ScanTarget"] = relationship(back_populates="reports")
    scan_job: Mapped["ScanJob | None"] = relationship(back_populates="reports")
