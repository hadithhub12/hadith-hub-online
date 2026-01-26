import { describe, it, expect } from 'vitest';
import { detectQuranVerses, linkQuranVerses, quranComUrl } from '../lib/quran-detector';

/**
 * Quran Verse Detection and Linking Tests
 */

describe('quranComUrl', () => {
  it('generates correct URL for single verse', () => {
    expect(quranComUrl(2, 255)).toBe('https://quran.com/2/255');
    expect(quranComUrl(1, 1)).toBe('https://quran.com/1/1');
  });

  it('generates correct URL for verse range', () => {
    expect(quranComUrl(2, 255, 256)).toBe('https://quran.com/2/255-256');
    expect(quranComUrl(3, 1, 5)).toBe('https://quran.com/3/1-5');
  });

  it('ignores ayahEnd if same as ayah', () => {
    expect(quranComUrl(2, 255, 255)).toBe('https://quran.com/2/255');
  });
});

describe('detectQuranVerses', () => {
  describe('Pattern 1: سورة [name] آية [number]', () => {
    it('detects سورة البقرة آية 255', () => {
      const refs = detectQuranVerses('في سورة البقرة آية 255');
      expect(refs).toHaveLength(1);
      expect(refs[0].surah).toBe(2);
      expect(refs[0].ayah).toBe(255);
    });

    it('detects range سورة البقرة آية 255-260', () => {
      const refs = detectQuranVerses('سورة البقرة آية 255-260');
      expect(refs).toHaveLength(1);
      expect(refs[0].ayahEnd).toBe(260);
    });
  });

  describe('Pattern 2: (surah: verse)', () => {
    it('detects (البقرة: 255)', () => {
      const refs = detectQuranVerses('قال تعالى (البقرة: 255)');
      expect(refs).toHaveLength(1);
      expect(refs[0].surah).toBe(2);
      expect(refs[0].ayah).toBe(255);
    });

    it('detects (آل عمران: 18)', () => {
      const refs = detectQuranVerses('(آل عمران: 18)');
      expect(refs).toHaveLength(1);
      expect(refs[0].surah).toBe(3);
      expect(refs[0].ayah).toBe(18);
    });
  });

  describe('Multiple references', () => {
    it('detects multiple references in same text', () => {
      const text = 'قال تعالى (البقرة: 255) و (آل عمران: 18)';
      const refs = detectQuranVerses(text);
      expect(refs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Invalid references', () => {
    it('ignores invalid surah numbers', () => {
      const refs = detectQuranVerses('سورة غير موجودة آية 1');
      expect(refs).toHaveLength(0);
    });
  });
});

describe('linkQuranVerses', () => {
  it('links سورة البقرة آية 255', () => {
    const result = linkQuranVerses('سورة البقرة آية 255');
    expect(result).toContain('href="https://quran.com/2/255"');
    expect(result).toContain('class="quran-link"');
  });

  it('links (البقرة: 255)', () => {
    const result = linkQuranVerses('(البقرة: 255)');
    expect(result).toContain('href="https://quran.com/2/255"');
  });

  it('links آل عمران: 18 (colon format without parens)', () => {
    const result = linkQuranVerses('آل عمران: 18');
    expect(result).toContain('href="https://quran.com/3/18"');
  });

  it('preserves text without references', () => {
    const text = 'نص عادي بدون مراجع قرآنية';
    const result = linkQuranVerses(text);
    expect(result).toBe(text);
  });

  it('links النساء، الآية: 32', () => {
    const result = linkQuranVerses('النساء، الآية: 32');
    expect(result).toContain('href="https://quran.com/4/32"');
  });

  it('links نساء 24/4 format', () => {
    const result = linkQuranVerses('نساء 24/4');
    expect(result).toContain('href="https://quran.com/4/24"');
  });

  it('opens links in new tab', () => {
    const result = linkQuranVerses('(البقرة: 255)');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  describe('Multiple links', () => {
    it('links multiple references', () => {
      const result = linkQuranVerses('(البقرة: 255) و (آل عمران: 18)');
      expect(result).toContain('href="https://quran.com/2/255"');
      expect(result).toContain('href="https://quran.com/3/18"');
    });
  });

  describe('Surah name variations', () => {
    it('handles surahs with أ/ا variations', () => {
      const r1 = linkQuranVerses('(الأنعام: 115)');
      const r2 = linkQuranVerses('(الانعام: 115)');

      expect(r1).toContain('href="https://quran.com/6/115"');
      expect(r2).toContain('href="https://quran.com/6/115"');
    });

    it('handles surahs without ال prefix', () => {
      const result = linkQuranVerses('(بقرة: 255)');
      expect(result).toContain('href="https://quran.com/2/255"');
    });
  });
});
