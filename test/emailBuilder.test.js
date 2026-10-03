import { describe, it } from 'node:test';
import assert from 'node:assert';

// Pure logic under test mirrored for Node's ESM native test runner
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

function interpolateSubject(subjectTemplate, blanks, values) {
  let result = subjectTemplate;
  const labelMap = {};
  blanks.forEach((b) => {
    const val = values[b.id] || values[b.label] || b.defaultValue || '';
    if (val) {
      labelMap[b.label.trim().toLowerCase()] = val;
    }
  });

  blanks.forEach((b) => {
    const val = values[b.id] || labelMap[b.label.trim().toLowerCase()] || b.defaultValue || '';
    result = result.split(`{{${b.id}}}`).join(val);
    result = result.split(`{{${b.label}}}`).join(val);
    result = result.split(`[${b.label}]`).join(val);
  });

  return result.trim();
}

function generateMailtoUrl(to, subject, body) {
  const cleanTo = to.trim();
  const searchParams = new URLSearchParams();
  if (subject) searchParams.set('subject', subject);
  if (body) searchParams.set('body', body);

  const query = searchParams.toString().replace(/\+/g, '%20');
  return `mailto:${encodeURIComponent(cleanTo)}?${query}`;
}

function generateGmailComposeUrl(to, subject, body) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to.trim(),
    su: subject,
    body: body,
  });

  return `https://mail.google.com/mail/?${params.toString().replace(/\+/g, '%20')}`;
}

function generateEmlContent(payload) {
  const lines = [
    `To: ${payload.to.trim()}`,
    `Subject: ${payload.subject}`,
    `X-Unsent: 1`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
  ];

  if (payload.from) {
    lines.unshift(`From: ${payload.from.trim()}`);
  }

  lines.push(''); // Header-body separator
  lines.push(payload.body);

  return lines.join('\r\n');
}

describe('Email Builder & Validation Engine', () => {
  describe('isValidEmail', () => {
    it('accepts valid email addresses', () => {
      assert.strictEqual(isValidEmail('jane@acme.corp'), true);
      assert.strictEqual(isValidEmail('john.doe+filter@domain.co.uk'), true);
      assert.strictEqual(isValidEmail('  alex@startup.io  '), true);
    });

    it('rejects invalid or malformed email addresses', () => {
      assert.strictEqual(isValidEmail(''), false);
      assert.strictEqual(isValidEmail(null), false);
      assert.strictEqual(isValidEmail(undefined), false);
      assert.strictEqual(isValidEmail('plainaddress'), false);
      assert.strictEqual(isValidEmail('@missingusername.com'), false);
      assert.strictEqual(isValidEmail('user@.domain'), false);
      assert.strictEqual(isValidEmail('user@domain'), false);
    });
  });

  describe('interpolateSubject', () => {
    const blanks = [
      { id: 'b1', label: 'Client Name', defaultValue: 'Valued Client' },
      { id: 'b2', label: 'Invoice No', defaultValue: 'INV-001' },
      { id: 'b3', label: 'Amount', defaultValue: '$1,000' },
    ];

    it('interpolates token IDs like {{b1}}', () => {
      const values = { b1: 'Acme Corp', b2: 'INV-9999' };
      const sub = interpolateSubject('Invoice {{b2}} for {{b1}}', blanks, values);
      assert.strictEqual(sub, 'Invoice INV-9999 for Acme Corp');
    });

    it('interpolates token labels like {{Client Name}} and [Invoice No]', () => {
      const values = { b1: 'Nexus Dynamics', b2: 'INV-4412' };
      const sub = interpolateSubject('Notice: [Invoice No] - {{Client Name}}', blanks, values);
      assert.strictEqual(sub, 'Notice: INV-4412 - Nexus Dynamics');
    });

    it('falls back to default value when record value is empty', () => {
      const values = {};
      const sub = interpolateSubject('Welcome {{Client Name}} - {{b3}}', blanks, values);
      assert.strictEqual(sub, 'Welcome Valued Client - $1,000');
    });
  });

  describe('generateMailtoUrl', () => {
    it('produces properly escaped mailto link with spaces as %20', () => {
      const url = generateMailtoUrl('recipient@example.com', 'Subject with Spaces', 'Hello World\nLine 2');
      assert.ok(url.startsWith('mailto:recipient%40example.com?'));
      assert.ok(url.includes('subject=Subject%20with%20Spaces'));
      assert.ok(url.includes('body=Hello%20World%0ALine%202'));
    });
  });

  describe('generateGmailComposeUrl', () => {
    it('produces direct web compose link for Google Mail', () => {
      const url = generateGmailComposeUrl('lead@company.com', 'Proposal Follow-up', 'Dear Lead,\nPlease find attached.');
      assert.ok(url.startsWith('https://mail.google.com/mail/?view=cm&fs=1&to=lead%40company.com'));
      assert.ok(url.includes('su=Proposal%20Follow-up'));
    });
  });

  describe('generateEmlContent', () => {
    it('constructs standard RFC 822 draft message with X-Unsent: 1', () => {
      const payload = {
        to: 'ops@cloud.internal',
        subject: 'Deployment Status Report',
        body: 'Server rack #4 migration completed smoothly.\nNo downtime recorded.',
      };
      const eml = generateEmlContent(payload);
      assert.ok(eml.includes('To: ops@cloud.internal'));
      assert.ok(eml.includes('Subject: Deployment Status Report'));
      assert.ok(eml.includes('X-Unsent: 1'));
      assert.ok(eml.includes('Content-Type: text/plain; charset=UTF-8'));
      assert.ok(eml.includes('Server rack #4 migration completed smoothly.'));
    });

    it('includes optional From: header when provided', () => {
      const payload = {
        to: 'customer@test.com',
        from: 'billing@mycompany.org',
        subject: 'Monthly Statement',
        body: 'Here is your monthly invoice.',
      };
      const eml = generateEmlContent(payload);
      assert.ok(eml.includes('From: billing@mycompany.org'));
      assert.ok(eml.includes('To: customer@test.com'));
    });
  });
});
