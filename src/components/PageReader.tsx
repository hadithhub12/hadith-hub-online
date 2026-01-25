'use client';

import { useMemo } from 'react';
import { linkQuranVerses } from '@/lib/quran-detector';

interface PageReaderProps {
  text: string;
  highlight?: string;
  className?: string;
  bookId?: string;
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

  // 1. Format book/section titles in brackets - cyan color
  // Matches: [تتمة كتاب الإمامة] or [معاني الأخبار]
  result = result.replace(
    /\[([^\]]+)\]/g,
    '<span class="hadith-book-title">[$1]</span>'
  );

  // 2. Format "أبواب" section headers - orange color
  // Matches: أبواب خلقهم و طينتهم...
  result = result.replace(
    /^(أبواب\s+[^\n]+)/gm,
    '<div class="hadith-section-header">$1</div>'
  );

  // 3. Format "باب" chapter headers - white/light with number
  // Matches: باب 1 بدو أرواحهم...
  result = result.replace(
    /^(باب\s+\d+\s+[^\n]+)/gm,
    '<div class="hadith-chapter-header">$1</div>'
  );

  // 4. Format hadith numbers at start of line with source abbreviation
  // Matches: 1 - مع،، or 2 - ختص،،
  // The pattern: number - abbreviation،، [full source name]
  result = result.replace(
    /^(\d+)\s*-\s*([^،\s]+)،،/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-source-abbrev">$2</span>'
  );

  // 5. Format inline source references without number
  // Matches: فس، [تفسير القمي]
  result = result.replace(
    /([^>\d\s])([،\s]+)([^\s،]+)،\s*(\[)/g,
    '$1$2<span class="hadith-source-abbrev">$3</span> $4'
  );

  // 6. Format "بيان:" explanatory sections - different styling
  result = result.replace(
    /(بيان)(:?\s*)/g,
    '<span class="hadith-explanation-label">$1</span>$2'
  );

  // 7. Format chain of narrators (sanad) - gray color
  // Detect patterns like: عَنْ X عَنْ Y عَنْ Z قَالَ:
  // This is a simplified approach - look for عن patterns before قال
  result = result.replace(
    /((?:عَنْ|عَنِ|عن)\s+[^:]+?)(قَالَ|قَالَ‌|قال)(:|\s*:)/g,
    '<span class="hadith-sanad">$1</span><span class="hadith-qala">$2</span>$3'
  );

  // 8. Format narrator chains with بِإِسْنَادِهِ
  result = result.replace(
    /(بِإِسْنَادِهِ\s+(?:عَنْ|عَنِ|عن)\s+[^:]+?)(قَالَ|قَالَ‌|قال)(:|\s*:)/g,
    '<span class="hadith-sanad">$1</span><span class="hadith-qala">$2</span>$3'
  );

  // 9. Format book references at start of hadith
  // Matches: كِتَابُ فَضَائِلِ الشِّيعَةِ، لِلصَّدُوقِ
  result = result.replace(
    /^(\d+)\s*-\s*(كِتَابُ\s+[^،]+،\s*لِ[^\s]+)/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-book-ref">$2</span>'
  );

  // 10. Format "وَ مِنْ كِتَابِ" or "وَ مِمَّا رَوَاهُ مِنْ كِتَابِ" references
  result = result.replace(
    /^(\d+)\s*-\s*(وَ\s+مِنْ\s+كِتَابِ\s+[^،]+،)/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-book-ref">$2</span>'
  );

  result = result.replace(
    /^(\d+)\s*-\s*(وَ\s+مِمَّا\s+رَوَاهُ\s+مِنْ\s+كِتَابِ\s+[^،]+،)/gm,
    '<span class="hadith-number-badge">$1</span> <span class="hadith-book-ref">$2</span>'
  );

  // 11. Format standalone hadith numbers that weren't caught
  result = result.replace(
    /^(\d+)\s*-\s*(?!<span)/gm,
    '<span class="hadith-number-badge">$1</span> '
  );

  return result;
}

export default function PageReader({ text, highlight, className = '', bookId }: PageReaderProps) {
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

  return (
    <div
      className={`page-reader arabic-text ${isBiharAlAnwar(bookId) ? 'bihar-anwar' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}
