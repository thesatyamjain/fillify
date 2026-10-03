import { Blank } from '../../types/template';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

/**
 * Validates an email address according to standard RFC format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Interpolates subject line template with row values (supports {{Label}}, {{b1}}, [Label]).
 */
export function interpolateSubject(
  subjectTemplate: string,
  blanks: Blank[],
  values: Record<string, string>
): string {
  let result = subjectTemplate;

  // Build lookup map by label
  const labelMap: Record<string, string> = {};
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

/**
 * Generates an RFC 2368 mailto: URL for launching default OS mail clients.
 */
export function generateMailtoUrl(to: string, subject: string, body: string): string {
  const cleanTo = to.trim();
  const searchParams = new URLSearchParams();
  if (subject) searchParams.set('subject', subject);
  if (body) searchParams.set('body', body);

  const query = searchParams.toString().replace(/\+/g, '%20');
  return `mailto:${encodeURIComponent(cleanTo)}?${query}`;
}

/**
 * Generates a direct web compose URL for Gmail.
 */
export function generateGmailComposeUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to.trim(),
    su: subject,
    body: body,
  });

  return `https://mail.google.com/mail/?${params.toString().replace(/\+/g, '%20')}`;
}

/**
 * Generates RFC 822 / MIME format .eml file content with X-Unsent draft flag.
 */
export function generateEmlContent(payload: EmailPayload): string {
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

/**
 * Triggers a browser download of a generated .eml draft file.
 */
export function downloadEmlFile(filename: string, content: string): void {
  const cleanName = filename.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  const blob = new Blob([content], { type: 'message/rfc822;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
