import { describe, it, expect } from 'vitest';
import { linkBookReferences, processFootnoteLinks } from '../lib/book-linker';

/**
 * Book Reference Linker Tests
 *
 * Tests the book reference linking functionality used in footnotes.
 */

describe('linkBookReferences', () => {
  describe('Pattern 1: Book name with ج (volume) and ص (page)', () => {
    it('links الكافي ج 8 ص 151', () => {
      const result = linkBookReferences('الكافي ج 8 ص 151');
      expect(result).toContain('href="/book/01348/8/151"');
      expect(result).toContain('class="book-ref-link"');
    });

    it('links كشف الغمّة ج 3 ص 179', () => {
      const result = linkBookReferences('كشف الغمّة ج 3 ص 179');
      expect(result).toContain('href="/book/01530/3/179"');
    });

    it('links بحار الأنوار ج 25 ص 100', () => {
      const result = linkBookReferences('بحار الأنوار ج 25 ص 100');
      expect(result).toContain('href="/book/01407/25/100"');
    });
  });

  describe('Pattern 2: Book name with colon and volume/page', () => {
    it('links بصائر الدرجات: 11/436', () => {
      const result = linkBookReferences('بصائر الدرجات: 11/436');
      expect(result).toContain('href="/book/01432/11/436"');
    });

    it('links الكافي: 1/50', () => {
      const result = linkBookReferences('الكافي: 1/50');
      expect(result).toContain('href="/book/01348/1/50"');
    });
  });

  describe('Pattern 3: Book name with colon and page only', () => {
    it('links بصائر الدرجات: 61', () => {
      const result = linkBookReferences('بصائر الدرجات: 61');
      expect(result).toContain('href="/book/01432/1/61"');
    });

    it('links الخصال: 127', () => {
      const result = linkBookReferences('الخصال: 127');
      expect(result).toContain('href="/book/01462/1/127"');
    });
  });

  describe('Pattern 4: Book name with ص (page marker) only', () => {
    it('links بصائر الدرجات ص 254', () => {
      const result = linkBookReferences('بصائر الدرجات ص 254');
      expect(result).toContain('href="/book/01432/1/254"');
    });

    it('links علل الشرائع ص 100', () => {
      const result = linkBookReferences('علل الشرائع ص 100');
      expect(result).toContain('href="/book/01498/1/100"');
    });
  });

  describe('Pattern 5: Book name with page/volume (reverse format)', () => {
    it('links بحار الانوار 310/70', () => {
      const result = linkBookReferences('بحار الانوار 310/70');
      expect(result).toContain('href="/book/01407/70/310"');
    });

    it('links اصول كافى 131/2', () => {
      const result = linkBookReferences('اصول كافى 131/2');
      expect(result).toContain('href="/book/01348/2/131"');
    });
  });

  describe('Multiple references in same text', () => {
    it('links multiple book references', () => {
      const text = 'انظر الكافي ج 1 ص 50 و بحار الأنوار ج 25 ص 100';
      const result = linkBookReferences(text);

      expect(result).toContain('href="/book/01348/1/50"');
      expect(result).toContain('href="/book/01407/25/100"');
    });
  });

  describe('Book name variations', () => {
    it('handles كمال الدين variations', () => {
      const r1 = linkBookReferences('كمال الدين ص 50');
      const r2 = linkBookReferences('إكمال الدين ص 50');

      expect(r1).toContain('href="/book/01533/1/50"');
      expect(r2).toContain('href="/book/01533/1/50"');
    });

    it('handles أمالي variations', () => {
      const r1 = linkBookReferences('أمالي الصدوق ص 100');
      const r2 = linkBookReferences('أمالي الطوسي ص 100');

      expect(r1).toContain('href="/book/02560/1/100"');
      expect(r2).toContain('href="/book/01424/1/100"');
    });

    it('handles الغيبة variations', () => {
      const r1 = linkBookReferences('الغيبة للطوسي ص 50');
      const r2 = linkBookReferences('الغيبة للنعماني ص 50');

      expect(r1).toContain('href="/book/01506/1/50"');
      expect(r2).toContain('href="/book/01507/1/50"');
    });
  });

  describe('Text without references', () => {
    it('returns text unchanged when no references', () => {
      const text = 'هذا نص عادي بدون مراجع';
      const result = linkBookReferences(text);
      expect(result).toBe(text);
    });
  });
});

describe('processFootnoteLinks', () => {
  it('processes both Quran and book references', () => {
    // Use a Quran reference format that's supported: (البقرة: 255)
    const footnote = 'انظر الكافي ج 1 ص 50 و (البقرة: 255)';
    const result = processFootnoteLinks(footnote);

    // Should have book link
    expect(result).toContain('href="/book/01348/1/50"');
    // Should have Quran link (quran.com format)
    expect(result).toContain('quran.com');
  });

  it('handles footnote with only book reference', () => {
    const footnote = 'بصائر الدرجات: 127';
    const result = processFootnoteLinks(footnote);
    expect(result).toContain('href="/book/01432/1/127"');
  });

  it('handles complex footnotes', () => {
    const footnote = 'المصدر السابق، و انظر أيضاً بحار الأنوار ج 25 ص 350 و الكافي ج 1 ص 200';
    const result = processFootnoteLinks(footnote);

    expect(result).toContain('href="/book/01407/25/350"');
    expect(result).toContain('href="/book/01348/1/200"');
  });
});
