"""
Security Subrouter

FastAPI router for Security model CRUD operations.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from core.db import get_session
from ...models.captable_models import Security, FundingRound
from ...schemas.captable_schemas.security_schemas import (
    Security as SecuritySchema,
    SecurityCreate, SecurityUpdate,
    SecurityResponse, SecuritiesResponse,
    SecurityType, Currency, AntiDilutionType, InterestRateType
)
from ...utils.dependency_utils import get_entity_access, require_write_access
from ...utils.filtering_utils import get_user_entity_ids, apply_soft_delete_filter
from ...utils.crud_utils import (
    get_record_or_404,
    create_with_audit,
    update_with_audit,
    soft_delete_with_audit,
)
from apps.accounts.utils.auth_utils import get_current_user
from apps.accounts.models import User

router = APIRouter(tags=["Securities"])

# ==========================================
# List Operations
# ==========================================

@router.get("/", response_model=SecuritiesResponse)
async def list_securities(
    funding_round_id: Optional[int] = Query(None, description="Filter by funding round"),
    security_type: Optional[SecurityType] = Query(None, description="Filter by security type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List securities for entities the user has access to.

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by entity access via funding round's entity
    3. Returns a paginated list of securities
    """
    try:
        # Get entities user has access to
        accessible_entity_ids = await get_user_entity_ids(user.id, session)

        if not accessible_entity_ids:
            return SecuritiesResponse(success=True, data=[])

        # Build query - join with FundingRound to filter by accessible entities
        query = (
            select(Security)
            .join(FundingRound, Security.funding_round_id == FundingRound.id)
            .filter(FundingRound.entity_id.in_(accessible_entity_ids))
        )
        query = apply_soft_delete_filter(query, Security)

        # Apply filters
        if funding_round_id:
            # Verify user has access to this funding round's entity
            funding_round = await session.get(FundingRound, funding_round_id)
            if funding_round:
                if funding_round.entity_id not in accessible_entity_ids:
                    raise HTTPException(status_code=403, detail="You do not have access to this funding round's entity")
            query = query.filter(Security.funding_round_id == funding_round_id)

        if security_type:
            query = query.filter(Security.security_type == security_type.value)

        if is_active is not None:
            query = query.filter(Security.is_active == is_active)

        # Apply pagination
        query = query.order_by(Security.created_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        securities = result.scalars().all()

        return SecuritiesResponse(
            success=True,
            data=[SecuritySchema.model_validate(security) for security in securities]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list securities: {str(e)}")

# ==========================================
# Individual Security Operations
# ==========================================

@router.get("/{security_id}", response_model=SecurityResponse)
async def get_security(
    security_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get security details - requires VIEW permission on funding round's entity

    This endpoint:
    1. Retrieves a security by ID (excludes soft-deleted)
    2. Returns the security details
    """
    try:
        security = await get_record_or_404(session, Security, security_id, "Security")

        # Get the associated funding round to check entity access
        funding_round = await session.get(FundingRound, security.funding_round_id)
        if not funding_round:
            raise HTTPException(status_code=404, detail="Associated funding round not found")

        # Check entity access
        entity_access = await get_entity_access(user.id, funding_round.entity_id, session)
        if not entity_access:
            raise HTTPException(status_code=403, detail="You do not have access to this security's entity")

        if entity_access.role not in ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER']:
            raise HTTPException(status_code=403, detail="You do not have VIEW permission for this entity")

        return SecurityResponse(
            success=True,
            data=SecuritySchema.model_validate(security)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get security: {str(e)}")

# ==========================================
# Create Operations
# ==========================================

@router.post("/", response_model=SecurityResponse)
async def create_security(
    data: SecurityCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create security - requires EDIT permission on funding round's entity.

    This endpoint:
    1. Creates a new security with the provided data
    2. Sets created_by from user context
    3. Logs the creation to the audit log
    4. Returns the created security details
    """
    try:
        # Verify funding round exists and get its entity_id
        funding_round = await session.get(FundingRound, data.funding_round_id)
        if not funding_round:
            raise HTTPException(status_code=404, detail="Funding round not found")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, funding_round.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        security = await create_with_audit(
            db=session,
            model=Security,
            table_name="securities",
            payload=data.model_dump(),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(security)

        return SecurityResponse(
            success=True,
            data=SecuritySchema.model_validate(security)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create security: {str(e)}")

# ==========================================
# Update Operations
# ==========================================

@router.put("/{security_id}", response_model=SecurityResponse)
async def update_security(
    security_id: int,
    data: SecurityUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Update security - requires EDIT permission on funding round's entity

    This endpoint:
    1. Updates a security with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated security details
    """
    try:
        security = await get_record_or_404(session, Security, security_id, "Security")

        # Get the associated funding round to check entity access
        funding_round = await session.get(FundingRound, security.funding_round_id)
        if not funding_round:
            raise HTTPException(status_code=404, detail="Associated funding round not found")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, funding_round.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        # If funding_round_id is being changed, verify access to new funding round
        if data.funding_round_id is not None and data.funding_round_id != security.funding_round_id:
            new_funding_round = await session.get(FundingRound, data.funding_round_id)
            if not new_funding_round:
                raise HTTPException(status_code=404, detail="New funding round not found")

            # Check access + role + subscription on new funding round's entity
            await require_write_access(user.id, new_funding_round.entity_id, session, ['EDITOR', 'ADMIN', 'OWNER'])

        await update_with_audit(
            db=session,
            item=security,
            table_name="securities",
            payload=data.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()
        await session.refresh(security)

        return SecurityResponse(
            success=True,
            data=SecuritySchema.model_validate(security)
        )

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update security: {str(e)}")

# ==========================================
# Delete Operations — Soft Delete
# ==========================================

@router.delete("/{security_id}")
async def delete_security(
    security_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Soft delete security - requires ADMIN permission on funding round's entity

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        security = await get_record_or_404(session, Security, security_id, "Security")

        # Get the associated funding round to check entity access
        funding_round = await session.get(FundingRound, security.funding_round_id)
        if not funding_round:
            raise HTTPException(status_code=404, detail="Associated funding round not found")

        # Check entity access + role + subscription
        entity_access = await require_write_access(user.id, funding_round.entity_id, session, ['ADMIN', 'OWNER'])

        security_name = security.security_name

        await soft_delete_with_audit(
            db=session,
            item=security,
            table_name="securities",
            user_id=user.id,
            organization_id=entity_access.organization_id,
        )

        await session.commit()

        return {
            "success": True,
            "message": f"Security '{security_name}' has been deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete security: {str(e)}")
