import React from 'react';

export const LoadingSkeleton: React.FC<{ label?: string }> = ({ label = 'Loading workspace...' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        color: 'var(--text-muted, #94a3b8)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: 'var(--accent-primary, #10b981)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono, monospace)' }}>
        {label}
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
