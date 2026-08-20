import { test, expect } from '@playwright/test';

test('has title and layout elements', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/THEDAL/i);

  // Check if Sidebar or TopBar elements are present
  // For instance, looking for a heading or a known text inside the layout
  const overviewHeading = page.locator('text=Environment Health');
  // Check if it's visible, or just check standard sidebar links
  await expect(page.locator('text=Overview').first()).toBeVisible();
});
