from typing import Optional

from ..models import ActivityLog, Organization, User

def log_activity(
    organization: Organization, 
    user: Optional[User] = None, 
    action: str = "", 
    ip_address: str = ""
):
    """
    Creates a new ActivityLog entry for a given organization and user
    
    Args:
        organization: The organization where the activity occurred
        user: The user who performed the action (None for system actions)
        action: Description of the action that was performed
        ip_address: IP address of the user
    """
    ActivityLog.objects.create(
        organization=organization,
        user=user,
        action=action,
        ip_address=ip_address
    )


def get_organization_activity_logs(organization_id: int, limit: int = 100):
    """
    Get recent activity logs for an organization
    
    Args:
        organization_id: The ID of the organization
        limit: Maximum number of logs to return
        
    Returns:
        QuerySet of ActivityLog objects
    """
    return ActivityLog.objects.filter(
        organization_id=organization_id
    ).select_related('user').order_by('-timestamp')[:limit]


def get_user_activity_logs(user_id: int, limit: int = 100):
    """
    Get recent activity logs for a specific user
    
    Args:
        user_id: The ID of the user
        limit: Maximum number of logs to return
        
    Returns:
        QuerySet of ActivityLog objects
    """
    return ActivityLog.objects.filter(
        user_id=user_id
    ).select_related('organization').order_by('-timestamp')[:limit]