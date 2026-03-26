from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import GenomicFile
from ...schemas.user.genomic_file_schemas import (
    GenomicFileCreate,
    GenomicFileDetail,
    GenomicFileListResponse,
    GenomicFileResponse,
    GenomicFileUpdate,
    MessageResponse,
)
from ...utils.dependency_utils import get_user_organization_id
from ...utils.filtering_utils import apply_default_filters
from ...utils.crud_utils import (
    create_with_audit,
    get_owned_record_or_404,
    soft_delete_with_audit,
    update_with_audit,
)

# ==========================================
# Genomic Files Router
# ==========================================

router = APIRouter(tags=["GenomicFiles"])


@router.get("/", response_model=GenomicFileListResponse)
async def list_genomic_files(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List genomic files with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of genomic files
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total genomic files (with filters applied)
        count_query = select(func.count(GenomicFile.id))
        count_query = apply_default_filters(count_query, GenomicFile, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get genomic files with pagination (with filters applied)
        data_query = select(GenomicFile).order_by(GenomicFile.id).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, GenomicFile, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return GenomicFileListResponse(
            success=True,
            data=[GenomicFileDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{genomic_file_id}", response_model=GenomicFileResponse)
async def get_genomic_file(
    genomic_file_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific genomic file

    This endpoint:
    1. Retrieves a genomic file by ID (excludes soft-deleted, enforces ownership)
    2. Returns the genomic file details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=GenomicFile,
            item_id=genomic_file_id,
            user_org_id=org_id,
            entity_label="GenomicFile",
        )
        return GenomicFileResponse(
            success=True,
            data=GenomicFileDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=GenomicFileResponse)
async def create_genomic_file(
    payload: GenomicFileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new genomic file

    This endpoint:
    1. Creates a new genomic file with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created genomic file details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        item = await create_with_audit(
            db=db,
            model=GenomicFile,
            table_name="genomic_files",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return GenomicFileResponse(
            success=True,
            data=GenomicFileDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{genomic_file_id}", response_model=GenomicFileResponse)
async def update_genomic_file(
    genomic_file_id: int,
    payload: GenomicFileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update a genomic file

    This endpoint:
    1. Updates a genomic file with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated genomic file details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=GenomicFile,
            item_id=genomic_file_id,
            user_org_id=org_id,
            entity_label="GenomicFile",
        )

        update_data = payload.model_dump(exclude_unset=True)

        await update_with_audit(
            db=db,
            item=item,
            table_name="genomic_files",
            payload=update_data,
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return GenomicFileResponse(
            success=True,
            data=GenomicFileDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{genomic_file_id}", response_model=MessageResponse)
async def delete_genomic_file(
    genomic_file_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete a genomic file

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=GenomicFile,
            item_id=genomic_file_id,
            user_org_id=org_id,
            entity_label="GenomicFile",
        )

        label = item.id
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="genomic_files",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"GenomicFile {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
