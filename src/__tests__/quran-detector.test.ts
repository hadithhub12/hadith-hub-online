import { describe, it, expect } from 'vitest';
import { detectQuranVerses, linkQuranVerses, quranComUrl } from '../lib/quran-detector';

describe('quranComUrl', () => {
  it('generates single verse URL', () => {
    expect(quranComUrl(2, 255)).toBe('https://quran.com/2/255');
  });

  it('generates verse range URL', () => {
    expect(quranComUrl(2, 255, 260)).toBe('https://quran.com/2/255-260');
  });
});

describe('detectQuranVerses', () => {
  it('detects numeric references like 2:255', () => {
    const result = detectQuranVerses('The verse 2:255 is known as Ayatul Kursi');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].surah).toBe(2);
    expect(result[0].ayah).toBe(255);
  });

  it('detects multiple numeric references', () => {
    const result = detectQuranVerses('See 2:255 and also 3:18');
    expect(result.length).toBe(2);
  });

  it('detects Arabic surah name format', () => {
    const result = detectQuranVerses('قال الله تعالى (البقرة: 255)');
    expect(result.length).toBe(1);
    expect(result[0].surah).toBe(2);
    expect(result[0].ayah).toBe(255);
  });

  it('detects verse ranges', () => {
    const result = detectQuranVerses('See 2:255-260');
    expect(result.length).toBe(1);
    expect(result[0].ayahEnd).toBe(260);
  });

  it('returns empty array for text without references', () => {
    const result = detectQuranVerses('This is just normal text');
    expect(result).toEqual([]);
  });

  it('ignores invalid references', () => {
    const result = detectQuranVerses('Invalid 999:999');
    expect(result).toEqual([]);
  });
});

describe('linkQuranVerses', () => {
  it('wraps Arabic surah references in links', () => {
    const result = linkQuranVerses('قال الله تعالى (البقرة: 255)');
    expect(result).toContain('href="https://quran.com/2/255"');
    expect(result).toContain('class="quran-link"');
  });

  it('preserves text without references', () => {
    const input = 'This is normal text without any references';
    const result = linkQuranVerses(input);
    expect(result).toBe(input);
  });

  it('handles multiple references', () => {
    const result = linkQuranVerses('(البقرة: 255) و (آل عمران: 18)');
    expect(result).toContain('href="https://quran.com/2/255"');
    expect(result).toContain('href="https://quran.com/3/18"');
  });
});
