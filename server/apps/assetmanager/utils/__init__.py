"""
AssetManager Utilities Package
==============================

This package implements the entire permissions, audit, filtering, billing, and
CRUD system for the AssetManager application. Every subrouter depends on these
utilities — understanding this package means understanding the access model.

Modules:
    dependency_utils    — Core access control (single-record endpoints)
    filtering_utils     — Query-level access control (list endpoints)
    audit_utils         — Explicit audit logging for all write operations
    crud_utils          — Standard CRUD helpers that wrap audit logging
    subscription_utils  — Stripe billing and write-lock enforcement


Access Model
------------
User → Organization(s) → Entity(ies) via EntityOrganizationMember join table.

    User
     └─ OrganizationMember (user belongs to org)
         └─ EntityOrganizationMember (org has access to entity, with a role)
              └─ Entity

A user can belong to multiple organizations, and each organization can access
multiple entities. Access to an entity is always mediated through an organization.

The function get_entity_access(user_id, entity_id) traverses this chain:
    User → OrganizationMember → EntityOrganizationMember
and returns the EntityOrganizationMember row (or None if no access).


Role Hierarchy
--------------
VIEWER < EDITOR < ADMIN < OWNER  (defined in ENTITY_ROLES)

    VIEWER  — Read-only access to entity data
    EDITOR  — Read + write access to entity data
    ADMIN   — Editor + manage members, invitations, entity settings
    OWNER   — Admin + delete entity, transfer ownership

Role is stored on EntityOrganizationMember.role — it's per-org-per-entity,
not per-user globally. The same user can be OWNER of Entity A through Org 1
and VIEWER of Entity B through Org 2.


organization_id Convention
--------------------------
There are TWO different organization_id concepts:

1. Entity.organization_id — the BILLING OWNER org. The org that created the
   entity and pays for it via Stripe. Used only by subscription_utils.

2. entity_access.organization_id (EntityOrganizationMember.organization_id) —
   the ACCESS org. The org through which a user performs an operation on the
   entity. This is what gets passed to audit logs and context.

These can differ for cross-org access. Example: Org A creates Entity X
(Entity.organization_id = A). Org A grants Org B access to Entity X via
EntityOrganizationMember. When a user from Org B edits Entity X,
entity_access.organization_id = B (access org), but Entity.organization_id
still = A (billing owner).

IMPORTANT: Never use LIMIT 1 to pick "the user's org" — a user can belong
to multiple orgs. Always derive organization_id from the specific
EntityOrganizationMember row returned by get_entity_access().


Subscription Model
------------------
Quantity-based Stripe billing. See subscription_utils for full details.

    - FREE_ENTITY_LIMIT = 1 (first entity is free)
    - Entity.organization_id = billing owner org
    - Over free tier without active subscription → write-lock (reads still work)
    - manual_override flag for invoice/bank transfer clients
    - Stripe quantity synced on entity create/delete only


Soft Deletes
------------
All assetmanager records use deleted_at / deleted_by from BaseMixin.
Never hard delete. Every query must apply apply_soft_delete_filter() or
equivalent .filter(Model.deleted_at.is_(None)).


Audit Trail
-----------
Explicit log_audit() calls in endpoints — not DB triggers, not event listeners.
Every write operation (INSERT, UPDATE, DELETE) calls log_audit() with old/new
snapshots. The audit log captures: table_name, record_id, action, old_data,
new_data, user_id, organization_id (access org, not billing org).

crud_utils wraps this into create_with_audit / update_with_audit /
soft_delete_with_audit so subrouters don't call log_audit() directly.


Subrouter Contract
------------------
Every subrouter follows this standard pattern:

    LIST:   get_user_entity_ids() → filter query → apply_soft_delete_filter()
    GET:    get_record_or_404() → get_entity_access_or_403()
    CREATE: require_write_access(roles=[...]) → check_duplicate() → create_with_audit()
    UPDATE: get_record_or_404() → require_write_access(roles=[...]) → update_with_audit()
    DELETE: get_record_or_404() → require_write_access(roles=[...]) → soft_delete_with_audit()

require_write_access() returns EntityOrganizationMember, and its
.organization_id is passed through to all audit functions.

Variations from the standard pattern:

- entity_subrouter.py uses require_entity_role() (a FastAPI Depends factory)
  instead of require_write_access(), because entity CRUD endpoints have
  entity_id as a path parameter and need the Entity object directly.
  Entity create/delete also calls sync_stripe_quantity() for billing sync.

- entity_organization_invitation_subrouter.py has custom auth for
  accept/reject endpoints (invitee may not have entity access yet).
  Uses check_entity_subscription() instead of ensure_entity_subscription().

- Some endpoints add extra steps (e.g., cascading soft deletes, cross-entity
  validation) but the core access check + audit pattern remains the same.


Usage Examples
--------------
# Single-record access control (GET/UPDATE/DELETE endpoints)
from .dependency_utils import require_write_access, get_entity_access_or_403

entity_access = await require_write_access(user.id, entity_id, db, ['EDITOR', 'ADMIN', 'OWNER'])
org_id = entity_access.organization_id  # for audit context

# List endpoint filtering
from .filtering_utils import get_user_entity_ids, apply_soft_delete_filter

entity_ids = await get_user_entity_ids(user.id, db)
query = query.filter(Model.entity_id.in_(entity_ids))
query = apply_soft_delete_filter(query, Model)

# CRUD with audit
from .crud_utils import create_with_audit, update_with_audit, soft_delete_with_audit

item = await create_with_audit(db, Model, "table_name", payload, user.id, org_id)
item = await update_with_audit(db, item, "table_name", payload, user.id, org_id)
item = await soft_delete_with_audit(db, item, "table_name", user.id, org_id)
"""

from .dependency_utils import (
    # Constants
    ENTITY_ROLES,
    ENTITY_TYPES,

    # Helper Functions
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