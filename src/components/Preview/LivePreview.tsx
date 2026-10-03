import React, { useState, useEffect } from 'react';
import { Template } from '../../types/template';
import { replaceBlanksInText } from '../../utils/templateParser';
import { IconCopy, IconCheck, IconPrint, IconExport, IconEdit, IconRefresh } from '../Icons';
import { useToast } from '../../context/ToastContext';
import { copyToClipboard } from '../../utils/clipboard';

interface LivePreviewProps {
  template: Template;
  values: Record<string, string>;
  onSaveFillHistory: (values: Record<string, string>, finalText: string) => void;
  onResetValues: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  template,
  values,
  onSaveFillHistory,
  onResetValues,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editedText, setEditedText] = useState('');

  const assembledText = replaceBlanksInText(template.bodyText, template.blanks, values, { formatValues: true });

  useEffect(() => {
    if (!isEditingInline) setEditedText(assembledText);
  }, [assembledText, isEditingInline]);

  const finalTextToUse = isEditingInline ? editedText : assembledText;

  const handleCopy = async () => {
    const success = await copyToClipboard(finalTextToUse);
    if (success) {
      setCopied(true);
      showToast('Copied to clipboard. Ready to paste.');
      onSaveFillHistory(values, finalTextToUse);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadTxt = () => {
    const file = new Blob([finalTextToUse], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const element = document.createElement('a');
    element.href = url;
    element.download = `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_filled.txt`;
    document.body.appendChild(element);
    element.click();
    setTimeout(() => {
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }, 100);
    onSaveFillHistory(values, finalTextToUse);
  };

  const handlePrint = () => {
    onSaveFillHistory(values, finalTextToUse);
    window.print();
  };

  return (
    <div className="workspace-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px', position: 'relative' }}>
      {/* Header & Mode Toggles */}
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Live Assembled Document
          </h3>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Real-time output preview
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setIsEditingInline(!isEditingInline)}
            style={{
              padding: '6px 12px',
              background: isEditingInline ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: isEditingInline ? '#fbbf24' : 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconEdit size={13} /> {isEditingInline ? 'Done' : 'Tweak'}
          </button>
          <button
            onClick={onResetValues}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconRefresh size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Main Document View Canvas (Screen Only) */}
      <div
        className="no-print"
        style={{
          background: 'var(--bg-dark)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-panel)',
          flex: 1,
          overflowY: 'auto',
          minHeight: '260px',
        }}
      >
        {isEditingInline ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={14}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.95rem',
              lineHeight: 1.75,
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-body)',
            }}
          />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: '0.95rem', color: '#f8fafc' }}>
            {finalTextToUse}
          </div>
        )}
      </div>

      {/* Dedicated Print Output Body (Hidden on screen, pure output in print) */}
      <div className="print-only print-document-body">
        {finalTextToUse}
      </div>

      {/* Export Action Toolbar - Mobile First Responsive Grid */}
      <div className="no-print preview-actions-grid">
        <button
          onClick={handleCopy}
          className="btn-primary"
          style={{
            background: copied ? 'var(--bg-surface-elevated)' : 'var(--accent-primary)',
            borderColor: copied ? 'var(--border-subtle)' : 'var(--accent-primary)',
            padding: '12px 14px',
            fontSize: '0.875rem',
            height: '42px',
          }}
        >
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          {copied ? 'Copied!' : 'Copy Document'}
        </button>

        <button
          onClick={handlePrint}
          className="btn-secondary"
          style={{ padding: '12px 14px', fontSize: '0.875rem', justifyContent: 'center', height: '42px' }}
        >
          <IconPrint size={16} /> Print Document
        </button>

        <button
          onClick={handleDownloadTxt}
          className="btn-secondary"
          style={{ padding: '12px 14px', fontSize: '0.875rem', justifyContent: 'center', height: '42px' }}
        >
          <IconExport size={16} /> Export .txt File
        </button>
      </div>
    </div>
  );
};
