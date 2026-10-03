import React, { useState, useRef } from 'react';
import { Template, Blank } from '../../types/template';
import { useModalDismiss } from '../../utils/useModalDismiss';
import { useToast } from '../../context/ToastContext';
import {
  EmailPayload,
  isValidEmail,
  interpolateSubject,
  generateMailtoUrl,
  generateGmailComposeUrl,
  generateEmlContent,
  downloadEmlFile,
} from '../../utils/email/emailBuilder';
import {
  EmailSenderConfig,
  EmailProviderType,
  SendResult,
  sendEmailBatch,
} from '../../utils/email/emailSender';
import {
  IconClose,
  IconMail,
  IconSend,
  IconExternalLink,
  IconDownload,
} from '../Icons';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  rows: Record<string, string>[];
  allRenderedDocuments: { index: number; title: string; text: string; values: Record<string, string> }[];
}

const STORAGE_EMAIL_CONFIG = 'fillify_email_sender_config_v1';

export const BulkEmailModal: React.FC<BulkEmailModalProps> = ({
  isOpen,
  onClose,
  template,
  allRenderedDocuments,
}) => {
  const { showToast } = useToast();
  useModalDismiss(isOpen, onClose);

  // Auto-detect email column from blanks
  const emailBlanks = template.blanks.filter((b) => {
    const l = b.label.toLowerCase();
    return l.includes('email') || l.includes('mail') || l.includes('recipient') || l.includes('to');
  });

  const [recipientBlankId, setRecipientBlankId] = useState<string>(() => {
    return emailBlanks[0]?.id || template.blanks[0]?.id || '';
  });

  const [subjectTemplate, setSubjectTemplate] = useState<string>(() => {
    return `${template.name} for {{${template.blanks[0]?.label || 'Client'}}}`;
  });

  const [activeTab, setActiveTab] = useState<'drafts' | 'direct'>('drafts');

  // Direct Sending State
  const [config, setConfig] = useState<EmailSenderConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EMAIL_CONFIG);
      return saved ? JSON.parse(saved) : { provider: 'resend', fromAddress: 'onboarding@resend.dev' };
    } catch {
      return { provider: 'resend', fromAddress: 'onboarding@resend.dev' };
    }
  });

  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ completed: number; total: number } | null>(null);
  const [results, setResults] = useState<Record<number, SendResult>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save config changes to localStorage
  const handleConfigChange = (updates: Partial<EmailSenderConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_EMAIL_CONFIG, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to cache email config:', err);
      }
      return next;
    });
  };

  // Build payloads for all rows
  const queue: { index: number; payload: EmailPayload; isValid: boolean }[] = allRenderedDocuments.map((doc, idx) => {
    const emailVal = doc.values[recipientBlankId] || '';
    const subject = interpolateSubject(subjectTemplate, template.blanks, doc.values);
    return {
      index: idx + 1,
      payload: {
        to: emailVal,
        subject: subject || `${template.name} - #${idx + 1}`,
        body: doc.text,
        from: config.fromAddress,
      },
      isValid: isValidEmail(emailVal),
    };
  });

  const validCount = queue.filter((q) => q.isValid).length;

  if (!isOpen) return null;

  // Insert blank token into subject
  const handleInsertToken = (blank: Blank) => {
    setSubjectTemplate((prev) => `${prev} {{${blank.label}}}`);
  };

  // Launch single Gmail Compose
  const handleOpenGmail = (item: (typeof queue)[0]) => {
    if (!item.isValid) {
      showToast('Recipient email is invalid', 'error');
      return;
    }
    const url = generateGmailComposeUrl(item.payload.to, item.payload.subject, item.payload.body);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Launch single OS Mail Client
  const handleOpenMailto = (item: (typeof queue)[0]) => {
    if (!item.isValid) {
      showToast('Recipient email is invalid', 'error');
      return;
    }
    const url = generateMailtoUrl(item.payload.to, item.payload.subject, item.payload.body);
    window.location.href = url;
  };

  // Download single .eml
  const handleDownloadSingleEml = (item: (typeof queue)[0]) => {
    const eml = generateEmlContent(item.payload);
    downloadEmlFile(`${template.name}_doc_${item.index}`, eml);
  };

  // Download All .eml Files
  const handleDownloadAllEml = () => {
    queue.forEach((item, i) => {
      setTimeout(() => {
        const eml = generateEmlContent(item.payload);
        downloadEmlFile(`${template.name}_doc_${item.index}`, eml);
      }, i * 150);
    });
    showToast(`Downloaded ${queue.length} .eml draft files`);
  };

  // Direct Batch Dispatch
  const handleStartDirectSend = async () => {
    if (config.provider === 'resend' && !config.apiKey?.trim()) {
      showToast('Please provide your Resend API Key', 'error');
      return;
    }
    if (config.provider === 'webhook' && !config.webhookUrl?.trim()) {
      showToast('Please provide a Custom Webhook URL', 'error');
      return;
    }

    const validItems = queue.filter((q) => q.isValid);
    if (validItems.length === 0) {
      showToast('No valid email recipients found in current batch', 'error');
      return;
    }

    setIsSending(true);
    setResults({});
    setSendProgress({ completed: 0, total: validItems.length });

    abortControllerRef.current = new AbortController();

    try {
      await sendEmailBatch(
        validItems.map((v) => v.payload),
        config,
        {
          delayMs: 350,
          signal: abortControllerRef.current.signal,
          onProgress: ({ completed, total, currentResult }) => {
            setSendProgress({ completed, total });
            setResults((prev) => ({ ...prev, [currentResult.index]: currentResult }));
          },
        }
      );
      showToast(`Batch dispatch completed!`);
    } catch (err) {
      showToast('Batch sending interrupted', 'error');
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopDirectSend = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      showToast('Batch sending cancelled');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-email-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSending) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        className="modal-responsive-card animate-fade-in"
        style={{
          maxWidth: '860px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                id="bulk-email-modal-title"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}
              >
                Bulk Email Dispatcher
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                {allRenderedDocuments.length} Documents
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Generate instant draft messages in Gmail / Apple Mail or dispatch directly via API
            </p>
          </div>
          <button onClick={onClose} disabled={isSending} className="icon-btn" aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        {/* Configuration Bar */}
        <div
          style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.8fr)',
            gap: '16px',
          }}
        >
          {/* Recipient Column Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Recipient Email Column</span>
              <span style={{ color: validCount === queue.length ? 'var(--accent-primary)' : '#f59e0b', fontSize: '0.75rem' }}>
                {validCount}/{queue.length} Valid
              </span>
            </label>
            <select
              value={recipientBlankId}
              onChange={(e) => setRecipientBlankId(e.target.value)}
              className="workspace-input"
              style={{ fontSize: '0.825rem', padding: '7px 10px' }}
            >
              {template.blanks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} {emailBlanks.some((eb) => eb.id === b.id) ? ' (Auto-detected)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Line Template */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Email Subject Line Template
            </label>
            <input
              type="text"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              placeholder="e.g. Agreement for {{Client Name}}"
              className="workspace-input"
              style={{ fontSize: '0.825rem', padding: '7px 10px' }}
            />
            {/* Quick Token Insertion Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Insert:</span>
              {template.blanks.slice(0, 4).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleInsertToken(b)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    cursor: 'pointer',
                  }}
                >
                  +{b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '16px' }}>
          <button
            onClick={() => setActiveTab('drafts')}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'drafts' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'drafts' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconMail size={14} />
            <span>Zero-Config Drafts (Browser)</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'direct' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'direct' ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconSend size={14} />
            <span>Direct API Dispatch (Resend / Webhook)</span>
          </button>
        </div>

        {/* TAB 1: ZERO-CONFIG DRAFTS */}
        {activeTab === 'drafts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: '320px' }}>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Open pre-populated message tabs in 1 click or download standard RFC 822 draft files.
              </div>
              <button onClick={handleDownloadAllEml} className="btn-secondary" style={{ height: '30px', fontSize: '0.775rem' }}>
                <IconDownload size={13} /> Download All .eml Drafts
              </button>
            </div>

            {/* Recipient Queue Table */}
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                maxHeight: '320px',
                background: 'var(--bg-dark)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '8px 12px', width: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>#</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-main)' }}>Recipient Email</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-main)' }}>Subject</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {item.index}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {item.payload.to ? (
                          <span style={{ color: item.isValid ? 'var(--text-main)' : '#ef4444' }}>
                            {item.payload.to} {!item.isValid && '(Invalid format)'}
                          </span>
                        ) : (
                          <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Empty Email Field</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.payload.subject}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenGmail(item)}
                            className="btn-secondary"
                            style={{ height: '26px', padding: '0 8px', fontSize: '0.725rem' }}
                            title="Open draft in Gmail"
                          >
                            <IconExternalLink size={11} /> Gmail
                          </button>
                          <button
                            onClick={() => handleOpenMailto(item)}
                            className="btn-secondary"
                            style={{ height: '26px', padding: '0 8px', fontSize: '0.725rem' }}
                            title="Open in default mail client"
                          >
                            Mail
                          </button>
                          <button
                            onClick={() => handleDownloadSingleEml(item)}
                            className="icon-btn"
                            style={{ width: '26px', height: '26px' }}
                            title="Download .eml file"
                          >
                            <IconDownload size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECT API DISPATCH */}
        {activeTab === 'direct' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: '320px' }}>
            {/* API Config Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 1fr',
                gap: '12px',
                background: 'var(--bg-dark)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Provider
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => handleConfigChange({ provider: e.target.value as EmailProviderType })}
                  className="workspace-input"
                  style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                >
                  <option value="resend">Resend API</option>
                  <option value="webhook">Custom Webhook</option>
                </select>
              </div>

              {config.provider === 'resend' ? (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Resend API Key (re_...)
                  </label>
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => handleConfigChange({ apiKey: e.target.value })}
                    placeholder="re_123456789..."
                    className="workspace-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                    Webhook URL (Zapier/Make/n8n)
                  </label>
                  <input
                    type="url"
                    value={config.webhookUrl || ''}
                    onChange={(e) => handleConfigChange({ webhookUrl: e.target.value })}
                    placeholder="https://hooks.zapier.com/..."
                    className="workspace-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  From / Sender Address
                </label>
                <input
                  type="text"
                  value={config.fromAddress || ''}
                  onChange={(e) => handleConfigChange({ fromAddress: e.target.value })}
                  placeholder="e.g. onboarding@resend.dev"
                  className="workspace-input"
                  style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                />
              </div>
            </div>

            {/* Live Progress Bar when Sending */}
            {sendProgress && (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>
                    {isSending ? 'Dispatching Batch...' : 'Dispatch Complete'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                    {sendProgress.completed} / {sendProgress.total} (
                    {Math.round((sendProgress.completed / sendProgress.total) * 100)}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(sendProgress.completed / sendProgress.total) * 100}%`,
                      height: '100%',
                      background: 'var(--accent-primary)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Live Dispatch Log */}
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                maxHeight: '220px',
                background: 'var(--bg-dark)',
                flex: 1,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '6px 10px', width: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>#</th>
                    <th style={{ padding: '6px 10px', color: 'var(--text-main)' }}>Recipient</th>
                    <th style={{ padding: '6px 10px', color: 'var(--text-main)' }}>Delivery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => {
                    const res = results[item.index];
                    return (
                      <tr key={item.index} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {item.index}
                        </td>
                        <td style={{ padding: '6px 10px', color: item.isValid ? 'var(--text-main)' : '#ef4444' }}>
                          {item.payload.to || '(Empty)'}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          {!item.isValid ? (
                            <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Invalid Email</span>
                          ) : !res ? (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Queued</span>
                          ) : res.success ? (
                            <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                              ✓ Sent {res.messageId ? `(ID: ${res.messageId.slice(0, 8)}...)` : ''}
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                              ✕ Error: {res.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Direct Send Control Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto' }}>
              {isSending ? (
                <button onClick={handleStopDirectSend} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                  Stop Transmission
                </button>
              ) : (
                <button
                  onClick={handleStartDirectSend}
                  disabled={validCount === 0}
                  className="btn-primary"
                  style={{ padding: '0 16px', height: '34px', fontSize: '0.85rem' }}
                >
                  <IconSend size={14} /> Send {validCount} Emails Directly
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer Dismiss */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
          <button onClick={onClose} disabled={isSending} className="btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
