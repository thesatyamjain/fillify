import React, { useRef } from 'react';
import { IconPlus, IconHistory, IconDownload, IconUpload } from './Icons';

interface NavbarProps {
  activeMode: 'editor' | 'fill';
  setActiveMode: (mode: 'editor' | 'fill') => void;
  onNewTemplate: () => void;
  onOpenHistory: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMode,
  setActiveMode,
  onNewTemplate,
  onOpenHistory,
  onExportJSON,
  onImportJSON,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJSON(content);
      }
    };
    reader.readAsText(file);
    if (e.target) (e.target as HTMLInputElement).value = '';
  };

  return (
    <header className="no-print" style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '1rem',
          color: '#ffffff',
          fontFamily: 'var(--font-heading)',
        }}>
          F
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
          Fillify
        </div>
      </div>

      {/* Clean 2-Step Mode Navigation */}
      <div style={{
        background: 'var(--bg-dark)',
        padding: '4px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        gap: '4px',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          onClick={() => setActiveMode('editor')}
          style={{
            padding: '6px 16px',
            borderRadius: 'calc(var(--radius-sm) - 1px)',
            fontSize: '0.825rem',
            fontWeight: 600,
            fontFamily: 'var(--font-heading)',
            border: 'none',
            cursor: 'pointer',
            background: activeMode === 'editor' ? 'var(--accent-primary)' : 'transparent',
            color: activeMode === 'editor' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.1s ease',
          }}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveMode('fill')}
          style={{
            padding: '6px 16px',
            borderRadius: 'calc(var(--radius-sm) - 1px)',
            fontSize: '0.825rem',
            fontWeight: 600,
            fontFamily: 'var(--font-heading)',
            border: 'none',
            cursor: 'pointer',
            background: activeMode === 'fill' ? 'var(--accent-primary)' : 'transparent',
            color: activeMode === 'fill' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.1s ease',
          }}
        >
          Fill
        </button>
      </div>

      {/* Right Toolbar Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onNewTemplate}
          className="btn-secondary"
          title="Create a fresh empty template"
        >
          <IconPlus size={14} /> New
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        <button
          onClick={onOpenHistory}
          className="icon-btn"
          title="History"
        >
          <IconHistory size={16} />
        </button>

        <button
          onClick={onExportJSON}
          className="icon-btn"
          title="Export JSON"
        >
          <IconDownload size={16} />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="icon-btn"
          title="Import JSON"
        >
          <IconUpload size={16} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: 'none' }}
        />
      </div>
    </header>
  );
};
