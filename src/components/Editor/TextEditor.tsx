import React, { useState, useEffect, useRef } from 'react';
import { Template, Blank, SuggestedBlank, BlankType } from '../../types/template';
import { detectSuggestedBlanks } from '../../utils/blankDetector';
import { toHumanReadableRawText, fromHumanReadableRawText } from '../../utils/templateParser';
import { useUndoRedo } from '../../utils/useUndoRedo';
import { BlankModal } from './BlankModal';
import {
  IconUndo,
  IconRedo,
  IconSparkles,
  IconPlus,
  IconEdit,
  IconTrash,
  IconClose,
  IconArrowRight,
  IconCheck,
  IconRefresh,
  IconChevronDown,
} from '../Icons';

function replaceAllText(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement);
}

/**
 * Returns the slot index (0-based integer) nearest to the drop point.
 * Slot N means "insert before the N-th rendered segment".
 * excludeBlankId: skip the chip being dragged so it doesn't bias the result.
 */
function getDropSlot(e: React.DragEvent, container: HTMLElement | null, excludeBlankId?: string): number {
  if (!container) return 0;

  const slotEls = Array.from(container.querySelectorAll('[data-slot]')) as HTMLElement[];
  if (slotEls.length === 0) return 0;

  // Find which element edge is closest to the cursor on the X axis (per-line).
  // For each element we consider two candidate insertion points:
  //   - its LEFT edge  → insert BEFORE it (= its slot index)
  //   - its RIGHT edge → insert AFTER it  (= its slot index + 1)
  let bestSlot = slotEls.length; // default: append at end
  let bestDist = Infinity;

  for (const el of slotEls) {
    // Skip the chip currently being dragged
    const elBlankId = el.getAttribute('data-blank-id');
    if (excludeBlankId && elBlankId === excludeBlankId) continue;

    const rect = el.getBoundingClientRect();
    // Only consider elements on the same visual line (within vertical bounds + 1 line-height)
    const lineH = rect.height * 1.5;
    if (e.clientY < rect.top - lineH || e.clientY > rect.bottom + lineH) continue;

    const slotIdx = parseInt(el.dataset.slot || '0', 10);

    const distLeft = Math.abs(e.clientX - rect.left);
    if (distLeft < bestDist) {
      bestDist = distLeft;
      bestSlot = slotIdx; // insert before this element
    }

    const distRight = Math.abs(e.clientX - rect.right);
    if (distRight < bestDist) {
      bestDist = distRight;
      bestSlot = slotIdx + 1; // insert after this element
    }
  }

  return bestSlot;
}

