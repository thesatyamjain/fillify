import React, { useState, useEffect, useRef } from 'react';
import { Template, FilledInstance } from '../../types/template';
import { getUniqueBlankGroups, replaceBlanksInText } from '../../utils/templateParser';
import {
  parseCsvOrTsv,
  matchColumnsToBlanks,
  rowsToBlankValues,
  generateCsvTemplate,
  exportBulkDocumentsText,
} from '../../utils/csvParser';
import {
  IconCopy,
  IconCheck,
  IconPrint,
  IconDownload,
  IconUpload,
  IconPlus,
  IconTrash,
  IconSparkles,
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconClose,
} from '../Icons';
import { useToast } from '../../context/ToastContext';
import { copyToClipboard } from '../../utils/clipboard';

interface BulkViewProps {
  template: Template;
  onSaveFillHistory: (values: Record<string, string>, finalText: string) => void;
  onSaveMultipleFillHistory: (instances: FilledInstance[]) => void;
  onSwitchToWizard: () => void;
  onSwitchToFormView: () => void;
  onReturnToEdit: () => void;
}

export const BulkView: React.FC<BulkViewProps> = ({
  template,
  onSaveFillHistory,
  onSaveMultipleFillHistory,
  onSwitchToWizard,
  onSwitchToFormView,
  onReturnToEdit,
}) => {
  const uniqueBlanks = getUniqueBlankGroups(template.blanks);

  // Helper to build a single blank row based on defaults
  const createDefaultRow = (): Record<string, string> => {
    const row: Record<string, string> = {};
    uniqueBlanks.forEach((b) => {
      row[b.id] = b.defaultValue || '';
    });
    return row;
  };

  // Generate 3 sample rows with varied realistic data
  const createSampleRows = (): Record<string, string>[] => {
    const sampleNames = ['Apex Global Solutions', 'Starlight Media Inc.', 'Nexus Dynamics LLC'];
    const sampleDates = [
      new Date().toISOString().slice(0, 10),
      new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    ];
    const sampleAmounts = ['45,000', '1,20,000', '85,500'];

    return [0, 1, 2].map((idx) => {
      const row: Record<string, string> = {};
      uniqueBlanks.forEach((b) => {
        if (b.defaultValue && idx === 0) {
          row[b.id] = b.defaultValue;
          return;
        }

        switch (b.type) {
          case 'date':
            row[b.id] = sampleDates[idx];
            break;
          case 'currency':
            row[b.id] = sampleAmounts[idx];
            break;
          case 'number':
            row[b.id] = String((idx + 1) * 12);
            break;
          case 'checkbox':
            row[b.id] = idx % 2 === 0 ? 'yes' : 'no';
            break;
          case 'dropdown':
            row[b.id] = b.options?.[idx % (b.options.length || 1)] || '';
            break;
          default:
            if (b.label.toLowerCase().includes('name') || b.label.toLowerCase().includes('party')) {
              row[b.id] = sampleNames[idx];
            } else if (b.label.toLowerCase().includes('email')) {
              row[b.id] = `contact${idx + 1}@example.com`;
            } else if (b.label.toLowerCase().includes('city') || b.label.toLowerCase().includes('address')) {
              row[b.id] = ['New York, NY', 'Austin, TX', 'San Francisco, CA'][idx];
            } else {
              row[b.id] = b.defaultValue || `Batch Item #${idx + 1}`;
            }
            break;
        }
      });
      return row;
    });
  };

  const [rows, setRows] = useState<Record<string, string>[]>(() => {
    return createSampleRows();
  });

  const { showToast } = useToast();
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [isContinuousView, setIsContinuousView] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'grid' | 'preview'>('grid');

  // Import Modal State
  const [importPasteText, setImportPasteText] = useState('');
  const [importStats, setImportStats] = useState<{ rowCount: number; matchedHeaders: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedRowIndex in valid bounds
  useEffect(() => {
    if (rows.length === 0) {
      setSelectedRowIndex(0);
    } else if (selectedRowIndex >= rows.length) {
      setSelectedRowIndex(rows.length - 1);
    }
  }, [rows.length, selectedRowIndex]);

  const handleCellChange = (rowIndex: number, blankId: string, label: string, val: string) => {
    setRows((prev) => {
      const copy = [...prev];
      const targetRow = { ...copy[rowIndex], [blankId]: val };
      // Sync linked blanks with identical label
      template.blanks.forEach((b) => {
        if (b.label.trim().toLowerCase() === label.trim().toLowerCase()) {
          targetRow[b.id] = val;
        }
      });
      copy[rowIndex] = targetRow;
      return copy;
    });
  };

  const handleAddRow = () => {
    const newRow = createDefaultRow();
    setRows((prev) => [...prev, newRow]);
    setSelectedRowIndex(rows.length);
  };

  const handleDuplicateRow = (index: number) => {
    setRows((prev) => {
      const copy = [...prev];
      const dup = { ...copy[index] };
      copy.splice(index + 1, 0, dup);
      return copy;
    });
    setSelectedRowIndex(index + 1);
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) {
      setRows([createDefaultRow()]);
      setSelectedRowIndex(0);
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
    if (selectedRowIndex >= index && selectedRowIndex > 0) {
      setSelectedRowIndex(selectedRowIndex - 1);
    }
  };

  const handleClearAllRows = () => {
    if (window.confirm('Clear all bulk rows and start with 1 blank row?')) {
      setRows([createDefaultRow()]);
      setSelectedRowIndex(0);
    }
  };

  const handleLoadSamples = () => {
    setRows(createSampleRows());
    setSelectedRowIndex(0);
    showToast('Loaded 3 sample batch records');
  };

  // Compile active document
  const activeRowValues = rows[selectedRowIndex] || {};
  const currentRenderedText = replaceBlanksInText(template.bodyText, template.blanks, activeRowValues, {
    formatValues: true,
  });

  // Compile all documents
  const allRenderedDocuments = rows.map((row, idx) => ({
    index: idx + 1,
    title: `${template.name} - Instance #${idx + 1}`,
    text: replaceBlanksInText(template.bodyText, template.blanks, row, { formatValues: true }),
    values: row,
  }));

  // CSV Template download
  const handleDownloadCsvTemplate = () => {
    const csvContent = generateCsvTemplate(uniqueBlanks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_bulk_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast('Downloaded CSV batch template');
  };

  // Parse pasted or uploaded CSV text
  useEffect(() => {
    if (!importPasteText.trim()) {
      setImportStats(null);
      return;
    }
    const parsed = parseCsvOrTsv(importPasteText);
    if (parsed.length > 1) {
      const headers = parsed[0];
      const dataRows = parsed.slice(1);
      const { matchedCount } = matchColumnsToBlanks(headers, uniqueBlanks);
      setImportStats({
        rowCount: dataRows.length,
        matchedHeaders: matchedCount,
      });
    } else {
      setImportStats(null);
    }
  }, [importPasteText, uniqueBlanks]);

  const handleApplyImport = (mode: 'replace' | 'append') => {
    const parsed = parseCsvOrTsv(importPasteText);
    if (parsed.length <= 1) {
      alert('Please enter or upload a valid CSV with at least one header row and one data row.');
      return;
    }
    const headers = parsed[0];
    const dataRows = parsed.slice(1);
    const { colToBlankId } = matchColumnsToBlanks(headers, uniqueBlanks);
    const newRecords = rowsToBlankValues(dataRows, colToBlankId, uniqueBlanks);

    if (newRecords.length === 0) {
      alert('No data rows found to import.');
      return;
    }

    if (mode === 'replace') {
      setRows(newRecords);
      setSelectedRowIndex(0);
    } else {
      setRows((prev) => [...prev, ...newRecords]);
    }

    setIsImportModalOpen(false);
    setImportPasteText('');
    showToast(`Imported ${newRecords.length} document records`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportPasteText(text);
      }
    };
    reader.readAsText(file);
    if (e.target) (e.target as HTMLInputElement).value = '';
  };

  // Batch Exports
  const handleCopyCurrent = async () => {
    const success = await copyToClipboard(currentRenderedText);
    if (success) {
      setCopied(true);
      showToast(`Copied Document #${selectedRowIndex + 1} to clipboard`);
      onSaveFillHistory(activeRowValues, currentRenderedText);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAll = async () => {
    const combined = exportBulkDocumentsText(allRenderedDocuments);
    const success = await copyToClipboard(combined);
    if (success) {
      setCopied(true);
      showToast(`Copied all ${rows.length} documents to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  const handleDownloadAllTxt = () => {
    const combined = exportBulkDocumentsText(allRenderedDocuments);
    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_batch_${rows.length}_docs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast(`Downloaded batch bundle with ${rows.length} documents`);
  };

  const handleSaveAllToHistory = () => {
    const instances: FilledInstance[] = allRenderedDocuments.map((doc, idx) => ({
      id: `fill_batch_${Date.now()}_${idx}`,
      templateId: template.id,
      templateName: `${template.name} (Batch #${idx + 1})`,
      filledAt: Date.now(),
      values: doc.values,
      finalText: doc.text,
    }));
    onSaveMultipleFillHistory(instances);
    showToast(`Saved all ${rows.length} instances to history`);
  };

  return (
    <div className="page-container">
      {/* Primary Header & Mode Switcher */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: 800, letterSpacing: '-0.035em' }}>
              Bulk Batch Generator
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {rows.length} {rows.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Populate multiple documents simultaneously using the spreadsheet grid or import from CSV
          </p>
        </div>

        {/* Workflow Switchers */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={onReturnToEdit} className="btn-secondary" title="Return to Interactive Workspace Editor">
            <IconArrowLeft size={14} /> Back
          </button>
          <button onClick={onSwitchToWizard} className="btn-secondary">
            <IconSparkles size={13} /> Wizard
          </button>
          <button onClick={onSwitchToFormView} className="btn-secondary">
            Full Form
          </button>
          <button
            className="btn-primary"
            style={{
              cursor: 'default',
            }}
          >
            Bulk Batch
          </button>
        </div>
      </div>

      {/* Mobile Switcher Tab Bar */}
      <div className="mobile-only" style={{ width: '100%', marginBottom: '4px' }}>
        <div className="mobile-segmented-tabs">
          <button
            type="button"
            className={`mobile-segmented-tab ${mobileTab === 'grid' ? 'active' : ''}`}
            onClick={() => setMobileTab('grid')}
          >
            Spreadsheet Data ({rows.length})
          </button>
          <button
            type="button"
            className={`mobile-segmented-tab ${mobileTab === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileTab('preview')}
          >
            Document Preview (#{selectedRowIndex + 1})
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="no-print bulk-responsive-grid">
        {/* Left Column: Data Grid & Actions */}
        <div className={`workspace-panel animate-fade-in ${mobileTab !== 'grid' ? 'hide-on-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Action Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleAddRow} className="btn-primary">
                <IconPlus size={14} /> Add Row
              </button>
              <button onClick={handleLoadSamples} className="btn-secondary" title="Populate 3 realistic test rows">
                <IconRefresh size={13} /> Fill Samples
              </button>
              <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary">
                <IconUpload size={14} /> Import CSV
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={handleDownloadCsvTemplate} className="btn-secondary" title="Download CSV template matching this document's blanks">
                <IconDownload size={14} /> CSV Template
              </button>
              <button
                onClick={handleClearAllRows}
                className="btn-secondary"
                style={{ color: '#ef4444' }}
                title="Clear all rows"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-dark)',
              maxHeight: '620px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 12px', width: '48px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>
                    #
                  </th>
                  {uniqueBlanks.map((b) => (
                    <th
                      key={b.id}
                      style={{
                        padding: '10px 14px',
                        color: 'var(--text-main)',
                        fontWeight: 600,
                        minWidth: b.type === 'longtext' ? '220px' : '160px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{b.label}</span>
                        {b.required && <span style={{ color: '#ef4444' }}>*</span>}
                        <span
                          style={{
                            fontSize: '0.625rem',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {b.type}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '10px 12px', width: '70px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => {
                  const isSelected = rowIdx === selectedRowIndex;
                  return (
                    <tr
                      key={rowIdx}
                      onClick={() => setSelectedRowIndex(rowIdx)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      {/* Row Index */}
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          color: isSelected ? '#60a5fa' : 'var(--text-muted)',
                          fontWeight: isSelected ? 700 : 500,
                          borderRight: '1px solid var(--border-subtle)',
                        }}
                      >
                        {rowIdx + 1}
                      </td>

                      {/* Cells for Blanks */}
                      {uniqueBlanks.map((b) => {
                        const cellVal = row[b.id] ?? '';
                        return (
                          <td key={b.id} style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                            {b.type === 'dropdown' ? (
                              <select
                                value={cellVal}
                                onChange={(e) => handleCellChange(rowIdx, b.id, b.label, e.target.value)}
                                className="workspace-input"
                                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              >
                                <option value="">Select...</option>
                                {(b.options || []).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : b.type === 'checkbox' ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={cellVal === 'true' || cellVal === 'yes' || cellVal === '1'}
                                  onChange={(e) =>
                                    handleCellChange(rowIdx, b.id, b.label, e.target.checked ? 'yes' : 'no')
                                  }
                                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                                />
                              </div>
                            ) : b.type === 'date' ? (
                              <input
                                type="date"
                                value={cellVal}
                                onChange={(e) => handleCellChange(rowIdx, b.id, b.label, e.target.value)}
                                className="workspace-input"
                                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              />
                            ) : b.type === 'longtext' ? (
                              <textarea
                                value={cellVal}
                                onChange={(e) => handleCellChange(rowIdx, b.id, b.label, e.target.value)}
                                rows={1}
                                className="workspace-input"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '0.85rem',
                                  resize: 'vertical',
                                  minHeight: '34px',
                                }}
                              />
                            ) : (
                              <input
                                type={b.type === 'number' ? 'number' : 'text'}
                                value={cellVal}
                                onChange={(e) => handleCellChange(rowIdx, b.id, b.label, e.target.value)}
                                placeholder={b.defaultValue || `Enter ${b.label}`}
                                className="workspace-input"
                                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Row Action Buttons */}
                      <td style={{ padding: '6px 8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateRow(rowIdx);
                            }}
                            className="icon-btn"
                            title="Duplicate Row"
                            style={{ width: '26px', height: '26px' }}
                          >
                            <IconPlus size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(rowIdx);
                            }}
                            className="icon-btn"
                            title="Delete Row"
                            style={{ width: '26px', height: '26px', color: '#ef4444' }}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Click any row to preview its generated output</span>
            <span>Tab / Shift+Tab to navigate between fields</span>
          </div>
        </div>

        {/* Right Column: Live Batch Preview & Batch Actions */}
        <div className={`workspace-panel animate-fade-in ${mobileTab !== 'preview' ? 'hide-on-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
          {/* Preview Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                Document Output Preview
              </h3>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {isContinuousView
                  ? `Rendering all ${rows.length} documents`
                  : `Previewing Record ${selectedRowIndex + 1} of ${rows.length}`}
              </div>
            </div>

            {/* Pager & View Switcher */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!isContinuousView && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-dark)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <button
                    disabled={selectedRowIndex === 0}
                    onClick={() => setSelectedRowIndex((prev) => Math.max(0, prev - 1))}
                    className="icon-btn"
                    style={{ width: '24px', height: '24px', opacity: selectedRowIndex === 0 ? 0.4 : 1 }}
                    title="Previous Document"
                  >
                    <IconArrowLeft size={12} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '0 4px', color: 'var(--text-main)' }}>
                    {selectedRowIndex + 1} / {rows.length}
                  </span>
                  <button
                    disabled={selectedRowIndex >= rows.length - 1}
                    onClick={() => setSelectedRowIndex((prev) => Math.min(rows.length - 1, prev + 1))}
                    className="icon-btn"
                    style={{ width: '24px', height: '24px', opacity: selectedRowIndex >= rows.length - 1 ? 0.4 : 1 }}
                    title="Next Document"
                  >
                    <IconArrowRight size={12} />
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsContinuousView(!isContinuousView)}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', height: '28px', padding: '0 10px' }}
              >
                {isContinuousView ? 'Single View' : 'Stack All View'}
              </button>
            </div>
          </div>

          {/* Document Content Canvas */}
          <div
            style={{
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '460px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {isContinuousView ? (
              allRenderedDocuments.map((doc) => (
                <div
                  key={doc.index}
                  style={{
                    borderBottom: '1px dashed var(--border-subtle)',
                    paddingBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-primary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 700,
                    }}
                  >
                    Document #{doc.index}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.925rem', color: '#f8fafc' }}>
                    {doc.text}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.925rem', color: '#f8fafc' }}>
                {currentRenderedText}
              </div>
            )}
          </div>

          {/* Batch Actions Toolbar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: 'auto' }}>
            <button
              onClick={handleCopyCurrent}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0 8px' }}
              title="Copy active document text"
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              <span>Copy Current</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0 8px' }}
              title="Copy all documents with separators"
            >
              <IconCopy size={14} />
              <span>Copy All ({rows.length})</span>
            </button>

            <button
              onClick={handlePrintAll}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0 8px' }}
              title="Print all documents (each on its own page)"
            >
              <IconPrint size={14} />
              <span>Print All</span>
            </button>

            <button
              onClick={handleDownloadAllTxt}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0 8px' }}
              title="Download all documents as a structured .txt file"
            >
              <IconDownload size={14} />
              <span>Export .txt</span>
            </button>
          </div>

          {/* History Save Button */}
          <button
            onClick={handleSaveAllToHistory}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd' }}
          >
            <IconCheck size={14} />
            <span>Save All {rows.length} Documents to History</span>
          </button>
        </div>
      </div>

      {/* Hidden Print Container for Clean Page Breaks */}
      <div className="print-only">
        {allRenderedDocuments.map((doc) => (
          <div key={doc.index} className="bulk-print-page">
            {doc.text}
          </div>
        ))}
      </div>

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div
          className="modal-overlay animate-fade-in no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="workspace-panel"
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              border: '1px solid var(--border-medium)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Import CSV or Tabular Data
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Upload a .csv file or paste rows copied from Excel or Google Sheets
                </p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="icon-btn">
                <IconClose size={16} />
              </button>
            </div>

            {/* Upload File Area */}
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
                textAlign: 'center',
                background: 'var(--bg-dark)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ margin: '0 auto 8px auto' }}>
                <IconUpload size={14} /> Select CSV or TSV File
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                or paste raw comma-separated or tab-separated text below
              </div>
            </div>

            {/* Paste Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Paste CSV / TSV text with column headers:
              </label>
              <textarea
                value={importPasteText}
                onChange={(e) => setImportPasteText(e.target.value)}
                rows={6}
                placeholder={`Party A Name,Effective Date,Liability Cap\r\nAcme Corp,2026-10-15,100000\r\nGlobex Corp,2026-11-01,250000`}
                className="workspace-input"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.5 }}
              />
            </div>

            {/* Import Feedback / Statistics */}
            {importStats && (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#93c5fd' }}>
                  Detected <strong>{importStats.rowCount}</strong> data row{importStats.rowCount > 1 ? 's' : ''}.
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Matched <strong>{importStats.matchedHeaders}</strong> of <strong>{uniqueBlanks.length}</strong> blanks.
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsImportModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                disabled={!importStats || importStats.rowCount === 0}
                onClick={() => handleApplyImport('append')}
                className="btn-secondary"
                style={{ opacity: !importStats ? 0.5 : 1 }}
              >
                Append to Existing Rows
              </button>
              <button
                disabled={!importStats || importStats.rowCount === 0}
                onClick={() => handleApplyImport('replace')}
                className="btn-primary"
                style={{ opacity: !importStats ? 0.5 : 1 }}
              >
                Replace All Rows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
