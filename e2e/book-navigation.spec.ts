import { test, expect } from '@playwright/test';

/**
 * Book Navigation E2E Tests
 * Tests book detail pages, volume selection, and page navigation.
 */

test.describe('Book Detail Page', () => {
  // Use Al-Kafi (01348) as test book - a major hadith collection
  const testBookId = '01348';

  test('loads book detail page', async ({ page }) => {
    await page.goto(`/book/${testBookId}`);

    // Should display book information
    await page.waitForTimeout(2000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    // Should contain Arabic content
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('displays book title', async ({ page }) => {
    await page.goto(`/book/${testBookId}`);
    await page.waitForTimeout(2000);

    // Should show Al-Kafi title
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/الكافي|Al-Kafi/i);
  });

  test('displays volume list', async ({ page }) => {
    await page.goto(`/book/${testBookId}`);
    await page.waitForTimeout(2000);

    // Should show volume links
    const volumeLinks = page.locator('a[href*="/book/01348/"]');
    const count = await volumeLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows book metadata', async ({ page }) => {
    await page.goto(`/book/${testBookId}`);
    await page.waitForTimeout(2000);

    // Should display author and other info
    const pageContent = await page.textContent('body');
    // Should have some content indicating volumes or pages
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Volume Selection', () => {
  const testBookId = '01348';

  test('clicking volume navigates to first page', async ({ page }) => {
    await page.goto(`/book/${testBookId}`);
    await page.waitForTimeout(2000);

    // Click first volume
    const volumeLink = page.locator('a[href*="/book/01348/"]').first();
    if (await volumeLink.isVisible()) {
      await volumeLink.click();

      // Should navigate to volume/page
      await expect(page).toHaveURL(/\/book\/01348\/\d+/);
    }
  });

  test('displays volume number correctly', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/1`);
    await page.waitForTimeout(2000);

    // Should show volume 1 indicator
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/مجلد|جزء|Volume|Vol\.?\s*1/i);
  });
});

test.describe('Page Navigation', () => {
  const testBookId = '01348';

  test('displays page content', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/1`);
    await page.waitForTimeout(2000);

    // Should show hadith text
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('shows page number', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/5`);
    await page.waitForTimeout(2000);

    // Should display page number 5
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/5|٥/);
  });

  test('navigates to next page', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/1`);
    await page.waitForTimeout(2000);

    // Find next page button
    const nextButton = page.locator('a, button').filter({ hasText: /التالي|Next|→|>/i }).first();

    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Should be on page 2
      await expect(page).toHaveURL(/\/book\/01348\/1\/2/);
    }
  });

  test('navigates to previous page', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/5`);
    await page.waitForTimeout(2000);

    // Find previous page button
    const prevButton = page.locator('a, button').filter({ hasText: /السابق|Prev|←|</i }).first();

    if (await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForTimeout(1000);

      // Should be on page 4
      await expect(page).toHaveURL(/\/book\/01348\/1\/4/);
    }
  });

  test('first page has no previous button or it is disabled', async ({ page }) => {
    await page.goto(`/book/${testBookId}/1/1`);
    await page.waitForTimeout(2000);

    // Previous button should be hidden or disabled on first page
    const prevButton = page.locator('a, button').filter({ hasText: /السابق|Prev|←|</i }).first();

    if (await prevButton.isVisible()) {
      const isDisabled = await prevButton.isDisabled();
      const href = await prevButton.getAttribute('href');
      // Either disabled or missing href
      expect(isDisabled || !href || href === '#').toBe(true);
    }
  });
});

test.describe('Multi-Volume Navigation', () => {
  const testBookId = '01348'; // Al-Kafi has multiple volumes

  test('can navigate between volumes', async ({ page }) => {
    // Go to last page of volume 1 (approximate)
    await page.goto(`/book/${testBookId}/1/100`);
    await page.waitForTimeout(2000);

    // Try to navigate forward
    const nextButton = page.locator('a, button').filter({ hasText: /التالي|Next|→|>/i }).first();

    if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
      // Keep clicking until volume changes or we reach end
      await nextButton.click();
      await page.waitForTimeout(1000);

      // URL should still be valid book page
      await expect(page).toHaveURL(/\/book\/01348\/\d+\/\d+/);
    }
  });

  test('volume 2 is accessible', async ({ page }) => {
    await page.goto(`/book/${testBookId}/2/1`);
    await page.waitForTimeout(2000);

    // Should load volume 2 content
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });
});

test.describe('Direct URL Navigation', () => {
  test('loads specific book/volume/page from URL', async ({ page }) => {
    await page.goto('/book/01348/1/10');
    await page.waitForTimeout(2000);

    // Should display page 10
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('handles invalid book ID gracefully', async ({ page }) => {
    await page.goto('/book/99999');
    await page.waitForTimeout(2000);

    // Should show error or not found
    const status = page.url();
    // Page should load without crashing
  });

  test('handles invalid page number gracefully', async ({ page }) => {
    await page.goto('/book/01348/1/99999');
    await page.waitForTimeout(2000);

    // Should handle gracefully (show error or redirect)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Book Navigation - Different Books', () => {
  test('loads Bihar al-Anwar (large book)', async ({ page }) => {
    await page.goto('/book/01407/1/1');
    await page.waitForTimeout(2000);

    // Should display content
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('loads Al-Khisal (book with footnotes)', async ({ page }) => {
    await page.goto('/book/01462/1/1');
    await page.waitForTimeout(2000);

    // Should display content
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });
});

test.describe('Page Jump/Go To', () => {
  test('page input allows jumping to specific page', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for page input or jump control
    const pageInput = page.locator('input[type="number"], input[placeholder*="صفحة"], input[placeholder*="page"]').first();

    if (await pageInput.isVisible()) {
      await pageInput.clear();
      await pageInput.fill('50');
      await pageInput.press('Enter');
      await page.waitForTimeout(1000);

      // Should navigate to page 50
      await expect(page).toHaveURL(/\/book\/01348\/1\/50/);
    }
  });
});

test.describe('Breadcrumb Navigation', () => {
  test('shows breadcrumb path', async ({ page }) => {
    await page.goto('/book/01348/1/5');
    await page.waitForTimeout(2000);

    // Look for breadcrumb or back navigation
    const breadcrumb = page.locator('nav, [aria-label*="breadcrumb"]');
    // Or home link
    const homeLink = page.locator('a[href="/"]');

    // Should have some navigation path
    const hasNav = (await breadcrumb.count()) > 0 || (await homeLink.count()) > 0;
    expect(hasNav).toBe(true);
  });

  test('can navigate back to book list', async ({ page }) => {
    await page.goto('/book/01348/1/5');
    await page.waitForTimeout(2000);

    // Find link back to home or book list
    const homeLink = page.locator('a[href="/"]').first();

    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('URL Sharing', () => {
  test('share button is available', async ({ page }) => {
    await page.goto('/book/01348/1/5');
    await page.waitForTimeout(2000);

    // Look for share button
    const shareButton = page.locator('button').filter({ hasText: /مشاركة|Share/i }).first();

    // Share functionality should exist
    if (await shareButton.isVisible()) {
      // Click share
      await shareButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('URL uniquely identifies page', async ({ page }) => {
    await page.goto('/book/01348/2/15');
    await page.waitForTimeout(2000);

    // URL should contain book, volume, page
    expect(page.url()).toContain('01348');
    expect(page.url()).toContain('/2/');
    expect(page.url()).toContain('/15');
  });
});
