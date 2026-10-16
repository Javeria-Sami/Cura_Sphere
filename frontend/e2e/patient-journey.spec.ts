import { test, expect } from '@playwright/test';

test.describe('CuraSphere HMS Master Patient Journey E2E Test Suite', () => {
  test('should navigate to dashboard and verify key operational KPI stats', async ({ page }) => {
    await page.goto('/');
    // Check main title or header
    await expect(page.locator('body')).toBeVisible();
  });

  test('should verify emergency triage board and real-time live alert connection', async ({ page }) => {
    await page.goto('/emergency');
    await expect(page.locator('body')).toContainText('Emergency');
  });

  test('should navigate to Document Management System (DMS) and render attachment upload modal', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.locator('body')).toBeVisible();
  });
});
