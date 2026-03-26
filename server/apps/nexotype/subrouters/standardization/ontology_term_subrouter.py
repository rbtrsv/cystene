from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_session
from apps.accounts.models import User
from apps.accounts.utils.auth_utils import get_current_user

from ...models import OntologyTerm
from ...schemas.standardization.ontology_term_schemas import (
    MessageResponse,
    OntologyTermCreate,
    OntologyTermDetail,
    OntologyTermListResponse,
    OntologyTermResponse,
    OntologyTermUpdate,
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
# Ontology Terms Router
# ==========================================

router = APIRouter(tags=["OntologyTerms"])


@router.get("/", response_model=OntologyTermListResponse)
async def list_ontology_terms(
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List ontology terms with optional pagination

    This endpoint:
    1. Filters out soft-deleted records
    2. Filters by data ownership (curated + user's org)
    3. Returns a paginated list of ontology terms
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Count total ontology terms (with filters applied)
        count_query = select(func.count(OntologyTerm.id))
        count_query = apply_default_filters(count_query, OntologyTerm, org_id)
        count_result = await db.execute(count_query)
        total_count = count_result.scalar()

        # Get ontology terms with pagination (with filters applied)
        data_query = select(OntologyTerm).order_by(OntologyTerm.name).offset(offset).limit(limit)
        data_query = apply_default_filters(data_query, OntologyTerm, org_id)
        result = await db.execute(data_query)
        items = result.scalars().all()

        return OntologyTermListResponse(
            success=True,
            data=[OntologyTermDetail.model_validate(item, from_attributes=True) for item in items],
            count=total_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.get("/{ontology_term_id}", response_model=OntologyTermResponse)
async def get_ontology_term(
    ontology_term_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get details for a specific ontology term

    This endpoint:
    1. Retrieves an ontology term by ID (excludes soft-deleted, enforces ownership)
    2. Returns the ontology term details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=OntologyTerm,
            item_id=ontology_term_id,
            user_org_id=org_id,
            entity_label="OntologyTerm",
        )
        return OntologyTermResponse(
            success=True,
            data=OntologyTermDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.post("/", response_model=OntologyTermResponse)
async def create_ontology_term(
    payload: OntologyTermCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new ontology term

    This endpoint:
    1. Creates a new ontology term with the provided data
    2. Sets created_by and organization_id from user context
    3. Logs the creation to the audit log
    4. Returns the created ontology term details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)

        # Create new or restore soft-deleted record with same accession
        item = await create_or_restore_with_audit(
            db=db,
            model=OntologyTerm,
            table_name="ontology_terms",
            payload=payload.model_dump(),
            user_id=user.id,
            organization_id=org_id,
            unique_fields={"accession": payload.accession},
            entity_label="OntologyTerm",
        )

        await db.commit()
        await db.refresh(item)
        return OntologyTermResponse(
            success=True,
            data=OntologyTermDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.put("/{ontology_term_id}", response_model=OntologyTermResponse)
async def update_ontology_term(
    ontology_term_id: int,
    payload: OntologyTermUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update an ontology term

    This endpoint:
    1. Updates an ontology term with the provided data
    2. Sets updated_by from user context
    3. Logs the update to the audit log with old/new data
    4. Returns the updated ontology term details
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=OntologyTerm,
            item_id=ontology_term_id,
            user_org_id=org_id,
            entity_label="OntologyTerm",
        )

        # Check if new accession conflicts with another ontology term
        if payload.accession and payload.accession != item.accession:
            await check_duplicate(
                db=db,
                model=OntologyTerm,
                filters={"accession": payload.accession},
                entity_label="OntologyTerm",
                exclude_id=ontology_term_id,
            )

        await update_with_audit(
            db=db,
            item=item,
            table_name="ontology_terms",
            payload=payload.model_dump(exclude_unset=True),
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        await db.refresh(item)
        return OntologyTermResponse(
            success=True,
            data=OntologyTermDetail.model_validate(item, from_attributes=True),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router.delete("/{ontology_term_id}", response_model=MessageResponse)
async def delete_ontology_term(
    ontology_term_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Soft delete an ontology term

    This endpoint:
    1. Sets deleted_at and deleted_by (soft delete, no hard delete)
    2. Logs the deletion to the audit log
    3. Returns a success message
    """
    try:
        org_id = await get_user_organization_id(user.id, db)
        item = await get_owned_record_or_404(
            db=db,
            model=OntologyTerm,
            item_id=ontology_term_id,
            user_org_id=org_id,
            entity_label="OntologyTerm",
        )

        label = item.name
        await soft_delete_with_audit(
            db=db,
            item=item,
            table_name="ontology_terms",
            user_id=user.id,
            organization_id=org_id,
        )

        await db.commit()
        return MessageResponse(success=True, message=f"OntologyTerm {label} has been deleted")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
