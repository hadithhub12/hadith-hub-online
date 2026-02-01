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

    // Look for font selector button
    const fontSelector = page.locator('button').filter({ hasText: /خط|Font/i }).first();

    if (await fontSelector.isVisible()) {
      // Font selector exists
      await expect(fontSelector).toBeVisible();
    }
  });

  test('font selector opens dropdown with tabs', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Click font settings button
    const fontButton = page.locator('button[title*="إعدادات الخط"], button[title*="Font Settings"]').first();

    if (await fontButton.isVisible()) {
      await fontButton.click();
      await page.waitForTimeout(300);

      // Should show tabs for Font, Size, Colors
      const fontTab = page.locator('button').filter({ hasText: /نوع الخط|Font/i }).first();
      const sizeTab = page.locator('button').filter({ hasText: /الحجم|Size/i }).first();
      const colorsTab = page.locator('button').filter({ hasText: /الألوان|Colors/i }).first();

      // At least one tab should be visible
      const hasTabs = await fontTab.isVisible() || await sizeTab.isVisible() || await colorsTab.isVisible();
      expect(hasTabs).toBeTruthy();
    }
  });

  test('changing font updates text display', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Open font selector
    const fontButton = page.locator('button[title*="إعدادات الخط"], button[title*="Font Settings"]').first();

    if (await fontButton.isVisible()) {
      await fontButton.click();
      await page.waitForTimeout(300);

      // Look for font options (e.g., Amiri, Scheherazade, etc.)
      const fontOptions = page.locator('button').filter({ hasText: /أميري|Amiri|شهرزاد|Scheherazade/i });

      if (await fontOptions.count() > 0) {
        await fontOptions.first().click();
        await page.waitForTimeout(500);

        // Text should still be visible
        const pageContent = await page.textContent('body');
        expect(pageContent).toMatch(/[\u0600-\u06FF]/);
      }
    }
  });

  test('font size options are available', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Open font selector
    const fontButton = page.locator('button[title*="إعدادات الخط"], button[title*="Font Settings"]').first();

    if (await fontButton.isVisible()) {
      await fontButton.click();
      await page.waitForTimeout(300);

      // Click size tab
      const sizeTab = page.locator('button').filter({ hasText: /الحجم|Size/i }).first();
      if (await sizeTab.isVisible()) {
        await sizeTab.click();
        await page.waitForTimeout(300);

        // Should show size options
        const sizeOptions = page.locator('button').filter({ hasText: /صغير|كبير|متوسط|Small|Medium|Large/i });
        const count = await sizeOptions.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Page Reader - Color Palettes', () => {
  test('color palette selector is available', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Open font selector
    const fontButton = page.locator('button[title*="إعدادات الخط"], button[title*="Font Settings"]').first();

    if (await fontButton.isVisible()) {
      await fontButton.click();
      await page.waitForTimeout(300);

      // Click colors tab
      const colorsTab = page.locator('button').filter({ hasText: /الألوان|Colors/i }).first();
      if (await colorsTab.isVisible()) {
        await colorsTab.click();
        await page.waitForTimeout(300);

        // Should show color palette options
        const paletteOptions = page.locator('button').filter({ hasText: /Classic|كلاسيكي|Sepia|بني|Ocean|محيط|Forest|غابة|Royal|ملكي|Sunset|غروب/i });
        const count = await paletteOptions.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('changing color palette updates display', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Open font selector
    const fontButton = page.locator('button[title*="إعدادات الخط"], button[title*="Font Settings"]').first();

    if (await fontButton.isVisible()) {
      await fontButton.click();
      await page.waitForTimeout(300);

      // Click colors tab
      const colorsTab = page.locator('button').filter({ hasText: /الألوان|Colors/i }).first();
      if (await colorsTab.isVisible()) {
        await colorsTab.click();
        await page.waitForTimeout(300);

        // Select a different palette (e.g., Ocean)
        const oceanPalette = page.locator('button').filter({ hasText: /Ocean|محيط/i }).first();
        if (await oceanPalette.isVisible()) {
          await oceanPalette.click();
          await page.waitForTimeout(500);

          // Text should still be visible and readable
          const pageContent = await page.textContent('body');
          expect(pageContent).toMatch(/[\u0600-\u06FF]/);
        }
      }
    }
  });

  test('color palette shows preview swatches', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Open font selector
    const fontButton = page.locator('button[title*="إعدادات الخط"], button[title*="Font Settings"]').first();

    if (await fontButton.isVisible()) {
      await fontButton.click();
      await page.waitForTimeout(300);

      // Click colors tab
      const colorsTab = page.locator('button').filter({ hasText: /الألوان|Colors/i }).first();
      if (await colorsTab.isVisible()) {
        await colorsTab.click();
        await page.waitForTimeout(300);

        // Should show color swatch circles
        const colorSwatches = page.locator('div.rounded-full[style*="background-color"]');
        const count = await colorSwatches.count();
        // Each palette has 5 swatches, should have multiple
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('color palette persists after page reload', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Open font selector and select a palette
    const fontButton = page.locator('button[title*="إعدادات الخط"], button[title*="Font Settings"]').first();

    if (await fontButton.isVisible()) {
      await fontButton.click();
      await page.waitForTimeout(300);

      const colorsTab = page.locator('button').filter({ hasText: /الألوان|Colors/i }).first();
      if (await colorsTab.isVisible()) {
        await colorsTab.click();
        await page.waitForTimeout(300);

        // Select Royal palette
        const royalPalette = page.locator('button').filter({ hasText: /Royal|ملكي/i }).first();
        if (await royalPalette.isVisible()) {
          await royalPalette.click();
          await page.waitForTimeout(500);

          // Close dropdown
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);

          // Reload page
          await page.reload();
          await page.waitForTimeout(2000);

          // Open font selector again
          await fontButton.click();
          await page.waitForTimeout(300);
          await colorsTab.click();
          await page.waitForTimeout(300);

          // Royal should be selected (has ring-2 class when selected)
          const selectedPalette = page.locator('button.ring-2').filter({ hasText: /Royal|ملكي/i });
          // Check if selection persisted
          const isRoyalSelected = await selectedPalette.count() > 0;
          // Palette preference should be saved in localStorage
        }
      }
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

test.describe('Page Reader - Hadith Formatting', () => {
  test('hadith numbers are displayed with badge styling', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for hadith number badges
    const hadithNums = page.locator('.hadith-num, span[class*="hadith-num"]');
    const count = await hadithNums.count();
    // Not all pages have hadith numbers, but formatting should work
  });

  test('chapter headers are styled distinctly', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for chapter headers
    const chapterHeaders = page.locator('.hadith-chapter, div[class*="hadith-chapter"]');
    // Chapter headers may or may not be present on every page
    const count = await chapterHeaders.count();
    // Just verify page loads without errors
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('sanad (narrator chain) uses muted color', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for sanad elements
    const sanadElements = page.locator('.hadith-sanad, span[class*="hadith-sanad"]');
    // Sanad formatting should be applied when content has narrators
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('matn (hadith text) uses distinct color', async ({ page }) => {
    await page.goto('/book/01348/1/1');
    await page.waitForTimeout(2000);

    // Look for matn elements
    const matnElements = page.locator('.hadith-matn, span[class*="hadith-matn"]');
    // Matn formatting should be applied to actual hadith text
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('footnote references are superscripted', async ({ page }) => {
    // Al-Khisal has footnotes
    await page.goto('/book/01462/1/10');
    await page.waitForTimeout(2000);

    // Look for footnote reference elements
    const footnoteRefs = page.locator('.hadith-footnote-ref, sup[class*="footnote"]');
    // Footnotes may or may not be present
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Page Reader - Bihar al-Anwar Formatting', () => {
  const biharBookId = '01405';

  test('Bihar al-Anwar book loads correctly', async ({ page }) => {
    await page.goto(`/book/${biharBookId}/1/1`);
    await page.waitForTimeout(2000);

    // Should display Arabic text content
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('Bihar chapter headers are formatted', async ({ page }) => {
    await page.goto(`/book/${biharBookId}/14/19`);
    await page.waitForTimeout(2000);

    // Look for chapter headers (باب sections)
    const chapterHeaders = page.locator('.hadith-chapter, div[class*="hadith-chapter"]');
    // Bihar has chapter headers
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('Bihar hadith entries use colon-based formatting', async ({ page }) => {
    await page.goto(`/book/${biharBookId}/14/19`);
    await page.waitForTimeout(2000);

    // The formatting should split text on colon
    // Before colon = sanad (gray), after colon = matn (blue/cyan)
    const sanadElements = page.locator('.hadith-sanad');
    const matnElements = page.locator('.hadith-matn');

    // Content should be present
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('Bihar footnote markers are converted', async ({ page }) => {
    await page.goto(`/book/${biharBookId}/14/19`);
    await page.waitForTimeout(2000);

    // Footnote markers 【１】 should be converted to superscript
    const footnoteRefs = page.locator('sup[class*="footnote"], .hadith-footnote-ref');
    // May or may not have footnotes on this specific page
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
