import json
from django.test import TestCase, Client
from django.utils import timezone
from ..models import User, Organization, OrganizationMember, Invitation, Token
from ..utils.password_utils import hash_password
from ..utils.token_utils import generate_access_token

class InvitationTests(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create owner user
        self.owner = User.objects.create(
            email="owner@example.com",
            password_hash=hash_password("OwnerPass123"),
            name="Owner User",
            role=User.RoleTypes.MEMBER
        )
        self.owner_token = generate_access_token(self.owner.id)
        
        # Store token in database
        Token.objects.create(
            user=self.owner,
            access_token=self.owner_token,
            refresh_token="owner_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )

        # Create organization
        self.organization = Organization.objects.create(name="Test Org")
        OrganizationMember.objects.create(
            user=self.owner,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.OWNER
        )

        # Create user to be invited
        self.invited_user = User.objects.create(
            email="invited@example.com",
            password_hash=hash_password("InvitedPass123"),
            name="Invited User",
            role=User.RoleTypes.MEMBER
        )
        self.invited_token = generate_access_token(self.invited_user.id)
        
        # Store token in database
        Token.objects.create(
            user=self.invited_user,
            access_token=self.invited_token,
            refresh_token="invited_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )

        # URLs - based on router.py and invitations_subrouter.py
        self.base_url = "/api/accounts/invitations"
        self.org_invitations_url = f"{self.base_url}/organization/{self.organization.id}"
        self.my_invitations_url = f"{self.base_url}/my-invitations"
        self.accept_url = lambda invitation_id: f"{self.base_url}/{invitation_id}/accept"
        self.reject_url = lambda invitation_id: f"{self.base_url}/{invitation_id}/reject"
        self.cancel_url = lambda invitation_id: f"{self.base_url}/{invitation_id}"

    def test_create_invitation(self):
        """Test creating an invitation"""
        payload = {
            "email": "invited@example.com",
            "organization_id": self.organization.id,
            "role": "EDITOR"
        }
        response = self.client.post(
            self.base_url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)
        
        # Verify invitation was created
        invitation = Invitation.objects.filter(
            email="invited@example.com",
            organization=self.organization
        ).first()
        self.assertIsNotNone(invitation)
        self.assertEqual(invitation.role, "EDITOR")
        self.assertEqual(invitation.status, Invitation.StatusTypes.PENDING)
        self.assertEqual(invitation.invited_by, self.owner)

    def test_list_organization_invitations(self):
        """Test listing invitations for an organization"""
        # Create invitation
        invitation = Invitation.objects.create(
            email=self.invited_user.email,
            organization=self.organization,
            role="EDITOR",
            status=Invitation.StatusTypes.PENDING,
            invited_by=self.owner
        )

        response = self.client.get(
            self.org_invitations_url,
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["email"], "invited@example.com")
        self.assertEqual(data[0]["role"], "EDITOR")
        self.assertEqual(data[0]["status"], "PENDING")

    def test_list_my_invitations(self):
        """Test listing invitations for the current user"""
        # Create invitation
        invitation = Invitation.objects.create(
            email=self.invited_user.email,
            organization=self.organization,
            role="EDITOR",
            status=Invitation.StatusTypes.PENDING,
            invited_by=self.owner
        )

        response = self.client.get(
            self.my_invitations_url,
            HTTP_AUTHORIZATION=f"Bearer {self.invited_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["email"], "invited@example.com")
        self.assertEqual(data[0]["role"], "EDITOR")
        self.assertEqual(data[0]["status"], "PENDING")

    def test_accept_invitation(self):
        """Test accepting an invitation"""
        # Create invitation
        invitation = Invitation.objects.create(
            email=self.invited_user.email,
            organization=self.organization,
            role="EDITOR",
            status=Invitation.StatusTypes.PENDING,
            invited_by=self.owner
        )

        response = self.client.post(
            self.accept_url(invitation.id),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.invited_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)

        # Verify membership was created
        membership = OrganizationMember.objects.filter(
            user=self.invited_user,
            organization=self.organization
        ).first()
        self.assertIsNotNone(membership)
        self.assertEqual(membership.role, "EDITOR")

        # Verify invitation status was updated
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, Invitation.StatusTypes.ACCEPTED)

    def test_reject_invitation(self):
        """Test rejecting an invitation"""
        # Create invitation
        invitation = Invitation.objects.create(
            email=self.invited_user.email,
            organization=self.organization,
            role="EDITOR",
            status=Invitation.StatusTypes.PENDING,
            invited_by=self.owner
        )

        response = self.client.post(
            self.reject_url(invitation.id),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.invited_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)

        # Verify invitation status was updated
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, Invitation.StatusTypes.REJECTED)

    def test_cancel_invitation(self):
        """Test cancelling an invitation"""
        # Create invitation
        invitation = Invitation.objects.create(
            email=self.invited_user.email,
            organization=self.organization,
            role="EDITOR",
            status=Invitation.StatusTypes.PENDING,
            invited_by=self.owner
        )

        response = self.client.delete(
            self.cancel_url(invitation.id),
            HTTP_AUTHORIZATION=f"Bearer {self.owner_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)

        # Verify invitation status was updated
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, Invitation.StatusTypes.CANCELLED)

    def test_invalid_invitation(self):
        """Test handling invalid invitation ID"""
        response = self.client.post(
            self.accept_url(999999),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.invited_token}"
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with success: false
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)

    def test_unauthorized_invite(self):
        """Test unauthorized invitation creation"""
        # Create non-owner user
        non_owner = User.objects.create(
            email="nonowner@example.com",
            password_hash=hash_password("NonOwnerPass123"),
            name="Non-Owner User",
            role=User.RoleTypes.MEMBER
        )
        OrganizationMember.objects.create(
            user=non_owner,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.EDITOR
        )
        non_owner_token = generate_access_token(non_owner.id)
        
        # Store token in database
        Token.objects.create(
            user=non_owner,
            access_token=non_owner_token,
            refresh_token="non_owner_refresh_token",
            access_token_expires_at=timezone.now() + timezone.timedelta(hours=1),
            refresh_token_expires_at=timezone.now() + timezone.timedelta(days=7),
            is_valid=True
        )

        payload = {
            "email": "test@example.com",
            "organization_id": self.organization.id,
            "role": "VIEWER"
        }
        response = self.client.post(
            self.base_url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {non_owner_token}"
        )
        self.assertEqual(response.status_code, 200)  # API returns 200 with success: false
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)

    def test_wrong_user_accept(self):
        """Test wrong user accepting invitation"""
        # Create invitation
        invitation = Invitation.objects.create(
            email="another@example.com",
            organization=self.organization,
            role="EDITOR",
            status=Invitation.StatusTypes.PENDING,
            invited_by=self.owner
        )

        response = self.client.post(
            self.accept_url(invitation.id),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.invited_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)
        self.assertIn("not for you", data["error"])
