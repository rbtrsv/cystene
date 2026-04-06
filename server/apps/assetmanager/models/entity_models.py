from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Numeric, UniqueConstraint
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
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)

    # Discovery — allows entity to be found by other organizations via search
    # Why: enables cross-org stakeholder creation without granting data access
    is_discoverable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Invite code — private access without public discovery
    # Why: admin generates code, shares privately, recipient joins instantly as VIEWER
    # NULL = no code generated. Unique = each code maps to exactly one entity.
    invite_code: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)

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
        back_populates="entity", cascade="all, delete-orphan",
        foreign_keys="[Stakeholder.entity_id]"
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

    # Invitation type — explicit direction discriminator for auth logic
    # Why: EntityOrganizationInvitation is used bidirectionally:
    #   - 'invite' = entity admin invites an organization (forward direction)
    #   - 'request' = organization requests access to entity (reverse direction, claim flow)
    # Accept/reject auth depends on this: invite → org member decides, request → entity admin decides
    invitation_type: Mapped[str] = mapped_column(String(20), default="invite", nullable=False)

    # Relationships
    entity: Mapped["Entity"] = relationship(back_populates="entity_organization_invitations")
    # Note: organization and invited_by relationships would be defined if those models are available


class Stakeholder(Base, BaseMixin):
    """
    Represents any party with a stake in an entity.
    - Can be investors (LPs), fund managers (GPs), employees, etc.
    - Every stakeholder IS an entity (source_entity_id NOT NULL) — name comes from entity
    - entity_id = the cap table this stakeholder sits on (NOT NULL, CASCADE)
    - source_entity_id = the investing entity (NOT NULL, RESTRICT — can't delete entity with active positions)
    """
    __tablename__ = "stakeholders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Core fields
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'general_partner', 'limited_partner', 'employee', etc.
    # CASCADE: stakeholder sits on this entity's cap table — if entity is deleted, stakeholder goes with it
    entity_id: Mapped[int] = mapped_column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)

    # Entity proxy — the investing entity. Name comes from this entity.
    # RESTRICT: can't delete an entity that has active positions on other cap tables
    source_entity_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("entities.id", ondelete="RESTRICT"), nullable=False
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
    entity: Mapped["Entity"] = relationship(
        "Entity", back_populates="stakeholders", foreign_keys=[entity_id]
    )
    source_entity: Mapped["Entity"] = relationship(
        "Entity", foreign_keys=[source_entity_id]
    )
