import React, { useRef } from 'react';
import { IconPlus, IconHistory, IconExport, IconImport } from './Icons';
import { useTemplates } from '../context/TemplateContext';
import { useFill } from '../context/FillContext';

interface NavbarProps {
  activeMode: 'editor' | 'fill';
  setActiveMode: (mode: 'editor' | 'fill') => void;
  onNewTemplate?: () => void;
  onOpenHistory?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: (jsonStr: string) => void;
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
  const { createNewTemplate, exportTemplatesJSONFile, importTemplatesFromJSON } = useTemplates();
  const { openHistoryModal } = useFill();

  const handleNew = onNewTemplate || createNewTemplate;
  const handleHistory = onOpenHistory || openHistoryModal;
  const handleExport = onExportJSON || exportTemplatesJSONFile;
  const handleImport = onImportJSON || importTemplatesFromJSON;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleImport(content);
      }
    };
    reader.readAsText(file);
    if (e.target) (e.target as HTMLInputElement).value = '';
  };

  return (
    <header
      className="no-print"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px var(--space-page-x)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        gap: '8px',
        width: '100%',
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 0 }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: '#ffffff',
            fontFamily: 'var(--font-heading)',
            flexShrink: 0,
          }}
        >
          F
        </div>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '-0.03em',
            color: '#ffffff',
          }}
        >
          Fillify
        </span>
      </div>

      {/* 2-Step Mode Navigation - Touch-friendly Pill */}
      <nav
        aria-label="Workspace Mode"
        style={{
          background: 'var(--bg-dark)',
          padding: '3px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          gap: '2px',
          border: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setActiveMode('editor')}
          style={{
            padding: '5px 12px',
            borderRadius: 'calc(var(--radius-sm) - 1px)',
            fontSize: '0.8rem',
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
            padding: '5px 12px',
            borderRadius: 'calc(var(--radius-sm) - 1px)',
            fontSize: '0.8rem',
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
      </nav>

      {/* Right Toolbar Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={handleNew}
          className="btn-secondary"
          title="Create a fresh empty template"
          style={{ padding: '0 8px', fontSize: '0.775rem' }}
        >
          <IconPlus size={14} />
          <span className="desktop-only">New</span>
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)', margin: '0 2px' }} />

        <button
          onClick={handleHistory}
          className="icon-btn"
          title="Session History"
          aria-label="Session History"
        >
          <IconHistory size={16} />
        </button>

        <button
          onClick={handleExport}
          className="icon-btn"
          title="Export JSON"
          aria-label="Export JSON"
        >
          <IconExport size={16} />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="icon-btn"
          title="Import JSON"
          aria-label="Import JSON"
        >
          <IconImport size={16} />
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
