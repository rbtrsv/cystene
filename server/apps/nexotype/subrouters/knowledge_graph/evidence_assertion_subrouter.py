from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import EvidenceAssertion
from ...schemas.knowledge_graph.evidence_assertion_schemas import (
    EvidenceAssertionCreate,
    EvidenceAssertionDetail,
    EvidenceAssertionListResponse,
    EvidenceAssertionResponse,
    EvidenceAssertionUpdate,
    MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    check_duplicate,
    create_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# Evidence Assertions Router
# ==========================================

router = APIRouter(tags=["EvidenceAssertions"])


@router.get("/", response_model=EvidenceAssertionListResponse)
async def list_evidence_assertions(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List evidence assertions with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of evidence assertions
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total evidence assertions (with filters applied)
        count_query = select(func.count(EvidenceAssertion.id))
        count_query = apply_default_filters(count_query, EvidenceAssertion, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get evidence assertions with pagination (with filters applied)
        data_query = select(EvidenceAssertion).order_by(EvidenceAssertion.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, EvidenceAssertion, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return EvidenceAssertionListResponse(
            success=True,
            data=[EvidenceAssertionDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{assertion_id}", response_model=EvidenceAssertionResponse)
async def get_evidence_assertion(
    assertion_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific evidence assertion

    This endpoint:
    1. Retrieves an evidence assertion by ID (excludes soft-deleted, enforces ownership)
    2. Returns the evidence assertion details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=EvidenceAssertion,
            item_id=assertion_id,
            user_org_id=org_id,
            entity_label="EvidenceAssertion",
        )
        return EvidenceAssertionResponse(
            success=True,
            data=EvidenceAssertionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=EvidenceAssertionResponse)
async def create_evidence_assertion(
    payload: EvidenceAssertionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new evidence assertion

    This endpoint:
    1. Checks for duplicate relationship_table + relationship_id + source_id combination
    2. Creates a new evidence assertion with the provided data
    3. Sets created_by and organization_id from user context
    4. Logs the creation to the audit log
    5. Returns the created evidence assertion details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        await check_duplicate(
            db=db,
            model=EvidenceAssertion,
            filters={
                "relationship_table": payload.relationship_table,
                "relationship_id": payload.relationship_id,
                "source_id": payload.source_id,
            },
            entity_label="EvidenceAssertion",
        )

        item = await create_with_audit(
            db=db,
            model=EvidenceAssertion,
            table_name="evidence_assertions",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return EvidenceAssertionResponse(
            success=True,
            data=EvidenceAssertionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{assertion_id}", response_model=EvidenceAssertionResponse)
async def update_evidence_assertion(
    assertion_id: int,
    payload: EvidenceAssertionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an evidence assertion

    This endpoint:
    1. Updates an evidence assertion with the provided data
    2. Checks for duplicate relationship_table + relationship_id + source_id combination (excluding self)
    3. Sets updated_by from user context
    4. Logs the update to the audit log with old/new data
    5. Returns the updated evidence assertion details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=EvidenceAssertion,
            item_id=assertion_id,
            user_org_id=org_id,
            entity_label="EvidenceAssertion",
        )

        # Check if composite key fields are changing
        update_data = payload.model_dump(exclude_unset=True)
        new_rel_table = update_data.get("relationship_table", item.relationship_table)
        new_rel_id = update_data.get("relationship_id", item.relationship_id)
        new_source_id = update_data.get("source_id", item.source_id)
        if (
            new_rel_table != item.relationship_table
            or new_rel_id != item.relationship_id
            or new_source_id != item.source_id
        ):
            await check_duplicate(
                db=db,
                model=EvidenceAssertion,
                filters={
                    "relationship_table": new_rel_table,
                    "relationship_id": new_rel_id,
                    "source_id": new_source_id,
                },
                entity_label="EvidenceAssertion",
                exclude_id=assertion_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="evidence_assertions",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return EvidenceAssertionResponse(
            success=True,
            data=EvidenceAssertionDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{assertion_id}", response_model=MessageResponse)
async def delete_evidence_assertion(
    assertion_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an evidence assertion

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=EvidenceAssertion,
            item_id=assertion_id,
            user_org_id=org_id,
            entity_label="EvidenceAssertion",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="evidence_assertions",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"EvidenceAssertion {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
