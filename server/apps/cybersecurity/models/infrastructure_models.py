"""
Cybersecurity Models — Infrastructure Domain

What the user owns, how they connect, what they scan.
3 classes with FK relations between them — kept in one file to avoid circular imports.
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from core.db import Base
from .mixin_models import BaseMixin


# ==========================================
# 1. INFRASTRUCTURE
# ==========================================

class Infrastructure(Base, BaseMixin):
    """
    What the user owns — a server, application, database, network device, or cloud account.
    Provides business context (environment, criticality, owner) that makes scan findings actionable.

    Why this entity: Without it, a finding is "port 3306 open on 91.98.44.218".
    With it, the same finding is "port 3306 open on Production Database Server (critical, Data Team)".
    Same pattern as Entity in FinPy (Organization → Entity → children).
    """
    __tablename__ = "infrastructure"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # What it is
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    infra_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "server", "application", "database", "network_device", "cloud_service", "cloud_account"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Business context — this is the value that makes the product worth paying for
    environment: Mapped[str] = mapped_column(String(50), default="production")  # "production", "staging", "development", "testing"
    criticality: Mapped[str] = mapped_column(String(50), default="medium")  # "critical", "high", "medium", "low"
    owner: Mapped[str | None] = mapped_column(String(255), nullable=True)  # "Backend Team", "DevOps", a person's name
    # Why owner is String not FK: teams/people change, owner is descriptive context not a strict relationship

    # Technical identifiers (optional — user fills in what they know)
    # Why all nullable: not all infrastructure has all fields (a cloud service has no IP, a network device has no URL)
    ip_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hostname: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cloud_provider: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "aws", "hetzner", "gcp", "azure", "digitalocean"
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "eu-central-1", "fsn1", "us-east-1"

    # Metadata
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Comma-separated
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    credentials: Mapped[list["Credential"]] = relationship(back_populates="infrastructure", cascade="all, delete-orphan")
    scan_targets: Mapped[list["ScanTarget"]] = relationship(back_populates="infrastructure", cascade="all, delete-orphan")


# ==========================================
# 2. CREDENTIALS
# ==========================================

class Credential(Base, BaseMixin):
    """
    Encrypted credentials for internal scanning — SSH keys, cloud API keys, domain passwords.

    Why separate entity (not fields on Infrastructure): A credential may be used for multiple
    infrastructure items. Same decoupling as ecommerce WidgetAPIKey (separate from EcommerceConnection).

    Security: encrypted_value is Fernet-encrypted (AES-128-CBC). Decrypted only at scan time.
    Same pattern as ecommerce WidgetAPIKey.api_key_encrypted.
    """
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    infrastructure_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("infrastructure.id", ondelete="SET NULL"), nullable=True)
    # Why SET NULL: credential survives infrastructure deletion (can be reassigned)
    # Why nullable: credential can be created before linking to infrastructure

    # Credential identification
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # "Production SSH Key", "AWS Prod API Key"
    cred_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "ssh_key", "ssh_password", "api_key", "domain_credentials", "service_account"

    # Encrypted value — Fernet symmetric encryption
    # Why Text: encrypted values are base64 strings, SSH private keys can be very long
    encrypted_value: Mapped[str] = mapped_column(Text, nullable=False)

    # Metadata (unencrypted — safe to store in plain text)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)  # SSH username, API key ID, domain\username
    extra_metadata: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: {"port": 22, "region": "eu-central-1"}
    # Why "extra_metadata" not "metadata": SQLAlchemy reserves "metadata" attribute on declarative models

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    infrastructure: Mapped["Infrastructure | None"] = relationship(back_populates="credentials")
    templates: Mapped[list["ScanTemplate"]] = relationship(back_populates="credential")


# ==========================================
# 3. SCAN TARGETS
# ==========================================

class ScanTarget(Base, BaseMixin):
    """
    What we scan — a domain, IP address, IP range, or URL.
    Optionally linked to Infrastructure for business context.
    """
    __tablename__ = "scan_targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    infrastructure_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("infrastructure.id", ondelete="SET NULL"), nullable=True)
    # Why nullable: user can scan without describing infrastructure first
    # Why SET NULL: target survives infrastructure deletion

    # Target identification
    name: Mapped[str] = mapped_column(String(255), nullable=False)  # "Production API", "Corporate Website"
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "domain", "ip", "ip_range", "url"
    target_value: Mapped[str] = mapped_column(String(500), nullable=False)  # "example.com", "192.168.1.0/24"

    # Verification — proves ownership before allowing scans
    # Why: prevents scanning targets you don't own (legal + ethical requirement)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_method: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "dns_txt", "file_upload", "meta_tag"
    verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Metadata
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Comma-separated
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)  # Soft toggle — disables scheduling without deleting

    # Relationships
    infrastructure: Mapped["Infrastructure | None"] = relationship(back_populates="scan_targets")
    templates: Mapped[list["ScanTemplate"]] = relationship(back_populates="target", cascade="all, delete-orphan")
    schedules: Mapped[list["ScanSchedule"]] = relationship(back_populates="target", cascade="all, delete-orphan")
    jobs: Mapped[list["ScanJob"]] = relationship(back_populates="target", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="target", cascade="all, delete-orphan")
