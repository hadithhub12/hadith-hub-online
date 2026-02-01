'use client';

import { useMemo } from 'react';
import { linkQuranVerses } from '@/lib/quran-detector';
import { processFootnoteLinks } from '@/lib/book-linker';
import { useFont, type ArabicFont, FONT_SIZES } from '@/context/FontContext';

interface PageReaderProps {
  text: string;
  highlight?: string;
  className?: string;
  bookId?: string;
  font?: ArabicFont;
  footnotes?: string | null; // JSON array of footnotes
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Source book abbreviations used in Bihar al-Anwar
const SOURCE_ABBREVIATIONS: Record<string, string> = {
  'مع': 'معاني الأخبار',
  'فس': 'تفسير القمي',
  'ختص': 'الإختصاص',
  'فر': 'تفسير فرات بن إبراهيم',
  'كنز': 'كنز جامع الفوائد',
  'ج': 'الجمل',
  'ير': 'بصائر الدرجات',
  'ن': 'عيون أخبار الرضا',
  'ع': 'علل الشرائع',
  'ل': 'الخصال',
  'لى': 'أمالي الصدوق',
  'ما': 'أمالي الطوسي',
  'كا': 'الكافي',
  'يب': 'تهذيب الأحكام',
  'شى': 'تفسير العياشي',
  'م': 'من لا يحضره الفقيه',
  'سن': 'المحاسن',
  'ب': 'قرب الإسناد',
  'كش': 'رجال الكشي',
  'غط': 'الغيبة للطوسي',
  'نى': 'الغيبة للنعماني',
  'شا': 'الإرشاد',
  'ص': 'مصباح المتهجد',
  'ثو': 'ثواب الأعمال',
  'عقا': 'عقاب الأعمال',
  'مص': 'مصباح الشريعة',
  'مكا': 'مكارم الأخلاق',
  'جا': 'المجالس والأخبار',
  'طب': 'طب الأئمة',
  'كشف': 'كشف الغمة',
  'إعلام': 'إعلام الورى',
  'مناقب': 'مناقب آل أبي طالب',
  'دعوات': 'الدعوات',
  'محص': 'التمحيص',
  'جع': 'جامع الأخبار',
};

// Check if this is Bihar al-Anwar (book ID 01407) - needs special source abbreviation handling
function isBiharAlAnwar(bookId?: string): boolean {
  return bookId === '01407';
}

/**
 * Universal Hadith Text Formatter
 * Works across all hadith books with common patterns:
 * - Chapter headers (باب) - orange
 * - Hadith numbers - cyan badge
 * - Author comments (أقول) - orange
 * - Narrator chains (عن) - cyan
 * - Footnote markers - red superscript
 */
function formatUniversalHadithText(text: string): string {
  let result = text;

  // 1. FIRST: Format footnote markers - red superscript (must be done before chapter/hadith detection)
  // Pattern: (١), (٢), (1), (2) etc - superscript numbers in parentheses
  result = result.replace(
    /\(([٠-٩0-9١٢٣٤٥٦٧٨٩]+)\)/g,
    '<sup class="hadith-footnote-ref">($1)</sup>'
  );

  // 2. Format bracket footnote markers 【١】 (must be done before chapter/hadith detection)
  result = result.replace(
    /【([٠-٩0-9]+)】/g,
    '<sup class="hadith-footnote-ref">($1)</sup>'
  );

  // 3. Format chapter headers with numbers - orange
  // Pattern: "7 - باب استحباب..." at start of line (may have footnote ref before it)
  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d+)\s*[-–]\s*(بَابُ?[^\n]+)/gm,
    '$1<div class="hadith-chapter"><span class="hadith-chapter-num">$2</span> - <span class="hadith-chapter-title">$3</span></div>'
  );

  // 4. Format hadith numbers at start of lines - cyan badge
  // Pattern: "18474 -" (may have footnote ref before it)
  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d{1,5})\s*[-–]\s*/gm,
    '$1<span class="hadith-num">$2</span> - '
  );

  // 5. Format each hadith: text before first colon is sanad (gray), after colon is matn (cyan)
  // Pattern: After hadith number, split on first colon
  result = result.replace(
    /(<span class="hadith-num">\d+<\/span> - )([\s\S]*?)(:)([\s\S]*?)(?=<span class="hadith-num">|<div class="hadith-chapter">|$)/g,
    (match, numPart, beforeColon, colon, afterColon) => {
      return `${numPart}<span class="hadith-sanad">${beforeColon}</span>${colon}<span class="hadith-matn">${afterColon}</span>`;
    }
  );

  return result;
}

