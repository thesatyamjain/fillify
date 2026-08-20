import React, { useEffect, useRef } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
    title: 'Paste Any Text',
    desc: 'Drop in any document — contracts, emails, reports, letters. Fillify keeps your formatting intact.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: 'Auto-Detect Fields',
    desc: 'One click finds placeholders like [NAME], ___, or SCREAMING_CASE and converts them into typed fields.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Wizard Fill Mode',
    desc: 'Answer one field at a time with live preview — like a conversation, not a spreadsheet.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    ),
    title: 'Copy or Download',
    desc: 'Export the finished document as plain text or copy directly to your clipboard in one click.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Fill History',
    desc: 'Every completed document is saved locally. Revisit, copy, or re-use any past fill session instantly.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Fully Local',
    desc: 'Nothing leaves your browser. No account, no cloud, no tracking — your documents stay private.',
  },
];

const STEPS = [
  { num: '01', label: 'Paste your raw text template' },
  { num: '02', label: 'Define or auto-detect blank fields' },
  { num: '03', label: 'Fill with Wizard or Form view' },
  { num: '04', label: 'Copy or download the finished document' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  // Subtle parallax-style entrance animation on the hero text
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
    }}>

      {/* ── Navbar ── */}
      <header style={{
        height: '56px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        position: 'sticky',
        top: 0,
        background: 'rgba(9,9,11,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="#2563eb"/>
            <path d="M8 11h10M8 16h6M8 21h8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="22" cy="20" r="5" fill="#1d4ed8"/>
            <path d="M20 20l1.5 1.5L24 18" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.03em' }}>
            Fillify
          </span>
        </div>

        <button
          onClick={onGetStarted}
          className="btn-primary"
          style={{ padding: '7px 18px', fontSize: '0.85rem' }}
        >
          Open App
        </button>
      </header>

      {/* ── Hero ── */}
      <section style={{
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '96px 24px 80px',
        position: 'relative',
      }}>
        {/* Background grid texture */}
        <div aria-hidden style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(var(--border-subtle) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.35,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Glow */}
        <div aria-hidden style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '320px',
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(2px)',
        }} />

        <div ref={heroRef} style={{ position: 'relative', maxWidth: '720px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 14px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#60a5fa',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            Free · Local · No account required
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.4rem, 5.5vw, 3.75rem)',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.045em',
            lineHeight: 1.08,
            marginBottom: '22px',
          }}>
            Turn any text template<br />
            into an interactive form
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            maxWidth: '52ch',
            margin: '0 auto 38px',
          }}>
            Paste a contract, letter, or report. Mark the blanks. Fill them field by field with live preview. Copy the finished document.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onGetStarted}
              className="btn-primary"
              style={{
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Get Started — it's free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>

            <button
              onClick={onGetStarted}
              className="btn-secondary"
              style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 600 }}
            >
              View sample templates
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        padding: '0 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1px',
            background: 'var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}>
            {STEPS.map((step) => (
              <div
                key={step.num}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '28px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.08em',
                }}>
                  {step.num}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{
        padding: '0 24px 100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: '960px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.03em',
              marginBottom: '12px',
            }}>
              Everything you need, nothing you don't
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Works entirely in your browser. No sign-up, no servers, no data leaves your machine.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1px',
            background: 'var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '28px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              >
                <div style={{ color: 'var(--accent-primary)', display: 'flex' }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>{f.title}</div>
                <div style={{ fontSize: '0.8375rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '38ch' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        padding: '0 24px 96px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '640px',
          width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '52px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* inner glow */}
          <div aria-hidden style={{
            position: 'absolute',
            top: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '360px',
            height: '180px',
            background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.4rem, 3vw, 1.875rem)',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            marginBottom: '14px',
          }}>
            Ready to fill your first document?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '32px', margin: '0 auto 32px' }}>
            Open a sample template or paste your own text and start in under 30 seconds.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-primary"
            style={{
              padding: '14px 36px',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Open Fillify
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: 'var(--text-dim)',
        fontSize: '0.775rem',
      }}>
        <span>Built to stay local.</span>
        <span>·</span>
        <span>No data leaves your browser.</span>
      </footer>
    </div>
  );
};
