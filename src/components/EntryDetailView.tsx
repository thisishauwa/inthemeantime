import React, { useState } from 'react';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import type { Entry } from '../types';

interface EntryDetailViewProps {
  entry: Entry;
  onBack: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleForYou: (id: string, currentState: boolean) => Promise<void>;
}

export const EntryDetailView: React.FC<EntryDetailViewProps> = ({
  entry,
  onBack,
  onEdit,
  onDelete,
  onToggleForYou,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formattedDate = () => {
    try {
      const d = new Date(entry.entry_date);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return entry.entry_date;
    }
  };

  const images = entry.attachments?.filter(a => a.type === 'image') || [];
  const audios = entry.attachments?.filter(a => a.type === 'audio') || [];

  return (
    <div className="fade-in reading-width" style={{ padding: '30px 0 100px 0' }}>
      {/* Navigation & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '36px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Archive</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* For You toggle */}
          <button
            onClick={() => onToggleForYou(entry.id, entry.for_you)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 500,
              background: entry.for_you ? 'var(--for-you-bg)' : 'var(--bg-secondary)',
              color: entry.for_you ? 'var(--for-you-color)' : 'var(--text-secondary)',
              border: `1px solid ${entry.for_you ? 'var(--for-you-color)' : 'var(--border-light)'}`,
            }}
            title={entry.for_you ? 'Included in curated collection for them' : 'Click to mark for curated collection'}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#EC4899',
              display: 'inline-block',
            }} />
            <span>{entry.for_you ? 'For You' : 'Mark For You'}</span>
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(entry)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
            }}
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>

          {/* Delete */}
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to remove this memory from your archive?')) {
                await onDelete(entry.id);
                onBack();
              }
            }}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
            }}
            title="Delete entry"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Date & Time Header */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: 'var(--accent)',
          fontFamily: 'var(--font-serif)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <span>{formattedDate()}</span>
          {entry.for_you && (
            <span style={{
              fontSize: '0.72rem',
              background: 'var(--for-you-bg)',
              color: 'var(--for-you-color)',
              padding: '2px 8px',
              borderRadius: '999px',
              textTransform: 'none',
              letterSpacing: 'normal',
            }}>
              Curated for them
            </span>
          )}
        </div>
      </div>

      {/* Optional Title */}
      {entry.title && (
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.4rem',
          fontWeight: 400,
          lineHeight: 1.25,
          color: 'var(--text-primary)',
          marginBottom: '28px',
        }}>
          {entry.title}
        </h1>
      )}

      {/* Main Letter Body */}
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '1.25rem',
        lineHeight: 1.9,
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        marginBottom: '40px',
      }}>
        {entry.body}
      </div>

      {/* Audio Voice Notes */}
      {audios.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            marginBottom: '10px',
          }}>
            Voice Fragments recorded in this moment
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {audios.map((aud) => (
              <div
                key={aud.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                }}
              >
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  🎙️ {aud.filename} {aud.duration ? `(${aud.duration}s)` : ''}
                </div>
                <audio controls src={aud.file_url} style={{ width: '100%', height: '36px' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Attachments */}
      {images.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img.file_url)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <img
                  src={img.file_url}
                  alt={img.filename}
                  style={{
                    width: '100%',
                    maxHeight: '450px',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-light)',
        }}>
          {entry.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-serif)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Lightbox / Zoom view for images */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={selectedImage}
            alt="Enlarged view"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}
    </div>
  );
};
