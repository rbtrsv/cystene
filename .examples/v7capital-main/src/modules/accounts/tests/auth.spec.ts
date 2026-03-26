import { test, expect } from '@playwright/test';

/**
 * This test suite verifies that the accounts authentication and permissions systems work correctly
 */
test.describe('Account Authentication & Permissions', () => {
  // Define user roles for testing
  const users = {
    admin: {
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN'
    },
    editor: {
      email: 'editor@example.com',
      password: 'password123',
      role: 'EDITOR'
    },
    viewer: {
      email: 'viewer@example.com',
      password: 'password123',
      role: 'VIEWER'
    }
  };

  // Mock auth for testing
  test.beforeEach(async ({ page }) => {
    // This intercepts and mocks successful authentication requests
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: 'admin@example.com',
            role: 'ADMIN',
            name: 'Mock Admin'
          }
        })
      });
    });

    // Mock user profile data 
    await page.route('**/rest/v1/profiles**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'mock-profile-id',
          user_id: 'mock-user-id',
          email: 'admin@example.com',
          role: 'ADMIN',
          name: 'Mock Admin'
        }])
      });
    });
  });

  test('login page loads correctly', async ({ page }) => {
    // Go to login page
    await page.goto('/accounts/login');
    
    // Check that the login form loads correctly
    await expect(page.locator('h2.text-xl, .text-xl')).toContainText('Sign in to your account');
    
    // Verify form elements are present
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('Unauthenticated user is redirected to login', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/accounts\/login/);
  });

  test.skip('Global permissions are enforced correctly', async ({ page }) => {
    // This test needs the permissions debug page which we don't have yet
    // Sign in as admin
    const user = users.admin;
    await page.goto('/accounts/login');
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Navigate to permissions debug page
    await page.goto('/dashboard/debug/permissions');
    
    // Check global permissions for admin
    await expect(page.locator('[data-testid="perm-global-view"]')).toHaveAttribute('data-result', 'allowed');
    await expect(page.locator('[data-testid="perm-global-create"]')).toHaveAttribute('data-result', 'allowed');
    await expect(page.locator('[data-testid="perm-global-update"]')).toHaveAttribute('data-result', 'allowed');
    await expect(page.locator('[data-testid="perm-global-delete"]')).toHaveAttribute('data-result', 'allowed');
    
    // Sign out
    await page.goto('/accounts/logout');
    
    // Sign in as viewer
    const viewerUser = users.viewer;
    await page.goto('/accounts/login');
    await page.fill('#email', viewerUser.email);
    await page.fill('#password', viewerUser.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Navigate to permissions debug page
    await page.goto('/dashboard/debug/permissions');
    
    // Check global permissions for viewer
    await expect(page.locator('[data-testid="perm-global-view"]')).toHaveAttribute('data-result', 'allowed');
    await expect(page.locator('[data-testid="perm-global-create"]')).toHaveAttribute('data-result', 'denied');
    await expect(page.locator('[data-testid="perm-global-update"]')).toHaveAttribute('data-result', 'denied');
    await expect(page.locator('[data-testid="perm-global-delete"]')).toHaveAttribute('data-result', 'denied');
  });

  test.skip('User profile data is correctly displayed', async ({ page }) => {
    // This test needs the permissions debug page which we don't have yet
    // Sign in as admin
    const user = users.admin;
    await page.goto('/accounts/login');
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Navigate to permissions debug page (which shows user info)
    await page.goto('/dashboard/debug/permissions');
    
    // Verify user profile data is loaded correctly
    const profile = page.locator('[data-testid="user-profile"]');
    await expect(profile).toContainText(user.email);
    await expect(profile).toContainText(user.role);
  });

  test('Sign out works correctly', async ({ page }) => {
    // Sign in
    const user = users.admin;
    await page.goto('/accounts/login');
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Verify we're logged in
    await page.waitForURL('/dashboard');
    
    // Sign out
    await page.goto('/accounts/logout');
    
    // Try to access protected page
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/accounts\/login/);
  });

  // For simplicity, skip the complex tests until we can set up proper mocking
  test.skip('Authentication simulation', async ({ page }) => {
    // This is a placeholder for future authentication tests
    // This would verify actual signin functionality when we have proper mocks
  });
});

/**
 * This test suite verifies that the accounts authentication system works correctly
 */
test.describe('Account Authentication', () => {
  // We'll use real credentials that you should replace with valid ones
  const validCredentials = {
    email: 'robert.radoslav@protonmail.ch', // REPLACE WITH REAL EMAIL
    password: '$R654693hyts'     // REPLACE WITH REAL PASSWORD
  };

  const invalidCredentials = {
    email: 'wrong@example.com',
    password: 'wrongpassword'
  };

  test('login form accepts input and shows validation', async ({ page }) => {
    // Go to login page
    await page.goto('/accounts/login');
    
    // Try to submit with empty form
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show validation errors - check if any error message appears
    await expect(page.locator('.text-red-500, .text-destructive')).toBeVisible({timeout: 3000});
    
    // Fill form with invalid credentials
    await page.fill('#email', invalidCredentials.email);
    await page.fill('#password', invalidCredentials.password);
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should show auth error
    await expect(page.locator('text=Invalid credentials')).toBeVisible({timeout: 5000});
  });

  test('Successful authentication redirects to dashboard', async ({ page }) => {
    // This test can be skipped if you don't have valid credentials yet
    test.skip(validCredentials.email === 'admin@example.com', 'No real credentials provided');

    // Go to login page
    await page.goto('/accounts/login');
    
    // Fill in with valid credentials
    await page.fill('#email', validCredentials.email);
    await page.fill('#password', validCredentials.password);
    
    // Take a screenshot before submitting for debugging
    await page.screenshot({ path: 'before-login.png' });
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Should redirect to dashboard
    try {
      await page.waitForURL('/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL('/dashboard');
    } catch (error) {
      // Take a screenshot on failure for debugging
      await page.screenshot({ path: 'login-failure.png' });
      throw error;
    }
  });

  test('Dashboard redirects unauthenticated users to login', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/accounts\/login/);
  });

  test('Authentication persists across pages', async ({ page }) => {
    // This test can be skipped if you don't have valid credentials yet
    test.skip(validCredentials.email === 'admin@example.com', 'No real credentials provided');
    
    // Log in first
    await page.goto('/accounts/login');
    await page.fill('#email', validCredentials.email);
    await page.fill('#password', validCredentials.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for successful login
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Navigate to another protected page
    await page.goto('/dashboard/profile');
    
    // Should still be authenticated (not redirected to login)
    await expect(page).not.toHaveURL(/\/accounts\/login/);
  });
}); 