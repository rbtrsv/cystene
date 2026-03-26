from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import ExternalReference
from ...schemas.standardization.external_reference_schemas import (
    ExternalReferenceCreate,
    ExternalReferenceDetail,
    ExternalReferenceListResponse,
    ExternalReferenceResponse,
    ExternalReferenceUpdate,
    MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    check_duplicate,
    create_or_restore_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# External References Router
# ==========================================

router = APIRouter(tags=["ExternalReferences"])


@router.get("/", response_model=ExternalReferenceListResponse)
async def list_external_references(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List external references with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of external references
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total external references (with filters applied)
        count_query = select(func.count(ExternalReference.id))
        count_query = apply_default_filters(count_query, ExternalReference, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get external references with pagination (with filters applied)
        data_query = select(ExternalReference).order_by(ExternalReference.entity_type).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, ExternalReference, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return ExternalReferenceListResponse(
            success=True,
            data=[ExternalReferenceDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{external_reference_id}", response_model=ExternalReferenceResponse)
async def get_external_reference(
    external_reference_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific external reference

    This endpoint:
    1. Retrieves an external reference by ID (excludes soft-deleted, enforces ownership)
    2. Returns the external reference details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ExternalReference,
            item_id=external_reference_id,
            user_org_id=org_id,
            entity_label="ExternalReference",
        )
        return ExternalReferenceResponse(
            success=True,
            data=ExternalReferenceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=ExternalReferenceResponse)
async def create_external_reference(
    payload: ExternalReferenceCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new external reference

    This endpoint:
    1. Creates a new external reference or restores a soft-deleted one with same composite key
    2. Sets created_by and organization_id from user context
    3. Logs the creation (INSERT) or restoration (RESTORE) to the audit log
    4. Returns the created/restored external reference details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Create new or restore soft-deleted record with same composite key
        item = await create_or_restore_with_audit(
            db=db,
            model=ExternalReference,
            table_name="external_references",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
            unique_fields={
                "entity_type": payload.entity_type,
                "entity_id": payload.entity_id,
                "source": payload.source,
                "external_id": payload.external_id,
            },
            entity_label="ExternalReference",
        )

        await db.commit()
        await db.refresh(item)
        return ExternalReferenceResponse(
            success=True,
            data=ExternalReferenceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{external_reference_id}", response_model=ExternalReferenceResponse)
async def update_external_reference(
    external_reference_id: int,
    payload: ExternalReferenceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an external reference

    This endpoint:
    1. Updates an external reference with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated external reference details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ExternalReference,
            item_id=external_reference_id,
            user_org_id=org_id,
            entity_label="ExternalReference",
        )

        # Composite uniqueness check if any key field changed
        update_data = payload.model_dump(exclude_unset=True)
        new_entity_type = update_data.get("entity_type", item.entity_type)
        new_entity_id = update_data.get("entity_id", item.entity_id)
        new_source = update_data.get("source", item.source)
        new_external_id = update_data.get("external_id", item.external_id)

        if (new_entity_type != item.entity_type or
            new_entity_id != item.entity_id or
            new_source != item.source or
            new_external_id != item.external_id):
            await check_duplicate(
                db=db,
                model=ExternalReference,
                filters={
                    "entity_type": new_entity_type,
                    "entity_id": new_entity_id,
                    "source": new_source,
                    "external_id": new_external_id,
                },
                entity_label="ExternalReference",
                exclude_id=external_reference_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="external_references",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return ExternalReferenceResponse(
            success=True,
            data=ExternalReferenceDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{external_reference_id}", response_model=MessageResponse)
async def delete_external_reference(
    external_reference_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an external reference

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=ExternalReference,
            item_id=external_reference_id,
            user_org_id=org_id,
            entity_label="ExternalReference",
        )

        label = item.external_id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="external_references",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"ExternalReference {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
