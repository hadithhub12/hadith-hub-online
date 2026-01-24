'use client';

import { useMemo } from 'react';
import { linkQuranVerses } from '@/lib/quran-detector';

interface PageReaderProps {
  text: string;
  highlight?: string;
  className?: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function PageReader({ text, highlight, className = '' }: PageReaderProps) {
  const processedText = useMemo(() => {
    let result = text;

    // First, link Quran verses
    result = linkQuranVerses(result);

    // Then, highlight search terms if provided
    if (highlight) {
      const terms = highlight.split(/\s+/).filter(t => t.length > 0);
      for (const term of terms) {
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        result = result.replace(regex, '<mark class="highlight">$1</mark>');
      }
    }

    // Convert newlines to <br> tags for proper line breaks
    // Also convert double newlines to paragraph breaks
    result = result
      .replace(/\n\n+/g, '</p><p class="mt-4">')  // Double newlines become paragraph breaks
      .replace(/\n/g, '<br />');  // Single newlines become line breaks

    // Wrap in paragraph if we have paragraph breaks
    if (result.includes('</p><p')) {
      result = '<p>' + result + '</p>';
    }

    return result;
  }, [text, highlight]);

  return (
    <div
      className={`arabic-text text-xl leading-loose ${className}`}
      dangerouslySetInnerHTML={{ __html: processedText }}
      style={{
        fontFamily: 'var(--font-amiri), Amiri, Traditional Arabic, serif',
      }}
    />
  );
}
