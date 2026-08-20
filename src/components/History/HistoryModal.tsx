import React, { useState } from 'react';
import { FilledInstance } from '../../types/template';
import { IconCopy, IconCheck, IconClose } from '../Icons';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: FilledInstance[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (item: FilledInstance) => {
    try {
      await navigator.clipboard.writeText(item.finalText);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.warn('Clipboard write failed.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px',
    }}>
      <div className="workspace-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '740px',
        maxHeight: '85vh',
        background: 'var(--bg-surface)',
        padding: '32px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800 }}>
              Filled Document History
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Recently generated filled documents (Session Log)</p>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
          >
            <IconClose size={18} />
          </button>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            No filled document history recorded in this session yet.<br />Use Copy, Print, or Export to record entries here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                    {item.templateName || 'Document Fill'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {new Date(item.filledAt).toLocaleString()}
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.55,
                  color: 'var(--text-muted)',
                  maxHeight: '100px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '12px',
                }}>
                  {item.finalText}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleCopy(item)}
                    style={{
                      padding: '6px 14px',
                      background: copiedId === item.id ? 'var(--bg-surface-elevated)' : 'var(--accent-primary)',
                      border: copiedId === item.id ? '1px solid var(--border-subtle)' : '1px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {copiedId === item.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    {copiedId === item.id ? 'Copied' : 'Copy Text'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
