'use client';

import { useMemo } from 'react';
import { linkQuranVerses } from '@/lib/quran-detector';
import { processFootnoteLinks } from '@/lib/book-linker';

import type { ArabicFont } from './FontSelector';

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

// Check if this is Bihar al-Anwar (book ID 01407)
function isBiharAlAnwar(bookId?: string): boolean {
  return bookId === '01407';
}

function formatBiharAlAnwarText(text: string): string {
  let result = text;

  // 1. Format main book/section titles at start of page - centered cyan
  // Only match titles at the very beginning or after newlines that are standalone
  // Matches: [تتمة كتاب الإمامة] at start of text
  result = result.replace(
    /^(\[تتمة[^\]]+\])/gm,
    '<div class="hadith-book-title">$1</div>'
  );

  // 2. Format "أبواب" section headers - orange color
  // Matches: أبواب خلقهم و طينتهم...
  result = result.replace(
    /^(أبواب\s+[^\n]+)/gm,
    '<div class="hadith-section-header">$1</div>'
  );

  // 3. Format "باب" chapter headers - dark/light with number
  // Matches: باب 1 بدو أرواحهم...
  result = result.replace(
    /^(باب\s+\d+\s+[^\n]+)/gm,
    '<div class="hadith-chapter-header">$1</div>'
  );

  // 4. Format hadith numbers at start of line with source abbreviation and full source name
  // Matches: 1 - مع،، [معاني الأخبار]،
  // The pattern: number - abbreviation،، [full source name]،
  result = result.replace(
    /^(\d+)\s*-\s*([^،\s]+)،،\s*(\[[^\]]+\])،/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-source-abbrev">$2</span> <span class="hadith-source-ref">$3</span>،'
  );

  // 5. Format hadith numbers with source but no brackets
  // Matches: 1 - مع،،
  result = result.replace(
    /^(\d+)\s*-\s*([^،\s]+)،،(?!\s*\[)/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-source-abbrev">$2</span>،'
  );

  // 6. Format inline source references (secondary sources within text)
  // Matches: فس، [تفسير القمي]،
  result = result.replace(
    /\n([^\s\d][^،\n]*)،\s*(\[[^\]]+\])،/g,
    '\n<span class="hadith-source-abbrev">$1</span>، <span class="hadith-source-ref">$2</span>،'
  );

  // 7. Format "بيان:" explanatory sections - different styling
  result = result.replace(
    /(بيان)(:?\s*)/g,
    '<span class="hadith-explanation-label">$1</span>$2'
  );

  // 8. Format book references at start of hadith
  // Matches: 3 - كِتَابُ فَضَائِلِ الشِّيعَةِ، لِلصَّدُوقِ
  result = result.replace(
    /^(\d+)\s*-\s*(كِتَابُ\s+[^،]+،\s*لِ[^\s،]+)/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-book-ref">$2</span>'
  );

  // 9. Format "وَ مِنْ كِتَابِ" or "وَ مِمَّا رَوَاهُ" references
  result = result.replace(
    /^(\d+)\s*-\s*(وَ\s+مِنْ\s+كِتَابِ\s+[^،]+،)/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-book-ref">$2</span>'
  );

  result = result.replace(
    /^(\d+)\s*-\s*(وَ\s+مِمَّا\s+رَوَاهُ[^،]+،)/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-book-ref">$2</span>'
  );

  // 10. Format standalone hadith numbers that weren't caught
  result = result.replace(
    /^(\d+)\s*-\s*(?!<span)/gm,
    '<span class="hadith-number-badge">$1</span> '
  );

  // 11. Format remaining source references in brackets (inline, not titles)
  // These are source names within hadith text
  result = result.replace(
    /(\[[^\]]+\])(?!<\/)/g,
    '<span class="hadith-source-ref">$1</span>'
  );

  // 12. Format chain of narrators (sanad/isnad)
  // The sanad typically starts after the source reference and ends at "قَالَ" or "قال" or before the actual hadith text
  // Pattern: matches chains with عَنْ أَبِيهِ عَنْ جَدِّهِ or similar narrator chains
  // We look for sequences containing عن (from) followed by names, ending with قال (said)
  result = result.replace(
    /((?:عَنْ|عن)\s+[^،:]+(?:،\s*(?:عَنْ|عن)\s+[^،:]+)*)(،?\s*)((?:قَالَ|قال))/g,
    '<span class="hadith-sanad">$1</span>$2$3'
  );

  // Also format the beginning narrator chains that start with حدثنا or أخبرنا
  result = result.replace(
    /((?:حَدَّثَنَا|حدثنا|أَخْبَرَنَا|أخبرنا)\s+[^،]+(?:،\s*(?:عَنْ|عن|حَدَّثَنَا|حدثنا)\s+[^،]+)*)(،?\s*)((?:قَالَ|قال|أَنَّ|أن))/g,
    '<span class="hadith-sanad">$1</span>$2$3'
  );

  // 13. Format footnote markers 【١】 to styled superscript spans
  result = result.replace(
    /【([٠-٩]+)】/g,
    '<span class="footnote-marker">($1)</span>'
  );

  return result;
}

export default function PageReader({ text, highlight, className = '', bookId, font = 'amiri', footnotes }: PageReaderProps) {
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

    // Apply Bihar al-Anwar specific formatting
    if (isBiharAlAnwar(bookId)) {
      result = formatBiharAlAnwarText(result);
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

  return (
    <div className={`page-reader-container ${className}`}>
      <div
        className={`page-reader arabic-text ${fontClass} ${isBiharAlAnwar(bookId) ? 'bihar-anwar' : ''}`}
        dangerouslySetInnerHTML={{ __html: processedText }}
      />
      {parsedFootnotes.length > 0 && (
        <div className={`footnotes-section arabic-text ${fontClass}`}>
          <div className="footnotes-divider" />
          <div className="footnotes-title">الحواشي</div>
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
