import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageReader from '../components/PageReader';
import { FontProvider } from '../context/FontContext';

/**
 * Footnotes Rendering Tests
 *
 * Tests that footnotes are correctly parsed, displayed, and linked.
 */

// Helper to render PageReader with FontContext
function renderPageReader(props: Parameters<typeof PageReader>[0]) {
  return render(
    <FontProvider>
      <PageReader {...props} />
    </FontProvider>
  );
}

describe('PageReader Footnotes', () => {
  describe('Footnotes parsing', () => {
    it('renders footnotes section when footnotes are provided', () => {
      const footnotes = JSON.stringify([
        'هذه حاشية أولى',
        'هذه حاشية ثانية',
      ]);

      renderPageReader({
        text: 'نص الصفحة الرئيسي',
        footnotes,
      });

      // Should show footnotes title (partial match since it includes count)
      expect(screen.getByText(/الحواشي/)).toBeInTheDocument();

      // Should show footnote content
      expect(screen.getByText('هذه حاشية أولى')).toBeInTheDocument();
      expect(screen.getByText('هذه حاشية ثانية')).toBeInTheDocument();
    });

    it('does not render footnotes section when footnotes are null', () => {
      renderPageReader({
        text: 'نص الصفحة الرئيسي',
        footnotes: null,
      });

      expect(screen.queryByText(/الحواشي/)).not.toBeInTheDocument();
    });

    it('does not render footnotes section when footnotes are empty array', () => {
      renderPageReader({
        text: 'نص الصفحة الرئيسي',
        footnotes: '[]',
      });

      expect(screen.queryByText(/الحواشي/)).not.toBeInTheDocument();
    });

    it('handles invalid JSON gracefully', () => {
      renderPageReader({
        text: 'نص الصفحة الرئيسي',
        footnotes: 'invalid json',
      });

      // Should still render the main text without crashing
      expect(screen.getByText('نص الصفحة الرئيسي')).toBeInTheDocument();
      expect(screen.queryByText('الحواشي')).not.toBeInTheDocument();
    });
  });

  describe('Footnote markers', () => {
    it('formats Arabic footnote markers 【١】 to styled spans', () => {
      renderPageReader({
        text: 'نص مع حاشية【١】 وحاشية أخرى【٢】',
        bookId: '01407', // Bihar al-Anwar
      });

      const container = document.querySelector('.page-reader');
      expect(container?.innerHTML).toContain('class="footnote-marker"');
    });
  });

  describe('Footnotes with book references', () => {
    it('renders footnotes with book reference links', () => {
      const footnotes = JSON.stringify([
        'انظر الكافي ج 1 ص 50',
      ]);

      renderPageReader({
        text: 'نص الصفحة',
        footnotes,
      });

      // Should have a link to the referenced book
      const link = document.querySelector('a[href="/book/01348/1/50"]');
      expect(link).toBeInTheDocument();
    });

    it('renders footnotes with multiple book references', () => {
      const footnotes = JSON.stringify([
        'انظر الكافي ج 1 ص 50 و بحار الأنوار ج 25 ص 100',
      ]);

      renderPageReader({
        text: 'نص الصفحة',
        footnotes,
      });

      expect(document.querySelector('a[href="/book/01348/1/50"]')).toBeInTheDocument();
      expect(document.querySelector('a[href="/book/01407/25/100"]')).toBeInTheDocument();
    });
  });

  describe('Main text rendering', () => {
    it('renders main text correctly', () => {
      renderPageReader({
        text: 'هذا هو النص الرئيسي للصفحة',
      });

      expect(screen.getByText('هذا هو النص الرئيسي للصفحة')).toBeInTheDocument();
    });

    it('highlights search terms', () => {
      renderPageReader({
        text: 'النص يحتوي على كلمة محمد',
        highlight: 'محمد',
      });

      const mark = document.querySelector('mark.highlight');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('محمد');
    });

    it('applies font class', () => {
      renderPageReader({
        text: 'نص عربي',
        font: 'noto-naskh',
      });

      const reader = document.querySelector('.page-reader');
      expect(reader?.classList.contains('font-noto-naskh')).toBe(true);
    });
  });

  describe('Bihar al-Anwar specific formatting', () => {
    it('applies Bihar al-Anwar class for book 01407', () => {
      renderPageReader({
        text: 'باب 1 أسماء الله الحسنى',
        bookId: '01407',
      });

      const reader = document.querySelector('.page-reader');
      expect(reader?.classList.contains('bihar-anwar')).toBe(true);
    });

    it('formats chapter headers', () => {
      renderPageReader({
        text: 'باب 1 في فضل العلم\n\nنص الباب',
        bookId: '01407',
      });

      const container = document.querySelector('.page-reader');
      expect(container?.innerHTML).toContain('hadith-chapter-header');
    });

    it('formats hadith numbers', () => {
      renderPageReader({
        text: '1 - مع،، [معاني الأخبار]،',
        bookId: '01407',
      });

      const container = document.querySelector('.page-reader');
      expect(container?.innerHTML).toContain('hadith-number-badge');
    });
  });
});

describe('Footnotes CSS Classes', () => {
  it('has correct CSS classes for footnotes section', () => {
    const footnotes = JSON.stringify(['حاشية']);

    renderPageReader({
      text: 'نص',
      footnotes,
    });

    expect(document.querySelector('.footnotes-section')).toBeInTheDocument();
    expect(document.querySelector('.footnotes-divider')).toBeInTheDocument();
    expect(document.querySelector('.footnotes-title')).toBeInTheDocument();
    expect(document.querySelector('.footnotes-list')).toBeInTheDocument();
    expect(document.querySelector('.footnote-item')).toBeInTheDocument();
  });
});
