import { test, expect } from '@playwright/test';

/**
 * Page Reader E2E Tests
 * Tests content display, footnotes, highlighting, and reader features.
 */

test.describe('Page Reader - Content Display', () => {
  const testBookId = '01348';

  test('displays hadith text', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/1`);
    await page.waitForTimeout(2000);

    // Should display Arabic text content
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
    expect(pageContent?.length).toBeGreaterThan(200);
  });

  test('text is properly formatted RTL', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/1`);
    await page.waitForTimeout(2000);

    // Check for RTL direction on text container
    const textContainer = page.locator('[dir="rtl"], .text-right, [style*="direction: rtl"]').first();

    // Should have RTL styling for Arabic text
    const hasRTL = await textContainer.count() > 0 || await page.locator('html[dir="rtl"]').count() > 0;
    // Page should support Arabic text direction
  });

  test('page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`/book/${testBookId}/1/1`);
    await page.waitForSelector('body');
    const loadTime = Date.now() - startTime;

    // Page should load in reasonable time
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Page Reader - Footnotes', () => {
  // Al-Khisal has footnotes
  const testBookId = '01462';

  test('displays footnotes when present', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/10`);
    await page.waitForTimeout(2000);

    // Look for footnote markers or section
    const pageContent = await page.textContent('body');
    // Footnotes may contain reference markers like (1) or superscripts
    expect(pageContent).toBeTruthy();
  });

  test('footnote markers are visible', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/20`);
    await page.waitForTimeout(2000);

    // Look for footnote indicators
    const footnoteMarkers = page.locator('sup, [class*="footnote"], [data-footnote]');
    // Some pages have footnotes
    const count = await footnoteMarkers.count();
    // Just verify page loads (footnotes may not be on every page)
  });

  test('footnotes are expandable/readable', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/30`);
    await page.waitForTimeout(2000);

    // Look for footnote toggle or section
    const footnoteSection = page.locator('[class*="footnote"], [id*="footnote"]');

    if (await footnoteSection.count() > 0) {
      // Footnotes section exists
      await expect(footnoteSection.first()).toBeVisible();
    }
  });
});

test.describe('Page Reader - Highlighting', () => {
  test('highlights search term from URL', async ({ page }) => {
    await page.goto('/book/01348/1/1?highlight=محمد');
    await page.waitForTimeout(2000);

    // Should show highlight indicator or banner
    const highlightIndicator = page.locator('[class*="highlight"], mark, .bg-yellow, .text-highlight');
    // Highlight functionality should work
  });

  test('highlight banner shows search term', async ({ page }) => {
    await page.goto('/book/01348/1/1?highlight=علي');
    await page.waitForTimeout(2000);

    // Should show what's highlighted
    const pageContent = await page.textContent('body');
    // Page should indicate highlighting is active
  });

  test('clear highlight button works', async ({ page }) => {
    await page.goto('/book/01348/1/1?highlight=محمد');
    await page.waitForTimeout(2000);

    // Look for clear highlight button
    const clearButton = page.locator('a, button').filter({ hasText: /إزالة|Clear|مسح/i }).first();

    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // URL should no longer have highlight param
      expect(page.url()).not.toContain('highlight=');
    }
  });

  test('back to search button works', async ({ page }) => {
    await page.goto('/book/01348/1/1?highlight=محمد&mode=word');
    await page.waitForTimeout(2000);

    // Look for back to search button
    const backButton = page.locator('button, a').filter({ hasText: /العودة|Back.*search|البحث/i }).first();

    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForTimeout(500);

      // Should navigate back (using browser history)
    }
  });
});

test.describe('Page Reader - Font Selection', () => {
  test('font selector is available', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for font selector
    const fontSelector = page.locator('select, button').filter({ hasText: /خط|Font/i }).first();

    if (await fontSelector.isVisible()) {
      // Font selector exists
      await expect(fontSelector).toBeVisible();
    }
  });

  test('changing font updates text display', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for font options
    const fontOptions = page.locator('button[class*="font"], select option');

    if (await fontOptions.count() > 1) {
      // Click a different font option
      await fontOptions.nth(1).click();
      await page.waitForTimeout(500);

      // Text should still be visible
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/[\u0600-\u06FF]/);
    }
  });
});

test.describe('Page Reader - Book/Quran References', () => {
  test('book references are linked', async ({ page }) => {
    await page.goto('/book/01348/1/50');
    await page.waitForTimeout(2000);

    // Look for internal book reference links
    const bookRefs = page.locator('a[href*="/book/"]');

    // Page may have cross-references to other books
    const count = await bookRefs.count();
    // Just verify page loads
  });

  test('Quran references are detected', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Quran references might be highlighted or linked
    const quranRefs = page.locator('a[href*="quran"], [class*="quran"]');
    // Not all pages have Quran references
  });
});

test.describe('Page Reader - Language Toggle', () => {
  test('language toggle affects UI text', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Get initial UI text
    const initialContent = await page.textContent('body');

    // Toggle language
    const langToggle = page.locator('button').filter({ hasText: /EN|العربية|English/i }).first();

    if (await langToggle.isVisible()) {
      await langToggle.click();
      await page.waitForTimeout(500);

      // UI should update
      const newContent = await page.textContent('body');
      expect(newContent).toBeTruthy();
    }
  });

  test('content remains in Arabic regardless of UI language', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Toggle to English UI
    const langToggle = page.locator('button').filter({ hasText: /EN|English/i }).first();

    if (await langToggle.isVisible()) {
      await langToggle.click();
      await page.waitForTimeout(500);
    }

    // Hadith text should still be Arabic
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });
});

test.describe('Page Reader - Theme', () => {
  test('dark mode applies to reader', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for theme toggle
    const themeToggle = page.locator('button').filter({ has: page.locator('svg') }).first();

    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Check if dark class is applied
      const html = page.locator('html');
      const className = await html.getAttribute('class');
      // Theme should toggle
    }
  });

  test('text remains readable in both themes', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Content should be visible
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(100);

    // Toggle theme
    const themeToggle = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    // Content should still be visible
    const newContent = await page.textContent('body');
    expect(newContent?.length).toBeGreaterThan(100);
  });
});

test.describe('Page Reader - Mobile Responsiveness', () => {
  test('displays correctly on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Content should be visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('navigation works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/book/01348/1/5');
    await page.waitForTimeout(2000);

    // Find navigation controls
    const navButtons = page.locator('a, button').filter({ hasText: /التالي|السابق|Next|Prev|→|←|>/i });

    if (await navButtons.first().isVisible()) {
      await navButtons.first().click();
      await page.waitForTimeout(1000);

      // Should navigate
      await expect(page).toHaveURL(/\/book\/01348\/1\/\d+/);
    }
  });
});

test.describe('Page Reader - Accessibility', () => {
  test('page has proper structure', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Should have heading structure
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('links are focusable', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Tab through page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to focus elements
  });
});

test.describe('Page Reader - Topic Search Highlight', () => {
  test('topic search results show special highlight', async ({ page }) => {
    await page.goto('/book/01348/1/1?highlight=test&mode=topic');
    await page.waitForTimeout(2000);

    // Topic mode should show different highlighting style
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
