import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Delete } from 'lucide-react';

interface PasscodeLockProps {
  correctPasscode?: string;
  isOpen: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

export const PasscodeLock: React.FC<PasscodeLockProps> = ({
  correctPasscode = '1805',
  isOpen,
  onUnlock,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPasscode) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
          inputRef.current?.focus();
        }, 800);
      }
    }
  }, [pin, correctPasscode, onUnlock]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !error) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !error) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        userSelect: 'none',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
          padding: '32px 28px 28px 28px',
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: error ? 'shake 0.4s ease' : 'none',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#111827')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#9CA3AF')}
        >
          <X size={18} />
        </button>

        {/* Lock Icon */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: error ? '#FEE2E2' : '#F0F0F0',
            color: error ? '#DC2626' : '#5C59ED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            transition: 'all 0.2s ease',
          }}
        >
          <Lock size={22} />
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#080808',
            letterSpacing: '-0.02em',
            marginBottom: '6px',
          }}
        >
          Private Letters Archive
        </h3>

        <p
          style={{
            fontSize: '0.84rem',
            color: '#595959',
            lineHeight: 1.5,
            marginBottom: '24px',
            maxWidth: '260px',
          }}
        >
          This archive is protected. Enter the 4-digit code to view letters.
        </p>

        {/* Hidden keyboard input for accessibility and physical typing */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(val);
          }}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            top: 0,
            left: 0,
          }}
        />

        {/* 4 Dot Indicators */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: error ? '10px' : '26px',
            cursor: 'text',
          }}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  border: error
                    ? '2px solid #DC2626'
                    : isFilled
                    ? '2px solid #5C59ED'
                    : '2px solid #D1D5DB',
                  background: error
                    ? '#DC2626'
                    : isFilled
                    ? '#5C59ED'
                    : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <p
            style={{
              fontSize: '0.78rem',
              color: '#DC2626',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            Incorrect code. Access denied.
          </p>
        )}

        {/* Numeric Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            width: '100%',
            maxWidth: '240px',
            marginBottom: '10px',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              style={{
                height: '48px',
                borderRadius: '50%',
                background: '#F9FAFB',
                border: '1px solid #F0F0F0',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.12s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#E5E7EB')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#F9FAFB')}
            >
              {digit}
            </button>
          ))}

          {/* Blank or Cancel */}
          <button
            type="button"
            onClick={onClose}
            style={{
              height: '48px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              fontSize: '0.78rem',
              color: '#6B7280',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          {/* 0 */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            style={{
              height: '48px',
              borderRadius: '50%',
              background: '#F9FAFB',
              border: '1px solid #F0F0F0',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.12s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#E5E7EB')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#F9FAFB')}
          >
            0
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            style={{
              height: '48px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#6B7280')}
            title="Delete"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
