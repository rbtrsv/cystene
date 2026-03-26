from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional
from core.db import Base
from .mixin_models import BaseMixin


class Entity(Base, BaseMixin):
    """
    Core model representing any financial entity (company or fund).
    - Can be a traditional company or a fund
    - Can raise money from other entities
    - Can invest in other entities
    - Has its own financials and KPIs
    - Can have a parent entity (e.g., a portfolio company has a fund as parent)
    - Belongs to an organization that controls access
    - Ownership structure tracked through OwnershipSnapshot
    """
    __tablename__ = "entities"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'fund', 'company', 'individual'
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=True)
    current_valuation: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    cash_balance: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)

    # Self-referencing relationship for parent/child entities
    parent: Mapped[Optional["Entity"]] = relationship("Entity", remote_side=[id], back_populates="assets")
    assets: Mapped[list["Entity"]] = relationship("Entity", back_populates="parent")

    # Relationships
    entity_organization_members: Mapped[list["EntityOrganizationMember"]] = relationship(
        back_populates="entity", cascade="all, delete-orphan"
    )
    entity_organization_invitations: Mapped[list["EntityOrganizationInvitation"]] = relationship(
        back_populates="entity", cascade="all, delete-orphan"
    )
    stakeholders: Mapped[list["Stakeholder"]] = relationship(
        back_populates="entity", cascade="all, delete-orphan"
    )


class EntityOrganizationMember(Base, BaseMixin):
    """
    Links organizations to entities with specific roles.

    This model enables organization-level access to entities:
    - An organization can have one role per entity
    - Roles determine what actions organization members can perform
    - Similar structure to OrganizationMember for consistency
    """
    __tablename__ = "entity_organization_members"
    __table_args__ = (UniqueConstraint('organization_id', 'entity_id'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="VIEWER", nullable=False)  # 'OWNER', 'ADMIN', 'EDITOR', 'VIEWER'
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    entity: Mapped["Entity"] = relationship(back_populates="entity_organization_members")
    # Note: organization relationship would be defined if Organization model is available


class EntityOrganizationInvitation(Base, BaseMixin):
    """
    Invitation system for entity-organization access.

    Allows entities to invite organizations to access entity data.
    """
    __tablename__ = "entity_organization_invitations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="VIEWER", nullable=False)
    invited_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)  # 'PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'

    # Relationships
    entity: Mapped["Entity"] = relationship(back_populates="entity_organization_invitations")
    # Note: organization and invited_by relationships would be defined if those models are available


class Stakeholder(Base, BaseMixin):
    """
    Represents any party with a stake in an entity.
    - Can be investors (LPs), fund managers (GPs), employees, etc.
    - When a Syndicate invests in an entity, a Stakeholder proxy is auto-created
      with source_syndicate_id pointing back to the Syndicate
    """
    __tablename__ = "stakeholders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'general_partner', 'limited_partner', 'employee', etc.
    # SET NULL: stakeholder sits on another entity's cap table. If the linked entity deletes
    # its account, the stakeholder record stays (name, securities, transactions intact) — just loses the entity link.
    entity_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("entities.id", ondelete="SET NULL"), nullable=True)

    # Syndicate proxy — when a Syndicate invests in this entity, this field links back to the Syndicate
    source_syndicate_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("syndicates.id", ondelete="SET NULL"), nullable=True
    )

    # Investment Rights
    carried_interest_percentage: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    preferred_return_rate: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    distribution_tier: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Governance Rights
    board_seats: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    voting_rights: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    pro_rata_rights: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    drag_along: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tag_along: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    observer_rights: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Investment Terms
    minimum_investment: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    maximum_investment: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    # Relationships
    entity: Mapped[Optional["Entity"]] = relationship(back_populates="stakeholders")
    source_syndicate: Mapped[Optional["Syndicate"]] = relationship(
        "Syndicate", back_populates="stakeholder_proxies", foreign_keys=[source_syndicate_id]
    )


class Syndicate(Base, BaseMixin):
    """
    Independent investment vehicle owned/managed by an Entity.
    - NOT a type of Stakeholder (no inheritance)
    - entity_id = the managing entity (mutable — management can be transferred)
    - Can invest across MANY entities — appears in cap tables via Stakeholder proxies
      (Stakeholder.source_syndicate_id points back here)
    - Members are entities from ANY organization (cross-org by design)
    - Internal secondary market via SyndicateTransaction
    """
    __tablename__ = "syndicates"

    # Own PK — NOT a FK to stakeholders
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Managing entity — the entity that created/controls this syndicate (mutable)
    # RESTRICT: syndicate has members from other organizations — deleting the managing entity
    # would silently destroy their positions. Must transfer management or dissolve syndicate first.
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="RESTRICT"), nullable=False)

    # Core fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    carried_interest_percentage: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    minimum_investment: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    maximum_investment: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    # Relationships
    entity: Mapped["Entity"] = relationship("Entity", foreign_keys=[entity_id])
    memberships: Mapped[list["SyndicateMember"]] = relationship(back_populates="syndicate", cascade="all, delete-orphan")
    transactions: Mapped[list["SyndicateTransaction"]] = relationship(back_populates="syndicate", cascade="all, delete-orphan")
    stakeholder_proxies: Mapped[list["Stakeholder"]] = relationship(
        "Stakeholder", back_populates="source_syndicate", foreign_keys="[Stakeholder.source_syndicate_id]"
    )


class SyndicateMember(Base, BaseMixin):
    """
    Represents an entity's participation in a syndicate.
    - member_entity_id → FK to entities (NOT stakeholders)
    - Members can be entities from ANY organization (cross-org by design)
    """
    __tablename__ = "syndicate_members"
    __table_args__ = (UniqueConstraint('syndicate_id', 'member_entity_id'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    syndicate_id: Mapped[int] = mapped_column(Integer, ForeignKey("syndicates.id", ondelete="CASCADE"), nullable=False)
    member_entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    ownership_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    investment_amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    joined_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    syndicate: Mapped["Syndicate"] = relationship(back_populates="memberships", foreign_keys=[syndicate_id])
    member_entity: Mapped["Entity"] = relationship("Entity", foreign_keys=[member_entity_id])


class SyndicateTransaction(Base, BaseMixin):
    """
    Internal ledger for syndicate member-to-member transfers (secondary market).
    - Entity A sells its position in the syndicate to Entity D
    - Entity cap tables where the syndicate invests are UNCHANGED
    - Only the internal split between members changes
    - Flow: seller initiates → buyer accepts → optionally manager approves → completed
    """
    __tablename__ = "syndicate_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    syndicate_id: Mapped[int] = mapped_column(Integer, ForeignKey("syndicates.id", ondelete="CASCADE"), nullable=False)

    # Transaction type — 'transfer' (member sells to another), 'allocation_change' (manager adjusts)
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Parties
    seller_entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    buyer_entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)

    # Transfer details
    ownership_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    # Status flow: pending_buyer → pending_manager → completed (or rejected at any step)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # 'pending_buyer', 'pending_manager', 'completed', 'rejected'
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Model-specific timestamps (NOT from BaseMixin)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    syndicate: Mapped["Syndicate"] = relationship(back_populates="transactions", foreign_keys=[syndicate_id])
    seller_entity: Mapped["Entity"] = relationship("Entity", foreign_keys=[seller_entity_id])
    buyer_entity: Mapped["Entity"] = relationship("Entity", foreign_keys=[buyer_entity_id])