interface TextEditorProps {
  template: Template;
  onUpdateTemplate: (updated: Template) => void;
  onProceedToFill: () => void;
  onOpenSamples?: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  template,
  onUpdateTemplate,
  onProceedToFill,
  onOpenSamples,
}) => {
  const {
    state: currentHistoryTemplate,
    set: updateHistory,
    reset: resetHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<Template>(template);

  useEffect(() => {
    if (template.id !== currentHistoryTemplate.id) {
      resetHistory(template);
    }
  }, [template.id, resetHistory]);

  const commitUpdate = (updated: Template) => {
    updateHistory(updated);
    onUpdateTemplate(updated);
  };

  // Keep a stable ref to the latest undo/redo state so we only register the listener once.
  const undoRedoRef = useRef({ canUndo, canRedo, undo, redo });
  useEffect(() => {
    undoRedoRef.current = { canUndo, canRedo, undo, redo };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { canUndo: cu, canRedo: cr, undo: u, redo: r } = undoRedoRef.current;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (cr) { e.preventDefault(); r(); }
        } else {
          if (cu) { e.preventDefault(); u(); }
        }
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        if (cr) { e.preventDefault(); r(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // registered once — reads latest state through the ref

  const handleUndo = () => {
    if (canUndo) undo();
  };

  const handleRedo = () => {
    if (canRedo) redo();
  };

  useEffect(() => {
    onUpdateTemplate(currentHistoryTemplate);
  }, [currentHistoryTemplate]);

  const activeTemplate = currentHistoryTemplate;

  const [selectedSpan, setSelectedSpan] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlank, setEditingBlank] = useState<Blank | undefined>(undefined);
  const [suggestedList, setSuggestedList] = useState<SuggestedBlank[]>([]);
  const [showAutoDetectDrawer, setShowAutoDetectDrawer] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState<boolean>(true);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Template updated & saved successfully!');

  // Merged drag state — single setState call per dragover event instead of three.
  const [dragState, setDragState] = useState<{ dragging: boolean; hovered: boolean; slot: number }>(
    { dragging: false, hovered: false, slot: -1 }
  );
  const isDraggingToken = dragState.dragging;
  const isCanvasHoveredForDrop = dragState.hovered;
  const dropIndicatorPos = dragState.slot;

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggedTokenRef = useRef<{ tokenName: string; isMove: boolean; blankId?: string } | null>(null);

  const handleExplicitUpdateTemplate = () => {
    onUpdateTemplate(activeTemplate);
    setToastMessage('Template updated & saved successfully!');
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleResetTemplate = () => {
    if (window.confirm('Are you sure you want to reset this template? All document text and defined variable fields will be cleared.')) {
      commitUpdate({
        ...activeTemplate,
        bodyText: '',
        blanks: [],
      });
      setToastMessage('Template reset successfully!');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    commitUpdate({ ...activeTemplate, name: e.target.value });
  };

  // Drag and Drop Token Handlers
  const handleDragTokenStart = (e: React.DragEvent, tokenName: string, isMove = false, blankId?: string) => {
    draggedTokenRef.current = { tokenName, isMove, blankId };
    e.dataTransfer.setData('text/plain', `{{${tokenName}}}`);
    e.dataTransfer.setData('application/json', JSON.stringify({ tokenName, isMove, blankId }));
    e.dataTransfer.effectAllowed = isMove ? 'move' : 'copy';
    setDragState({ dragging: true, hovered: false, slot: -1 });
  };

  const handleDragTokenEnd = () => {
    setDragState({ dragging: false, hovered: false, slot: -1 });
    setTimeout(() => {
      draggedTokenRef.current = null;
    }, 200);
  };

  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dropContainer = canvasRef.current;
    const excludeId = draggedTokenRef.current?.isMove ? draggedTokenRef.current?.blankId : undefined;
    const slot = getDropSlot(e, dropContainer, excludeId);
    setDragState(prev => (prev.hovered && prev.slot === slot ? prev : { dragging: true, hovered: true, slot }));
  };

  const handleDragLeaveCanvas = (e: React.DragEvent) => {
    if (canvasRef.current && canvasRef.current.contains(e.relatedTarget as Node)) return;
    setDragState({ dragging: false, hovered: false, slot: -1 });
  };

  /**
   * Convert a slot index back to a raw char position in bodyText.
   * Segments alternate: [textChunk, chip, textChunk, chip, ...]
   * Slot 0 = start, slot 1 = after first segment, etc.
   */
  const slotToBodyIndex = (slot: number, body: string): number => {
    const regex = /\{\{(b_[a-zA-Z0-9_]+|[a-zA-Z0-9_-]+)\}\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Build segment start positions in raw bodyText
    const segStarts: number[] = [];
    while ((match = regex.exec(body)) !== null) {
      if (match.index > lastIndex) {
        segStarts.push(lastIndex);
      }
      segStarts.push(match.index);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < body.length) {
      segStarts.push(lastIndex);
    }

    if (segStarts.length === 0) return body.length;
    if (slot <= 0) return 0;
    if (slot >= segStarts.length) return body.length;
    return segStarts[slot];
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    setDragState({ dragging: false, hovered: false, slot: -1 });

    const dragInfo = draggedTokenRef.current;
    draggedTokenRef.current = null;

    const dropContainer = canvasRef.current;
    const excludeId = dragInfo?.isMove ? dragInfo?.blankId : undefined;
    const dropSlot = getDropSlot(e, dropContainer, excludeId);
    setDragState({ dragging: false, hovered: false, slot: -1 });

    const rawTextData = e.dataTransfer.getData('text/plain');
    const isMove = dragInfo?.isMove ?? false;
    const blankId = dragInfo?.blankId || '';
    const tokenName = dragInfo?.tokenName || (rawTextData ? rawTextData.trim().replace(/^\{\{/, '').replace(/\}\}$/, '') : '');

    if (!tokenName && !blankId) return;

    // MOVE: rearrange existing chip by slot
    if (isMove && blankId) {
      const token = `{{${blankId}}}`;
      const oldStart = activeTemplate.bodyText.indexOf(token);

      if (oldStart >= 0) {
        // Remove token first, then re-insert at new slot position
        const bodyWithout = activeTemplate.bodyText.substring(0, oldStart) + activeTemplate.bodyText.substring(oldStart + token.length);
        const insertAt = slotToBodyIndex(dropSlot, bodyWithout);
        const newBodyText = bodyWithout.substring(0, insertAt) + ` ${token} ` + bodyWithout.substring(insertAt);
        commitUpdate({ ...activeTemplate, bodyText: newBodyText });
        return;
      }
    }

    // COPY: insert new token from sidebar by slot
    const existingBlank = activeTemplate.blanks.find(b => b.label.trim().toLowerCase() === tokenName.trim().toLowerCase());
    const blankToUseId = existingBlank?.id ?? `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    let updatedBlanks = activeTemplate.blanks;
    if (!existingBlank) {
      updatedBlanks = [...activeTemplate.blanks, {
        id: blankToUseId,
        label: tokenName,
        type: 'text' as BlankType,
        order: activeTemplate.blanks.length + 1,
        required: true,
      }];
    }

    const tokenTag = `{{${blankToUseId}}}`;
    const insertAt = slotToBodyIndex(dropSlot, activeTemplate.bodyText);
    const newBodyText = activeTemplate.bodyText.substring(0, insertAt) + ` ${tokenTag} ` + activeTemplate.bodyText.substring(insertAt);

    commitUpdate({ ...activeTemplate, bodyText: newBodyText, blanks: updatedBlanks });
  };

  const handleSelectTextInVisual = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        setSelectedSpan(selectedText);
      }
    } else {
      setSelectedSpan('');
    }
  };

  const handleMarkSelection = () => {
    if (!selectedSpan) return;
    setEditingBlank(undefined);
    setIsModalOpen(true);
  };

  const handleSaveBlank = (blank: Blank) => {
    let newBody = activeTemplate.bodyText;
    const existingIndex = activeTemplate.blanks.findIndex(b => b.id === blank.id);

    if (existingIndex >= 0) {
      const updatedBlanks = [...activeTemplate.blanks];
      updatedBlanks[existingIndex] = blank;
      commitUpdate({ ...activeTemplate, blanks: updatedBlanks });
    } else if (selectedSpan) {
      const token = `{{${blank.id}}}`;
      newBody = replaceAllText(newBody, selectedSpan, token);
      const updatedBlanks = [...activeTemplate.blanks, blank];
      commitUpdate({ ...activeTemplate, bodyText: newBody, blanks: updatedBlanks });
    } else {
      const token = `{{${blank.id}}}`;
      newBody = `${newBody} ${token}`;
      const updatedBlanks = [...activeTemplate.blanks, blank];
      commitUpdate({ ...activeTemplate, bodyText: newBody, blanks: updatedBlanks });
    }

    setSelectedSpan('');
  };

  const handleDeleteBlank = (id: string) => {
    // Only remove the token from the canvas text.
    // The blank definition stays in activeTemplate.blanks so it remains in Defined Blanks.
    const token = `{{${id}}}`;
    let newBody = activeTemplate.bodyText;
    // Remove token together with any surrounding space pair it created.
    newBody = replaceAllText(newBody, ` ${token} `, ' ');
    newBody = replaceAllText(newBody, `${token} `, '');
    newBody = replaceAllText(newBody, ` ${token}`, '');
    newBody = replaceAllText(newBody, token, '');
    commitUpdate({ ...activeTemplate, bodyText: newBody });
  };

  const handleRunAutoDetect = () => {
    const existingIds = activeTemplate.blanks.map(b => b.id);
    const suggestions = detectSuggestedBlanks(activeTemplate.bodyText, existingIds);
    setSuggestedList(suggestions);
    setShowAutoDetectDrawer(true);
  };

  const handleUpdateSuggestion = (index: number, label: string, type: BlankType) => {
    setSuggestedList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], suggestedLabel: label, suggestedType: type };
      return updated;
    });
  };

  const handleAcceptSuggestion = (s: SuggestedBlank) => {
    const newBlankId = `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newBlank: Blank = {
      id: newBlankId,
      label: s.suggestedLabel,
      type: s.suggestedType,
      order: activeTemplate.blanks.length + 1,
      required: true,
    };

    const token = `{{${newBlankId}}}`;
    const newBody = replaceAllText(activeTemplate.bodyText, s.spanText, token);
    const updatedBlanks = [...activeTemplate.blanks, newBlank];

    commitUpdate({ ...activeTemplate, bodyText: newBody, blanks: updatedBlanks });
    setSuggestedList(prev => prev.filter(item => item.spanText !== s.spanText));
  };

  const handleAcceptAllSuggestions = () => {
    let currentBody = activeTemplate.bodyText;
    const newBlanks: Blank[] = [...activeTemplate.blanks];

    suggestedList.forEach((s, idx) => {
      const newBlankId = `b_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`;
      const newBlank: Blank = {
        id: newBlankId,
        label: s.suggestedLabel,
        type: s.suggestedType,
        order: newBlanks.length + 1,
        required: true,
      };

      const token = `{{${newBlankId}}}`;
      currentBody = replaceAllText(currentBody, s.spanText, token);
      newBlanks.push(newBlank);
    });

    commitUpdate({ ...activeTemplate, bodyText: currentBody, blanks: newBlanks });
    setSuggestedList([]);
    setShowAutoDetectDrawer(false);
  };

  const handleTextChunkChange = (oldText: string, newText: string) => {
    if (oldText === newText) return;
    // Only run the heavy fromHumanReadableRawText pipeline (which can silently create blanks)
    // when the user actually typed something that looks like a token pattern.
    // Plain prose edits go through a simple string replacement to avoid accidental blank creation.
    const looksLikeToken = /\{\{[^}]+\}\}|\[[^\]\n]{2,}\]/.test(newText);
    if (looksLikeToken) {
      const currentHuman = toHumanReadableRawText(activeTemplate.bodyText, activeTemplate.blanks);
      const updatedHuman = replaceAllText(currentHuman, oldText, newText);
      const { updatedBodyText, updatedBlanks } = fromHumanReadableRawText(updatedHuman, activeTemplate.blanks);
      commitUpdate({ ...activeTemplate, bodyText: updatedBodyText, blanks: updatedBlanks });
    } else {
      // Simple path: replace the plain-text chunk directly in bodyText.
      const newBody = replaceAllText(activeTemplate.bodyText, oldText, newText);
      commitUpdate({ ...activeTemplate, bodyText: newBody });
    }
  };

  const renderUnifiedCanvasContent = () => {
    let body = activeTemplate.bodyText;
    if (!body) {
      return (
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const val = e.currentTarget.innerText;
            if (val) {
              const { updatedBodyText, updatedBlanks } = fromHumanReadableRawText(val, activeTemplate.blanks);
              commitUpdate({ ...activeTemplate, bodyText: updatedBodyText, blanks: updatedBlanks });
            }
          }}
          style={{ color: 'var(--text-dim)', fontStyle: 'italic', outline: 'none', display: 'inline-block', width: '100%' }}
        >
          Click here to paste or type document text... Drag fields from the right panel to insert at exact mouse drop position.
        </span>
      );
    }

    const parts: (string | React.ReactNode)[] = [];
    const regex = /\{\{(b_[a-zA-Z0-9_]+|[a-zA-Z0-9_-]+)\}\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    // slotIdx tracks how many segments we have rendered so far
    let slotIdx = 0;

    const showCaret = isDraggingToken && dropIndicatorPos >= 0;
    let caretInserted = false;

    const renderDropCaret = () => (
      <span
        key="live-drop-caret"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 4px',
          verticalAlign: 'middle',
          position: 'relative',
          zIndex: 25,
        }}
      >
        <span style={{
          width: '2px',
          height: '1.45em',
          background: 'var(--accent-primary)',
          borderRadius: '2px',
        }} />
        <span style={{
          position: 'absolute',
          top: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent-primary)',
          color: '#ffffff',
          fontSize: '0.65rem',
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          📍 Drop Field Here
        </span>
      </span>
    );



    while ((match = regex.exec(body)) !== null) {
      const matchStart = match.index;
      const blankId = match[1];

      if (matchStart > lastIndex) {
        const textChunk = body.substring(lastIndex, matchStart);
        const thisSlot = slotIdx++;

        if (showCaret && !caretInserted && dropIndicatorPos === thisSlot) {
          parts.push(renderDropCaret());
          caretInserted = true;
        }
        parts.push(
          <span key={`text-chunk-${lastIndex}`} data-slot={thisSlot}
            contentEditable suppressContentEditableWarning
            onBlur={(e) => handleTextChunkChange(textChunk, e.currentTarget.innerText)}
            style={{ outline: 'none', display: 'inline' }}
          >{textChunk}</span>
        );
      }

      const blank = activeTemplate.blanks.find(b => b.id === blankId);
      const thisSlot = slotIdx++;

      if (showCaret && !caretInserted && dropIndicatorPos === thisSlot) {
        parts.push(renderDropCaret());
        caretInserted = true;
      }

      if (blank) {
        parts.push(
          <span
            key={`chip-${blank.id}-${matchStart}`}
            className="blank-chip"
            data-blank-id={blank.id}
            data-slot={thisSlot}
            contentEditable={false}
            draggable={true}
            onMouseDown={(e) => { e.stopPropagation(); }}
            onDragStart={(e) => {
              e.stopPropagation();
              handleDragTokenStart(e, blank.label, true, blank.id);
            }}
            onDragEnd={handleDragTokenEnd}
            onClick={(e) => {
              e.stopPropagation();
              setEditingBlank(blank);
              setIsModalOpen(true);
            }}
            title="Drag to reposition chip or click to configure field properties"
            style={{ cursor: 'grab', userSelect: 'none' }}
          >
            <span>{blank.label}</span>
            <span className="blank-chip-type">{blank.type}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteBlank(blank.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                marginLeft: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              ×
            </button>
          </span>
        );
      } else {
        parts.push(
          <span key={`unknown-${matchStart}`} data-slot={thisSlot}
            style={{ outline: 'none', display: 'inline', color: 'var(--text-dim)' }}
          >[{blankId}]</span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < body.length) {
      const remainingText = body.substring(lastIndex);
      const thisSlot = slotIdx++;

      if (showCaret && !caretInserted && dropIndicatorPos === thisSlot) {
        parts.push(renderDropCaret());
        caretInserted = true;
      }
      parts.push(
        <span key="rem" data-slot={thisSlot}
          contentEditable suppressContentEditableWarning
          onBlur={(e) => handleTextChunkChange(remainingText, e.currentTarget.innerText)}
          style={{ outline: 'none', display: 'inline' }}
        >{remainingText}</span>
      );
    }

    // Append caret after last slot if needed
    if (showCaret && !caretInserted) {
      parts.push(renderDropCaret());
    }

    return parts;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px', maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      {/* Notification Toast */}
      {showSaveToast && (
        <div className="workspace-panel animate-fade-in" style={{
          position: 'fixed',
          top: '80px',
          right: '32px',
          zIndex: 100,
          background: 'var(--bg-surface-elevated)',
          borderColor: 'var(--accent-primary)',
          padding: '12px 20px',
          color: '#ffffff',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <IconCheck size={18} color="var(--accent-primary)" /> {toastMessage}
        </div>
      )}

      {/* Top Section Stack */}
      {/* Onboarding Guidance Banner */}
      {showGuideBanner && (
        <div className="workspace-panel animate-fade-in" style={{
          padding: '16px 22px',
          background: 'var(--bg-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.925rem', color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
              Workflow: Create an interactive template
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>1. Drag fields from Defined Blanks into document</span>
              <span>•</span>
              <span>2. Drag chips within document to rearrange positions</span>
              <span>•</span>
              <span>3. Click Update Template or Proceed to Fill</span>
            </div>
          </div>
          <button
            onClick={() => setShowGuideBanner(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
            title="Dismiss guide"
          >
            <IconClose size={16} />
          </button>
        </div>
      )}

      {/* Template Title & Primary Action Toolbar */}
      <div className="workspace-panel workspace-panel-hover" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            Template Title:
          </span>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={activeTemplate.name}
              onChange={handleNameChange}
              placeholder="Click to edit template title..."
              title="Click anywhere to edit template title"
              style={{
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: '1.35rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: '#ffffff',
                outline: 'none',
                width: '100%',
                letterSpacing: '-0.035em',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent-primary)';
                e.target.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'transparent';
                e.target.style.background = 'transparent';
              }}
            />
            <span style={{ marginLeft: '-28px', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <IconEdit size={16} color="var(--text-muted)" />
            </span>
          </div>

          {onOpenSamples && (
            <button
              onClick={onOpenSamples}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-subtle)',
              }}
              title="Open Template Library to select or switch templates"
            >
              Templates <IconChevronDown size={14} color="var(--text-dim)" />
            </button>
          )}
        </div>

        {/* Primary Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <button
            onClick={handleExplicitUpdateTemplate}
            className="btn-primary"
            title="Save and commit template changes"
          >
            <IconCheck size={14} /> Update Template
          </button>

          <button
            onClick={handleResetTemplate}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            }}
            title="Reset Template (Clear all text & blanks)"
          >
            <IconRefresh size={14} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 4px' }} />

          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="btn-secondary"
            title="Undo change (Ctrl+Z / Cmd+Z)"
            style={{
              opacity: canUndo ? 1 : 0.4,
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
          >
            <IconUndo size={14} /> Undo
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="btn-secondary"
            title="Redo change (Ctrl+Y / Cmd+Shift+Z)"
            style={{
              opacity: canRedo ? 1 : 0.4,
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
          >
            <IconRedo size={14} /> Redo
          </button>
        </div>
      </div>

      {/* Text Selection Floating Toolbar */}
      {selectedSpan && (
        <div className="workspace-panel animate-fade-in" style={{
          padding: '14px 22px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
            Selected text: <strong style={{ color: '#ffffff' }}>"{selectedSpan}"</strong>
          </div>
          <button
            onClick={handleMarkSelection}
            className="btn-primary"
          >
            <IconPlus size={15} /> Mark as Blank Field
          </button>
        </div>
      )}

      {/* Height-Responsive Grid Row: Single Unified Interactive Template Workspace & Defined Blanks Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px', alignItems: 'stretch' }}>
        {/* Left: Single Unified Interactive Template Workspace Card */}
        <div className="workspace-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
                Interactive Document Workspace
              </label>
            </div>

            <button
              onClick={handleRunAutoDetect}
              className="btn-secondary"
              style={{
                height: '32px',
                padding: '0 12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontWeight: 700,
              }}
            >
              <IconSparkles size={14} color="#fbbf24" /> Auto-Detect Blanks
            </button>
          </div>

          {/* Drag & Drop Point-Target Enabled Canvas Drop Zone */}
          <div
            ref={canvasRef}
            onMouseUp={handleSelectTextInVisual}
            onDragOver={handleDragOverCanvas}
            onDragLeave={handleDragLeaveCanvas}
            onDrop={handleDropOnCanvas}
            style={{
              width: '100%',
              background: isCanvasHoveredForDrop ? 'var(--bg-surface-elevated)' : 'var(--bg-dark)',
              border: isCanvasHoveredForDrop ? '2px dashed var(--accent-primary)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              color: 'var(--text-main)',
              fontSize: '1rem',
              lineHeight: 1.85,
              outline: 'none',
              minHeight: '340px',
              whiteSpace: 'pre-wrap',
              cursor: 'text',
              userSelect: 'text',
              transition: 'all 0.15s ease',
              boxShadow: 'none',
              flex: 1,
              position: 'relative',
            }}
          >
            {renderUnifiedCanvasContent()}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {isDraggingToken
                ? '📍 Live Drop Caret Active: Drop field at the glowing indicator!'
                : 'Click text to edit directly, drag chips to adjust position, or drag new fields from Defined Blanks.'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-surface-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                {activeTemplate.bodyText.length} chars
              </span>
              <span style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: 600 }}>{activeTemplate.blanks.length} fields defined</span>
            </div>
          </div>
        </div>

        {/* Right: Height-Responsive Single Source of Truth Defined Blanks Panel */}
        <div className="workspace-panel" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800 }}>
                Defined Blanks ({activeTemplate.blanks.length})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drag fields into document canvas</p>
            </div>
            <button
              onClick={() => {
                setEditingBlank(undefined);
                setSelectedSpan('');
                setIsModalOpen(true);
              }}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <IconPlus size={13} /> Add Field
            </button>
          </div>

          {/* Dynamic Flex-Scrollable List Container */}
          {activeTemplate.blanks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '44px 20px',
              background: 'var(--bg-dark)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-dim)',
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              margin: 'auto 0',
            }}>
              <div>No blank fields added yet.</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Highlight text in the canvas or click below to auto-detect fields.
              </div>
              <button
                onClick={handleRunAutoDetect}
                className="btn-secondary"
                style={{ marginTop: '8px', fontSize: '0.8rem' }}
              >
                <IconSparkles size={13} color="#fbbf24" /> Auto-Detect Blanks
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: '1 1 0%',
              minHeight: 0,
              overflowY: 'auto',
              paddingRight: '6px',
              marginBottom: '16px',
            }}>
              {activeTemplate.blanks.map((b, idx) => (
                <div
                  key={b.id}
                  draggable={true}
                  onDragStart={(e) => handleDragTokenStart(e, b.label, false, b.id)}
                  onDragEnd={handleDragTokenEnd}
                  style={{
                    background: 'var(--bg-dark)',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    cursor: 'grab',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  title="Drag and drop field onto exact document text position"
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', cursor: 'grab' }} title="Drag handle">:::</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>#{idx + 1}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ textTransform: 'capitalize', color: '#818cf8', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', padding: '1px 7px', borderRadius: '4px' }}>
                          {b.type}
                        </span>
                        {b.required && <span style={{ color: '#fbbf24', fontSize: '0.7rem' }}>Required</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        setEditingBlank(b);
                        setIsModalOpen(true);
                      }}
                      title="Configure field properties"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBlank(b.id)}
                      title="Delete field"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Single Focused Primary Action: Proceed to Fill Document */}
          <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={onProceedToFill}
              disabled={activeTemplate.blanks.length === 0}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                opacity: activeTemplate.blanks.length > 0 ? 1 : 0.4,
                cursor: activeTemplate.blanks.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Proceed to Fill Document <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Blank Modal */}
      <BlankModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBlank}
        initialBlank={editingBlank}
        selectedTextSpan={selectedSpan}
      />

      {/* Refined Auto-Detect Drawer */}
      {showAutoDetectDrawer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100,
        }}>
          <div className="workspace-panel animate-fade-in" style={{
            width: '480px',
            height: '100%',
            background: 'var(--bg-surface)',
            padding: '28px',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--border-medium)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
                  Detected Placeholder Fields ({suggestedList.length})
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Review and convert unconfigured document placeholders</p>
              </div>
              <button
                onClick={() => setShowAutoDetectDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* 1-Click Accept All Header Bar */}
            {suggestedList.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={handleAcceptAllSuggestions}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
                >
                  <IconCheck size={16} /> Accept All ({suggestedList.length}) Fields into Document
                </button>
              </div>
            )}

            {suggestedList.length === 0 ? (
              <div style={{ padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)', margin: 'auto 0' }}>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem', marginBottom: '8px' }}>
                  All placeholders configured!
                </div>
                <div>
                  No unconfigured placeholder patterns like [NAME], ___ or SCREAMING_SNAKE_CASE detected in this document.
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                  Highlight any text on the left canvas to define a custom blank field.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                {suggestedList.map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-dark)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Raw text: <code style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>"{s.spanText}"</code></span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={s.suggestedLabel}
                        onChange={(e) => handleUpdateSuggestion(i, e.target.value, s.suggestedType)}
                        className="workspace-input"
                        placeholder="Field label..."
                        style={{ padding: '8px 12px', fontSize: '0.875rem', flex: 1 }}
                      />

                      <select
                        value={s.suggestedType}
                        onChange={(e) => handleUpdateSuggestion(i, s.suggestedLabel, e.target.value as BlankType)}
                        className="workspace-input"
                        style={{ padding: '8px 12px', fontSize: '0.8125rem', width: '110px' }}
                      >
                        <option value="text">Text</option>
                        <option value="longtext">Long Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="currency">Currency</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="checkbox">Yes/No</option>
                      </select>

                      <button
                        onClick={() => handleAcceptSuggestion(s)}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        title="Accept this field"
                      >
                        <IconCheck size={14} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
