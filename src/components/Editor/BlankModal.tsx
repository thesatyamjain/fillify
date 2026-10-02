import React, { useState, useEffect } from 'react';
import { Blank, BlankType } from '../../types/template';
import { useModalDismiss } from '../../utils/useModalDismiss';

interface BlankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blank: Blank) => void;
  initialBlank?: Partial<Blank>;
  selectedTextSpan?: string;
}

export const BlankModal: React.FC<BlankModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBlank,
  selectedTextSpan,
}) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<BlankType>('text');
  const [required, setRequired] = useState(true);
  const [defaultValue, setDefaultValue] = useState('');
  const [helpText, setHelpText] = useState('');
  const [optionsStr, setOptionsStr] = useState('');

  useModalDismiss(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      if (initialBlank) {
        setLabel(initialBlank.label || selectedTextSpan || '');
        setType(initialBlank.type || 'text');
        setRequired(initialBlank.required ?? true);
        setDefaultValue(initialBlank.defaultValue || '');
        setHelpText(initialBlank.helpText || '');
        setOptionsStr(initialBlank.options ? initialBlank.options.join(', ') : '');
      } else if (selectedTextSpan) {
        // Clean label from selected text
        const cleaned = selectedTextSpan
          .replace(/^[\{\[\<\_]+|[\}\]\>\_\:]+$/g, '')
          .replace(/_/g, ' ')
          .trim();
        setLabel(cleaned || 'Field Label');
        setType('text');
        setRequired(true);
        setDefaultValue('');
        setHelpText('');
        setOptionsStr('');
      }
    }
  }, [isOpen, initialBlank, selectedTextSpan]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const parsedOptions = type === 'dropdown'
      ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const blank: Blank = {
      id: initialBlank?.id || `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: label.trim(),
      type,
      order: initialBlank?.order ?? 0, // order is managed by the blanks array position
      required,
      defaultValue: defaultValue.trim() || undefined,
      helpText: helpText.trim() || undefined,
      options: parsedOptions,
    };

    onSave(blank);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blank-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="no-print"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'var(--space-page-x)',
      }}
    >
      <div className="modal-responsive-card animate-fade-in" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3
            id="blank-modal-title"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}
          >
            {initialBlank?.id ? 'Edit Blank Field' : 'Define New Blank Field'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', padding: '4px' }}
          >
            ×
          </button>
        </div>

        {selectedTextSpan && !initialBlank?.id && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.875rem',
            color: '#34d399',
          }}>
            Selected text: <strong style={{ color: '#ffffff' }}>"{selectedTextSpan}"</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
              Field Label / Name *
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Client Name, Contract Date, Order Amount"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                Field Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as BlankType)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="text">Short Text</option>
                <option value="longtext">Long Text / Paragraph</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="currency">Currency (₹ / $)</option>
                <option value="dropdown">Dropdown Options</option>
                <option value="checkbox">Yes/No Checkbox</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                Default Value (Optional)
              </label>
              <input
                type="text"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="Default fallback"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {type === 'dropdown' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                Dropdown Choices (comma-separated) *
              </label>
              <input
                type="text"
                required
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="Option 1, Option 2, Option 3"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
              Help Text / Prompt Question (Optional)
            </label>
            <input
              type="text"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="e.g. Enter the client's full registered name"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="req-checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="req-checkbox" style={{ fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-main)' }}>
              Required Field
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'none',
              }}
            >
              Save Blank
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
