import { describe, it } from 'node:test';
import assert from 'node:assert';

function inferType(text) {
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

function cleanLabel(raw) {
  let label = raw
    .replace(/^[\{\[\<\(\_\:\s]+|[\}\]\>\)\_\:\s]+$/g, '')
    .replace(/_/g, ' ')
    .trim();
  
  if (!label) label = 'Blank Field';
  return label
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function detectSuggestedBlanks(text) {
  const suggestions = [];
  const bracketRegex = /(\[[^\]\n]{2,60}\]|<[^>\n]{2,60}>|\([^\)\n]{2,60}\))/g;
  let match;

  while ((match = bracketRegex.exec(text)) !== null) {
    const raw = match[0];
    if (/^\{\{.*\}\}$/.test(raw) || /^b[0-9_]+$/i.test(raw)) continue;
    suggestions.push({
      spanText: raw,
      suggestedLabel: cleanLabel(raw),
      suggestedType: inferType(raw),
    });
  }

  const underscoreRegex = /(___{2,})/g;
  while ((match = underscoreRegex.exec(text)) !== null) {
    suggestions.push({
      spanText: match[0],
      suggestedLabel: 'Blank Field',
      suggestedType: 'text',
    });
  }

  return suggestions;
}

describe('Blank Detector & Type Inference', () => {
  it('detects bracketed placeholders [Name]', () => {
    const text = 'Welcome [Customer Name] to [Project Scope] on [Effective Date] for [Total Fee].';
    const suggestions = detectSuggestedBlanks(text);
    assert.strictEqual(suggestions.length, 4);

    assert.strictEqual(suggestions[0].suggestedLabel, 'Customer Name');
    assert.strictEqual(suggestions[0].suggestedType, 'text');

    assert.strictEqual(suggestions[1].suggestedLabel, 'Project Scope');
    assert.strictEqual(suggestions[1].suggestedType, 'longtext');

    assert.strictEqual(suggestions[2].suggestedLabel, 'Effective Date');
    assert.strictEqual(suggestions[2].suggestedType, 'date');

    assert.strictEqual(suggestions[3].suggestedLabel, 'Total Fee');
    assert.strictEqual(suggestions[3].suggestedType, 'currency');
  });

  it('detects underscore fill-in blanks ____', () => {
    const text = 'Signed: _______________ Date: ______';
    const suggestions = detectSuggestedBlanks(text);
    assert.strictEqual(suggestions.length, 2);
    assert.strictEqual(suggestions[0].suggestedLabel, 'Blank Field');
    assert.strictEqual(suggestions[0].suggestedType, 'text');
  });

  it('detects angle bracket placeholders <Target Company>', () => {
    const text = 'Notice served to <Target Company>.';
    const suggestions = detectSuggestedBlanks(text);
    assert.strictEqual(suggestions.length, 1);
    assert.strictEqual(suggestions[0].suggestedLabel, 'Target Company');
  });
});
