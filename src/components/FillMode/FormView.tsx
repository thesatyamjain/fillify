import React, { useState, useEffect } from 'react';
import { Template } from '../../types/template';
import { getUniqueBlankGroups } from '../../utils/templateParser';
import { LivePreview } from '../Preview/LivePreview';
import { IconSparkles, IconArrowLeft } from '../Icons';

interface FormViewProps {
  template: Template;
  onSaveFillHistory: (values: Record<string, string>, finalText: string) => void;
  onSwitchToWizard: () => void;
  onReturnToEdit: () => void;
}

export const FormView: React.FC<FormViewProps> = ({
  template,
  onSaveFillHistory,
  onSwitchToWizard,
  onReturnToEdit,
}) => {
  const uniqueBlanks = getUniqueBlankGroups(template.blanks);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, string> = {};
    getUniqueBlankGroups(template.blanks).forEach(b => {
      if (b.defaultValue) {
        initial[b.id] = b.defaultValue;
      }
    });
    setValues(initial);
  }, [template.id]);

  const handleChangeValue = (blankId: string, label: string, val: string) => {
    const updated = { ...values, [blankId]: val };
    template.blanks.forEach(b => {
      if (b.label.trim().toLowerCase() === label.trim().toLowerCase()) {
        updated[b.id] = val;
      }
    });
    setValues(updated);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', padding: '32px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Left Column: Scrollable Multi-field Form */}
      <div className="workspace-panel animate-fade-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.035em' }}>
              Full Interactive Form View
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fill all document fields on a single scrollable form</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={onReturnToEdit}
              className="btn-secondary"
              title="Return to Interactive Workspace Editor"
            >
              <IconArrowLeft size={14} /> Back to Edit
            </button>
            <button
              onClick={onSwitchToWizard}
              className="btn-secondary"
            >
              <IconSparkles size={13} /> Conversational Wizard
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {uniqueBlanks.map((b) => {
            const val = values[b.id] || '';
            return (
              <div key={b.id} style={{ background: 'var(--bg-dark)', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'block', fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
                  {b.label} {b.required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                {b.helpText && (
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    {b.helpText}
                  </div>
                )}

                {b.type === 'longtext' ? (
                  <textarea
                    value={val}
                    onChange={(e) => handleChangeValue(b.id, b.label, e.target.value)}
                    rows={3}
                    className="workspace-input"
                  />
                ) : b.type === 'date' ? (
                  <input
                    type="date"
                    value={val}
                    onChange={(e) => handleChangeValue(b.id, b.label, e.target.value)}
                    className="workspace-input"
                  />
                ) : b.type === 'currency' ? (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#818cf8', fontWeight: 800 }}>
                      ₹
                    </span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChangeValue(b.id, b.label, e.target.value)}
                      placeholder="e.g. 10,000"
                      className="workspace-input"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                ) : b.type === 'dropdown' ? (
                  <select
                    value={val}
                    onChange={(e) => handleChangeValue(b.id, b.label, e.target.value)}
                    className="workspace-input"
                  >
                    <option value="">Select an option...</option>
                    {(b.options || []).map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : b.type === 'checkbox' ? (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ffffff', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name={`radio_${b.id}`}
                        checked={val === 'yes'}
                        onChange={() => handleChangeValue(b.id, b.label, 'yes')}
                      />
                      Yes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ffffff', fontSize: '0.9rem' }}>
                      <input
                        type="radio"
                        name={`radio_${b.id}`}
                        checked={val === 'no'}
                        onChange={() => handleChangeValue(b.id, b.label, 'no')}
                      />
                      No
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleChangeValue(b.id, b.label, e.target.value)}
                    className="workspace-input"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Document Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
