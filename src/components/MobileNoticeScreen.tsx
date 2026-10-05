import React from 'react';
import { Laptop } from 'lucide-react';

export const MobileNoticeScreen: React.FC = () => {
  return (
    <div
      className="mobile-notice-container"
      style={{
        width: '100vw',
        height: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        boxSizing: 'border-box',
        textAlign: 'center',
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        userSelect: 'none',
      }}
    >
      {/* Brand Header: In the Meantime (Clean text, no circular logo) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#080808',
            letterSpacing: '-0.02em',
          }}
        >
          In the Meantime
        </h1>
        <span
          style={{
            fontSize: '0.78rem',
            color: '#8C8C8C',
            fontWeight: 400,
            marginTop: '3px',
          }}
        >
          letters &amp; fragments for one day
        </span>
      </div>

      {/* Primary Headline matching Posthearts */}
      <h2
        style={{
          fontSize: '1.65rem',
          fontWeight: 700,
          color: '#080808',
          letterSpacing: '-0.025em',
          maxWidth: '360px',
          marginTop: '32px',
          marginBottom: '14px',
          lineHeight: 1.25,
        }}
      >
        Write your letter from a laptop for now.
      </h2>

      {/* Body text explaining desktop requirement */}
      <p
        style={{
          fontSize: '0.94rem',
          color: '#595959',
          lineHeight: 1.65,
          maxWidth: '330px',
          margin: '0 auto',
        }}
      >
        We&apos;re still working on making In the Meantime mobile-ready, but your words can shine beautifully from a laptop. Open this link on your computer to write, format, and archive your letters.
      </p>

      {/* Pill Badge */}
      <div
        style={{
          marginTop: '36px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          borderRadius: '999px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          fontSize: '0.82rem',
          fontWeight: 500,
          color: '#374151',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Laptop size={16} style={{ color: '#5C59ED' }} />
        <span>Designed for larger screens</span>
      </div>
    </div>
  );
};
