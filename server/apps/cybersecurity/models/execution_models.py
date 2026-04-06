"""
Cybersecurity Models — Execution Domain

How we scan, when we scan, and scan execution tracking.
3 classes with FK relations between them — kept in one file to avoid circular imports.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin


# ==========================================
# 4. SCAN TEMPLATES
# ==========================================

class ScanTemplate(Base, BaseMixin):
    """
    How we scan — reusable configuration defining which scan types to run and with what parameters.
    One template can be reused across many jobs.
    """
    __tablename__ = "scan_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    target_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_targets.id", ondelete="CASCADE"), nullable=False)

    # Template identification
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # "Quick Port Scan", "Full Assessment"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Scan type selection — which scanners to run
    # Why comma-separated string: keeps PostgreSQL simple, no PG array needed. Parsed in Python.
    scan_types: Mapped[str] = mapped_column(String(500), nullable=False)  # "port_scan,dns_enum,ssl_check,web_scan"

    # Port scan parameters (only used when scan_types includes "port_scan")
    port_range: Mapped[str] = mapped_column(String(255), default="top_100")  # "top_100", "top_1000", "full", "1-1024", "80,443,8080"
    scan_speed: Mapped[str] = mapped_column(String(50), default="normal")  # "slow" (stealth), "normal", "fast" (aggressive)

    # Web scan parameters (only used when scan_types includes "web_scan")
    follow_redirects: Mapped[bool] = mapped_column(Boolean, default=True)
    max_depth: Mapped[int] = mapped_column(Integer, default=3)  # Max crawl depth for web scanning
    check_headers: Mapped[bool] = mapped_column(Boolean, default=True)  # Check security headers (CSP, HSTS, etc.)

    # DNS scan parameters (only used when scan_types includes "dns_enum")
    dns_brute_force: Mapped[bool] = mapped_column(Boolean, default=False)
    dns_wordlist: Mapped[str] = mapped_column(String(50), default="small")  # "small" (100), "medium" (1000), "large" (10000)

    # General parameters
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=300)  # Max scan duration in seconds
    max_concurrent: Mapped[int] = mapped_column(Integer, default=50)  # Max concurrent connections

    # Active scanning consent — legal requirement
    # Why: Active scanning (SQLi, XSS detection) sends payloads to the target.
    # Can trigger WAF blocks or affect production. User must explicitly authorize.
    active_scan_consent: Mapped[bool] = mapped_column(Boolean, default=False)

    # Custom engine parameters — per-scanner flexibility
    # Why: Enables custom wordlists, custom headers, custom payloads per scan.
    engine_params: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string

    # Credential for internal scanners — direct FK avoids 3-JOIN traversal
    # Why here: user explicitly selects which credential to use for this template.
    # Infrastructure can have multiple credentials — this field removes ambiguity.
    credential_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("credentials.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    target: Mapped["ScanTarget"] = relationship(back_populates="templates")
    credential: Mapped["Credential | None"] = relationship(back_populates="templates")
    schedules: Mapped[list["ScanSchedule"]] = relationship(back_populates="template", cascade="all, delete-orphan")
    jobs: Mapped[list["ScanJob"]] = relationship(back_populates="template", cascade="all, delete-orphan")


# ==========================================
# 5. SCAN SCHEDULES
# ==========================================

class ScanSchedule(Base, BaseMixin):
    """
    When we scan — recurring schedule configuration.
    """
    __tablename__ = "scan_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    target_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_targets.id", ondelete="CASCADE"), nullable=False)
    template_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_templates.id", ondelete="CASCADE"), nullable=False)

    # Schedule configuration
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # "Weekly Full Scan"
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)  # "hourly", "daily", "weekly", "monthly"
    cron_expression: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Optional cron override: "0 2 * * 1"

    # Schedule state
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_run_status: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "success", "failed", "cancelled"

    # Relationships
    target: Mapped["ScanTarget"] = relationship(back_populates="schedules")
    template: Mapped["ScanTemplate"] = relationship(back_populates="schedules")
    jobs: Mapped[list["ScanJob"]] = relationship(back_populates="schedule", cascade="all, delete-orphan")


# ==========================================
# 6. SCAN JOBS
# ==========================================

class ScanJob(Base, BaseMixin):
    """
    Tracks a single scan execution — what was scanned, when, status, results summary.
    Created manually (user clicks "Scan Now") or automatically (scheduler triggers).
    """
    __tablename__ = "scan_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    target_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_targets.id", ondelete="CASCADE"), nullable=False)
    template_id: Mapped[int] = mapped_column(Integer, ForeignKey("scan_templates.id", ondelete="CASCADE"), nullable=False)
    schedule_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("scan_schedules.id", ondelete="SET NULL"), nullable=True)
    # Why SET NULL on schedule: if schedule is deleted, keep historical job records

    # Job lifecycle
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")  # "pending", "running", "completed", "failed", "cancelled"
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)  # completed_at - started_at

    # Execution details
    # Why separate from template.scan_types: template may change after job runs, this preserves what actually ran
    scan_types_run: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Comma-separated

    # Results summary — denormalized counts for quick display without joining findings/assets
    total_findings: Mapped[int] = mapped_column(Integer, default=0)
    critical_count: Mapped[int] = mapped_column(Integer, default=0)
    high_count: Mapped[int] = mapped_column(Integer, default=0)
    medium_count: Mapped[int] = mapped_column(Integer, default=0)
    low_count: Mapped[int] = mapped_column(Integer, default=0)
    info_count: Mapped[int] = mapped_column(Integer, default=0)
    total_assets: Mapped[int] = mapped_column(Integer, default=0)

    # Execution context
    # Why: "cloud" = scanned from Cystene servers. "remote_agent" = scanned from agent in client's network (future).
    execution_point: Mapped[str] = mapped_column(String(50), default="cloud")

    # Security score — executive dashboard metric
    # Why: 0-100 score computed at scan completion. Executives need one number for board reporting.
    security_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Error tracking
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    target: Mapped["ScanTarget"] = relationship(back_populates="jobs")
    template: Mapped["ScanTemplate"] = relationship(back_populates="jobs")
    schedule: Mapped["ScanSchedule | None"] = relationship(back_populates="jobs")
    findings: Mapped[list["Finding"]] = relationship(back_populates="scan_job", cascade="all, delete-orphan", foreign_keys="[Finding.scan_job_id]")
    assets: Mapped[list["Asset"]] = relationship(back_populates="scan_job", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="scan_job")
