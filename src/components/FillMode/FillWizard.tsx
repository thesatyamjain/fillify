import React, { useState, useEffect, useRef } from 'react';
import { Template, Blank } from '../../types/template';
import { getUniqueBlankGroups, replaceBlanksInText } from '../../utils/templateParser';
import { LivePreview } from '../Preview/LivePreview';
import { IconSparkles, IconArrowRight, IconArrowLeft, IconCheck } from '../Icons';

interface FillWizardProps {
  template: Template;
  onSaveFillHistory: (values: Record<string, string>, finalText: string) => void;
  onSwitchToFormView: () => void;
  onSwitchToBulk?: () => void;
  onReturnToEdit: () => void;
}

export const FillWizard: React.FC<FillWizardProps> = ({
  template,
  onSaveFillHistory,
  onSwitchToFormView,
  onSwitchToBulk,
  onReturnToEdit,
}) => {
  const uniqueBlanks = getUniqueBlankGroups(template.blanks);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [mobileTab, setMobileTab] = useState<'step' | 'preview'>('step');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    const initial: Record<string, string> = {};
    getUniqueBlankGroups(template.blanks).forEach(b => {
      if (b.defaultValue) {
        initial[b.id] = b.defaultValue;
      }
    });
    setValues(initial);
    setCurrentIndex(0);
  }, [template.id]);

  useEffect(() => {
    const t = setTimeout(() => { inputRef.current?.focus(); }, 50);
    return () => clearTimeout(t);
  }, [currentIndex]);

  const handleAutofillSampleData = () => {
    const autofilled: Record<string, string> = {};
    template.blanks.forEach((b) => {
      if (b.defaultValue) {
        autofilled[b.id] = b.defaultValue;
        return;
      }

      switch (b.type) {
        case 'date':
          autofilled[b.id] = new Date().toISOString().slice(0, 10);
          break;
        case 'currency':
          autofilled[b.id] = '50,000';
          break;
        case 'number':
          autofilled[b.id] = '101';
          break;
        case 'longtext':
          autofilled[b.id] = 'Standard terms and project specifications evaluated for agreement.';
          break;
        case 'dropdown':
          autofilled[b.id] = b.options?.[0] || 'Selected Option';
          break;
        case 'checkbox':
          autofilled[b.id] = 'yes';
          break;
        default:
          autofilled[b.id] = `${b.label} Value`;
          break;
      }
    });
    setValues(autofilled);
  };

  if (uniqueBlanks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
          No blank fields defined in this template yet.
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Switch back to the Editor tab to mark blank fields.</p>
        <button
          onClick={onReturnToEdit}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <IconArrowLeft size={16} /> Return to Edit Template
        </button>
      </div>
    );
  }

  const currentBlank: Blank = uniqueBlanks[currentIndex];
  const currentValue = values[currentBlank.id] || '';
  const progressPercent = Math.round(((currentIndex + 1) / uniqueBlanks.length) * 100);

  const handleNext = () => {
    if (currentIndex < uniqueBlanks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleChangeValue = (val: string) => {
    const updated = { ...values };
    updated[currentBlank.id] = val;

    template.blanks.forEach((b: Blank) => {
      if (b.label.trim().toLowerCase() === currentBlank.label.trim().toLowerCase()) {
        updated[b.id] = val;
      }
    });

    setValues(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentBlank.type !== 'longtext' && !e.shiftKey) {
      e.preventDefault();
      handleNext();
    }
  };

  const renderInputControl = () => {
    switch (currentBlank.type) {
      case 'longtext':
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={(e) => handleChangeValue(e.target.value)}
            placeholder={currentBlank.helpText || `Enter ${currentBlank.label}...`}
            rows={5}
            className="workspace-input"
            style={{
              padding: '16px 20px',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              resize: 'vertical',
            }}
          />
        );

      case 'date':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={currentValue}
            onChange={(e) => handleChangeValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="workspace-input"
            style={{
              padding: '16px 20px',
              fontSize: '1.1rem',
            }}
          />
        );

      case 'currency':
        return (
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#34d399',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}>
              ₹
            </span>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={currentValue}
              onChange={(e) => handleChangeValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 50,000"
              className="workspace-input"
              style={{
                padding: '16px 20px 16px 48px',
                fontSize: '1.1rem',
              }}
            />
          </div>
        );

      case 'dropdown':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {(currentBlank.options || []).map((opt) => {
                const isSelected = currentValue === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChangeValue(opt)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.25)' : '#070b14',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={currentValue}
              onChange={(e) => handleChangeValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Or type custom value..."
              className="workspace-input"
              style={{
                padding: '14px 18px',
                fontSize: '1rem',
              }}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              type="button"
              onClick={() => handleChangeValue('yes')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: currentValue === 'yes' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: currentValue === 'yes' ? 'rgba(16, 185, 129, 0.25)' : '#070b14',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ✓ Yes
            </button>
            <button
              type="button"
              onClick={() => handleChangeValue('no')}
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: currentValue === 'no' ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                background: currentValue === 'no' ? 'rgba(239, 68, 68, 0.25)' : '#070b14',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ✕ No
            </button>
          </div>
        );

      default:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={currentValue}
            onChange={(e) => handleChangeValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentBlank.helpText || `Enter ${currentBlank.label}...`}
            className="workspace-input"
            style={{
              padding: '16px 20px',
              fontSize: '1.1rem',
            }}
          />
        );
    }
  };

  return (
    <div className="fill-responsive-grid">
      {/* Mobile Switcher Tab Bar */}
      <div className="mobile-only" style={{ width: '100%', marginBottom: '4px' }}>
        <div className="mobile-segmented-tabs">
          <button
            type="button"
            className={`mobile-segmented-tab ${mobileTab === 'step' ? 'active' : ''}`}
            onClick={() => setMobileTab('step')}
          >
            Step {currentIndex + 1} of {uniqueBlanks.length}
          </button>
          <button
            type="button"
            className={`mobile-segmented-tab ${mobileTab === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileTab('preview')}
          >
            Document Preview
          </button>
        </div>
      </div>

      {/* Left Column: Stage */}
      <div className={`workspace-panel animate-fade-in no-print ${mobileTab !== 'step' ? 'hide-on-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Progress Bar & Header */}
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Field {currentIndex + 1} of {uniqueBlanks.length}
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={onReturnToEdit}
                className="btn-secondary"
                title="Return to Interactive Workspace Editor"
              >
                <IconArrowLeft size={14} /> Back
              </button>
              <button
                onClick={handleAutofillSampleData}
                className="btn-secondary"
                title="Fill all fields with sample data for quick testing"
              >
                <IconSparkles size={13} color="#fbbf24" /> Sample Data
              </button>
              <button
                onClick={onSwitchToFormView}
                className="btn-secondary"
              >
                Form View
              </button>
              {onSwitchToBulk && (
                <button
                  onClick={onSwitchToBulk}
                  className="btn-secondary"
                >
                  Bulk Batch
                </button>
              )}
            </div>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          </div>
        </div>

        {/* Display Prompt */}
        <div style={{ marginTop: '4px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.25rem, 3.5vw, 1.85rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '8px', letterSpacing: '-0.035em' }}>
            {currentBlank.helpText || `What is the ${currentBlank.label}?`}
          </h2>
          {currentBlank.required && (
            <span style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              Required Field
            </span>
          )}
        </div>

        {/* Input Control Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {renderInputControl()}
        </div>

        {/* Keyboard hint */}
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
          Press <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontWeight: 600 }}>Enter ↵</kbd> to proceed to next field.
        </div>

        {/* Navigation Footer */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="btn-secondary"
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              opacity: currentIndex === 0 ? 0.3 : 1,
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconArrowLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            {currentIndex + 1} of {uniqueBlanks.length}
          </span>

          {currentIndex < uniqueBlanks.length - 1 ? (
            <button
              onClick={handleNext}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Next Field <IconArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => {
                const assembled = replaceBlanksInText(template.bodyText, template.blanks, values, { formatValues: true });
                onSaveFillHistory(values, assembled);
                setMobileTab('preview');
              }}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: '0.875rem',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <IconCheck size={16} /> Finish Document
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Live Document Preview */}
      <div className={`animate-fade-in ${mobileTab !== 'preview' ? 'hide-on-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <LivePreview
          template={template}
          values={values}
          onSaveFillHistory={onSaveFillHistory}
          onResetValues={() => setValues({})}
        />
      </div>
    </div>
  );
};
