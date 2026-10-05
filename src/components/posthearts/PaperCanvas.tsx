import React, { useState, useRef, useEffect } from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ChevronDown, 
  Trash2,
  Volume2
} from 'lucide-react';
import { BACKDROP_COLORS, FONTS } from './stickerData';
import type { Entry } from '../../types';

interface PaperCanvasProps {
  entry: Entry;
  onUpdateEntry: (updated: Entry) => void;
  onExport: (format: 'png' | 'pdf' | 'zip' | 'md' | 'json') => void;
  onOpenDownloadModal?: () => void;
}

export const PaperCanvas: React.FC<PaperCanvasProps> = ({
  entry,
  onUpdateEntry,
  onExport,
  onOpenDownloadModal,
}) => {
  const [activePopover, setActivePopover] = useState<'color' | 'align' | 'font' | 'download' | null>(null);
  const [scale, setScale] = useState<'1x' | '2x' | '3x'>('3x');
  const paperRef = useRef<HTMLDivElement | null>(null);

  const backdropColor = entry.backdrop_color || '#237A57';
  const fontFamily = entry.font_family || 'Schoolbell';
  const textAlign = entry.text_align || 'left';
  const photos = entry.photos || [];

  // Close popovers on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.posthearts-topbar')) {
        setActivePopover(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const togglePopover = (name: 'color' | 'align' | 'font' | 'download') => {
    setActivePopover(prev => (prev === name ? null : name));
  };

  const handleRemovePhoto = (photoId: string) => {
    const updated = photos.filter(p => p.id !== photoId);
    onUpdateEntry({ ...entry, photos: updated });
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: '24px',
      background: backdropColor,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'none',
      border: 'none',
      transition: 'background-color 0.3s ease',
    }}>
      {/* Top Floating Toolbar (Color, Align, Font, Scale, Download) */}
      <div 
        className="posthearts-topbar" 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          zIndex: 30,
        }}
      >
        {/* Backdrop color circle with extended 12 rich colors palette */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => togglePopover('color')}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: backdropColor,
              border: '2px solid #FFFFFF',
              display: 'block',
              cursor: 'pointer',
            }}
            title="Choose canvas background color"
          />

          {activePopover === 'color' && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 14px)',
              left: 0,
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '10px 12px',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: 'none',
              zIndex: 50,
              width: '286px',
            }}>
              {BACKDROP_COLORS.map(c => {
                const isSelected = backdropColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    onClick={() => {
                      onUpdateEntry({ ...entry, backdrop_color: c.hex });
                      setActivePopover(null);
                    }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: c.hex,
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      padding: 0,
                      outline: 'none',
                    }}
                    title={c.name}
                  >
                    {isSelected && (
                      <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Text Alignment */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => togglePopover('align')}
            style={{
              padding: '6px 8px',
              color: '#374151',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Text Alignment"
          >
            {textAlign === 'left' && <AlignLeft size={16} />}
            {textAlign === 'center' && <AlignCenter size={16} />}
            {textAlign === 'right' && <AlignRight size={16} />}
          </button>

          {activePopover === 'align' && (
            <div 
              className="alignment-subpill"
              style={{
                top: 'calc(100% + 14px)',
              }}
            >
              <button
                className={textAlign === 'left' ? 'active-align' : ''}
                onClick={() => {
                  onUpdateEntry({ ...entry, text_align: 'left' });
                  setActivePopover(null);
                }}
              >
                <AlignLeft size={14} />
              </button>
              <button
                className={textAlign === 'center' ? 'active-align' : ''}
                onClick={() => {
                  onUpdateEntry({ ...entry, text_align: 'center' });
                  setActivePopover(null);
                }}
              >
                <AlignCenter size={14} />
              </button>
              <button
                className={textAlign === 'right' ? 'active-align' : ''}
                onClick={() => {
                  onUpdateEntry({ ...entry, text_align: 'right' });
                  setActivePopover(null);
                }}
              >
                <AlignRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Font dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => togglePopover('font')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '999px',
              background: '#F3F4F6',
              fontSize: '0.82rem',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            <span style={{ maxWidth: '78px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fontFamily}
            </span>
            <ChevronDown size={13} />
          </button>

          {activePopover === 'font' && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 14px)',
              left: 0,
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '6px',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: 'none',
              zIndex: 50,
              minWidth: '155px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    onUpdateEntry({ ...entry, font_family: f.id });
                    setActivePopover(null);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    fontFamily: f.id,
                    background: fontFamily === f.id ? '#F3F4F6' : 'transparent',
                    color: '#111827',
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scale toggle */}
        <button
          onClick={() => {
            const next = scale === '1x' ? '2x' : scale === '2x' ? '3x' : '1x';
            setScale(next);
          }}
          style={{
            padding: '5px 10px',
            borderRadius: '999px',
            background: '#F3F4F6',
            fontSize: '0.8rem',
            color: '#374151',
            fontWeight: 500,
          }}
          title="Zoom Scale"
        >
          {scale}
        </button>

        {/* Download Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              if (onOpenDownloadModal) {
                onOpenDownloadModal();
              } else {
                togglePopover('download');
              }
            }}
            className="topbar-primary-btn"
          >
            <span>Download</span>
            <ChevronDown size={13} />
          </button>

          {activePopover === 'download' && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 14px)',
              right: 0,
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '6px',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: 'none',
              zIndex: 50,
              minWidth: '190px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}>
              <button
                onClick={() => {
                  onExport('pdf');
                  setActivePopover(null);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#111827',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>📖 Printable Book &amp; PDF</span>
              </button>

              <button
                onClick={() => {
                  onExport('zip');
                  setActivePopover(null);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#111827',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>📦 Complete ZIP Archive</span>
              </button>

              <button
                onClick={() => {
                  onExport('md');
                  setActivePopover(null);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#111827',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>📄 Markdown Book (.md)</span>
              </button>

              <button
                onClick={() => {
                  onExport('json');
                  setActivePopover(null);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#111827',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>🗄️ Raw Data (.json)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The Authentic A4 Creased Paper Sheet with Subtle Tilt */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        overflow: 'hidden',
        paddingTop: '36px',
      }}>
        <div
          ref={paperRef}
          className="a4-paper-sheet"
          style={{
            fontFamily,
            textAlign,
            fontSize: '1.22rem',
            lineHeight: 1.75,
            color: '#1F2937',
            transform: scale === '1x' ? 'scale(0.88) rotate(-1.5deg)' : scale === '2x' ? 'scale(0.96) rotate(-1.5deg)' : 'scale(1) rotate(-1.5deg)',
          }}
        >
          {/* Main letter body text directly rendered on paper */}
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              onUpdateEntry({ ...entry, body: e.currentTarget.innerText });
            }}
            style={{
              minHeight: '260px',
              outline: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {entry.body || "today i wished you were in the passenger seat."}
          </div>

          {/* Attached Audio Voice Note on Paper */}
          {entry.attachments?.some(a => a.type === 'audio') && (
            <div style={{
              margin: '18px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Volume2 size={16} style={{ color: '#5C59ED' }} />
              <div style={{ flex: 1 }}>
                {entry.attachments.filter(a => a.type === 'audio').map(aud => (
                  <audio key={aud.id} controls src={aud.file_url} style={{ width: '100%', height: '32px' }} />
                ))}
              </div>
            </div>
          )}

          {/* Photos CELLOTAPED to the Paper! */}
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="cellotaped-photo"
              style={{
                transform: `rotate(${photo.rotate || -1.5}deg)`,
              }}
            >
              {/* Frosted Cellotape Strips */}
              <div className="cellotape-strip-top" />
              <div className="cellotape-strip-corner" />

              <img src={photo.url} alt="Cellotaped memory" />

              <button
                onClick={() => handleRemovePhoto(photo.id)}
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#FFF',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                }}
                title="Remove photo"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
