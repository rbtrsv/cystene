from django.db import models
from django.utils import timezone


class User(models.Model):
    """
    Custom user model not using Django's authentication system
    """
    class RoleTypes(models.TextChoices):
        OWNER = 'OWNER', 'Owner'
        ADMIN = 'ADMIN', 'Admin'
        MEMBER = 'MEMBER', 'Member'

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, null=True, blank=True)
    password_hash = models.TextField()
    email_verified = models.BooleanField(default=False)
    role = models.CharField(
        max_length=50,
        choices=RoleTypes.choices,
        default=RoleTypes.MEMBER
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.email
    
    def soft_delete(self):
        """Soft delete a user by setting deleted_at timestamp"""
        self.deleted_at = timezone.now()
        self.save()
    
    @property
    def is_active(self):
        return self.deleted_at is None


class Token(models.Model):
    """
    Token model for authentication
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    access_token = models.TextField()
    refresh_token = models.CharField(max_length=255, unique=True)
    access_token_expires_at = models.DateTimeField()
    refresh_token_expires_at = models.DateTimeField()
    is_valid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)


class Organization(models.Model):
    """
    Organization model
    """
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    """
    Organization member model
    """
    class RoleTypes(models.TextChoices):
        OWNER = 'OWNER', 'Owner'
        ADMIN = 'ADMIN', 'Admin'
        EDITOR = 'EDITOR', 'Editor'
        VIEWER = 'VIEWER', 'Viewer'
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(
        max_length=50, 
        choices=RoleTypes.choices,
        default=RoleTypes.VIEWER
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'organization']
    
    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"


class Subscription(models.Model):
    """
    Subscription model
    """
    class StatusTypes(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        CANCELED = 'CANCELED', 'Canceled'
        PAST_DUE = 'PAST_DUE', 'Past Due'
        UNPAID = 'UNPAID', 'Unpaid'
        TRIALING = 'TRIALING', 'Trialing'
    
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='subscription')
    stripe_customer_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    stripe_subscription_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    stripe_product_id = models.CharField(max_length=255, null=True, blank=True)
    plan_name = models.CharField(max_length=50, null=True, blank=True)
    subscription_status = models.CharField(
        max_length=50, 
        choices=StatusTypes.choices,
        default=StatusTypes.ACTIVE
    )
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.organization.name} - {self.plan_name or 'No plan'}"


class Invitation(models.Model):
    """
    Invitation model
    """
    class StatusTypes(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=50)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    invited_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=50,
        choices=StatusTypes.choices,
        default=StatusTypes.PENDING
    )
    
    def __str__(self):
        return f"{self.email} - {self.organization.name}"


class ActivityLog(models.Model):
    """
    Activity log model
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='activity_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='activity_logs')
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    
    def __str__(self):
        return f"{self.action} - {self.timestamp}"