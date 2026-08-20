import React, { useState, useEffect } from 'react';
import { Template } from '../../types/template';
import { replaceBlanksInText } from '../../utils/templateParser';
import { IconCopy, IconCheck, IconPrint, IconDownload, IconEdit, IconRefresh } from '../Icons';

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
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editedText, setEditedText] = useState('');

  const assembledText = replaceBlanksInText(template.bodyText, template.blanks, values, { formatValues: true });

  useEffect(() => {
    if (!isEditingInline) setEditedText(assembledText);
  }, [assembledText, isEditingInline]);

  const finalTextToUse = isEditingInline ? editedText : assembledText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalTextToUse);
      setCopied(true);
      setShowToast(true);
      onSaveFillHistory(values, finalTextToUse);
      setTimeout(() => setCopied(false), 2200);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      // Clipboard API unavailable (non-HTTPS or blocked) — silent fail, no false feedback.
      console.warn('Clipboard write failed.');
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
    // Give the browser time to initiate the download before revoking.
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
    <div className="workspace-panel animate-fade-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '620px', position: 'relative' }}>
      {/* Toast Notification (Zero Emojis) */}
      {showToast && (
        <div className="animate-fade-in" style={{
          position: 'absolute',
          bottom: '84px',
          right: '32px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--accent-primary)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          fontWeight: 500,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 50,
        }}>
          <IconCheck size={16} color="var(--accent-primary)" />
          <span>Copied to Clipboard. Ready to paste.</span>
        </div>
      )}

      {/* Header & Mode Toggles */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Live Assembled Document
          </h3>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Real-time output preview
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
            <IconEdit size={13} /> {isEditingInline ? 'Done Tweaking' : 'Free-Text Tweak'}
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
            <IconRefresh size={13} /> Fill Again
          </button>
        </div>
      </div>

      {/* Main Document View Canvas */}
      <div
        className="print-only-container"
        style={{
          background: 'var(--bg-dark)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '28px',
          flex: 1,
          overflowY: 'auto',
          minHeight: '360px',
        }}
      >
        {isEditingInline ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={16}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.975rem',
              lineHeight: 1.75,
              outline: 'none',
              resize: 'none',
              fontFamily: 'var(--font-body)',
            }}
          />
        ) : (
          <div className="print-document-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: '0.975rem', color: '#f8fafc' }}>
            {finalTextToUse}
          </div>
        )}
      </div>

      {/* Export Action Toolbar */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginTop: '24px' }}>
        <button
          onClick={handleCopy}
          className="btn-primary"
          style={{
            background: copied ? 'var(--bg-surface-elevated)' : 'var(--accent-primary)',
            borderColor: copied ? 'var(--border-subtle)' : 'var(--accent-primary)',
            padding: '14px',
            fontSize: '0.925rem',
          }}
        >
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>

        <button
          onClick={handlePrint}
          className="btn-secondary"
          style={{ padding: '14px', fontSize: '0.925rem', justifyContent: 'center' }}
        >
          <IconPrint size={16} /> Print Document
        </button>

        <button
          onClick={handleDownloadTxt}
          className="btn-secondary"
          style={{ padding: '14px', fontSize: '0.925rem', justifyContent: 'center' }}
        >
          <IconDownload size={16} /> Export .txt File
        </button>
      </div>
    </div>
  );
};
