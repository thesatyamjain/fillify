import { Blank } from '../types/template';

export function replaceBlanksInText(
  bodyText: string,
  blanks: Blank[],
  values: Record<string, string>,
  options: { highlightUnfilled?: boolean; formatValues?: boolean } = {}
): string {
  let result = bodyText;

  // Build a lookup map of values by blank label for linked blanks
  const labelToValueMap: Record<string, string> = {};
  blanks.forEach(b => {
    const val = values[b.id] || values[b.label] || b.defaultValue || '';
    if (val) {
      labelToValueMap[b.label.trim().toLowerCase()] = val;
    }
  });

  blanks.forEach((blank) => {
    const token = `{{${blank.id}}}`;
    const rawVal = values[blank.id] || labelToValueMap[blank.label.trim().toLowerCase()] || blank.defaultValue || '';

    let formattedVal = rawVal;
    if (options.formatValues && rawVal) {
      formattedVal = formatBlankValue(rawVal, blank);
    }

    if (!formattedVal) {
      formattedVal = options.highlightUnfilled ? `[${blank.label}]` : '';
    }

    // Replace all occurrences of this token
    result = result.split(token).join(formattedVal);
  });

  return result;
}

export function formatBlankValue(val: string, blank: Blank): string {
  if (!val) return '';

  if (blank.type === 'currency') {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num);
      } catch {
        return `₹${num.toLocaleString()}`;
      }
    }
  }

  if (blank.type === 'date') {
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = val.split('-');
      return `${d}/${m}/${y}`;
    }
  }

  if (blank.type === 'checkbox') {
    if (val === 'true' || val === 'yes' || val === '1') {
      return blank.helpText || 'Yes';
    }
    return 'No';
  }

  return val;
}

export function getUniqueBlankGroups(blanks: Blank[]): Blank[] {
  const seenLabels = new Set<string>();
  const unique: Blank[] = [];

  const sorted = [...blanks].sort((a, b) => a.order - b.order);

  for (const blank of sorted) {
    const key = blank.label.trim().toLowerCase();
    if (!seenLabels.has(key)) {
      seenLabels.add(key);
      unique.push(blank);
    }
  }

  return unique;
}

/**
 * Converts internal token bodyText (e.g. {{b1}}) to human-readable text (e.g. {{Customer Name}})
 */
export function toHumanReadableRawText(bodyText: string, blanks: Blank[]): string {
  let result = bodyText;
  blanks.forEach((blank) => {
    const internalToken = `{{${blank.id}}}`;
    const humanToken = `{{${blank.label}}}`;
    result = result.split(internalToken).join(humanToken);
  });
  return result;
}

/**
 * Converts human-readable raw text (e.g. {{Customer Name}} or [Order Date]) back to internal tokens and updates blanks
 */
export function fromHumanReadableRawText(rawText: string, blanks: Blank[]): { updatedBodyText: string; updatedBlanks: Blank[] } {
  let resultBody = rawText;
  const updatedBlanks = [...blanks];

  // 1. Map existing blanks by label
  blanks.forEach((blank) => {
    const humanToken = `{{${blank.label}}}`;
    const internalToken = `{{${blank.id}}}`;
    resultBody = resultBody.split(humanToken).join(internalToken);
  });

  // 2. Automatically parse any new {{Label}} or [Label] typed by user in raw mode
  const customBracketRegex = /(\{\{([^\}\n]+)\}\}|\[([^\]\n]+)\])/g;
  let match: RegExpExecArray | null;

  while ((match = customBracketRegex.exec(resultBody)) !== null) {
    const rawMatch = match[0];
    if (/^\{\{b_[a-zA-Z0-9_]+\}\}$/.test(rawMatch) || /^\{\{b[0-9_]+\}\}$/i.test(rawMatch)) {
      continue;
    }

    const labelName = (match[2] || match[3] || '').trim();
    if (!labelName) continue;

    let existing = updatedBlanks.find(b => b.label.trim().toLowerCase() === labelName.toLowerCase());
    let blankId = existing ? existing.id : `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (!existing) {
      existing = {
        id: blankId,
        label: labelName,
        type: 'text',
        order: updatedBlanks.length + 1,
        required: true,
      };
      updatedBlanks.push(existing);
    }

    const internalToken = `{{${blankId}}}`;
    resultBody = resultBody.split(rawMatch).join(internalToken);
  }

  return { updatedBodyText: resultBody, updatedBlanks };
}
