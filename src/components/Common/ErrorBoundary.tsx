import { Component, ErrorInfo, ReactNode } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showResetConfirm: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showResetConfirm: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('Fillify Root ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetStorage = (): void => {
    this.setState({ showResetConfirm: true });
  };

  executeResetStorage = (): void => {
    try {
      localStorage.removeItem('fillify_current_template_id_v3');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  handleDownloadDiagnostics = (): void => {
    const report = [
      `FILLIFY DIAGNOSTIC REPORT`,
      `Generated: ${new Date().toISOString()}`,
      `Error Message: ${this.state.error?.message || 'Unknown error'}`,
      `\nStack Trace:\n${this.state.error?.stack || 'None'}`,
      `\nComponent Stack:\n${this.state.errorInfo?.componentStack || 'None'}`,
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fillify_crash_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark, #060911)',
            color: 'var(--text-main, #f8fafc)',
            padding: '24px',
            fontFamily: 'var(--font-body, system-ui, sans-serif)',
          }}
        >
          <div
            className="workspace-panel"
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: '36px',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--bg-surface-elevated, #0c1220)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#ef4444',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                Runtime Fault Protected
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading, inherit)',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  color: '#ffffff',
                }}
              >
                An unexpected interface error occurred
              </h1>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-muted, #94a3b8)',
                  marginTop: '8px',
                  lineHeight: 1.6,
                }}
              >
                The application encountered an unhandled exception while processing document state. No templates were deleted.
              </p>
            </div>

            {/* Error Message Box */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle, #1e293b)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: '14px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8rem',
                color: '#fca5a5',
                overflowX: 'auto',
                maxHeight: '160px',
              }}
            >
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            {/* Recovery Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                marginTop: '6px',
              }}
            >
              <button
                onClick={this.handleReload}
                className="btn-primary"
                style={{ flex: 1, minWidth: '140px', height: '36px' }}
              >
                Reload Workspace
              </button>
              <button
                onClick={this.handleResetStorage}
                className="btn-secondary"
                style={{ height: '36px' }}
                title="Clears pointer to corrupted template"
              >
                Reset Session State
              </button>
              <button
                onClick={this.handleDownloadDiagnostics}
                className="btn-secondary"
                style={{ height: '36px' }}
              >
                Download Diagnostics
              </button>
            </div>

            <ConfirmModal
              isOpen={this.state.showResetConfirm}
              onClose={() => this.setState({ showResetConfirm: false })}
              onConfirm={this.executeResetStorage}
              title="Reset Session State?"
              message="Resetting will clear locally cached template session pointers and reload the application. Your saved templates and filled documents remain intact. Continue?"
              confirmLabel="Reset & Reload"
              variant="warning"
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
