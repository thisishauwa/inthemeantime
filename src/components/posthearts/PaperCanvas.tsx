import React, { useState, useRef, useEffect } from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ChevronDown, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { BACKDROP_COLORS, FONTS } from './stickerData';
import { HumanVoiceNotePlayer } from './HumanVoiceNotePlayer';
import { splitLetterIntoPages, updateLetterPage, addNewPageToLetter } from '../../lib/pagination';
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
  const [scale, setScale] = useState<'1x' | '2x' | '3x'>('2x');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward' | null>(null);
  const paperRef = useRef<HTMLDivElement | null>(null);

  const backdropColor = entry.backdrop_color || '#237A57';
  const fontFamily = entry.font_family || 'Schoolbell';
  const textAlign = entry.text_align || 'left';
  const photos = entry.photos || [];
  const hasAttachments = photos.length > 0 || (entry.attachments || []).some(a => a.type === 'audio');
  const [pageCapacity, setPageCapacity] = useState<{ cleanLines: number; attachmentLines: number }>({
    cleanLines: 16,
    attachmentLines: 10,
  });

  // Dynamically calculate the exact amount of lines that fit the stationery sheet
  useEffect(() => {
    const calculateCapacity = () => {
      if (!paperRef.current) return;
      const sheetHeight = paperRef.current.clientHeight;
      if (sheetHeight <= 0) return;

      const computed = window.getComputedStyle(paperRef.current);
      const lineHeight = parseFloat(computed.lineHeight) || 30.6;

      // Overhead: top padding (36px) + bottom padding (32px) + date header (~30px) + safety margin (10px)
      const overhead = 36 + 32 + 30 + 10;
      const usableHeight = sheetHeight - overhead;

      // Exact integer lines that fit completely inside the sheet without cutting off
      const cleanLines = Math.max(10, Math.floor(usableHeight / lineHeight));
      const attachmentLines = Math.max(6, Math.floor((usableHeight - 150) / lineHeight));

      setPageCapacity((prev) => {
        if (prev.cleanLines === cleanLines && prev.attachmentLines === attachmentLines) return prev;
        return { cleanLines, attachmentLines };
      });
    };

    calculateCapacity();
    window.addEventListener('resize', calculateCapacity);

    let observer: ResizeObserver | null = null;
    if (paperRef.current && typeof window.ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(calculateCapacity);
      observer.observe(paperRef.current);
    }

    return () => {
      window.removeEventListener('resize', calculateCapacity);
      observer?.disconnect();
    };
  }, [scale, fontFamily]);

  const pages = splitLetterIntoPages(entry.body, hasAttachments, pageCapacity.cleanLines, pageCapacity.attachmentLines);
  const pageCount = pages.length;

  // Clamp current page index if pages array changes
  useEffect(() => {
    if (currentPageIndex >= pageCount) {
      setCurrentPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageCount, currentPageIndex]);

  // Reset to first page when active letter changes
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [entry.id]);

  const handlePageTurn = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= pageCount) return;
    setFlipDirection(newIndex > currentPageIndex ? 'forward' : 'backward');
    setCurrentPageIndex(newIndex);
    setTimeout(() => setFlipDirection(null), 320);
  };

  const handleAddPage = () => {
    const { updatedBody, newPageIndex } = addNewPageToLetter(
      entry.body,
      hasAttachments,
      pageCapacity.cleanLines,
      pageCapacity.attachmentLines
    );
    onUpdateEntry({ ...entry, body: updatedBody });
    handlePageTurn(newPageIndex);
  };

  const formatDateLabel = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

      {/* The Authentic A4 Creased Paper Sheet Stack with Subtle Tilt */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        height: '100%',
        overflow: 'hidden',
        padding: '52px 14px 48px 14px',
        position: 'relative',
        boxSizing: 'border-box',
      }}>
        <div
          className="paper-stack-wrapper"
          style={{
            transform:
              scale === '1x'
                ? 'scale(0.82)'
                : scale === '2x'
                ? 'scale(0.92)'
                : 'scale(1)',
            transformOrigin: 'center center',
          }}
        >
          {/* Underlying stacked paper sheets when letter has multiple pages */}
          {pageCount >= 3 && <div className="a4-paper-underlay-2" />}
          {pageCount >= 2 && <div className="a4-paper-underlay-1" />}

          <div
            ref={paperRef}
            className={`a4-paper-sheet ${
              flipDirection === 'forward'
                ? 'paper-flip-forward'
                : flipDirection === 'backward'
                ? 'paper-flip-backward'
                : ''
            }`}
            style={{
              fontFamily,
              textAlign,
              fontSize: scale === '1x' ? '1.05rem' : scale === '2x' ? '1.14rem' : '1.22rem',
              lineHeight: 1.68,
              color: '#1F2937',
              transform: 'rotate(-1.5deg)',
              zIndex: 2,
            }}
          >
            {/* Header: Date and Page Number */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                fontSize: '0.82rem',
                color: '#8C8C8C',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.02em',
                userSelect: 'none',
              }}
            >
              <span>{formatDateLabel(entry.entry_date)}</span>
              {currentPageIndex > 0 && (
                <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#8C8C8C', fontSize: '0.8rem' }}>
                  (continued)
                </span>
              )}
            </div>

            {/* Letter body text for the current page */}
            <div
              contentEditable
              suppressContentEditableWarning
              key={`page-content-${currentPageIndex}`}
              onBlur={(e) => {
                const updated = updateLetterPage(
                  entry.body,
                  currentPageIndex,
                  e.currentTarget.innerText,
                  hasAttachments,
                  pageCapacity.cleanLines,
                  pageCapacity.attachmentLines
                );
                onUpdateEntry({ ...entry, body: updated });
              }}
              style={{
                minHeight: currentPageIndex === 0 ? '160px' : '260px',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {pages[currentPageIndex] || ''}
            </div>

            {/* Attached Human Voice Notes on Paper (Rendered on Page 1) */}
            {currentPageIndex === 0 && entry.attachments?.some((a) => a.type === 'audio') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
                {entry.attachments
                  .filter((a) => a.type === 'audio')
                  .map((aud) => (
                    <HumanVoiceNotePlayer
                      key={aud.id}
                      id={aud.id}
                      url={aud.file_url}
                      duration={aud.duration}
                      onDelete={() => {
                        const filtered = (entry.attachments || []).filter((a) => a.id !== aud.id);
                        onUpdateEntry({ ...entry, attachments: filtered });
                      }}
                    />
                  ))}
              </div>
            )}

            {/* Photos CELLOTAPED to the Paper! (Rendered on Page 1) */}
            {currentPageIndex === 0 && photos.length > 0 && (
              <div
                className={`letter-scrapbook-gallery photos-count-${Math.min(photos.length, 4)}`}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: photos.length === 1 ? '0' : photos.length === 2 ? '14px' : '10px',
                  margin: '18px auto 8px auto',
                  width: '100%',
                  maxWidth: '460px',
                }}
              >
                {photos.map((photo, idx) => {
                  const photoWidth =
                    photos.length === 1
                      ? '220px'
                      : photos.length === 2
                      ? '185px'
                      : photos.length === 3
                      ? '138px'
                      : '142px';

                  const naturalRotations = [-2.5, 2, -1.8, 2.5, -2, 1.5];
                  const rotation = photo.rotate || naturalRotations[idx % naturalRotations.length];

                  return (
                    <div
                      key={photo.id}
                      className="cellotaped-photo"
                      style={{
                        width: photoWidth,
                        maxWidth: '100%',
                        margin: '4px',
                        transform: `rotate(${rotation}deg)`,
                        flexShrink: 0,
                      }}
                    >
                      <div className="cellotape-strip-top" />
                      <div className="cellotape-strip-corner" />

                      <img
                        src={photo.url}
                        alt="Cellotaped memory"
                        style={{
                          width: '100%',
                          height: photos.length === 1 ? '150px' : photos.length === 2 ? '130px' : '105px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

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
                          cursor: 'pointer',
                          border: 'none',
                        }}
                        title="Remove photo"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Pagination Pill (visible when multiple pages exist) */}
      {pageCount > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '18px',
            zIndex: 35,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(10px)',
            padding: '7px 18px',
            borderRadius: '999px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            userSelect: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => handlePageTurn(currentPageIndex - 1)}
            disabled={currentPageIndex === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentPageIndex === 0 ? '#CBD5E1' : '#374151',
              cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              transition: 'color 0.1s ease',
            }}
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#1F2937',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Page {currentPageIndex + 1} of {pageCount}
          </span>

          <button
            type="button"
            onClick={() => handlePageTurn(currentPageIndex + 1)}
            disabled={currentPageIndex === pageCount - 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentPageIndex === pageCount - 1 ? '#CBD5E1' : '#374151',
              cursor: currentPageIndex === pageCount - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              transition: 'color 0.1s ease',
            }}
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>

          <div style={{ width: '1px', height: '14px', background: '#E5E7EB', margin: '0 2px' }} />

          <button
            type="button"
            onClick={handleAddPage}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#4B5563',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '2px 4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4B5563')}
            title="Add a new sheet of stationery"
          >
            <Plus size={12} />
            <span>New page</span>
          </button>
        </div>
      )}
    </div>
  );
};
