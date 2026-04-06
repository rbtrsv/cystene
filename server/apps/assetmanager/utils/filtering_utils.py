"""
AssetManager Filtering Utilities — Query-Level Access Control
=============================================================

This module handles access control for LIST endpoints. While dependency_utils
checks "does this user have access to THIS entity?", filtering_utils answers
"WHICH entities can this user access?" and applies that as a query filter.

Core Pattern:
    Every list endpoint follows the same flow:
    1. get_user_entity_ids(user_id, session) → list of entity IDs user can access
    2. query.filter(Model.entity_id.in_(entity_ids)) → scope query to accessible data
    3. apply_soft_delete_filter(query, Model) → exclude soft-deleted records

Key Functions:

    get_user_entity_ids(user_id, session, entity_type=None, min_role=None)
        The foundation. Returns all entity IDs the user can access through
        ANY of their organizations. Traverses User → OrganizationMember →
        EntityOrganizationMember → Entity. Supports optional entity_type
        and min_role filters.

    apply_soft_delete_filter(query, model)
        Adds WHERE deleted_at IS NULL. Applied to every query. Every
        assetmanager model has deleted_at from BaseMixin.

    apply_entity_access_filter(query, user_id, session, entity_column, ...)
        Generic version: applies entity access filtering to any query given
        the column that holds the entity_id reference.

Model-Specific Filters:
    Pre-built query modifiers for common models. Each calls
    get_user_entity_ids() internally, then filters the appropriate FK column:

    filter_entities_query         — filters Entity.id
    filter_stakeholders_query     — filters Stakeholder.entity_id
    filter_funding_rounds_query   — filters FundingRound.entity_id
    filter_securities_query       — filters Security.funding_round_id (via funding round access)
    filter_security_transactions_query — filters SecurityTransaction.funding_round_id
    filter_financial_statements_query  — filters IncomeStatement.entity_id
    filter_holdings_query         — filters Holding.entity_id
    filter_deal_pipeline_query    — filters DealPipeline.entity_id

Advanced Filtering:
    filter_by_entity_type_and_role  — combined entity_type + min_role filter
    get_entity_ids_by_type          — entity IDs filtered by type (fund/company/individual)
    get_fund_entity_ids / get_company_entity_ids / get_individual_entity_ids — shortcuts

Role-Based Filtering:
    get_entity_ids_with_minimum_role — entity IDs where user has >= min_role
    get_editable_entity_ids          — EDITOR or higher
    get_manageable_entity_ids        — ADMIN or higher
    get_owned_entity_ids             — OWNER only

Cross-Entity Filtering:
    filter_cross_entity_query(query, user_id, session, source_col, target_col)
        For relationships where user needs access to BOTH sides (e.g., deals
        between two entities). Filters both source and target entity columns
        against the user's accessible entity IDs.

Caching:
    AccessFilterContext(user_id, session)
        Caching wrapper for multi-query endpoints to avoid redundant DB calls.
        Caches entity IDs, fund IDs, and company IDs. Use when an endpoint
        needs to check access multiple times in the same request.

Utility Functions:
    create_empty_result_filter  — returns a filter that matches nothing
    has_access_to_any_entity    — boolean check
    count_accessible_entities   — count of accessible entities
"""

from typing import List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.sql.selectable import Select

from ..models.entity_models import Entity, EntityOrganizationMember, Stakeholder
from ..models.captable_models import FundingRound, Security, SecurityTransaction
from ..models.financial_models import IncomeStatement
from ..models.holding_models import DealPipeline, Holding
from apps.accounts.models import OrganizationMember
from .dependency_utils import ENTITY_TYPES, ENTITY_ROLES


# ==========================================
# Soft Delete Filtering
# ==========================================

def apply_soft_delete_filter(query: Select, model: Any) -> Select:
    """
    Filter out soft-deleted records.

    Adds WHERE deleted_at IS NULL to the query.
    Every assetmanager model has deleted_at from BaseMixin.

    Args:
        query: SQLAlchemy query to filter
        model: The model class (e.g., Entity, Stakeholder, FundingRound)

    Returns:
        Filtered query excluding soft-deleted records
    """
    return query.filter(model.deleted_at.is_(None))


