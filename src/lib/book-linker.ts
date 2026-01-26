/**
 * Book Reference Linker
 *
 * Links book references in footnotes to the appropriate book pages.
 * Only matches known book names followed by page/volume references.
 */

import { linkQuranVerses } from './quran-detector';

// Book name to ID mapping with all common variations
// IDs verified against actual database
interface BookInfo {
  id: string;
  defaultVolume?: number;
}

const BOOK_DATABASE: Array<{ names: string[]; info: BookInfo }> = [
  // بصائر الدرجات - Basair al-Darajat
  { names: ['بصائر الدرجات', 'البصائر'], info: { id: '01432' } },

  // كمال الدين - Kamal al-Din
  { names: ['كمال الدين', 'إكمال الدين', 'اكمال الدين', 'كمال الدین'], info: { id: '01533' } },

  // بحار الأنوار - Bihar al-Anwar
  { names: ['بحار الأنوار', 'بحار الانوار', 'البحار'], info: { id: '01407' } },

  // الكافي - Al-Kafi (don't include 'كافي' alone as it causes double matching)
  { names: ['الكافي', 'الکافي', 'اصول كافى', 'أصول الكافي', 'اصول الكافي'], info: { id: '01348' } },

  // علل الشرائع - Ilal al-Shara'i
  { names: ['علل الشرائع', 'علل الشرایع', 'العلل'], info: { id: '01498' } },

  // الخصال - Al-Khisal
  { names: ['الخصال'], info: { id: '01462' } },

  // معاني الأخبار - Ma'ani al-Akhbar
  { names: ['معاني الأخبار', 'معاني الاخبار', 'المعاني'], info: { id: '01560' } },

  // عيون أخبار الرضا - Uyun Akhbar al-Rida
  { names: ['عيون أخبار الرضا', 'عيون اخبار الرضا', 'العيون'], info: { id: '01503' } },

  // أمالي الصدوق - Amali al-Saduq
  { names: ['أمالي الصدوق', 'امالي الصدوق', 'الأمالي للصدوق', 'الامالي للصدوق'], info: { id: '02560' } },

  // أمالي الطوسي - Amali al-Tusi
  { names: ['أمالي الطوسي', 'امالي الطوسي', 'الأمالي للطوسي', 'الأمالي (للطوسي)'], info: { id: '01424' } },

  // تهذيب الأحكام - Tahdhib al-Ahkam
  { names: ['تهذيب الأحكام', 'تهذيب الاحكام', 'التهذيب'], info: { id: '01346' } },

  // من لا يحضره الفقيه - Man la Yahduruhu al-Faqih
  { names: ['من لا يحضره الفقيه', 'من لايحضره الفقيه', 'الفقيه'], info: { id: '01347' } },

  // الإرشاد - Al-Irshad
  { names: ['الإرشاد', 'الارشاد'], info: { id: '01413' } },

  // الغيبة للطوسي - Al-Ghayba (Tusi)
  { names: ['الغيبة للطوسي', 'غيبة الطوسي', 'الغيبة للشيخ الطوسي'], info: { id: '01506' } },

  // الغيبة للنعماني - Al-Ghayba (Nu'mani)
  { names: ['الغيبة للنعماني', 'غيبة النعماني'], info: { id: '01507' } },

  // المحاسن - Al-Mahasin
  { names: ['المحاسن'], info: { id: '01544' } },

  // قرب الإسناد - Qurb al-Isnad
  { names: ['قرب الإسناد', 'قرب الاسناد'], info: { id: '00628' } },

  // تفسير القمي - Tafsir al-Qummi
  { names: ['تفسير القمي', 'تفسير القمّي'], info: { id: '01446' } },

  // ثواب الأعمال / عقاب الأعمال - Thawab/Iqab al-A'mal
  { names: ['ثواب الأعمال', 'ثواب الاعمال', 'عقاب الأعمال', 'عقاب الاعمال'], info: { id: '01453' } },

  // كشف الغمة - Kashf al-Ghumma
  { names: ['كشف الغمة', 'كشف الغمّة'], info: { id: '01530' } },

  // إعلام الورى - I'lam al-Wara
  { names: ['إعلام الورى', 'اعلام الورى'], info: { id: '01418' } },

  // المناقب لابن شهر آشوب - Manaqib Ibn Shahr Ashub
  { names: ['المناقب', 'مناقب آل أبي طالب', 'مناقب ابن شهر آشوب'], info: { id: '01566' } },

  // الدعوات - Al-Da'awat
  { names: ['الدعوات', 'دعوات الراوندي'], info: { id: '01465' } },

  // جامع الأخبار - Jami' al-Akhbar
  { names: ['جامع الأخبار', 'جامع الاخبار'], info: { id: '01454' } },

  // الاختصاص - Al-Ikhtisas
  { names: ['الاختصاص', 'الإختصاص'], info: { id: '01410' } },

  // مصباح المتهجد - Misbah al-Mutahajjid
  { names: ['مصباح المتهجد', 'المصباح'], info: { id: '01559' } },

  // التمحيص - Al-Tamhis
  { names: ['التمحيص'], info: { id: '01537' } },

  // إثبات الهداة - Ithbat al-Hudat
  { names: ['إثبات الهداة', 'اثبات الهداة'], info: { id: '00902' } },

  // أعلام الدين - A'lam al-Din
  { names: ['أعلام الدين', 'اعلام الدين'], info: { id: '01417' } },

  // مكارم الأخلاق - Makarim al-Akhlaq
  { names: ['مكارم الأخلاق', 'مكارم الاخلاق'], info: { id: '14513' } },
];

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate book URL
 */
