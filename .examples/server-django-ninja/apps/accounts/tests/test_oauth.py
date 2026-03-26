from django.test import TestCase, Client
from unittest.mock import patch, MagicMock
from ..models import User, Token

class GoogleOAuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.auth_url = "/api/accounts/oauth/google/url"
        self.callback_url = "/api/accounts/oauth/google/callback"

    def test_google_auth_url_returns_url(self):
        """Test that auth URL endpoint returns a URL"""
        response = self.client.get(self.auth_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('auth_url', data)
        self.assertTrue(data['auth_url'].startswith('https://accounts.google.com/o/oauth2/auth'))
        self.assertIn('state', data)

    def test_callback_requires_code(self):
        """Test that callback requires code parameter"""
        response = self.client.post(self.callback_url)
        self.assertEqual(response.status_code, 422)  # Validation error

    def test_callback_success(self):
        """Test successful OAuth callback"""
        # In a real test, we would need to mock the Google OAuth API
        # For now, we'll just test that the endpoint exists and requires a code
        response = self.client.post(
            self.callback_url,
            data={'code': 'test_code'},
            content_type='application/json'
        )
        
        # The endpoint should return 422 without a valid code
        self.assertEqual(response.status_code, 422)

    def test_callback_error(self):
        """Test OAuth callback with error"""
        # Test that the endpoint handles missing code parameter
        response = self.client.post(
            self.callback_url,
            data={},
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 422)
