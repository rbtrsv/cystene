import { test, expect } from '@playwright/test';

/**
 * This test suite verifies asset management permissions
 */
test.describe('Asset Manager Permissions', () => {
  // Use real credentials that you should replace
  const adminUser = {
    email: 'robert.radoslav@protonmail.ch', // REPLACE WITH REAL ADMIN EMAIL
    password: '$R654693hyts'     // REPLACE WITH REAL PASSWORD
  };
  
  const viewerUser = {
    email: 'robert.radoslav@protonmail.ch', // REPLACE WITH REAL VIEWER EMAIL
    password: '$R654693hyts'      // REPLACE WITH REAL PASSWORD
  };

  // Helper function to log in
  async function login(page, email, password) {
    await page.goto('/accounts/login');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard', { timeout: 10000 });
  }

  test('Admin can access company creation', async ({ page }) => {
    // Skip if no real credentials
    test.skip(adminUser.email === 'admin@example.com', 'No real admin credentials provided');
    
    // Login as admin
    await login(page, adminUser.email, adminUser.password);
    
    // Go to companies page
    await page.goto('/dashboard/companies');
    
    // Check for create company button (only admins and editors should see this)
    const createButton = page.getByRole('button', { name: /Create|Add|New Company/i });
    await expect(createButton).toBeVisible();
    
    // Click the button
    await createButton.click();
    
    // Verify create form appears
    await expect(page.getByText(/Create Company|New Company|Add Company/i)).toBeVisible();
  });

  test('Viewer cannot create companies', async ({ page }) => {
    // Skip if no real credentials
    test.skip(viewerUser.email === 'viewer@example.com', 'No real viewer credentials provided');
    
    // Login as viewer
    await login(page, viewerUser.email, viewerUser.password);
    
    // Go to companies page
    await page.goto('/dashboard/companies');
    
    // Create button should not be visible for viewers
    const createButton = page.getByRole('button', { name: /Create|Add|New Company/i });
    await expect(createButton).not.toBeVisible();
  });
  
  test('Permission checks work on debug page', async ({ page }) => {
    // Skip if no real credentials
    test.skip(adminUser.email === 'admin@example.com', 'No real admin credentials provided');
    
    // Login as admin
    await login(page, adminUser.email, adminUser.password);
    
    // Go to permissions debug page
    await page.goto('/dashboard/debug/permissions');
    
    // Check that permissions UI shows correct values for admin
    await expect(page.locator('[data-testid="perm-global-view"]')).toHaveAttribute('data-result', 'allowed');
    await expect(page.locator('[data-testid="perm-global-create"]')).toHaveAttribute('data-result', 'allowed');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'admin-permissions.png' });
    
    // Logout and login as viewer
    await page.goto('/accounts/logout');
    await login(page, viewerUser.email, viewerUser.password);
    
    // Go to permissions debug page
    await page.goto('/dashboard/debug/permissions');
    
    // Check that permissions UI shows correct values for viewer
    await expect(page.locator('[data-testid="perm-global-view"]')).toHaveAttribute('data-result', 'allowed');
    await expect(page.locator('[data-testid="perm-global-create"]')).toHaveAttribute('data-result', 'denied');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'viewer-permissions.png' });
  });
  
  test('Company list is visible to all users', async ({ page }) => {
    // Login as viewer (lowest permission)
    await login(page, viewerUser.email, viewerUser.password);
    
    // Go to companies page
    await page.goto('/dashboard/companies');
    
    // Even viewers should see the list
    await expect(page.getByText(/Companies|Your Companies/i)).toBeVisible();
    
    // List or table should be present
    await expect(page.locator('table, ul, [role="list"]')).toBeVisible();
  });
}); 