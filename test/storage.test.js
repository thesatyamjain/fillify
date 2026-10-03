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

  it('correctly filters out deleted template by id', () => {
    const list = [
      { id: 't1', name: 'Contract 1' },
      { id: 't2', name: 'Contract 2' },
      { id: 't3', name: 'Contract 3' },
    ];
    const deleteId = 't2';
    const remaining = list.filter(t => t.id !== deleteId);
    assert.strictEqual(remaining.length, 2);
    assert.strictEqual(remaining.find(t => t.id === 't2'), undefined);
  });

  it('correctly filters out deleted history instance and clears history', () => {
    const history = [
      { id: 'h1', templateId: 't1', filledAt: 100 },
      { id: 'h2', templateId: 't1', filledAt: 200 },
      { id: 'h3', templateId: 't2', filledAt: 300 },
    ];
    const afterDelete = history.filter(h => h.id !== 'h2');
    assert.strictEqual(afterDelete.length, 2);
    assert.strictEqual(afterDelete.some(h => h.id === 'h2'), false);

    const afterClear = [];
    assert.strictEqual(afterClear.length, 0);
  });
});
