/**
 * Simple markdown parser for basic formatting
 * Supports: bold, italic, code, lists, headers, and line breaks
 */

export interface FormattedContent {
  type: 'text' | 'bold' | 'italic' | 'code' | 'codeblock' | 'heading' | 'list' | 'listitem' | 'paragraph';
  content: string | FormattedContent[];
  level?: number; // For headings and lists
}

/**
 * Parse markdown text into structured format
 */
export function parseMarkdown(text: string): FormattedContent[] {
  if (!text) return [];

  const lines = text.split('\n');
  const result: FormattedContent[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines but preserve structure
    if (!line.trim()) {
      if (result.length > 0) {
        result.push({ type: 'text', content: '' });
      }
      i++;
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      result.push({
        type: 'heading',
        content: parseInlineMarkdown(headerMatch[2]),
        level,
      });
      i++;
      continue;
    }

    // Code blocks
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push({
        type: 'codeblock',
        content: codeLines.join('\n'),
      });
      i++; // Skip closing ```
      continue;
    }

    // Bullet lists
    const bulletMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
    if (bulletMatch) {
      result.push({
        type: 'listitem',
        content: parseInlineMarkdown(bulletMatch[1]),
      });
      i++;
      continue;
    }

    // Numbered lists
    const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (numberedMatch) {
      result.push({
        type: 'listitem',
        content: parseInlineMarkdown(numberedMatch[1]),
      });
      i++;
      continue;
    }

    // Regular paragraphs
    result.push({
      type: 'paragraph',
      content: parseInlineMarkdown(line),
    });
    i++;
  }

  return result;
}

/**
 * Parse inline markdown (bold, italic, code)
 */
function parseInlineMarkdown(text: string): FormattedContent[] {
  const result: FormattedContent[] = [];
  let current = '';
  let i = 0;

  while (i < text.length) {
    // Bold **text** or __text__
    if ((text[i] === '*' && text[i + 1] === '*') || (text[i] === '_' && text[i + 1] === '_')) {
      if (current) result.push({ type: 'text', content: current });
      current = '';

      const delimiter = text[i];
      i += 2;
      let boldContent = '';
      while (i < text.length - 1) {
        if ((text[i] === delimiter && text[i + 1] === delimiter)) {
          break;
        }
        boldContent += text[i];
        i++;
      }
      if (text[i] === delimiter && text[i + 1] === delimiter) {
        result.push({ type: 'bold', content: boldContent });
        i += 2;
      } else {
        current += delimiter + delimiter + boldContent;
      }
      continue;
    }

    // Italic *text* or _text_
    if ((text[i] === '*' || text[i] === '_') && text[i + 1] !== text[i]) {
      if (current) result.push({ type: 'text', content: current });
      current = '';

      const delimiter = text[i];
      i += 1;
      let italicContent = '';
      while (i < text.length) {
        if (text[i] === delimiter) {
          break;
        }
        italicContent += text[i];
        i++;
      }
      if (text[i] === delimiter) {
        result.push({ type: 'italic', content: italicContent });
        i += 1;
      } else {
        current += delimiter + italicContent;
      }
      continue;
    }

    // Inline code `text`
    if (text[i] === '`') {
      if (current) result.push({ type: 'text', content: current });
      current = '';

      i++;
      let codeContent = '';
      while (i < text.length && text[i] !== '`') {
        codeContent += text[i];
        i++;
      }
      if (text[i] === '`') {
        result.push({ type: 'code', content: codeContent });
        i++;
      } else {
        current += '`' + codeContent;
      }
      continue;
    }

    current += text[i];
    i++;
  }

  if (current) result.push({ type: 'text', content: current });
  return result;
}

/**
 * Check if text contains markdown
 */
export function hasMarkdown(text: string): boolean {
  return /(\*\*|__|\*|_|`|^#+\s|^[-*•]|^\d+\.)/m.test(text);
}

/**
 * Format text into readable chunks (max 200 chars per line conceptually)
 */
export function formatResponseText(text: string): string {
  if (!text) return '';

  // Replace multiple spaces with single space
  let formatted = text.replace(/\s{2,}/g, ' ');

  // Add line breaks before new topics (indicated by capital letters after periods)
  formatted = formatted.replace(/\.\s+([A-Z])/g, '.\n\n$1');

  return formatted;
}
