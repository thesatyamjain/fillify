import React, { useRef, useEffect } from 'react';
import { useModalDismiss } from '../../utils/useModalDismiss';
import { IconAlertTriangle, IconClose } from '../Icons';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'neutral';
  itemPreview?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  itemPreview,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  useModalDismiss(isOpen, onClose);

  // Focus cancel button on mount to avoid accidental confirmation on Enter
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const badgeColor = isDanger ? '#ef4444' : '#f59e0b';
  const badgeBg = isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)';
  const badgeBorder = isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
    >
      <div
        className="workspace-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header with Alert Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: badgeBg,
                border: `1px solid ${badgeBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: badgeColor,
                flexShrink: 0,
              }}
            >
              <IconAlertTriangle size={18} color={badgeColor} />
            </div>
            <div>
              <h3
                id="confirm-modal-title"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-btn"
            style={{ width: '28px', height: '28px' }}
            title="Cancel and close"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Message Body */}
        <div
          id="confirm-modal-desc"
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          {typeof message === 'string' ? <p style={{ margin: 0 }}>{message}</p> : message}
        </div>

        {/* Optional Item Highlight Box */}
        {itemPreview && (
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-mono)',
              wordBreak: 'break-all',
            }}
          >
            {itemPreview}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            marginTop: '6px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ minWidth: '84px', justifyContent: 'center' }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn-primary"
            style={{
              background: isDanger ? '#ef4444' : '#f59e0b',
              borderColor: isDanger ? '#dc2626' : '#d97706',
              color: '#ffffff',
              minWidth: '100px',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