function bookUrl(bookId: string, volume: number, page: number): string {
  return `/book/${bookId}/${volume}/${page}`;
}

/**
 * Link book references in text
 * Only matches known book names followed by page/volume references.
 *
 * Supported patterns:
 * - بصائر الدرجات: 127
 * - بصائر الدرجات ص 127
 * - بصائر الدرجات ص 127-130
 * - بصائر الدرجات: 1/127 (volume/page)
 * - الكافي ج 8 ص 151
 * - كشف الغمّة ج 3 ص 179
 * - بحار الانوار 310/70 (page/volume)
 * - اصول كافى 131/2 (page/volume)
 */
export function linkBookReferences(text: string): string {
  let result = text;

  for (const book of BOOK_DATABASE) {
    for (const bookName of book.names) {
      const escapedName = escapeRegex(bookName);

      // Pattern 1: Book name with ج (volume) and ص (page) - most specific, check first
      // e.g., الكافي ج 8 ص 151 or كشف الغمّة ج 3 ص 179
      const pattern1 = new RegExp(
        `(${escapedName})\\s+ج\\s*(\\d+)\\s+ص\\s*(\\d+)(?:\\s*(?:و|-)\\s*(\\d+))?`,
        'g'
      );
      result = result.replace(pattern1, (match, name, volume, page) => {
        const url = bookUrl(book.info.id, parseInt(volume, 10), parseInt(page, 10));
        return `<a href="${url}" class="book-ref-link">${match}</a>`;
      });

      // Pattern 2: Book name followed by colon and volume/page (e.g., بصائر الدرجات: 11/436)
      const pattern2 = new RegExp(
        `(${escapedName})\\s*:\\s*(\\d+)\\/(\\d+)(?:\\s*(?:و|-)\\s*(\\d+))?`,
        'g'
      );
      result = result.replace(pattern2, (match, name, vol, page) => {
        const url = bookUrl(book.info.id, parseInt(vol, 10), parseInt(page, 10));
        return `<a href="${url}" class="book-ref-link">${match}</a>`;
      });

      // Pattern 3: Book name followed by colon and page only (e.g., بصائر الدرجات: 61)
      const pattern3 = new RegExp(
        `(${escapedName})\\s*:\\s*(\\d+)(?:\\s*(?:و|-)\\s*(\\d+))?(?!\\/)`,
        'g'
      );
      result = result.replace(pattern3, (match, name, page) => {
        const url = bookUrl(book.info.id, book.info.defaultVolume || 1, parseInt(page, 10));
        return `<a href="${url}" class="book-ref-link">${match}</a>`;
      });

      // Pattern 4: Book name with ص (page marker) only (e.g., بصائر الدرجات ص 254)
      const pattern4 = new RegExp(
        `(${escapedName})\\s+ص\\s*(\\d+)(?:\\s*(?:و|-)\\s*(\\d+))?`,
        'g'
      );
      result = result.replace(pattern4, (match, name, page) => {
        const url = bookUrl(book.info.id, book.info.defaultVolume || 1, parseInt(page, 10));
        return `<a href="${url}" class="book-ref-link">${match}</a>`;
      });

      // Pattern 5: Book name followed by space and page/volume (e.g., بحار الانوار 310/70 or اصول كافى 131/2)
      // Note: In this format, the first number is the page and the second is the volume
      const pattern5 = new RegExp(
        `(${escapedName})\\s+(\\d+)\\/(\\d+)(?!\\d)`,
        'g'
      );
      result = result.replace(pattern5, (match, name, page, volume) => {
        const url = bookUrl(book.info.id, parseInt(volume, 10), parseInt(page, 10));
        return `<a href="${url}" class="book-ref-link">${match}</a>`;
      });
    }
  }

  return result;
}

/**
 * Style footnote numbers (1), (2), (٣), etc. at the start of footnotes
 */
function styleFootnoteNumbers(text: string): string {
  // Match footnote numbers at the start: (1), (2), (١), (٢), etc.
  // Also handles (1) in the middle of text for secondary references
  return text.replace(
    /\(([٠-٩\d]+)\)/g,
    '<span class="footnote-number">($1)</span>'
  );
}

/**
 * Process footnotes with Quran and book links
 */
export function processFootnoteLinks(footnote: string): string {
  let result = footnote;

  // First style footnote numbers
  result = styleFootnoteNumbers(result);

  // Then link Quran verses
  result = linkQuranVerses(result);

  // Then link book references
  result = linkBookReferences(result);

  return result;
}
