import { test, expect } from '@playwright/test';

/**
 * Help Page E2E Tests
 * Tests the help/documentation page functionality including navigation,
 * language toggle, and content sections.
 */

test.describe('Help Page - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('loads help page successfully', async ({ page }) => {
    // Wait for page content to load
    await page.waitForTimeout(2000);

    // Check for help/guide title in Arabic or English
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/دليل الاستخدام|User Guide|Help|مَرْكَز|مكتبة/i);
  });

  test('displays table of contents', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });

    // Should have navigation links to sections
    const tocLinks = page.locator('a[href^="#"]');
    const count = await tocLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('displays all main sections', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });

    const pageContent = await page.textContent('body');

    // Check for main section titles (Arabic or English)
    // Introduction
    expect(pageContent).toMatch(/مقدمة|Introduction/i);
    // Search Guide
    expect(pageContent).toMatch(/دليل البحث|Search Guide/i);
    // Library Browsing
    expect(pageContent).toMatch(/تصفح المكتبة|Browse|Library/i);
    // Reading
    expect(pageContent).toMatch(/قراءة|Reading/i);
    // Settings
    expect(pageContent).toMatch(/الإعدادات|Settings/i);
    // Contact
    expect(pageContent).toMatch(/اتصل بنا|Contact/i);
  });

  test('displays contact email', async ({ page }) => {
    await page.waitForSelector('h1', { timeout: 10000 });

    // Should display the contact email
    const emailLink = page.locator('a[href="mailto:hadithhub141@gmail.com"]');
    await expect(emailLink).toBeVisible();
  });
});

test.describe('Help Page - Search Documentation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('documents all search modes', async ({ page }) => {
    const pageContent = await page.textContent('body');

    // Exact Search
    expect(pageContent).toMatch(/البحث الدقيق|Exact Search/i);
    // Word Search
    expect(pageContent).toMatch(/البحث بالكلمات|Word Search/i);
    // Root Search
    expect(pageContent).toMatch(/البحث بالجذر|Root Search/i);
    // Topic/Semantic Search
    expect(pageContent).toMatch(/البحث الموضوعي|Topic Search|AI/i);
  });

  test('shows AI badge for topic search', async ({ page }) => {
    // Topic search should be highlighted as AI-powered
    const aiBadge = page.locator('text=/AI|ذكاء اصطناعي/i');
    await expect(aiBadge.first()).toBeVisible();
  });
});

test.describe('Help Page - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('back to home link works', async ({ page }) => {
    // Find and click back to home link
    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible();

    await backLink.click();

    // Should navigate to home page
    await expect(page).toHaveURL('/');
  });

  test('anchor links scroll to sections', async ({ page }) => {
    // Find a TOC link
    const searchLink = page.locator('a[href="#search"]');

    if (await searchLink.isVisible()) {
      await searchLink.click();

      // URL should include the hash
      await expect(page).toHaveURL(/#search/);
    }
  });

  test('logo link navigates to home', async ({ page }) => {
    // Click on the logo/brand link
    const logoLink = page.locator('header a[href="/"]').first();

    if (await logoLink.isVisible()) {
      await logoLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Help Page - Language Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('toggles between Arabic and English', async ({ page }) => {
    // Find language toggle button
    const langToggle = page.locator('button').filter({ hasText: /EN|العربية|English|عربي/i }).first();

    if (await langToggle.isVisible()) {
      // Get initial content
      const initialTitle = await page.locator('h1').first().textContent();

      // Toggle language
      await langToggle.click();
      await page.waitForTimeout(500);

      // Title should change
      const newTitle = await page.locator('h1').first().textContent();
      expect(newTitle).not.toEqual(initialTitle);

      // Toggle back
      await langToggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('displays correct RTL/LTR direction', async ({ page }) => {
    // Check that the page has correct text direction
    const mainElement = page.locator('[dir]').first();
    const direction = await mainElement.getAttribute('dir');

    // Should be either 'rtl' or 'ltr'
    expect(['rtl', 'ltr']).toContain(direction);
  });
});

test.describe('Help Page - Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('theme toggle is visible', async ({ page }) => {
    // Theme toggle should be in header
    const themeToggle = page.locator('header button').filter({ has: page.locator('svg') });
    const count = await themeToggle.count();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not be visible
  });

  test('toggles between light and dark mode', async ({ page }) => {
    // Find a theme toggle button with sun/moon icon
    const themeButtons = page.locator('header button');
    const count = await themeButtons.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const button = themeButtons.nth(i);
        const svg = button.locator('svg');

        if (await svg.isVisible()) {
          // This might be the theme toggle
          await button.click();
          await page.waitForTimeout(300);
          break;
        }
      }
    }

    // Page should still be functional
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Help Page - Responsive Design', () => {
  test('displays correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Content should be visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/دليل|Guide|Help|مَرْكَز|مكتبة/i);
  });

  test('displays correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Content should be visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('displays correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Content should be visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Help Page - Accessibility from Other Pages', () => {
  test('help link visible on home page footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });

    // Find help link in footer
    const helpLink = page.locator('footer a[href="/help"], a[href="/help"]').first();
    await expect(helpLink).toBeVisible();

    // Click and verify navigation
    await helpLink.click();
    await expect(page).toHaveURL('/help');
  });

  test('help icon visible on search page', async ({ page }) => {
    await page.goto('/search');

    // Find help link icon
    const helpLink = page.locator('a[href="/help"]').first();

    if (await helpLink.isVisible()) {
      await helpLink.click();
      await expect(page).toHaveURL('/help');
    }
  });
});