# ==========================================
# Entity Access Filtering
# ==========================================

async def get_user_entity_ids(
    user_id: int, 
    session: AsyncSession, 
    entity_type: Optional[str] = None,
    min_role: Optional[str] = None
) -> List[int]:
    """
    Get entity IDs that a user has access to
    
    Args:
        user_id: ID of the user
        session: Database session  
        entity_type: Optional filter by entity type (fund, company, individual)
        min_role: Optional minimum role required (VIEWER, EDITOR, ADMIN, OWNER)
        
    Returns:
        List of entity IDs the user can access
    """
    # Get ALL user's organizations (user can be member of multiple orgs)
    result = await session.execute(
        select(OrganizationMember.organization_id)
        .filter(OrganizationMember.user_id == user_id)
    )
    user_org_ids = result.scalars().all()

    if not user_org_ids:
        return []

    # Build query for entity access (exclude soft-deleted memberships and entities)
    query = (
        select(Entity.id)
        .join(EntityOrganizationMember)
        .filter(
            EntityOrganizationMember.organization_id.in_(user_org_ids),
            EntityOrganizationMember.deleted_at.is_(None),
            Entity.deleted_at.is_(None)
        )
    )
    
    # Apply entity type filter
    if entity_type and entity_type in ENTITY_TYPES:
        query = query.filter(Entity.entity_type == entity_type)
    
    # Apply role filter
    if min_role and min_role in ENTITY_ROLES:
        min_role_index = ENTITY_ROLES.index(min_role)
        allowed_roles = ENTITY_ROLES[min_role_index:]
        query = query.filter(EntityOrganizationMember.role.in_(allowed_roles))
    
    result = await session.execute(query)
    return result.scalars().all()


async def get_accessible_stakeholder_ids(user_id: int, session: AsyncSession) -> List[int]:
    """
    Get stakeholder IDs that a user has access to through entity access
    
    Args:
        user_id: ID of the user
        session: Database session
        
    Returns:
        List of stakeholder IDs the user can access
    """
    entity_ids = await get_user_entity_ids(user_id, session)
    
    if not entity_ids:
        return []
    
    # Get stakeholders for accessible entities
    result = await session.execute(
        select(Stakeholder.id)
        .filter(Stakeholder.entity_id.in_(entity_ids))
    )
    return result.scalars().all()


async def get_accessible_funding_round_ids(user_id: int, session: AsyncSession) -> List[int]:
    """
    Get funding round IDs that a user has access to through entity access
    
    Args:
        user_id: ID of the user
        session: Database session
        
    Returns:
        List of funding round IDs the user can access
    """
    entity_ids = await get_user_entity_ids(user_id, session)
    
    if not entity_ids:
        return []
    
    # Get funding rounds for accessible entities
    result = await session.execute(
        select(FundingRound.id)
        .filter(FundingRound.entity_id.in_(entity_ids))
    )
    return result.scalars().all()


# ==========================================
# Query Filtering Functions
# ==========================================

async def apply_entity_access_filter(
    query: Select, 
    user_id: int, 
    session: AsyncSession,
    entity_column: Any,
    entity_type: Optional[str] = None,
    min_role: Optional[str] = None
) -> Select:
    """
    Apply entity access filtering to a SQLAlchemy query
    
    Args:
        query: SQLAlchemy query to filter
        user_id: ID of the user
        session: Database session
        entity_column: Column that contains entity_id to filter on
        entity_type: Optional entity type filter
        min_role: Optional minimum role filter
        
    Returns:
        Filtered query
    """
    accessible_entity_ids = await get_user_entity_ids(user_id, session, entity_type, min_role)
    
    if not accessible_entity_ids:
        # User has no access - return query that will return no results
        return query.filter(entity_column.in_([]))
    
    return query.filter(entity_column.in_(accessible_entity_ids))