function formatBiharAlAnwarText(text: string): string {
  let result = text;

  // 1. FIRST: Format footnote markers 【١】 (must be done before hadith number detection)
  result = result.replace(
    /【([٠-٩0-9]+)】/g,
    '<sup class="hadith-footnote-ref">($1)</sup>'
  );

  // 2. Format main book/section titles at start of page - centered (uses chapter header color)
  // Matches: [تتمة كتاب الإمامة] at start of text
  result = result.replace(
    /^(\[تتمة[^\]]+\])/gm,
    '<div class="hadith-chapter">$1</div>'
  );

  // 3. Format "أبواب" section headers - uses chapter header color
  // Matches: أبواب خلقهم و طينتهم...
  result = result.replace(
    /^(أبواب\s+[^\n]+)/gm,
    '<div class="hadith-chapter">$1</div>'
  );

  // 4. Format "باب" chapter headers - uses chapter header color
  // Matches: باب 1 بدو أرواحهم...
  result = result.replace(
    /^(باب\s+\d+\s+[^\n]+)/gm,
    '<div class="hadith-chapter">$1</div>'
  );

  // 5. Format hadith numbers at start of line with source abbreviation and full source name
  // Matches: 1 - مع،، [معاني الأخبار]،
  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d+)\s*-\s*([^،\s]+)،،\s*(\[[^\]]+\])،/gm,
    '$1<span class="hadith-num">$2</span> - <span class="hadith-sanad">$3،، $4،</span>'
  );

  // 6. Format hadith numbers with source but no brackets
  // Matches: 1 - مع،،
  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d+)\s*-\s*([^،\s]+)،،(?!\s*\[)/gm,
    '$1<span class="hadith-num">$2</span> - <span class="hadith-sanad">$3،،</span>'
  );

  // 7. Format book references at start of hadith
  // Matches: 3 - كِتَابُ فَضَائِلِ الشِّيعَةِ، لِلصَّدُوقِ
  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d+)\s*-\s*(كِتَابُ\s+[^،]+،\s*لِ[^\s،]+)/gm,
    '$1<span class="hadith-num">$2</span> - <span class="hadith-sanad">$3</span>'
  );

  // 8. Format "وَ مِنْ كِتَابِ" or "وَ مِمَّا رَوَاهُ" references
  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d+)\s*-\s*(وَ\s+مِنْ\s+كِتَابِ\s+[^،]+،)/gm,
    '$1<span class="hadith-num">$2</span> - <span class="hadith-sanad">$3</span>'
  );

  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d+)\s*-\s*(وَ\s+مِمَّا\s+رَوَاهُ[^،]+،)/gm,
    '$1<span class="hadith-num">$2</span> - <span class="hadith-sanad">$3</span>'
  );

  // 9. Format standalone hadith numbers that weren't caught
  result = result.replace(
    /^(<sup[^>]*>[^<]*<\/sup>)?(\d+)\s*-\s*(?!<span)/gm,
    '$1<span class="hadith-num">$2</span> - '
  );

  // 10. Format "بيان:" explanatory sections - uses chapter header color
  result = result.replace(
    /(بيان)(:?\s*)/g,
    '<span class="hadith-chapter-title">$1</span>$2'
  );

  // 11. Format remaining source references in brackets (inline, not titles)
  result = result.replace(
    /(\[[^\]]+\])(?!<\/)/g,
    '<span class="hadith-sanad">$1</span>'
  );

  // 12. Format each hadith: text before first colon is sanad (gray), after colon is matn (blue/cyan)
  // Same pattern as universal formatter
  result = result.replace(
    /(<span class="hadith-num">\d+<\/span> - )([\s\S]*?)(:)([\s\S]*?)(?=<span class="hadith-num">|<div class="hadith-chapter">|$)/g,
    (match, numPart, beforeColon, colon, afterColon) => {
      return `${numPart}<span class="hadith-sanad">${beforeColon}</span>${colon}<span class="hadith-matn">${afterColon}</span>`;
    }
  );

  return result;
}

export default function PageReader({ text, highlight, className = '', bookId, font: fontProp, footnotes }: PageReaderProps) {
  // Get font settings from context
  const { font: contextFont, fontSize, currentFontSize } = useFont();
  const font = fontProp || contextFont;

  // Parse footnotes from JSON string
  const parsedFootnotes = useMemo(() => {
    if (!footnotes) return [];
    try {
      return JSON.parse(footnotes) as string[];
    } catch {
      return [];
    }
  }, [footnotes]);

  const processedText = useMemo(() => {
    let result = text;

    // Apply formatting
    // Bihar al-Anwar has special source abbreviations, use its specific formatter
    if (isBiharAlAnwar(bookId)) {
      result = formatBiharAlAnwarText(result);
    } else {
      // Use universal formatter for all other books
      result = formatUniversalHadithText(result);
    }

    // Link Quran verses
    result = linkQuranVerses(result);

    // Highlight search terms if provided
    if (highlight) {
      const terms = highlight.split(/\s+/).filter(t => t.length > 0);
      for (const term of terms) {
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        result = result.replace(regex, '<mark class="highlight">$1</mark>');
      }
    }

    // Process paragraphs and line breaks
    const paragraphs = result.split(/\n\n+/);

    if (paragraphs.length > 1) {
      result = paragraphs
        .map((p) => {
          const content = p.replace(/\n/g, '<br />');
          return `<p class="page-paragraph">${content}</p>`;
        })
        .join('');
    } else {
      result = result.replace(/\n/g, '<br />');
    }

    return result;
  }, [text, highlight, bookId]);

  const fontClass = `font-${font}`;

  // Calculate font size based on scale
  const fontSizeStyle = {
    fontSize: `${currentFontSize.scale * 1.25}rem`,
    lineHeight: currentFontSize.scale > 1 ? '2.4' : '2.2',
  };

  return (
    <div className={`page-reader-container ${className}`}>
      <div
        className={`page-reader arabic-text ${fontClass} hadith-formatted ${isBiharAlAnwar(bookId) ? 'bihar-anwar' : ''}`}
        style={fontSizeStyle}
        dangerouslySetInnerHTML={{ __html: processedText }}
      />
      {parsedFootnotes.length > 0 && (
        <div className={`footnotes-section arabic-text ${fontClass}`} style={{ fontSize: `${currentFontSize.scale * 0.9}rem` }}>
          <div className="footnotes-divider" />
          <div className="footnotes-title">الحواشي والتعليقات ({parsedFootnotes.length})</div>
          <div className="footnotes-list">
            {parsedFootnotes.map((footnote, index) => (
              <div
                key={index}
                className="footnote-item"
                dangerouslySetInnerHTML={{ __html: processFootnoteLinks(footnote) }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
