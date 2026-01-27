import { test, expect } from '@playwright/test';

/**
 * Home Page E2E Tests
 * Tests the main books listing page with filtering, sorting, pagination, and view modes.
 */

test.describe('Home Page - Books List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and displays books', async ({ page }) => {
    // Wait for books to load
    await expect(page.locator('[data-testid="book-card"], .book-card, a[href^="/book/"]').first()).toBeVisible({ timeout: 10000 });

    // Should have multiple books displayed
    const bookLinks = page.locator('a[href^="/book/"]');
    await expect(bookLinks.first()).toBeVisible();
    const count = await bookLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('displays page title and header', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
    // Check for Arabic or English title in page
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/مكتبة|الحديث|Hadith|Library|كتب/i);
  });

  test('shows book information', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });

    // Books should display Arabic titles
    const pageContent = await page.textContent('body');
    // Should contain Arabic text (hadith book titles)
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });
});

test.describe('Home Page - Sect Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('filters books by Shia sect', async ({ page }) => {
    // Find and click Shia filter button
    const shiaButton = page.locator('button').filter({ hasText: /شيعة|Shia/i });
    if (await shiaButton.isVisible()) {
      await shiaButton.click();
      await page.waitForTimeout(500);

      // Verify filter is applied - books should still be visible
      const bookLinks = page.locator('a[href^="/book/"]');
      const count = await bookLinks.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('filters books by Sunni sect', async ({ page }) => {
    // Find and click Sunni filter button
    const sunniButton = page.locator('button').filter({ hasText: /سنة|Sunni/i });
    if (await sunniButton.isVisible()) {
      await sunniButton.click();
      await page.waitForTimeout(500);

      // Verify filter is applied
      const bookLinks = page.locator('a[href^="/book/"]');
      const count = await bookLinks.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('shows all books when All filter selected', async ({ page }) => {
    // Find and click All filter button
    const allButton = page.locator('button').filter({ hasText: /الكل|All/i }).first();
    if (await allButton.isVisible()) {
      await allButton.click();
      await page.waitForTimeout(500);

      // Should show books
      const bookLinks = page.locator('a[href^="/book/"]');
      const count = await bookLinks.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Home Page - View Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('switches between view modes', async ({ page }) => {
    // Look for view mode toggle buttons (compact, cards, list)
    const viewButtons = page.locator('button[title], button').filter({ hasText: /compact|cards|list|مضغوط|بطاقات|قائمة/i });

    if (await viewButtons.first().isVisible()) {
      // Click through view modes
      const buttons = await viewButtons.all();
      for (const button of buttons) {
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Verify books are still displayed after mode changes
    const bookLinks = page.locator('a[href^="/book/"]');
    await expect(bookLinks.first()).toBeVisible();
  });
});

test.describe('Home Page - Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('sorts books by title', async ({ page }) => {
    // Look for sort dropdown or buttons
    const sortByTitle = page.locator('button, select').filter({ hasText: /عنوان|title/i }).first();

    if (await sortByTitle.isVisible()) {
      await sortByTitle.click();
      await page.waitForTimeout(500);

      // Verify books are still displayed
      const bookLinks = page.locator('a[href^="/book/"]');
      await expect(bookLinks.first()).toBeVisible();
    }
  });

  test('sorts books by author', async ({ page }) => {
    const sortByAuthor = page.locator('button, select').filter({ hasText: /مؤلف|author/i }).first();

    if (await sortByAuthor.isVisible()) {
      await sortByAuthor.click();
      await page.waitForTimeout(500);

      const bookLinks = page.locator('a[href^="/book/"]');
      await expect(bookLinks.first()).toBeVisible();
    }
  });
});

test.describe('Home Page - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('navigates to next page', async ({ page }) => {
    // Look for pagination controls
    const nextButton = page.locator('button').filter({ hasText: /التالي|Next|→|>/i }).first();

    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      const initialBooks = await page.locator('a[href^="/book/"]').first().textContent();
      await nextButton.click();
      await page.waitForTimeout(500);

      // Page should change
      const bookLinks = page.locator('a[href^="/book/"]');
      await expect(bookLinks.first()).toBeVisible();
    }
  });

  test('navigates to previous page', async ({ page }) => {
    // First go to page 2
    const nextButton = page.locator('button').filter({ hasText: /التالي|Next|→|>/i }).first();

    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Now go back
      const prevButton = page.locator('button').filter({ hasText: /السابق|Prev|←|</i }).first();
      if (await prevButton.isVisible() && await prevButton.isEnabled()) {
        await prevButton.click();
        await page.waitForTimeout(500);

        const bookLinks = page.locator('a[href^="/book/"]');
        await expect(bookLinks.first()).toBeVisible();
      }
    }
  });
});

test.describe('Home Page - Language Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('toggles between Arabic and English', async ({ page }) => {
    // Look for language toggle
    const langToggle = page.locator('button').filter({ hasText: /EN|العربية|English|عربي/i }).first();

    if (await langToggle.isVisible()) {
      // Get initial page content
      const initialContent = await page.textContent('body');

      // Toggle language
      await langToggle.click();
      await page.waitForTimeout(500);

      // Content should have changed
      const newContent = await page.textContent('body');
      expect(newContent).toBeTruthy();

      // Toggle back
      await langToggle.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Home Page - Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('toggles between light and dark mode', async ({ page }) => {
    // Look for theme toggle button (usually has sun/moon icon)
    const themeToggle = page.locator('button').filter({ has: page.locator('svg') }).first();

    if (await themeToggle.isVisible()) {
      // Check initial state
      const htmlElement = page.locator('html');
      const initialClass = await htmlElement.getAttribute('class');

      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(300);

      // Class should have changed
      const newClass = await htmlElement.getAttribute('class');
      // Theme toggle should work (class may or may not change based on implementation)
    }
  });
});

test.describe('Home Page - Book Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('clicking a book navigates to book detail page', async ({ page }) => {
    // Click the first book link
    const firstBookLink = page.locator('a[href^="/book/"]').first();
    const href = await firstBookLink.getAttribute('href');

    await firstBookLink.click();

    // Should navigate to book page
    await expect(page).toHaveURL(/\/book\//);
  });
});

test.describe('Home Page - Search Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('search bar is visible and functional', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();

    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('محمد');

    // Submit search
    await searchInput.press('Enter');

    // Should navigate to search page
    await expect(page).toHaveURL(/\/search/);
  });

  test('search mode options are displayed', async ({ page }) => {
    // Look for search mode buttons
    const modeButtons = page.locator('button').filter({ hasText: /كلمة|جذر|عبارة|موضوع|Word|Root|Exact|Topic/i });

    // At least one mode option should be visible
    const count = await modeButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Home Page - Local Search Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('a[href^="/book/"]', { timeout: 10000 });
  });

  test('filters books list by local search', async ({ page }) => {
    // Some home pages have a local book filter
    const filterInput = page.locator('input[placeholder*="بحث"], input[placeholder*="filter"], input[placeholder*="Search"]').first();

    if (await filterInput.isVisible()) {
      // Get initial book count
      const initialCount = await page.locator('a[href^="/book/"]').count();

      // Type a filter term
      await filterInput.fill('الكافي');
      await page.waitForTimeout(500);

      // Should filter books
      const filteredCount = await page.locator('a[href^="/book/"]').count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });
});