async def filter_entities_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter entities query based on user access"""
    return await apply_entity_access_filter(query, user_id, session, Entity.id)


async def filter_stakeholders_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter stakeholders query based on user's entity access"""
    accessible_entity_ids = await get_user_entity_ids(user_id, session)
    
    if not accessible_entity_ids:
        return query.filter(Stakeholder.entity_id.in_([]))
    
    return query.filter(Stakeholder.entity_id.in_(accessible_entity_ids))


async def filter_funding_rounds_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter funding rounds query based on user's entity access"""
    return await apply_entity_access_filter(query, user_id, session, FundingRound.entity_id)


async def filter_securities_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter securities query based on user's funding round access"""
    accessible_round_ids = await get_accessible_funding_round_ids(user_id, session)
    
    if not accessible_round_ids:
        return query.filter(Security.funding_round_id.in_([]))
    
    return query.filter(Security.funding_round_id.in_(accessible_round_ids))


async def filter_security_transactions_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter security transactions query based on user's funding round access"""
    accessible_round_ids = await get_accessible_funding_round_ids(user_id, session)
    
    if not accessible_round_ids:
        return query.filter(SecurityTransaction.funding_round_id.in_([]))
    
    return query.filter(SecurityTransaction.funding_round_id.in_(accessible_round_ids))


async def filter_financial_statements_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter financial statements query based on user's entity access"""
    return await apply_entity_access_filter(query, user_id, session, IncomeStatement.entity_id)


async def filter_holdings_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter holdings query based on user's entity access"""
    return await apply_entity_access_filter(query, user_id, session, Holding.entity_id)


async def filter_deal_pipeline_query(query: Select, user_id: int, session: AsyncSession) -> Select:
    """Filter deal pipeline query based on user's entity access"""
    return await apply_entity_access_filter(query, user_id, session, DealPipeline.entity_id)


# ==========================================
# Advanced Filtering
# ==========================================

async def filter_by_entity_type_and_role(
    query: Select,
    user_id: int,
    session: AsyncSession,
    entity_column: Any,
    entity_type: Optional[str] = None,
    min_role: Optional[str] = None
) -> Select:
    """
    Advanced filtering by entity type and minimum role
    
    Args:
        query: SQLAlchemy query to filter
        user_id: ID of the user
        session: Database session
        entity_column: Column that contains entity_id
        entity_type: Optional entity type filter (fund, company, individual)
        min_role: Optional minimum role (VIEWER, EDITOR, ADMIN, OWNER)
        
    Returns:
        Filtered query
    """
    return await apply_entity_access_filter(query, user_id, session, entity_column, entity_type, min_role)


async def get_entity_ids_by_type(
    user_id: int,
    session: AsyncSession,
    entity_type: str
) -> List[int]:
    """
    Get entity IDs filtered by specific type
    
    Args:
        user_id: ID of the user
        session: Database session
        entity_type: Type of entity (fund, company, individual)
        
    Returns:
        List of entity IDs of the specified type
    """
    if entity_type not in ENTITY_TYPES:
        return []
    
    return await get_user_entity_ids(user_id, session, entity_type)


async def get_fund_entity_ids(user_id: int, session: AsyncSession) -> List[int]:
    """Get fund entity IDs user has access to"""
    return await get_entity_ids_by_type(user_id, session, 'fund')


async def get_company_entity_ids(user_id: int, session: AsyncSession) -> List[int]:
    """Get company entity IDs user has access to"""
    return await get_entity_ids_by_type(user_id, session, 'company')


async def get_individual_entity_ids(user_id: int, session: AsyncSession) -> List[int]:
    """Get individual entity IDs user has access to"""
    return await get_entity_ids_by_type(user_id, session, 'individual')


# ==========================================
# Role-Based Filtering
# ==========================================

async def get_entity_ids_with_minimum_role(
    user_id: int,
    session: AsyncSession,
    min_role: str
) -> List[int]:
    """
    Get entity IDs where user has at least the specified role
    
    Args:
        user_id: ID of the user
        session: Database session
        min_role: Minimum role required (VIEWER, EDITOR, ADMIN, OWNER)
        
    Returns:
        List of entity IDs where user has sufficient role
    """
    if min_role not in ENTITY_ROLES:
        return []
    
    return await get_user_entity_ids(user_id, session, min_role=min_role)


