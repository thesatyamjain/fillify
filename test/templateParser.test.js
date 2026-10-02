import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import transpiled or pure logic equivalents for template parsing
function formatBlankValue(val, blank) {
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

function replaceBlanksInText(bodyText, blanks, values, options = {}) {
  let result = bodyText;
  const labelToValueMap = {};
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
    result = result.split(token).join(formattedVal);
  });

  return result;
}

function getUniqueBlankGroups(blanks) {
  const seenLabels = new Set();
  const unique = [];
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

describe('Template Parser & Formatter', () => {
  it('correctly replaces tokens with provided values', () => {
    const body = 'Hello {{b1}}, your balance is {{b2}}.';
    const blanks = [
      { id: 'b1', label: 'Name', type: 'text', order: 1, required: true },
      { id: 'b2', label: 'Amount', type: 'text', order: 2, required: true },
    ];
    const output = replaceBlanksInText(body, blanks, { b1: 'Alice', b2: '$500' });
    assert.strictEqual(output, 'Hello Alice, your balance is $500.');
  });

  it('formats currency values for Indian Rupee style', () => {
    const blank = { id: 'b1', label: 'Fee', type: 'currency', order: 1, required: true };
    const formatted = formatBlankValue('50000', blank);
    assert(formatted.includes('50,000') || formatted.includes('₹'));
  });

  it('formats ISO dates into readable DD/MM/YYYY format', () => {
    const blank = { id: 'b1', label: 'Start Date', type: 'date', order: 1, required: true };
    const formatted = formatBlankValue('2026-10-02', blank);
    assert.strictEqual(formatted, '02/10/2026');
  });

  it('synchronizes linked blanks sharing identical labels', () => {
    const body = 'Signed by {{b1}}. Reminder sent to {{b2}}.';
    const blanks = [
      { id: 'b1', label: 'Client Name', type: 'text', order: 1, required: true },
      { id: 'b2', label: 'Client Name', type: 'text', order: 2, required: true },
    ];
    const output = replaceBlanksInText(body, blanks, { b1: 'Acme Corp' });
    assert.strictEqual(output, 'Signed by Acme Corp. Reminder sent to Acme Corp.');
  });

  it('deduplicates blank groups for form and bulk generation', () => {
    const blanks = [
      { id: 'b1', label: 'Party A', type: 'text', order: 1, required: true },
      { id: 'b2', label: 'Party A', type: 'text', order: 2, required: true },
      { id: 'b3', label: 'Party B', type: 'text', order: 3, required: true },
    ];
    const unique = getUniqueBlankGroups(blanks);
    assert.strictEqual(unique.length, 2);
    assert.strictEqual(unique[0].label, 'Party A');
    assert.strictEqual(unique[1].label, 'Party B');
  });
});
