import React, { useState, useMemo } from 'react';
import { X, FileText, Image as ImageIcon, Printer, Archive, Loader2 } from 'lucide-react';
import type { Entry } from '../../types';
import { downloadVisualPDF, downloadVisualImagesZip, openVisualPrintBook } from '../../lib/visualExport';
import { exportZIPArchive } from '../../lib/exportUtils';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  activeEntryId: string | null;
}

type TimeframeMode = 'all' | 'current' | 'date-range' | 'letter-range';
type ExportFormat = 'visual-pdf' | 'images-zip' | 'print-window' | 'markdown-zip';

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  entries,
  activeEntryId,
}) => {
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'for_you' | 'for_them'>('all');

  // Sorted entries chronologically
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  }, [entries]);

  // Default dates
  const minDate = sortedEntries.length > 0 ? sortedEntries[0].entry_date.slice(0, 10) : '';
  const maxDate = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].entry_date.slice(0, 10) : '';

  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(maxDate);

  const [fromLetterId, setFromLetterId] = useState<string>(sortedEntries[0]?.id || '');
  const [toLetterId, setToLetterId] = useState<string>(sortedEntries[sortedEntries.length - 1]?.id || '');

  const [format, setFormat] = useState<ExportFormat>('visual-pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');

  // Filter entries based on timeframe
  const selectedEntries = useMemo(() => {
    let result: Entry[] = [];

    if (timeframeMode === 'all') {
      result = sortedEntries;
    } else if (timeframeMode === 'current') {
      const current = sortedEntries.find((e) => e.id === activeEntryId);
      result = current ? [current] : sortedEntries.slice(0, 1);
    } else if (timeframeMode === 'date-range') {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();
      result = sortedEntries.filter((e) => {
        const time = new Date(e.entry_date).getTime();
        return (!startDate || time >= start) && (!endDate || time <= end);
      });
    } else if (timeframeMode === 'letter-range') {
      const fromIdx = sortedEntries.findIndex((e) => e.id === fromLetterId);
      const toIdx = sortedEntries.findIndex((e) => e.id === toLetterId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const startIdx = Math.min(fromIdx, toIdx);
        const endIdx = Math.max(fromIdx, toIdx);
        result = sortedEntries.slice(startIdx, endIdx + 1);
      } else {
        result = sortedEntries;
      }
    }

    if (audienceFilter === 'for_you') {
      result = result.filter((e) => e.for_you);
    } else if (audienceFilter === 'for_them') {
      result = result.filter((e) => Boolean(e.for_them || e.tags?.includes('For Them')));
    }

    return result;
  }, [timeframeMode, sortedEntries, activeEntryId, startDate, endDate, fromLetterId, toLetterId, audienceFilter]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (selectedEntries.length === 0) return;
    setIsExporting(true);

    try {
      if (format === 'visual-pdf') {
        await downloadVisualPDF(selectedEntries, (p) => {
          setProgressStatus(p.status);
        });
      } else if (format === 'images-zip') {
        await downloadVisualImagesZip(selectedEntries, (p) => {
          setProgressStatus(p.status);
        });
      } else if (format === 'print-window') {
        openVisualPrintBook(selectedEntries);
      } else if (format === 'markdown-zip') {
        await exportZIPArchive(selectedEntries, audienceFilter === 'for_you');
      }
      setTimeout(() => {
        setIsExporting(false);
        setProgressStatus('');
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export error:', err);
      alert('An error occurred during download. Please try again.');
      setIsExporting(false);
      setProgressStatus('');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 24px 18px 24px',
            borderBottom: '1px solid #F0F0F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#080808',
                letterSpacing: '-0.02em',
              }}
            >
              Download Letters
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#595959', marginTop: '4px' }}>
              Export with exact colored background canvas &amp; authentic paper look
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
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              transition: 'background 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '70vh' }}>
          {/* Section 1: Choose Timeframe / Scope */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#080808', marginBottom: '10px' }}>
              Choose Timeframe / Letters
            </label>

            {/* Segmented Mode Selector */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                background: '#F0F0F0',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '14px',
              }}
            >
              {[
                { id: 'all', label: 'All Letters' },
                { id: 'current', label: 'Current' },
                { id: 'date-range', label: 'Date Range' },
                { id: 'letter-range', label: 'By Letters' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeframeMode(tab.id as TimeframeMode)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: timeframeMode === tab.id ? 600 : 400,
                    color: timeframeMode === tab.id ? '#080808' : '#595959',
                    background: timeframeMode === tab.id ? '#FFFFFF' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: timeframeMode === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-inputs for Date Range */}
            {timeframeMode === 'date-range' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #ECEFF1',
                  marginBottom: '12px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.84rem',
                      background: '#FFFFFF',
                      color: '#111827',
                    }}
                  />
                </div>

                <span style={{ color: '#9CA3AF', marginTop: '16px' }}>&rarr;</span>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.84rem',
                      background: '#FFFFFF',
                      color: '#111827',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sub-inputs for Letter Range */}
            {timeframeMode === 'letter-range' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  border: '1px solid #ECEFF1',
                  marginBottom: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>
                    From Letter
                  </label>
                  <select
                    value={fromLetterId}
                    onChange={(e) => setFromLetterId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.82rem',
                      background: '#FFFFFF',
                      color: '#111827',
                    }}
                  >
                    {sortedEntries.map((e, idx) => (
                      <option key={e.id} value={e.id}>
                        {idx + 1}. {e.title || 'Untitled'} ({e.entry_date.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>

                <span style={{ color: '#9CA3AF', marginTop: '16px' }}>&rarr;</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>
                    To Letter
                  </label>
                  <select
                    value={toLetterId}
                    onChange={(e) => setToLetterId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.82rem',
                      background: '#FFFFFF',
                      color: '#111827',
                    }}
                  >
                    {sortedEntries.map((e, idx) => (
                      <option key={e.id} value={e.id}>
                        {idx + 1}. {e.title || 'Untitled'} ({e.entry_date.slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Filter Toggle: Audience Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>
                  Audience Filter
                </span>
                {/* Counter Badge */}
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: selectedEntries.length > 0 ? '#E0E7FF' : '#FEE2E2',
                    color: selectedEntries.length > 0 ? '#3730A3' : '#991B1B',
                  }}
                >
                  {selectedEntries.length} letter{selectedEntries.length === 1 ? '' : 's'} selected
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setAudienceFilter('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    background: audienceFilter === 'all' ? '#111827' : '#F3F4F6',
                    color: audienceFilter === 'all' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All Letters
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceFilter('for_you')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    background: audienceFilter === 'for_you' ? '#EC4899' : '#F3F4F6',
                    color: audienceFilter === 'for_you' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: audienceFilter === 'for_you' ? '#FFFFFF' : '#EC4899',
                    display: 'inline-block',
                  }} />
                  <span>For You</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceFilter('for_them')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    background: audienceFilter === 'for_them' ? '#F59E0B' : '#F3F4F6',
                    color: audienceFilter === 'for_them' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: audienceFilter === 'for_them' ? '#FFFFFF' : '#F59E0B',
                    display: 'inline-block',
                  }} />
                  <span>For Them</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Choose Download Format */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#080808', marginBottom: '10px' }}>
              Choose Format
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Option 1: Visual PDF Booklet */}
              <div
                onClick={() => setFormat('visual-pdf')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: format === 'visual-pdf' ? '2px solid #5C59ED' : '1px solid #E5E7EB',
                  background: format === 'visual-pdf' ? '#F7F7FE' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ECECFE',
                    color: '#5C59ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
                      Visual PDF Booklet
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        padding: '1px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      Recommended
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px', lineHeight: 1.4 }}>
                    Preserves the entire colored background canvas, authentic creased paper texture, exact typography, and cellotaped photos.
                  </p>
                </div>
              </div>

              {/* Option 2: High-Res PNG Images ZIP */}
              <div
                onClick={() => setFormat('images-zip')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: format === 'images-zip' ? '2px solid #5C59ED' : '1px solid #E5E7EB',
                  background: format === 'images-zip' ? '#F7F7FE' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#F3F4F6',
                    color: '#4B5563',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ImageIcon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
                    Visual Images Archive (.ZIP of PNGs)
                  </span>
                  <p style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px', lineHeight: 1.4 }}>
                    Individual high-resolution PNG image of each letter on its colored background stage.
                  </p>
                </div>
              </div>

              {/* Option 3: Print-to-PDF Window */}
              <div
                onClick={() => setFormat('print-window')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: format === 'print-window' ? '2px solid #5C59ED' : '1px solid #E5E7EB',
                  background: format === 'print-window' ? '#F7F7FE' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#F3F4F6',
                    color: '#4B5563',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Printer size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
                    Full-Bleed Print Preview
                  </span>
                  <p style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px', lineHeight: 1.4 }}>
                    Opens an exact full-bleed browser window ready for printing or saving as PDF via your system print dialog.
                  </p>
                </div>
              </div>

              {/* Option 4: Plain Markdown + Media Archive */}
              <div
                onClick={() => setFormat('markdown-zip')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: format === 'markdown-zip' ? '2px solid #5C59ED' : '1px solid #E5E7EB',
                  background: format === 'markdown-zip' ? '#F7F7FE' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#F3F4F6',
                    color: '#4B5563',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Archive size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
                    Raw Data &amp; Markdown (.ZIP)
                  </span>
                  <p style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px', lineHeight: 1.4 }}>
                    Plain markdown files, JSON database dump, and original raw audio and photo files.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress / Status banner if exporting */}
          {isExporting && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.84rem',
                color: '#4338CA',
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              <span>{progressStatus || 'Preparing letters for download...'}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #F0F0F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            background: '#FAFAFA',
          }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '10px 18px',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: '#4B5563',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              cursor: isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={isExporting || selectedEntries.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '999px',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#FFFFFF',
              background: selectedEntries.length > 0 ? '#5C59ED' : '#9CA3AF',
              border: 'none',
              cursor: isExporting || selectedEntries.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: 'none',
              transition: 'background 0.15s ease',
            }}
            onMouseOver={(e) => {
              if (!isExporting && selectedEntries.length > 0) {
                e.currentTarget.style.background = '#4E4CE6';
              }
            }}
            onMouseOut={(e) => {
              if (!isExporting && selectedEntries.length > 0) {
                e.currentTarget.style.background = '#5C59ED';
              }
            }}
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <span>Download {selectedEntries.length} Letter{selectedEntries.length === 1 ? '' : 's'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
