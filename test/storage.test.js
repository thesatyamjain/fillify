import { describe, it } from 'node:test';
import assert from 'node:assert';

function parseTemplatesJSON(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON — file could not be parsed.');
  }

  const validate = (item) => {
    if (!item || typeof item !== 'object') return false;
    return (
      typeof item.id === 'string' &&
      typeof item.bodyText === 'string' &&
      Array.isArray(item.blanks)
    );
  };

  if (Array.isArray(parsed)) {
    const valid = parsed.filter(validate);
    if (valid.length === 0) throw new Error('No valid templates found in the imported file.');
    return valid;
  } else if (validate(parsed)) {
    return [parsed];
  }
  throw new Error('Invalid Fillify template JSON format.');
}

function exportTemplatesJSON(templates) {
  return JSON.stringify(templates, null, 2);
}

describe('Storage & Serialization Resilience', () => {
  it('exports and round-trips valid templates', () => {
    const templates = [
      {
        id: 't1',
        name: 'Test Contract',
        bodyText: 'Hello {{b1}}',
        blanks: [{ id: 'b1', label: 'Name', type: 'text', order: 1, required: true }],
      },
    ];

    const json = exportTemplatesJSON(templates);
    const imported = parseTemplatesJSON(json);
    assert.strictEqual(imported.length, 1);
    assert.strictEqual(imported[0].id, 't1');
    assert.strictEqual(imported[0].name, 'Test Contract');
  });

  it('rejects invalid JSON payloads with clear error messages', () => {
    assert.throws(() => {
      parseTemplatesJSON('{ broken json');
    }, /Invalid JSON/);
  });

  it('rejects JSON payloads that do not match the Template schema', () => {
    assert.throws(() => {
      parseTemplatesJSON(JSON.stringify([{ invalid: 'structure' }]));
    }, /No valid templates found/);
  });
});
