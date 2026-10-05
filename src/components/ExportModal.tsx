import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  FileCode, 
  Archive, 
  Printer
} from 'lucide-react';
import type { Entry, AppSettings } from '../types';
import { 
  openPrintBookView, 
  exportConsolidatedMarkdown, 
  exportJSON, 
  exportZIPArchive 
} from '../lib/exportUtils';

interface ExportModalProps {
  entries: Entry[];
  settings: AppSettings;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  entries,
  settings,
  onClose,
}) => {
  const [scope, setScope] = useState<'all' | 'for_you'>('for_you');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [salutation, setSalutation] = useState(settings.partnerSalutation || 'To you, in the meantime');

  const forYouEntries = entries.filter(e => e.for_you);
  const activeEntries = scope === 'for_you' ? forYouEntries : entries;

  const handlePrintBook = () => {
    openPrintBookView(activeEntries, scope === 'for_you', salutation);
  };

  const handleMarkdown = () => {
    exportConsolidatedMarkdown(
      activeEntries,
      scope === 'for_you' ? 'In the Meantime — Letters for You' : 'In the Meantime — Archive'
    );
  };

  const handleJSON = () => {
    exportJSON(
      activeEntries,
      scope === 'for_you' ? 'in-the-meantime-for-you.json' : 'in-the-meantime-full-archive.json'
    );
  };

  const handleZip = async () => {
    setIsExportingZip(true);
    try {
      await exportZIPArchive(activeEntries, scope === 'for_you');
    } catch (err) {
      console.error('ZIP export error:', err);
      alert('Error creating ZIP archive.');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
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
        className="fade-in"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '560px',
          boxShadow: 'var(--shadow-float)',
          padding: '28px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}>
              Export Your Archive
            </h2>
            <p style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              marginTop: '4px',
            }}>
              Your words never belong to an app. Take them with you, or turn them into a book for the one you will love.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scope Selector: Curated 'For You' vs Full Archive */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '22px',
        }}>
          <label style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '8px',
          }}>
            Select what to export:
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => setScope('for_you')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: scope === 'for_you' ? 'var(--bg-card)' : 'transparent',
                border: `1px solid ${scope === 'for_you' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                textAlign: 'left',
              }}
            >
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#EC4899',
                  display: 'inline-block',
                }} />
                <span>For You ({forYouEntries.length})</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Only the curated letters you wish to give them.
              </span>
            </button>

            <button
              onClick={() => setScope('all')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: scope === 'all' ? 'var(--bg-card)' : 'transparent',
                border: `1px solid ${scope === 'all' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                textAlign: 'left',
              }}
            >
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                Complete Archive ({entries.length})
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Every single letter, thought, photo, and voice fragment.
              </span>
            </button>
          </div>

          {/* Book Salutation input */}
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Book Dedication / Salutation (printed on title page):
            </label>
            <input
              type="text"
              value={salutation}
              onChange={(e) => setSalutation(e.target.value)}
              placeholder="To you, in the meantime"
              style={{
                width: '100%',
                fontSize: '0.82rem',
                padding: '6px 8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Export Formats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Format 1: Printable Book / PDF */}
          <div
            onClick={handlePrintBook}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Printer size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Printable Book &amp; PDF
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Formatted with title page, dedication, and book typography.
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 500 }}>
              Generate
            </span>
          </div>

          {/* Format 2: ZIP Archive */}
          <div
            onClick={handleZip}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              cursor: isExportingZip ? 'default' : 'pointer',
              opacity: isExportingZip ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => !isExportingZip && (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Archive size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Complete ZIP Archive
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Includes markdown files, audio recordings, images, and JSON database.
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {isExportingZip ? 'Bundling...' : 'Download .zip'}
            </span>
          </div>

          {/* Format 3: Markdown */}
          <div
            onClick={handleMarkdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Consolidated Markdown (.md)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Single clean markdown document for Obsidian, Notion, or personal reading.
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Download .md
            </span>
          </div>

          {/* Format 4: Raw JSON */}
          <div
            onClick={handleJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FileCode size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Raw JSON Data (.json)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Lossless data export preserving all metadata and schemas.
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Download .json
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '22px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              padding: '6px 12px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
