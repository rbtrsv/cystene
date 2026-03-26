import json
from django.test import TestCase, Client
from django.utils import timezone
from unittest.mock import patch, MagicMock
from ..models import User, Organization, OrganizationMember, Subscription, Token
from ..utils.password_utils import hash_password
from ..utils.token_utils import generate_access_token

class StripeTests(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create test user
        self.test_user = User.objects.create(
            email="stripeuser@example.com",
            password_hash=hash_password("MySecurePass123"),
            name="Stripe User",
            role=User.RoleTypes.MEMBER
        )
        
        # Generate access token
        self.access_token = generate_access_token(self.test_user.id)
        
        # Store token in database
        Token.objects.create(
            user=self.test_user,
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
            user=self.test_user,
            organization=self.organization,
            role=OrganizationMember.RoleTypes.OWNER
        )
        
        # Test price ID
        self.test_price_id = "price_test123"
        
        # URLs - based on router.py and stripe_subrouter.py
        self.plans_url = "/api/accounts/stripe/plans"
        self.checkout_url = "/api/accounts/stripe/checkout"
        self.portal_url = "/api/accounts/stripe/portal"
        self.webhook_success_url = "/api/accounts/stripe/webhook-success"
        self.create_customer_url = "/api/accounts/stripe/create-customer"

    @patch('apps.accounts.utils.stripe_utils.get_stripe_prices')
    @patch('apps.accounts.utils.stripe_utils.get_stripe_products')
    def test_get_subscription_plans(self, mock_get_products, mock_get_prices):
        """Test the /plans endpoint returns prices and products"""
        # Mock the get_stripe_prices function
        mock_prices = [
            {
                "id": self.test_price_id,
                "product_id": "prod_test123",
                "name": "Test Plan",
                "description": "Test plan description",
                "amount": 10.00,
                "currency": "usd",
                "interval": "month",
                "interval_count": 1,
                "trial_period_days": 14,
                "features": ["Feature 1", "Feature 2"]
            }
        ]
        mock_get_prices.return_value = mock_prices
        
        # Mock the get_stripe_products function
        mock_products = [
            {
                "id": "prod_test123",
                "name": "Test Plan",
                "description": "Test plan description",
                "features": ["Feature 1", "Feature 2"],
                "defaultPriceId": self.test_price_id,
                "metadata": {}
            }
        ]
        mock_get_products.return_value = mock_products
        
        # Make the request
        response = self.client.get(
            self.plans_url,
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertIn("prices", data["data"])
        self.assertIn("products", data["data"])
        self.assertEqual(len(data["data"]["prices"]), 1)
        self.assertEqual(data["data"]["prices"][0]["id"], self.test_price_id)
        self.assertEqual(data["data"]["prices"][0]["name"], "Test Plan")
        self.assertEqual(len(data["data"]["products"]), 1)
        self.assertEqual(data["data"]["products"][0]["id"], "prod_test123")

    def test_checkout_unauthenticated(self):
        """Test the /checkout endpoint requires authentication"""
        response = self.client.post(
            self.checkout_url,
            data=json.dumps({}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)

    @patch('apps.accounts.utils.stripe_utils.create_checkout_session')
    def test_checkout_authenticated_success(self, mock_session_create):
        """Test the /checkout endpoint creates a checkout session"""
        # Mock the create_checkout_session function
        mock_session_create.return_value = {"url": "https://checkout.stripe.com/test"}
        
        # Make the request
        response = self.client.post(
            f"{self.checkout_url}?price_id={self.test_price_id}",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("url", data)
        self.assertEqual(data["url"], "https://checkout.stripe.com/test")

    @patch('apps.accounts.utils.stripe_utils.create_checkout_session')
    def test_checkout_authenticated_error(self, mock_session_create):
        """Test the /checkout endpoint handles errors"""
        # Mock the create_checkout_session function
        mock_session_create.return_value = {"error": "currency-mismatch"}
        
        # Make the request
        response = self.client.post(
            f"{self.checkout_url}?price_id={self.test_price_id}",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)
        self.assertEqual(data["error"], "currency-mismatch")

    def test_portal_unauthenticated(self):
        """Test the /portal endpoint requires authentication"""
        response = self.client.post(
            self.portal_url,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)

    @patch('apps.accounts.utils.stripe_utils.create_customer_portal_session')
    def test_portal_authenticated_success(self, mock_session_create):
        """Test the /portal endpoint creates a customer portal session"""
        # Create subscription for the organization
        Subscription.objects.create(
            organization=self.organization,
            stripe_customer_id="cus_test123",
            stripe_subscription_id="sub_test123",
            stripe_product_id="prod_test123",
            plan_name="Test Plan",
            subscription_status=Subscription.StatusTypes.ACTIVE
        )
        
        # Mock the create_customer_portal_session function
        mock_session_create.return_value = {"url": "https://billing.stripe.com/test"}
        
        # Make the request
        response = self.client.post(
            self.portal_url,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("url", data)
        self.assertEqual(data["url"], "https://billing.stripe.com/test")

    @patch('apps.accounts.utils.stripe_utils.create_customer_portal_session')
    def test_portal_authenticated_error(self, mock_session_create):
        """Test the /portal endpoint handles errors"""
        # Create subscription for the organization
        Subscription.objects.create(
            organization=self.organization,
            stripe_customer_id="cus_test123",
            stripe_subscription_id="sub_test123",
            stripe_product_id="prod_test123",
            plan_name="Test Plan",
            subscription_status=Subscription.StatusTypes.ACTIVE
        )
        
        # Mock the create_customer_portal_session function
        mock_session_create.return_value = {"error": "no-subscription"}
        
        # Make the request
        response = self.client.post(
            self.portal_url,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)
        self.assertEqual(data["error"], "no-subscription")

    @patch('apps.accounts.utils.stripe_utils.handle_successful_checkout')
    def test_webhook_success_success(self, mock_handle_checkout):
        """Test the /webhook-success endpoint processes checkout sessions"""
        # Mock the handle_successful_checkout function
        mock_handle_checkout.return_value = True
        
        # Make the request
        response = self.client.post(
            f"{self.webhook_success_url}?session_id=cs_test_123",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)

    @patch('apps.accounts.utils.stripe_utils.handle_successful_checkout')
    def test_webhook_success_error(self, mock_handle_checkout):
        """Test the /webhook-success endpoint handles errors"""
        # Mock the handle_successful_checkout function
        mock_handle_checkout.return_value = False
        
        # Make the request
        response = self.client.post(
            f"{self.webhook_success_url}?session_id=cs_test_123",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertIn("error", data)

    @patch('apps.accounts.utils.stripe_utils.create_stripe_customer')
    def test_create_customer_success(self, mock_create_customer):
        """Test the /create-customer endpoint creates a Stripe customer"""
        # Mock the create_stripe_customer function
        mock_create_customer.return_value = "cus_test123"
        
        # Make the request
        response = self.client.post(
            self.create_customer_url,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)

    @patch('apps.accounts.utils.stripe_utils.create_stripe_customer')
    def test_create_customer_with_email(self, mock_create_customer):
        """Test the /create-customer endpoint with custom email"""
        # Mock the create_stripe_customer function
        mock_create_customer.return_value = "cus_test123"
        
        # Make the request
        response = self.client.post(
            f"{self.create_customer_url}?email=custom@example.com",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
        )
        
        # Verify the response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)

    def test_create_customer_unauthenticated(self):
        """Test the /create-customer endpoint requires authentication"""
        response = self.client.post(
            self.create_customer_url,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)
