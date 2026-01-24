import { describe, it, expect } from 'vitest';
import { isRomanText, normalizeArabic, romanToArabic, prepareSearchQuery } from '../lib/transliteration';

describe('isRomanText', () => {
  it('returns true for pure ASCII text', () => {
    expect(isRomanText('hello')).toBe(true);
    expect(isRomanText('Muhammad')).toBe(true);
    expect(isRomanText('al-hadith')).toBe(true);
  });

  it('returns false for Arabic text', () => {
    expect(isRomanText('محمد')).toBe(false);
    expect(isRomanText('الحديث')).toBe(false);
  });

  it('returns false for mixed text', () => {
    expect(isRomanText('hello محمد')).toBe(false);
  });
});

describe('normalizeArabic', () => {
  it('removes diacritics', () => {
    expect(normalizeArabic('مُحَمَّد')).toBe('محمد');
  });

  it('normalizes alef variants', () => {
    expect(normalizeArabic('أحمد')).toBe('احمد');
    expect(normalizeArabic('إسلام')).toBe('اسلام');
    expect(normalizeArabic('آية')).toBe('ايه');
  });

  it('normalizes alef maksura to yaa', () => {
    expect(normalizeArabic('موسى')).toBe('موسي');
  });

  it('normalizes taa marbuta to haa', () => {
    expect(normalizeArabic('صلاة')).toBe('صلاه');
  });

  it('normalizes Persian kaf to Arabic kaf', () => {
    expect(normalizeArabic('کتاب')).toBe('كتاب');
  });
});

describe('romanToArabic', () => {
  it('converts common words', () => {
    const result = romanToArabic('allah');
    expect(result).toContain('الله');
  });

  it('converts Muhammad', () => {
    const result = romanToArabic('muhammad');
    expect(result.some(r => r.includes('محمد'))).toBe(true);
  });

  it('handles al- prefix', () => {
    const result = romanToArabic('al-hadith');
    expect(result.some(r => r.startsWith('ال'))).toBe(true);
  });

  it('converts basic words', () => {
    const result = romanToArabic('imam');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('prepareSearchQuery', () => {
  it('returns empty array for empty input', () => {
    expect(prepareSearchQuery('')).toEqual([]);
    expect(prepareSearchQuery('   ')).toEqual([]);
  });

  it('normalizes Arabic input', () => {
    const result = prepareSearchQuery('مُحَمَّد');
    expect(result).toContain('محمد');
  });

  it('converts Roman input to Arabic', () => {
    const result = prepareSearchQuery('hadith');
    expect(result.length).toBeGreaterThan(0);
    // Should contain Arabic characters
    expect(result.some(r => /[\u0600-\u06FF]/.test(r))).toBe(true);
  });
});
