import json
from django.test import TestCase, Client
from django.utils import timezone
from ..models import User, Organization, OrganizationMember, ActivityLog, Token
from ..utils.password_utils import hash_password
from ..utils.token_utils import generate_access_token

class ActivityTests(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create test user
        self.user = User.objects.create(
            email="logtester@example.com",
            password_hash=hash_password("LogPass123"),
            name="Log Tester",
            role=User.RoleTypes.MEMBER
        )
        
        # Generate access token
        self.access_token = generate_access_token(self.user.id)
        
        # Store token in database
        Token.objects.create(
            user=self.user,
            access_token=self.access_token,
            refresh_token="test_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )
        
        # Create organization
        self.organization = Organization.objects.create(name="Test Org")
        
        # Add user as organization member
        OrganizationMember.objects.create(
            user=self.user,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.OWNER
        )
        
        # Create activity log
        self.activity_log = ActivityLog.objects.create(
            organization=self.organization,
            user=self.user,
            action="CREATED_SOMETHING",
            timestamp=timezone.now()
        )
        
        # URLs
        self.list_url = f"/api/accounts/activity/list/{self.organization.id}"
        self.detail_url = lambda log_id: f"/api/accounts/activity/detail/{log_id}"

    def test_list_activity_logs(self):
        response = self.client.get(
            self.list_url,
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["action"], "CREATED_SOMETHING")

    def test_get_activity_log(self):
        response = self.client.get(
            self.detail_url(self.activity_log.id),
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertEqual(data["data"]["action"], "CREATED_SOMETHING")

    def test_unauthorized_access(self):
        # Create another user not in the organization
        other_user = User.objects.create(
            email="other@example.com",
            password_hash=hash_password("OtherPass123"),
            name="Other User",
            role=User.RoleTypes.MEMBER
        )
        other_token = generate_access_token(other_user.id)
        
        # Store token in database
        Token.objects.create(
            user=other_user,
            access_token=other_token,
            refresh_token="other_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )
        
        # Try to access activity logs
        response = self.client.get(
            self.list_url,
            HTTP_AUTHORIZATION=f"Bearer {other_token}"
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with success: false
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)

    def test_create_activity_log(self):
        payload = {
            "organization_id": self.organization.id,
            "action": "USER_ACTION",
            "details": {"key": "value"}
        }
        response = self.client.post(
            "/api/accounts/activity/create",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        
        # Verify activity log was created
        log = ActivityLog.objects.filter(
            organization=self.organization,
            user=self.user,
            action="USER_ACTION"
        ).first()
        self.assertIsNotNone(log)
