import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { IconCheck, IconClose } from '../components/Icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastItem | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-fade-in no-print"
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            background: 'var(--bg-surface-elevated, #0f172a)',
            border: `1px solid ${
              toast.type === 'error'
                ? '#ef4444'
                : toast.type === 'info'
                ? '#3b82f6'
                : 'var(--accent-primary, #10b981)'
            }`,
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md, 8px)',
            fontWeight: 500,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {toast.type === 'error' ? (
            <span style={{ color: '#ef4444', fontWeight: 700 }}>✕</span>
          ) : toast.type === 'info' ? (
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>ℹ</span>
          ) : (
            <IconCheck size={16} color="var(--accent-primary, #10b981)" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={hideToast}
            className="icon-btn"
            style={{ width: '20px', height: '20px', marginLeft: '6px' }}
            aria-label="Dismiss alert"
          >
            <IconClose size={12} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
