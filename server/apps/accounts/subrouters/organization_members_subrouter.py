from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from ..models import User, OrganizationMember, Organization
from ..schemas.organization_member_schemas import MemberCreate, MemberUpdate, MemberDetail, MessageResponse, OrganizationMemberRole
from ..utils.auth_utils import get_current_user
from ..utils.dependency_utils import require_organization_role
from ..utils.audit_utils import log_audit
from core.db import get_session

# ==========================================
# Organization Members Router
# ==========================================

router = APIRouter(tags=["Organization Members"])


@router.get("/{organization_id}/members", response_model=List[MemberDetail])
async def list_members(
    organization_id: int,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["VIEWER", "EDITOR", "ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    List all members of an organization
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns a list of all members with their roles
    """
    result = await session.execute(
        select(OrganizationMember)
        .options(selectinload(OrganizationMember.user))
        .filter(OrganizationMember.organization_id == organization.id)
    )
    members = result.scalars().all()
    
    return [
        MemberDetail(
            id=m.id,
            user_id=m.user.id,
            email=m.user.email,
            name=m.user.name,
            role=m.role,
            joined_at=m.joined_at,
            updated_at=m.updated_at
        )
        for m in members
    ]


@router.get("/{organization_id}/members/{member_id}", response_model=MemberDetail)
async def get_member(
    organization_id: int,
    member_id: int,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["VIEWER", "EDITOR", "ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Get details for a specific organization member
    
    This endpoint:
    1. Checks if the user has permission to view the organization
    2. Returns the member details
    """
    result = await session.execute(
        select(OrganizationMember)
        .options(selectinload(OrganizationMember.user))
        .filter(
            OrganizationMember.id == member_id,
            OrganizationMember.organization_id == organization.id
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this organization"
        )
    
    return MemberDetail(
        id=member.id,
        user_id=member.user.id,
        email=member.user.email,
        name=member.user.name,
        role=member.role,
        joined_at=member.joined_at,
        updated_at=member.updated_at
    )


@router.post("/{organization_id}/members", response_model=MemberDetail)
async def add_member(
    organization_id: int,
    data: MemberCreate,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Add a new member to the organization
    
    This endpoint:
    1. Checks if the user has permission to manage members
    2. Adds the specified user to the organization
    3. Returns the new member details
    """
    # Check if user exists
    result = await session.execute(
        select(User).filter(User.id == data.user_id)
    )
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already a member
    result = await session.execute(
        select(OrganizationMember).filter(
            OrganizationMember.user_id == target_user.id,
            OrganizationMember.organization_id == organization.id
        )
    )
    existing_member = result.scalar_one_or_none()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {target_user.email} is already a member of this organization"
        )
    
    # Create membership
    member = OrganizationMember(
        user_id=target_user.id,
        organization_id=organization.id,
        role=data.role.value
    )
    session.add(member)

    # Log audit
    await log_audit(
        organization=organization,
        user=user,
        action=f"Added {target_user.email} to organization with {data.role} role",
        session=session
    )

    await session.commit()
    await session.refresh(member)

    return MemberDetail(
        id=member.id,
        user_id=target_user.id,
        email=target_user.email,
        name=target_user.name,
        role=member.role
    )


@router.put("/{organization_id}/members/{member_id}", response_model=MemberDetail)
async def update_member(
    organization_id: int,
    member_id: int,
    data: MemberUpdate,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Update a member's role in the organization
    
    This endpoint:
    1. Checks if the user has permission to manage members
    2. Updates the member's role
    3. Returns the updated member details
    """
    # Find the membership to update
    result = await session.execute(
        select(OrganizationMember)
        .options(selectinload(OrganizationMember.user))
        .filter(
            OrganizationMember.id == member_id,
            OrganizationMember.organization_id == organization.id
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this organization"
        )
    
    # Don't allow changing the owner's role if there's only one owner
    if member.role == OrganizationMemberRole.OWNER.value and data.role != OrganizationMemberRole.OWNER:
        result = await session.execute(
            select(OrganizationMember).filter(
                OrganizationMember.organization_id == organization.id,
                OrganizationMember.role == OrganizationMemberRole.OWNER.value
            )
        )
        owner_count = len(result.scalars().all())
        
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change the role of the only owner"
            )
    
    # Don't allow non-owners to modify other owners
    result = await session.execute(
        select(OrganizationMember).filter(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == organization.id
        )
    )
    requester_membership = result.scalar_one()
    requester_is_owner = requester_membership.role == OrganizationMemberRole.OWNER.value
    
    if member.role == OrganizationMemberRole.OWNER.value and not requester_is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can modify other owners"
        )
        
    # Update the role
    original_role = member.role
    member.role = data.role.value

    # Log audit
    await log_audit(
        organization=organization,
        user=user,
        action=f"Changed {member.user.email}'s role from {original_role} to {data.role}",
        session=session
    )

    await session.commit()

    return MemberDetail(
        id=member.id,
        user_id=member.user.id,
        email=member.user.email,
        name=member.user.name,
        role=member.role,
        joined_at=member.joined_at,
        updated_at=member.updated_at
    )


@router.delete("/{organization_id}/members/{member_id}", response_model=MessageResponse)
async def remove_member(
    organization_id: int,
    member_id: int,
    user: User = Depends(get_current_user),
    organization: Organization = Depends(require_organization_role(["ADMIN", "OWNER"])),
    session: AsyncSession = Depends(get_session)
):
    """
    Remove a member from the organization
    
    This endpoint:
    1. Checks if the user has permission to manage members
    2. Removes the member from the organization
    3. Returns a success message
    """
    # Find the membership to remove
    result = await session.execute(
        select(OrganizationMember)
        .options(selectinload(OrganizationMember.user))
        .filter(
            OrganizationMember.id == member_id,
            OrganizationMember.organization_id == organization.id
        )
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this organization"
        )
    
    # Don't allow removing the only owner
    if member.role == OrganizationMemberRole.OWNER.value:
        result = await session.execute(
            select(OrganizationMember).filter(
                OrganizationMember.organization_id == organization.id,
                OrganizationMember.role == OrganizationMemberRole.OWNER.value
            )
        )
        owner_count = len(result.scalars().all())
        
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the only owner of the organization"
            )
        
        # Don't allow non-owners to remove owners
        result = await session.execute(
            select(OrganizationMember).filter(
                OrganizationMember.user_id == user.id,
                OrganizationMember.organization_id == organization.id
            )
        )
        requester_membership = result.scalar_one()
        requester_is_owner = requester_membership.role == OrganizationMemberRole.OWNER.value
        
        if not requester_is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners can remove other owners"
            )
    
    # Don't allow self-removal for the last owner
    if member.user.id == user.id and member.role == OrganizationMemberRole.OWNER.value:
        result = await session.execute(
            select(OrganizationMember).filter(
                OrganizationMember.organization_id == organization.id,
                OrganizationMember.role == OrganizationMemberRole.OWNER.value
            )
        )
        owner_count = len(result.scalars().all())
        
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="As the only owner, you cannot remove yourself. Transfer ownership first."
            )
    
    # Remove the membership
    email = member.user.email
    await session.delete(member)

    # Log audit
    await log_audit(
        organization=organization,
        user=user,
        action=f"Removed {email} from organization",
        session=session
    )

    await session.commit()

    return MessageResponse(
        success=True,
        message=f"Member {email} removed from organization"
    )