async def get_editable_entity_ids(user_id: int, session: AsyncSession) -> List[int]:
    """Get entity IDs where user can edit (EDITOR or higher)"""
    return await get_entity_ids_with_minimum_role(user_id, session, 'EDITOR')


async def get_manageable_entity_ids(user_id: int, session: AsyncSession) -> List[int]:
    """Get entity IDs where user can manage (ADMIN or higher)"""
    return await get_entity_ids_with_minimum_role(user_id, session, 'ADMIN')


async def get_owned_entity_ids(user_id: int, session: AsyncSession) -> List[int]:
    """Get entity IDs where user is owner"""
    return await get_entity_ids_with_minimum_role(user_id, session, 'OWNER')


# ==========================================
# Multi-Entity Filtering
# ==========================================

async def filter_cross_entity_query(
    query: Select,
    user_id: int,
    session: AsyncSession,
    source_entity_column: Any,
    target_entity_column: Any
) -> Select:
    """
    Filter queries that involve relationships between entities
    
    Args:
        query: SQLAlchemy query to filter
        user_id: ID of the user
        session: Database session
        source_entity_column: Column for source entity ID
        target_entity_column: Column for target entity ID
        
    Returns:
        Filtered query where user has access to both entities
    """
    accessible_entity_ids = await get_user_entity_ids(user_id, session)
    
    if not accessible_entity_ids:
        return query.filter(source_entity_column.in_([]))
    
    return query.filter(
        and_(
            source_entity_column.in_(accessible_entity_ids),
            target_entity_column.in_(accessible_entity_ids)
        )
    )


# ==========================================
# Utility Functions
# ==========================================

def create_empty_result_filter(column: Any) -> Any:
    """Create a filter that returns no results"""
    return column.in_([])


async def has_access_to_any_entity(user_id: int, session: AsyncSession) -> bool:
    """Check if user has access to any entity"""
    entity_ids = await get_user_entity_ids(user_id, session)
    return len(entity_ids) > 0


async def count_accessible_entities(
    user_id: int,
    session: AsyncSession,
    entity_type: Optional[str] = None
) -> int:
    """Count how many entities user has access to"""
    entity_ids = await get_user_entity_ids(user_id, session, entity_type)
    return len(entity_ids)


class AccessFilterContext:
    """Context class to manage access filtering for a user"""
    
    def __init__(self, user_id: int, session: AsyncSession):
        self.user_id = user_id
        self.session = session
        self._entity_ids_cache: Optional[List[int]] = None
        self._fund_ids_cache: Optional[List[int]] = None
        self._company_ids_cache: Optional[List[int]] = None
    
    async def get_accessible_entity_ids(self) -> List[int]:
        """Get all accessible entity IDs (cached)"""
        if self._entity_ids_cache is None:
            self._entity_ids_cache = await get_user_entity_ids(self.user_id, self.session)
        return self._entity_ids_cache
    
    async def get_accessible_fund_ids(self) -> List[int]:
        """Get accessible fund entity IDs (cached)"""
        if self._fund_ids_cache is None:
            self._fund_ids_cache = await get_fund_entity_ids(self.user_id, self.session)
        return self._fund_ids_cache
    
    async def get_accessible_company_ids(self) -> List[int]:
        """Get accessible company entity IDs (cached)"""
        if self._company_ids_cache is None:
            self._company_ids_cache = await get_company_entity_ids(self.user_id, self.session)
        return self._company_ids_cache
    
    async def filter_entity_query(self, query: Select) -> Select:
        """Apply entity filtering to a query"""
        entity_ids = await self.get_accessible_entity_ids()
        if not entity_ids:
            return query.filter(Entity.id.in_([]))
        return query.filter(Entity.id.in_(entity_ids))
    
    def invalidate_cache(self):
        """Invalidate cached entity IDs"""
        self._entity_ids_cache = None
        self._fund_ids_cache = None
        self._company_ids_cache = None