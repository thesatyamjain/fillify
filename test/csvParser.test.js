import { describe, it } from 'node:test';
import assert from 'node:assert';

// CSV parser under test
function parseCsvOrTsv(rawText) {
  const trimmed = rawText.trim();
  if (!trimmed) return [];
  const firstLine = trimmed.split(/\r\n|\n|\r/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < rawText.length) {
    const char = rawText[i];
    const nextChar = rawText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
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

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function normalizeHeader(h) {
  return h.replace(/^\[+|\]+$/g, '').replace(/^\{\+|\}+$/g, '').trim().toLowerCase();
}

function matchColumnsToBlanks(headers, uniqueBlanks) {
  const colToBlankId = {};
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

function rowsToBlankValues(dataRows, colToBlankId, uniqueBlanks) {
  return dataRows.map(row => {
    const record = {};
    uniqueBlanks.forEach(b => {
      if (b.defaultValue) record[b.id] = b.defaultValue;
    });
    row.forEach((cellVal, colIdx) => {
      const blankId = colToBlankId[colIdx];
      if (blankId) record[blankId] = cellVal;
    });
    return record;
  });
}

function generateCsvTemplate(uniqueBlanks) {
  const escapeCsv = (str) => `"${str.replace(/"/g, '""')}"`;
  const headers = uniqueBlanks.map(b => escapeCsv(b.label));
  const sampleValues = uniqueBlanks.map(b => escapeCsv(b.defaultValue || 'Sample'));
  return `${headers.join(',')}\r\n${sampleValues.join(',')}\r\n`;
}

describe('CSV & TSV Bulk Parser', () => {
  it('parses standard comma-separated values', () => {
    const csv = 'Name,Age,City\nAlice,30,New York\nBob,25,Chicago';
    const rows = parseCsvOrTsv(csv);
    assert.strictEqual(rows.length, 3);
    assert.deepStrictEqual(rows[0], ['Name', 'Age', 'City']);
    assert.strictEqual(rows[1][0], 'Alice');
  });

  it('correctly handles quoted fields with internal commas and escaped quotes', () => {
    const csv = '"Company, Inc.","Amount","Note"\n"Acme, LLC","10,000","He said ""Approved"""';
    const rows = parseCsvOrTsv(csv);
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[1][0], 'Acme, LLC');
    assert.strictEqual(rows[1][1], '10,000');
    assert.strictEqual(rows[1][2], 'He said "Approved"');
  });

  it('detects tab-separated (TSV) clipboard pastes from Excel and Sheets', () => {
    const tsv = 'Client\tDate\tFee\nAcme Corp\t2026-10-02\t5000\nGlobex\t2026-11-01\t7500';
    const rows = parseCsvOrTsv(tsv);
    assert.strictEqual(rows.length, 3);
    assert.strictEqual(rows[1][0], 'Acme Corp');
    assert.strictEqual(rows[1][2], '5000');
  });

  it('fuzzy matches column headers against template blanks', () => {
    const headers = ['[Client Name]', 'Effective Date', 'Fee'];
    const blanks = [
      { id: 'b1', label: 'Client Name', type: 'text', order: 1, required: true },
      { id: 'b2', label: 'Effective Date', type: 'date', order: 2, required: true },
      { id: 'b3', label: 'Fee', type: 'currency', order: 3, required: true },
    ];
    const { colToBlankId, matchedCount } = matchColumnsToBlanks(headers, blanks);
    assert.strictEqual(matchedCount, 3);
    assert.strictEqual(colToBlankId[0], 'b1');
    assert.strictEqual(colToBlankId[1], 'b2');
    assert.strictEqual(colToBlankId[2], 'b3');
  });

  it('generates a pre-populated CSV template file', () => {
    const blanks = [
      { id: 'b1', label: 'Party A Name', defaultValue: 'Acme Corp', type: 'text' },
      { id: 'b2', label: 'Effective Date', defaultValue: '2026-10-02', type: 'date' },
    ];
    const template = generateCsvTemplate(blanks);
    assert(template.includes('"Party A Name","Effective Date"'));
    assert(template.includes('"Acme Corp","2026-10-02"'));
  });
});
