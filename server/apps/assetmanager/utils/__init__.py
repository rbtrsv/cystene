"""
AssetManager Utilities Package

This package provides utilities for handling dependencies, filtering, and audit logging
in the AssetManager application. It supports the User → Organization → Entity access pattern.

Main Components:
- dependency_utils: FastAPI dependencies for entity access control and permission checking
- filtering_utils: Query filtering utilities for data access control and soft delete
- audit_utils: Explicit audit logging for all CRUD operations

Usage Examples:

# FastAPI Dependencies
from .dependency_utils import require_entity_role, get_accessible_entities

@router.put('/entities/{entity_id}')
async def update_entity(
    entity_id: int,
    entity: Entity = Depends(require_entity_role(['EDITOR', 'ADMIN', 'OWNER']))
):
    pass

# Query Filtering
from .filtering_utils import filter_entities_query, get_user_entity_ids, apply_soft_delete_filter

accessible_entities = await get_user_entity_ids(user.id, session, entity_type='fund')
filtered_query = await filter_entities_query(query, user.id, session)
query = apply_soft_delete_filter(query, Entity)

# Audit Logging
from .audit_utils import log_audit

await log_audit(session=db, table_name="entities", record_id=entity.id, action="INSERT",
                new_data=data.model_dump(), user_id=user.id, organization_id=org_id)
"""

from .dependency_utils import (
    # Constants
    ENTITY_ROLES,
    ENTITY_TYPES,

    # Helper Functions
    get_user_organization_id,
    get_entity_access,
    validate_role,

    # FastAPI Dependencies
    require_entity_role,
    get_accessible_entities,
)

from .filtering_utils import (
    # Soft Delete Filtering
    apply_soft_delete_filter,

    # Entity Access Filtering
    get_user_entity_ids,
    get_accessible_stakeholder_ids,
    get_accessible_funding_round_ids,

    # Query Filtering Functions
    apply_entity_access_filter,
    filter_entities_query,
    filter_stakeholders_query,
    filter_funding_rounds_query,
    filter_securities_query,
    filter_security_transactions_query,
    filter_financial_statements_query,
    filter_holdings_query,
    filter_deal_pipeline_query,

    # Advanced Filtering
    filter_by_entity_type_and_role,
    get_entity_ids_by_type,
    get_fund_entity_ids,
    get_company_entity_ids,
    get_individual_entity_ids,

    # Role-Based Filtering
    get_entity_ids_with_minimum_role,
    get_editable_entity_ids,
    get_manageable_entity_ids,
    get_owned_entity_ids,

    # Multi-Entity Filtering
    filter_cross_entity_query,

    # Utility Functions
    create_empty_result_filter,
    has_access_to_any_entity,
    count_accessible_entities,
    AccessFilterContext,
)

from .audit_utils import (
    # Serialization Helpers
    model_to_dict,

    # Audit Logging
    log_audit,

    # Audit Log Queries
    get_record_audit_logs,
    get_user_audit_logs,
    get_organization_audit_logs,
    get_table_audit_logs,
)

__all__ = [
    # Constants
    'ENTITY_ROLES',
    'ENTITY_TYPES',

    # Core Dependencies
    'require_entity_role',
    'get_accessible_entities',

    # Helper Functions
    'get_entity_access',
    'get_user_organization_id',
    'validate_role',

    # Soft Delete Filtering
    'apply_soft_delete_filter',

    # Filtering Utilities
    'get_user_entity_ids',
    'filter_entities_query',
    'filter_stakeholders_query',
    'get_fund_entity_ids',
    'get_company_entity_ids',
    'AccessFilterContext',

    # Serialization Helpers
    'model_to_dict',

    # Audit Logging
    'log_audit',
    'get_record_audit_logs',
    'get_user_audit_logs',
    'get_organization_audit_logs',
    'get_table_audit_logs',
]