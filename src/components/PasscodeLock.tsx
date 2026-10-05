import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface PasscodeLockProps {
  correctPasscode: string;
  onUnlock: () => void;
}

export const PasscodeLock: React.FC<PasscodeLockProps> = ({ correctPasscode, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPasscode) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '320px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
        }}>
          <Lock size={20} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem',
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}>
          In the Meantime
        </h1>

        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          marginBottom: '24px',
        }}>
          A quiet, private space. Enter passcode to open archive.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            autoFocus
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            style={{
              width: '140px',
              fontSize: '1.4rem',
              letterSpacing: '0.4em',
              textAlign: 'center',
              padding: '10px',
              background: 'var(--bg-secondary)',
              border: `1px solid ${error ? '#B43C3C' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}
          />

          {error && (
            <div style={{
              fontSize: '0.75rem',
              color: '#B43C3C',
              fontStyle: 'italic',
              marginBottom: '12px',
            }}>
              Incorrect passcode
            </div>
          )}

          <div>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: '#FFF',
                fontSize: '0.84rem',
                fontWeight: 500,
              }}
            >
              <span>Open Archive</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
