from django.contrib import admin
from .models import (
    User, 
    Organization, 
    OrganizationMember, 
    ActivityLog, 
    Invitation,
    Subscription
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'role', 'created_at')
    search_fields = ('email', 'name')
    
    fieldsets = (
        (None, {'fields': ('email', 'name', 'role', 'password_hash')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'deleted_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        if 'password_hash' in form.changed_data:
            from django.contrib.auth.hashers import make_password
            obj.password_hash = make_password(form.cleaned_data['password_hash'])
        super().save_model(request, obj, form, change)

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('user__email', 'organization__name')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('organization', 'user', 'action', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('action', 'user__email')

@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'organization', 'role', 'status', 'invited_at')
    list_filter = ('status', 'role')
    search_fields = ('email', 'organization__name')

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan_name', 'subscription_status', 'start_date')
    list_filter = ('subscription_status', 'plan_name')
    search_fields = ('organization__name',)
