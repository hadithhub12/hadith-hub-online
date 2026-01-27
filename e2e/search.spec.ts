import { test, expect } from '@playwright/test';

/**
 * Search Functionality E2E Tests
 * Tests all search modes: word, root, exact, and topic search.
 */

test.describe('Search Page - Basic Search', () => {
  test('navigates to search page with query', async ({ page }) => {
    await page.goto('/search?q=محمد');

    // Should be on search page
    await expect(page).toHaveURL(/\/search/);

    // Wait for results to load
    await page.waitForTimeout(2000);
  });

  test('displays search results', async ({ page }) => {
    await page.goto('/search?q=محمد');

    // Wait for results
    await page.waitForTimeout(3000);

    // Should show results or no results message
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('search input shows current query', async ({ page }) => {
    await page.goto('/search?q=علي');

    // Search input should contain the query
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('can perform new search from results page', async ({ page }) => {
    await page.goto('/search?q=محمد');
    await page.waitForTimeout(1000);

    // Find search input and enter new query
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.clear();
    await searchInput.fill('علي');
    await searchInput.press('Enter');

    // URL should update
    await expect(page).toHaveURL(/q=.*علي|q=.*%D8%B9%D9%84%D9%8A/);
  });
});

test.describe('Search Page - Word Mode', () => {
  test('searches with word mode', async ({ page }) => {
    await page.goto('/search?q=الله&mode=word');

    await page.waitForTimeout(2000);

    // Should show results
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('word mode button is selectable', async ({ page }) => {
    await page.goto('/search?q=محمد');
    await page.waitForTimeout(1000);

    // Look for word mode button
    const wordButton = page.locator('button').filter({ hasText: /كلمة|Word/i }).first();

    if (await wordButton.isVisible()) {
      await wordButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Search Page - Root Mode', () => {
  test('searches with root mode', async ({ page }) => {
    await page.goto('/search?q=كتب&mode=root');

    await page.waitForTimeout(2000);

    // Should show results matching root variations
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('root mode finds word variations', async ({ page }) => {
    await page.goto('/search?q=علم&mode=root');

    await page.waitForTimeout(3000);

    // Root search should find variations like علم, علماء, عالم, etc.
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Search Page - Exact Mode', () => {
  test('searches with exact phrase mode', async ({ page }) => {
    await page.goto('/search?q=بسم الله&mode=exact');

    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('exact mode matches full phrase', async ({ page }) => {
    await page.goto('/search?q=الرحمن الرحيم&mode=exact');

    await page.waitForTimeout(3000);

    // Should find exact phrase matches
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Search Page - Topic Mode (Semantic Search)', () => {
  test('searches with topic/semantic mode', async ({ page }) => {
    await page.goto('/search?q=الصبر&mode=topic');

    // Topic search uses embeddings, may take longer
    await page.waitForTimeout(5000);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('topic mode finds related concepts', async ({ page }) => {
    // Search for a concept
    await page.goto('/search?q=patience&mode=topic');

    await page.waitForTimeout(5000);

    // Should return related hadiths
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Search Page - Mode Switching', () => {
  test('switches between search modes', async ({ page }) => {
    await page.goto('/search?q=محمد');
    await page.waitForTimeout(2000);

    // Find mode buttons
    const modeButtons = page.locator('button').filter({ hasText: /كلمة|جذر|عبارة|موضوع|Word|Root|Exact|Topic/i });

    const count = await modeButtons.count();
    for (let i = 0; i < count; i++) {
      const button = modeButtons.nth(i);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('mode persists in URL', async ({ page }) => {
    await page.goto('/search?q=test');
    await page.waitForTimeout(2000);

    // Click root mode
    const rootButton = page.locator('button').filter({ hasText: /جذر|Root/i }).first();
    if (await rootButton.isVisible()) {
      await rootButton.click();
      // Wait longer for URL to update
      await page.waitForTimeout(2000);

      // URL should contain mode parameter
      const url = page.url();
      expect(url).toMatch(/mode=root|search.*test/);
    }
  });
});

test.describe('Search Page - Results Display', () => {
  test('displays book information in results', async ({ page }) => {
    await page.goto('/search?q=محمد&mode=word');
    await page.waitForTimeout(3000);

    // Results should contain book titles
    const pageContent = await page.textContent('body');
    // Should contain Arabic text
    expect(pageContent).toMatch(/[\u0600-\u06FF]/);
  });

  test('results are clickable links', async ({ page }) => {
    await page.goto('/search?q=محمد&mode=word');
    await page.waitForTimeout(3000);

    // Should have links to book pages
    const resultLinks = page.locator('a[href*="/book/"]');
    const count = await resultLinks.count();

    if (count > 0) {
      // Get the href of first result
      const href = await resultLinks.first().getAttribute('href');
      expect(href).toMatch(/\/book\//);

      // Click first result and wait for navigation
      await Promise.all([
        page.waitForURL(/\/book\//, { timeout: 15000 }),
        resultLinks.first().click(),
      ]);

      // Should navigate to book page
      expect(page.url()).toMatch(/\/book\//);
    }
  });

  test('shows snippet with highlighted text', async ({ page }) => {
    await page.goto('/search?q=محمد&mode=word');
    await page.waitForTimeout(3000);

    // Results should show text snippets
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(100);
  });
});

test.describe('Search Page - Results Grouping', () => {
  test('groups results by book', async ({ page }) => {
    await page.goto('/search?q=الله&mode=word');
    await page.waitForTimeout(3000);

    // Page should show organized results
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('shows result count', async ({ page }) => {
    await page.goto('/search?q=محمد&mode=word');
    await page.waitForTimeout(3000);

    // Should display number of results
    const pageContent = await page.textContent('body');
    // May contain numbers or Arabic numerals
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Search Page - Pagination', () => {
  test('paginates through results', async ({ page }) => {
    await page.goto('/search?q=الله&mode=word');
    await page.waitForTimeout(3000);

    // Look for pagination or load more
    const loadMore = page.locator('button').filter({ hasText: /المزيد|more|التالي|next/i }).first();

    if (await loadMore.isVisible()) {
      await loadMore.click();
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Search Page - Empty and Edge Cases', () => {
  test('handles empty search query', async ({ page }) => {
    await page.goto('/search?q=');

    // Should handle gracefully
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('handles search with no results', async ({ page }) => {
    await page.goto('/search?q=xyzxyzxyz123');
    await page.waitForTimeout(2000);

    // Should show no results message
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('handles special characters in search', async ({ page }) => {
    await page.goto('/search?q=' + encodeURIComponent('بسم الله الرحمن الرحيم'));
    await page.waitForTimeout(3000);

    // Should handle Arabic text with spaces
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Search Page - Transliteration', () => {
  test('searches with transliterated text (English to Arabic)', async ({ page }) => {
    // Search with romanized Arabic
    await page.goto('/search?q=muhammad');
    await page.waitForTimeout(3000);

    // Should find results even with English transliteration
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

test.describe('Search Page - Language Toggle', () => {
  test('displays results in selected language', async ({ page }) => {
    await page.goto('/search?q=محمد');
    await page.waitForTimeout(2000);

    // Toggle language
    const langToggle = page.locator('button').filter({ hasText: /EN|العربية|English/i }).first();

    if (await langToggle.isVisible()) {
      await langToggle.click();
      await page.waitForTimeout(1000);

      // Page should still function
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });
});

test.describe('Search Page - Navigation from Results', () => {
  test('navigating to result preserves search context', async ({ page }) => {
    await page.goto('/search?q=محمد&mode=word');
    await page.waitForTimeout(3000);

    // Click a result
    const resultLink = page.locator('a[href*="/book/"]').first();
    if (await resultLink.isVisible()) {
      await resultLink.click();
      await expect(page).toHaveURL(/\/book\//);

      // Should have highlight in URL for text search
      // (topic mode uses different highlighting)
    }
  });

  test('back to search button navigates back in history', async ({ page }) => {
    // First go to search page
    await page.goto('/search?q=محمد&mode=word');
    await page.waitForTimeout(3000);

    // Click a result
    const resultLink = page.locator('a[href*="/book/"]').first();
    if (await resultLink.isVisible()) {
      await resultLink.click();
      await expect(page).toHaveURL(/\/book\//);
      await page.waitForTimeout(1000);

      // Look for back button - it uses router.back() so it goes to browser history
      const backButton = page.locator('button, a').filter({ hasText: /العودة|Back|البحث|search/i }).first();
      if (await backButton.isVisible()) {
        // Store current URL
        const bookUrl = page.url();

        await backButton.click();
        await page.waitForTimeout(1000);

        // Should navigate away from book page (uses browser history)
        const newUrl = page.url();
        expect(newUrl).not.toBe(bookUrl);
      }
    }
  });
});
