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

    // Process paragraphs and line breaks
    // Split by double newlines to create paragraph blocks
    const paragraphs = result.split(/\n\n+/);

    if (paragraphs.length > 1) {
      // Multiple paragraphs - wrap each in a paragraph tag with proper spacing
      result = paragraphs
        .map((p, i) => {
          // Convert single newlines within paragraph to line breaks
          const content = p.replace(/\n/g, '<br />');
          return `<p class="page-paragraph">${content}</p>`;
        })
        .join('');
    } else {
      // Single paragraph - just convert newlines to line breaks
      result = result.replace(/\n/g, '<br />');
    }

    return result;
  }, [text, highlight]);

  return (
    <div
      className={`page-reader arabic-text ${className}`}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}
