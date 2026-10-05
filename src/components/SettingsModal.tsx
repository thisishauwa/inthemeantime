import React, { useState, useRef } from 'react';
import { 
  X, 
  Lock, 
  Upload, 
  Check, 
  Trash2,
  BookOpen
} from 'lucide-react';
import type { AppSettings } from '../types';
import { importEntries, resetArchiveToEmpty } from '../lib/storage';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onClose: () => void;
  onReloadEntries: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onReloadEntries,
}) => {
  const [salutation, setSalutation] = useState(settings.partnerSalutation || 'To you, in the meantime');
  const [passcodeEnabled, setPasscodeEnabled] = useState(settings.passcodeEnabled || false);
  const [passcode, setPasscode] = useState(settings.passcodeHash || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = async () => {
    const updated: AppSettings = {
      ...settings,
      partnerSalutation: salutation.trim(),
      passcodeEnabled,
      passcodeHash: passcodeEnabled ? passcode : undefined,
    };
    await onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 500);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const count = await importEntries(parsed);
          setImportCount(count);
          await onReloadEntries();
        } else {
          alert('Invalid archive format. Expected a JSON array of entries.');
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Could not parse the selected backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearArchive = async () => {
    if (window.confirm('Are you sure you want to clear your archive on this device? This cannot be undone unless you have a backup.')) {
      await resetArchiveToEmpty();
      await onReloadEntries();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          padding: '28px 30px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #ECEFF1',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.02em',
            }}>
              Settings
            </h2>
            <p style={{
              fontSize: '0.82rem',
              color: '#6B7280',
              marginTop: '3px',
            }}>
              Personalize your archive and manage local data.
            </p>
          </div>

          <button 
            onClick={onClose} 
            style={{ 
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6B7280',
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#E5E7EB')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#F3F4F6')}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Setting 1: Book Salutation / Dedication */}
        <div style={{
          background: '#F9FAFB',
          borderRadius: '16px',
          padding: '16px 18px',
          border: '1px solid #F0F0F2',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} style={{ color: '#5C59ED' }} />
            <label style={{ fontSize: '0.86rem', fontWeight: 600, color: '#111827' }}>
              Printable Book Dedication
            </label>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.4 }}>
            The opening dedication line printed on your exported letters book.
          </p>
          <input
            type="text"
            value={salutation}
            onChange={(e) => setSalutation(e.target.value)}
            placeholder="To you, in the meantime"
            style={{
              width: '100%',
              fontSize: '0.88rem',
              padding: '10px 14px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              color: '#111827',
              marginTop: '4px',
            }}
          />
        </div>

        {/* Setting 2: Passcode Lock */}
        <div style={{
          background: '#F9FAFB',
          borderRadius: '16px',
          padding: '16px 18px',
          border: '1px solid #F0F0F2',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} style={{ color: '#5C59ED' }} />
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#111827' }}>
                  Passcode Lock
                </div>
                <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
                  Require a PIN on this device to open your archive
                </div>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => setPasscodeEnabled(!passcodeEnabled)}
              style={{
                width: '42px',
                height: '24px',
                borderRadius: '999px',
                background: passcodeEnabled ? '#5C59ED' : '#D1D5DB',
                position: 'relative',
                transition: 'background 0.2s ease',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: passcodeEnabled ? '20px' : '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  transition: 'left 0.2s ease',
                }}
              />
            </button>
          </div>

          {passcodeEnabled && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #ECEFF1',
            }}>
              <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                4-digit PIN code:
              </span>
              <input
                type="password"
                maxLength={6}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••"
                style={{
                  width: '100px',
                  fontSize: '1rem',
                  letterSpacing: '0.25em',
                  padding: '6px 10px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#111827',
                }}
              />
            </div>
          )}
        </div>

        {/* Setting 3: Restore / Import Backup */}
        <div style={{
          background: '#F9FAFB',
          borderRadius: '16px',
          padding: '16px 18px',
          border: '1px solid #F0F0F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#111827' }}>
              Restore Archive
            </div>
            <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
              Import previously exported JSON backup
            </div>
          </div>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportJSON}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <Upload size={14} />
            <span>Import JSON</span>
          </button>
        </div>

        {importCount !== null && (
          <div style={{
            fontSize: '0.8rem',
            color: '#059669',
            background: '#ECFDF5',
            padding: '8px 12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Check size={14} />
            <span>Successfully restored {importCount} letters into your archive.</span>
          </div>
        )}

        {/* Reset / Danger Option */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 4px 0 4px',
        }}>
          <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
            Device memory
          </span>
          <button
            onClick={handleClearArchive}
            style={{
              fontSize: '0.78rem',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: '4px 6px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            <Trash2 size={13} />
            <span>Reset device archive</span>
          </button>
        </div>

        {/* Footer actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '8px',
          borderTop: '1px solid #ECEFF1',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              color: '#6B7280',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 20px',
              borderRadius: '999px',
              background: '#5C59ED',
              color: '#FFFFFF',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#4E4CE6')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#5C59ED')}
          >
            {saveSuccess ? (
              <>
                <Check size={15} />
                <span>Saved</span>
              </>
            ) : (
              <span>Save settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
