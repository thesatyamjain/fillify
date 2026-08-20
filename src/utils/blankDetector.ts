import { SuggestedBlank, BlankType } from '../types/template';

function inferType(text: string): BlankType {
  const lower = text.toLowerCase();
  if (lower.includes('date') || lower.includes('day') || lower.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/)) {
    return 'date';
  }
  if (lower.includes('amount') || lower.includes('price') || lower.includes('fee') || lower.includes('cost') || lower.includes('pay') || lower.includes('refund') || lower.includes('₹') || lower.includes('$')) {
    return 'currency';
  }
  if (lower.includes('number') || lower.includes('count') || lower.includes('quantity') || lower.includes('age') || lower.includes('id') || lower.includes('month') || lower.includes('year')) {
    return 'number';
  }
  if (lower.includes('scope') || lower.includes('description') || lower.includes('details') || lower.includes('address') || lower.includes('reason') || lower.includes('purpose') || lower.includes('clause') || lower.includes('summary')) {
    return 'longtext';
  }
  return 'text';
}

function cleanLabel(raw: string): string {
  let label = raw
    .replace(/^[\{\[\<\(\_\:\s]+|[\}\]\>\)\_\:\s]+$/g, '')
    .replace(/_/g, ' ')
    .trim();
  
  if (!label) label = 'Blank Field';
  
  // Capitalize words cleanly
  return label
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function detectSuggestedBlanks(text: string, existingBlankIds: string[] = []): SuggestedBlank[] {
  const suggestions: SuggestedBlank[] = [];
  const seenSpans = new Set<string>();

  const existingTokens = new Set(existingBlankIds.map(id => `{{${id}}}`));

  // Helper to check if a matched text is internal token junk like {{b1}}, {{b2}}, {{b_xyz}}
  const isInternalToken = (raw: string) => {
    if (existingTokens.has(raw)) return true;
    // Reserved {{b...}} or {{...}} internal token format
    if (/^\{\{.*\}\}$/.test(raw)) return true;
    // Raw b1, b2, b_123 strings
    if (/^b[0-9_]+$/i.test(raw)) return true;
    return false;
  };

  // Pattern 1: Brackets [Placeholder] or <Placeholder> or (Placeholder) - EXCLUDING {{...}} internal tokens!
  const bracketRegex = /(\[[^\]\n]{2,60}\]|<[^>\n]{2,60}>|\([^\)\n]{2,60}\))/g;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(text)) !== null) {
    const raw = match[0];
    if (isInternalToken(raw)) continue;

    const startIndex = match.index;
    const endIndex = startIndex + raw.length;

    if (!seenSpans.has(raw)) {
      seenSpans.add(raw);
      const label = cleanLabel(raw);
      suggestions.push({
        spanText: raw,
        startIndex,
        endIndex,
        suggestedLabel: label,
        suggestedType: inferType(raw),
      });
    }
  }

  // Pattern 2: Underscores ____ (3 or more)
  const underscoreRegex = /(?::\s*)?_{3,}/g;
  while ((match = underscoreRegex.exec(text)) !== null) {
    const raw = match[0];
    if (isInternalToken(raw)) continue;

    const startIndex = match.index;
    const endIndex = startIndex + raw.length;

    if (!seenSpans.has(raw)) {
      seenSpans.add(raw);
      suggestions.push({
        spanText: raw,
        startIndex,
        endIndex,
        suggestedLabel: `Field ${suggestions.length + 1}`,
        suggestedType: 'text',
      });
    }
  }

  // Pattern 3: SCREAMING_SNAKE_CASE placeholders like CUSTOMER_NAME, ORDER_NUMBER
  const capsRegex = /\b[A-Z0-9]{2,}_[A-Z0-9_]{2,}\b/g;
  while ((match = capsRegex.exec(text)) !== null) {
    const raw = match[0];
    if (isInternalToken(raw)) continue;

    const startIndex = match.index;
    const endIndex = startIndex + raw.length;

    if (!seenSpans.has(raw)) {
      seenSpans.add(raw);
      suggestions.push({
        spanText: raw,
        startIndex,
        endIndex,
        suggestedLabel: cleanLabel(raw),
        suggestedType: inferType(raw),
      });
    }
  }

  return suggestions;
}
