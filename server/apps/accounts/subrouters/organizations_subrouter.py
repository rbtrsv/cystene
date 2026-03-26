from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any

from ..models import User, Organization, OrganizationMember
from ..schemas.organization_schemas import (
    OrganizationCreate, 
    OrganizationUpdate, 
    OrganizationDetail, 
    MessageResponse
)
from ..schemas.organization_member_schemas import OrganizationMemberRole
from ..utils.auth_utils import get_current_user
from ..utils.dependency_utils import require_organization_role
from ..utils.audit_utils import log_audit
from core.db import get_session

# ==========================================
# Organizations Router
# ==========================================

router = APIRouter(tags=["Organizations"])


@router.get("/", response_model=List[OrganizationDetail])
async def list_organizations(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List all organizations where the current user is a member
    
    This endpoint:
    1. Finds all organizations where the user is a member
    2. Returns the list with the user's role in each organization
    """
    try:
        # Get memberships for the user
        result = await session.execute(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.organization))
            .filter(OrganizationMember.user_id == user.id)
        )
        memberships = result.scalars().all()
        
        # Return organization details
        return [
            OrganizationDetail(
                id=m.organization.id,
                name=m.organization.name,
                role=m.role,
                created_at=m.organization.created_at,
                updated_at=m.organization.updated_at
            )
            for m in memberships
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving organizations"
        )


@router.get("/{organization_id}", response_model=OrganizationDetail)
async def get_organization(
    organization_id: int,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["VIEWER", "EDITOR", "ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get details for a specific organization
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns the organization details
    """
    # Get user's membership to get their role
    result = await session.execute(
        select(OrganizationMember).filter(
            OrganizationMember.organization_id == organization.id,
            OrganizationMember.user_id == user.id
        )
    )
    membership = result.scalar_one()
    
    return OrganizationDetail(
        id=organization.id,
        name=organization.name,
        role=membership.role,
        created_at=organization.created_at,
        updated_at=organization.updated_at
    )


@router.post("/", response_model=OrganizationDetail)
async def create_organization(
    data: OrganizationCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new organization and add current user as owner
    
    This endpoint:
    1. Creates a new organization with the provided name
    2. Adds the current user as the owner
    3. Returns the new organization details
    """
    try:
        # Create organization
        organization = Organization(name=data.name)
        session.add(organization)
        await session.flush()  # Get the org ID without committing

        # Add user as owner
        membership = OrganizationMember(
            user_id=user.id,
            organization_id=organization.id,
            role=OrganizationMemberRole.OWNER.value
        )
        session.add(membership)

        # Log audit
        await log_audit(
            organization=organization,
            user=user,
            action=f"Created organization: {organization.name}",
            session=session
        )

        await session.commit()
        await session.refresh(organization)

        return OrganizationDetail(
            id=organization.id,
            name=organization.name,
            role=membership.role,
            created_at=organization.created_at,
            updated_at=organization.updated_at
        )
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the organization"
        )


@router.put("/{organization_id}", response_model=OrganizationDetail)
async def update_organization(
    organization_id: int,
    data: OrganizationUpdate,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Update an organization's details
    
    This endpoint:
    1. Checks if the user has permission to update the organization
    2. Updates the organization name
    3. Returns the updated organization details
    """
    # Update organization
    original_name = organization.name
    organization.name = data.name

    # Get user's membership for role
    result = await session.execute(
        select(OrganizationMember).filter(
            OrganizationMember.organization_id == organization.id,
            OrganizationMember.user_id == user.id
        )
    )
    membership = result.scalar_one()

    # Log audit
    await log_audit(
        organization=organization,
        user=user,
        action=f"Updated organization name from '{original_name}' to '{organization.name}'",
        session=session
    )

    await session.commit()

    return OrganizationDetail(
        id=organization.id,
        name=organization.name,
        role=membership.role,
        created_at=organization.created_at,
        updated_at=organization.updated_at
    )


@router.delete("/{organization_id}", response_model=MessageResponse)
async def delete_organization(
    organization_id: int,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Delete an organization (owner only)
    
    This endpoint:
    1. Checks if the user has permission to delete the organization
    2. Deletes the organization
    3. Returns a success message
    """
    organization_name = organization.name
    
    # Delete organization (will cascade to members, etc.)
    await session.delete(organization)
    await session.commit()
    
    return MessageResponse(
        success=True,
        message=f"Organization '{organization_name}' has been deleted"
    )


@router.get("/{organization_id}/role", response_model=Dict[str, Any])
async def get_user_role(
    organization_id: int,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get the current user's role in an organization
    
    This endpoint:
    1. Returns the user's role in the organization
    """
    result = await session.execute(
        select(OrganizationMember).filter(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == organization_id
        )
    )
    membership = result.scalar_one()
    
    return {
        "success": True,
        "role": membership.role
    }