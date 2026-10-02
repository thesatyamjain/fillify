import { Blank } from '../types/template';

/**
 * Robust RFC 4180-compliant CSV and TSV parser.
 * Handles quoted fields containing commas, tabs, and newlines.
 */
export function parseCsvOrTsv(rawText: string): string[][] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // Detect delimiter: tab or comma
  const firstLine = trimmed.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < rawText.length) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r' || char === '\n') {
        // Handle CRLF or LF
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(col => col.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push remaining field & row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes label for resilient fuzzy matching (e.g., "[Client Name]" -> "client name")
 */
function normalizeHeader(h: string): string {
  return h
    .replace(/^\[+|\]+$/g, '')
    .replace(/^\{\+|\}+$/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Matches table column indices to template blank IDs based on headers.
 */
export function matchColumnsToBlanks(
  headers: string[],
  uniqueBlanks: Blank[]
): { colToBlankId: Record<number, string>; matchedCount: number } {
  const colToBlankId: Record<number, string> = {};
  let matchedCount = 0;

  headers.forEach((header, colIndex) => {
    const norm = normalizeHeader(header);
    if (!norm) return;

    const matchedBlank = uniqueBlanks.find(
      b => normalizeHeader(b.label) === norm || normalizeHeader(b.id) === norm
    );

    if (matchedBlank) {
      colToBlankId[colIndex] = matchedBlank.id;
      matchedCount++;
    }
  });

  return { colToBlankId, matchedCount };
}

/**
 * Converts parsed table rows into array of values records.
 */
export function rowsToBlankValues(
  dataRows: string[][],
  colToBlankId: Record<number, string>,
  uniqueBlanks: Blank[]
): Record<string, string>[] {
  return dataRows.map(row => {
    const record: Record<string, string> = {};

    // First assign default values
    uniqueBlanks.forEach(b => {
      if (b.defaultValue) {
        record[b.id] = b.defaultValue;
      }
    });

    // Overwrite with row values
    row.forEach((cellVal, colIdx) => {
      const blankId = colToBlankId[colIdx];
      if (blankId) {
        record[blankId] = cellVal;
      }
    });

    return record;
  });
}

/**
 * Generates a ready-to-fill CSV template with headers and a sample row.
 */
export function generateCsvTemplate(uniqueBlanks: Blank[]): string {
  const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

  const headers = uniqueBlanks.map(b => escapeCsv(b.label));
  const sampleValues = uniqueBlanks.map(b => {
    if (b.defaultValue) return escapeCsv(b.defaultValue);
    switch (b.type) {
      case 'date':
        return escapeCsv(new Date().toISOString().slice(0, 10));
      case 'currency':
        return escapeCsv('25,000');
      case 'number':
        return escapeCsv('10');
      case 'checkbox':
        return escapeCsv('Yes');
      case 'dropdown':
        return escapeCsv(b.options?.[0] || 'Option 1');
      default:
        return escapeCsv(`Sample ${b.label}`);
    }
  });

  return `${headers.join(',')}\r\n${sampleValues.join(',')}\r\n`;
}

/**
 * Exports multiple rendered documents into a single formatted text file with demarcated separators.
 */
export function exportBulkDocumentsText(
  documents: { index: number; title: string; text: string }[]
): string {
  return documents
    .map(doc => {
      const divider = '='.repeat(72);
      return `${divider}\r\n${doc.title.toUpperCase()} (DOCUMENT #${doc.index})\r\n${divider}\r\n\r\n${doc.text}\r\n\r\n`;
    })
    .join('\r\n');
}
