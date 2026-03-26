import json
from django.test import TestCase, Client
from django.utils import timezone
from ..models import User, Organization, OrganizationMember, Token
from ..utils.password_utils import hash_password

class AuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = "/api/accounts/auth/register"
        self.login_url = "/api/accounts/auth/login"
        self.refresh_token_url = "/api/accounts/auth/refresh-token"
        self.forgot_password_url = "/api/accounts/auth/forgot-password"
        self.reset_password_url = "/api/accounts/auth/reset-password"
        
        self.test_password = "MySecurePass123"
        
        # Create test user
        self.test_user = User.objects.create(
            email="testlogin@example.com",
            password_hash=hash_password(self.test_password),
            name="Login User",
            role=User.RoleTypes.MEMBER
        )
        
        # Create organization for test user
        self.test_org = Organization.objects.create(name="Test Organization")
        
        # Add user as organization member
        OrganizationMember.objects.create(
            user=self.test_user,
            organization=self.test_org,
            role=OrganizationMember.RoleTypes.OWNER
        )

    def test_register(self):
        payload = {
            "email": "testsignup@example.com",
            "password": "MySecurePass123",
            "name": "Signup User",
            "organization_name": "New Organization"
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("token", data)
        self.assertIn("access_token", data["token"])
        self.assertIn("refresh_token", data["token"])
        self.assertEqual(data["token"]["token_type"], "bearer")

        # Verify user was created
        user = User.objects.get(email="testsignup@example.com")
        self.assertEqual(user.name, "Signup User")
        
        # Verify organization was created
        org = Organization.objects.get(name="New Organization")
        self.assertIsNotNone(org)
        
        # Verify user is an owner of the organization
        membership = OrganizationMember.objects.get(user=user, organization=org)
        self.assertEqual(membership.role, OrganizationMember.RoleTypes.OWNER)

    def test_login(self):
        payload = {
            "email": "testlogin@example.com",
            "password": self.test_password
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("token", data)
        self.assertIn("access_token", data["token"])
        self.assertIn("refresh_token", data["token"])
        self.assertEqual(data["token"]["token_type"], "bearer")

    def test_login_invalid_credentials(self):
        payload = {
            "email": "testlogin@example.com",
            "password": "WrongPassword123"
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with success: false
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)

    def test_refresh_token(self):
        # Create a token for the test user
        refresh_token = "test_refresh_token"
        Token.objects.create(
            user=self.test_user,
            access_token="test_access_token",
            refresh_token=refresh_token,
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )
        
        payload = {
            "refresh_token": refresh_token
        }
        response = self.client.post(
            self.refresh_token_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("token", data)
        self.assertIn("access_token", data["token"])
        self.assertIn("refresh_token", data["token"])
        
        # Verify old token is invalidated
        old_token = Token.objects.get(refresh_token=refresh_token)
        self.assertFalse(old_token.is_valid)
        
        # Verify new token is created
        new_token = Token.objects.get(refresh_token=data["token"]["refresh_token"])
        self.assertTrue(new_token.is_valid)

    def test_forgot_password(self):
        payload = {
            "email": "testlogin@example.com"
        }
        response = self.client.post(
            self.forgot_password_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)
        
        # Verify a password reset token was created
        reset_token = Token.objects.filter(
            user=self.test_user,
            access_token='password_reset'
        ).first()
        self.assertIsNotNone(reset_token)

    def test_reset_password(self):
        # Create a password reset token
        reset_token = "test_reset_token"
        Token.objects.create(
            user=self.test_user,
            access_token='password_reset',
            refresh_token=reset_token,
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            is_valid=True
        )
        
        new_password = "NewSecurePass456"
        payload = {
            "token": reset_token,
            "password": new_password
        }
        response = self.client.post(
            self.reset_password_url,
            data=json.dumps(payload),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)
        
        # Verify password was updated
        self.test_user.refresh_from_db()
        
        # Verify all tokens are invalidated
        tokens = Token.objects.filter(user=self.test_user)
        for token in tokens:
            self.assertFalse(token.is_valid)
        
        # Verify login works with new password
        login_payload = {
            "email": "testlogin@example.com",
            "password": new_password
        }
        login_response = self.client.post(
            self.login_url,
            data=json.dumps(login_payload),
            content_type="application/json"
        )
        
        self.assertEqual(login_response.status_code, 200)
        login_data = login_response.json()
        self.assertTrue(login_data["success"])
