from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime, timezone
from typing import Optional
from core.db import Base



class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="MEMBER", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    tokens: Mapped[list["Token"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    memberships: Mapped[list["OrganizationMember"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sent_invitations: Mapped[list["OrganizationInvitation"]] = relationship(back_populates="invited_by", cascade="all, delete-orphan")
    activity_logs: Mapped[list["AccountsAuditLog"]] = relationship(back_populates="user")
    
    def soft_delete(self):
        self.deleted_at = datetime.now(timezone.utc)
    
    @property
    def is_active(self):
        return self.deleted_at is None


class Token(Base):
    __tablename__ = "tokens"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    access_token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    refresh_token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="tokens")


class Organization(Base):
    __tablename__ = "organizations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    members: Mapped[list["OrganizationMember"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    subscription: Mapped[Optional["Subscription"]] = relationship(back_populates="organization", uselist=False, cascade="all, delete-orphan")
    invitations: Mapped[list["OrganizationInvitation"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    activity_logs: Mapped[list["AccountsAuditLog"]] = relationship(back_populates="organization", cascade="all, delete-orphan")



class OrganizationMember(Base):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint('user_id', 'organization_id'),)
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="VIEWER", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="memberships")
    organization: Mapped["Organization"] = relationship(back_populates="members")



class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
    stripe_product_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan_name: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subscription_status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Bypass Stripe — treat subscription as active regardless of Stripe status.
    # For clients paying via invoice/bank transfer instead of Stripe.
    # Set via database management tool (e.g. DBeaver): UPDATE subscriptions SET manual_override = true WHERE organization_id = X
    manual_override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="subscription")



class OrganizationInvitation(Base):
    __tablename__ = "organization_invitations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    invited_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="invitations")
    invited_by: Mapped["User"] = relationship(back_populates="sent_invitations")


class AccountsAuditLog(Base):
    __tablename__ = "accounts_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # What was affected
    table_name: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "users", "organizations"
    record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # ID of affected record

    action: Mapped[str] = mapped_column(Text, nullable=False)

    # Data change snapshots
    old_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # State before change
    new_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # State after change

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(back_populates="activity_logs")
    user: Mapped[Optional["User"]] = relationship(back_populates="activity_logs")