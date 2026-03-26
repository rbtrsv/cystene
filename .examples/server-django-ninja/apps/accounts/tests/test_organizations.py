import json
from django.test import TestCase, Client
from django.utils import timezone
from ..models import User, Organization, OrganizationMember, Token, ActivityLog
from ..utils.password_utils import hash_password
from ..utils.token_utils import generate_access_token

class OrganizationTests(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create test users
        self.owner = User.objects.create(
            email="owner@example.com",
            password_hash=hash_password("OwnerPass123"),
            name="Owner User",
            role=User.RoleTypes.MEMBER
        )
        self.owner_token = generate_access_token(self.owner.id)
        Token.objects.create(
            user=self.owner,
            access_token=self.owner_token,
            refresh_token="owner_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )
        
        self.admin = User.objects.create(
            email="admin@example.com",
            password_hash=hash_password("AdminPass123"),
            name="Admin User",
            role=User.RoleTypes.MEMBER
        )
        self.admin_token = generate_access_token(self.admin.id)
        Token.objects.create(
            user=self.admin,
            access_token=self.admin_token,
            refresh_token="admin_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )
        
        self.editor = User.objects.create(
            email="editor@example.com",
            password_hash=hash_password("EditorPass123"),
            name="Editor User",
            role=User.RoleTypes.MEMBER
        )
        self.editor_token = generate_access_token(self.editor.id)
        Token.objects.create(
            user=self.editor,
            access_token=self.editor_token,
            refresh_token="editor_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )
        
        self.viewer = User.objects.create(
            email="viewer@example.com",
            password_hash=hash_password("ViewerPass123"),
            name="Viewer User",
            role=User.RoleTypes.MEMBER
        )
        self.viewer_token = generate_access_token(self.viewer.id)
        Token.objects.create(
            user=self.viewer,
            access_token=self.viewer_token,
            refresh_token="viewer_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )
        
        # Create test organization
        self.organization = Organization.objects.create(name="Test Organization")
        
        # Add users as members with different roles
        OrganizationMember.objects.create(
            user=self.owner,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.OWNER
        )
        
        OrganizationMember.objects.create(
            user=self.admin,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.ADMIN
        )
        
        OrganizationMember.objects.create(
            user=self.editor,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.EDITOR
        )
        
        OrganizationMember.objects.create(
            user=self.viewer,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.VIEWER
        )
        
        # Create a second organization for the owner
        self.organization2 = Organization.objects.create(name="Second Organization")
        OrganizationMember.objects.create(
            user=self.owner,
            organization=self.organization2,
            role=OrganizationMember.RoleTypes.OWNER
        )
        
        # URLs
        self.base_url = "/api/accounts/organizations"
        self.detail_url = lambda org_id: f"{self.base_url}/{org_id}"
        self.role_url = lambda org_id: f"{self.base_url}/{org_id}/role"

    def test_list_organizations_authenticated(self):
        """Test listing organizations for an authenticated user"""
        response = self.client.get(
            self.base_url,
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)  # Owner has 2 organizations
        
        # Verify organization details
        org_ids = [org["id"] for org in data]
        self.assertIn(self.organization.id, org_ids)
        self.assertIn(self.organization2.id, org_ids)
        
        # Verify roles
        for org in data:
            if org["id"] == self.organization.id:
                self.assertEqual(org["role"], "OWNER")
            if org["id"] == self.organization2.id:
                self.assertEqual(org["role"], "OWNER")

    def test_list_organizations_unauthenticated(self):
        """Test listing organizations without authentication"""
        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_get_organization_owner(self):
        """Test getting organization details as owner"""
        response = self.client.get(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.organization.id)
        self.assertEqual(data["name"], self.organization.name)
        self.assertEqual(data["role"], "OWNER")

    def test_get_organization_admin(self):
        """Test getting organization details as admin"""
        response = self.client.get(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.admin_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.organization.id)
        self.assertEqual(data["name"], self.organization.name)
        self.assertEqual(data["role"], "ADMIN")

    def test_get_organization_editor(self):
        """Test getting organization details as editor"""
        response = self.client.get(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.editor_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.organization.id)
        self.assertEqual(data["name"], self.organization.name)
        self.assertEqual(data["role"], "EDITOR")

    def test_get_organization_viewer(self):
        """Test getting organization details as viewer"""
        response = self.client.get(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.viewer_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.organization.id)
        self.assertEqual(data["name"], self.organization.name)
        self.assertEqual(data["role"], "VIEWER")

    def test_get_organization_unauthenticated(self):
        """Test getting organization details without authentication"""
        response = self.client.get(self.detail_url(self.organization.id))
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_get_organization_nonexistent(self):
        """Test getting a nonexistent organization"""
        response = self.client.get(
            self.detail_url(999999),
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 403)  # Forbidden (not a member)

    def test_create_organization(self):
        """Test creating a new organization"""
        payload = {"name": "New Organization"}
        response = self.client.post(
            self.base_url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "New Organization")
        self.assertEqual(data["role"], "OWNER")
        
        # Verify organization was created
        org = Organization.objects.get(id=data["id"])
        self.assertEqual(org.name, "New Organization")
        
        # Verify user is an owner
        membership = OrganizationMember.objects.get(
            user=self.owner,
            organization=org
        )
        self.assertEqual(membership.role, "OWNER")
        
        # Verify activity log was created
        log = ActivityLog.objects.filter(
            organization=org,
            user=self.owner,
            action__contains="Created organization"
        ).first()
        self.assertIsNotNone(log)

    def test_create_organization_unauthenticated(self):
        """Test creating an organization without authentication"""
        payload = {"name": "New Organization"}
        response = self.client.post(
            self.base_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_update_organization_owner(self):
        """Test updating an organization as owner"""
        payload = {"name": "Updated Organization"}
        response = self.client.put(
            self.detail_url(self.organization.id),
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Updated Organization")
        
        # Verify organization was updated
        self.organization.refresh_from_db()
        self.assertEqual(self.organization.name, "Updated Organization")
        
        # Verify activity log was created
        log = ActivityLog.objects.filter(
            organization=self.organization,
            user=self.owner,
            action__contains="Updated organization name"
        ).first()
        self.assertIsNotNone(log)

    def test_update_organization_admin(self):
        """Test updating an organization as admin"""
        payload = {"name": "Admin Updated Organization"}
        response = self.client.put(
            self.detail_url(self.organization.id),
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.admin_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Admin Updated Organization")
        
        # Verify organization was updated
        self.organization.refresh_from_db()
        self.assertEqual(self.organization.name, "Admin Updated Organization")

    def test_update_organization_editor(self):
        """Test updating an organization as editor (should fail)"""
        payload = {"name": "Editor Updated Organization"}
        response = self.client.put(
            self.detail_url(self.organization.id),
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.editor_token}"
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Verify organization was not updated
        self.organization.refresh_from_db()
        self.assertNotEqual(self.organization.name, "Editor Updated Organization")

    def test_update_organization_viewer(self):
        """Test updating an organization as viewer (should fail)"""
        payload = {"name": "Viewer Updated Organization"}
        response = self.client.put(
            self.detail_url(self.organization.id),
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.viewer_token}"
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Verify organization was not updated
        self.organization.refresh_from_db()
        self.assertNotEqual(self.organization.name, "Viewer Updated Organization")

    def test_update_organization_unauthenticated(self):
        """Test updating an organization without authentication"""
        payload = {"name": "Unauthenticated Updated Organization"}
        response = self.client.put(
            self.detail_url(self.organization.id),
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)  # Unauthorized
        
        # Verify organization was not updated
        self.organization.refresh_from_db()
        self.assertNotEqual(self.organization.name, "Unauthenticated Updated Organization")

    def test_delete_organization_owner(self):
        """Test deleting an organization as owner"""
        response = self.client.delete(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)
        
        # Verify organization was deleted
        self.assertEqual(Organization.objects.filter(id=self.organization.id).count(), 0)

    def test_delete_organization_admin(self):
        """Test deleting an organization as admin (should fail)"""
        response = self.client.delete(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.admin_token}"
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Verify organization was not deleted
        self.assertEqual(Organization.objects.filter(id=self.organization.id).count(), 1)

    def test_delete_organization_editor(self):
        """Test deleting an organization as editor (should fail)"""
        response = self.client.delete(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.editor_token}"
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Verify organization was not deleted
        self.assertEqual(Organization.objects.filter(id=self.organization.id).count(), 1)

    def test_delete_organization_viewer(self):
        """Test deleting an organization as viewer (should fail)"""
        response = self.client.delete(
            self.detail_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.viewer_token}"
        )
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Verify organization was not deleted
        self.assertEqual(Organization.objects.filter(id=self.organization.id).count(), 1)

    def test_delete_organization_unauthenticated(self):
        """Test deleting an organization without authentication"""
        response = self.client.delete(self.detail_url(self.organization.id))
        self.assertEqual(response.status_code, 401)  # Unauthorized
        
        # Verify organization was not deleted
        self.assertEqual(Organization.objects.filter(id=self.organization.id).count(), 1)

    def test_get_user_role(self):
        """Test getting user role in an organization"""
        response = self.client.get(
            self.role_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["role"], "OWNER")
        
        # Test with admin
        response = self.client.get(
            self.role_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.admin_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["role"], "ADMIN")
        
        # Test with editor
        response = self.client.get(
            self.role_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.editor_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["role"], "EDITOR")
        
        # Test with viewer
        response = self.client.get(
            self.role_url(self.organization.id),
            HTTP_AUTHORIZATION=f"Bearer {self.viewer_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["role"], "VIEWER")

    def test_get_user_role_unauthenticated(self):
        """Test getting user role without authentication"""
        response = self.client.get(self.role_url(self.organization.id))
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_get_user_role_nonexistent(self):
        """Test getting user role for a nonexistent organization"""
        response = self.client.get(
            self.role_url(999999),
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 403)  # Forbidden (not a member)
