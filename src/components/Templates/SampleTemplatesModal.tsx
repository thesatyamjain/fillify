import React, { useState } from 'react';
import { Template } from '../../types/template';
import { IconClose, IconTrash, IconArrowRight } from '../Icons';
import { useModalDismiss } from '../../utils/useModalDismiss';

interface SampleTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTemplates: Template[];
  onSelectTemplate: (t: Template) => void;
  onDeleteTemplate: (id: string) => void;
}

export const SampleTemplatesModal: React.FC<SampleTemplatesModalProps> = ({
  isOpen,
  onClose,
  savedTemplates,
  onSelectTemplate,
  onDeleteTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  // Dynamically extract unique categories from templates, keeping 'All' first and 'Custom' last
  const uniqueCategories = Array.from(
    new Set(savedTemplates.map((t) => t.category).filter(Boolean))
  ) as string[];

  const categories = [
    'All',
    ...uniqueCategories.filter((c) => c !== 'Custom'),
    'Custom',
  ];

  const filteredTemplates = savedTemplates.filter((t) => {
    const matchesCategory = selectedCategory === 'All'
      ? true
      : selectedCategory === 'Custom'
      ? !t.category || t.category === 'Custom'
      : t.category === selectedCategory;

    const matchesSearch = searchQuery.trim() === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="templates-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'var(--space-page-x)',
      }}
    >
      <div className="modal-responsive-card animate-fade-in" style={{ maxWidth: '780px' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3
              id="templates-modal-title"
              style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.4rem)', fontWeight: 800 }}
            >
              Select Document Template
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Choose a pre-configured sample or your saved custom templates</p>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Search Input & Category Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by title or content..."
            className="workspace-input"
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            No templates match your search query. Try clearing filters!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  onSelectTemplate(t);
                  onClose();
                }}
                style={{
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 700, background: 'var(--accent-surface)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      {t.category || 'Custom'}
                    </span>
                    {!t.id.startsWith('sample-') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTemplate(t.id);
                        }}
                        title="Delete saved template"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <IconTrash size={14} color="#ef4444" />
                      </button>
                    )}
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    {t.name}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.bodyText}
                  </p>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.775rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t.blanks.length} Blank Fields</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Load Template <IconArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
