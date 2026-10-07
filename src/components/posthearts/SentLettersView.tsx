import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Entry } from '../../types';

interface SentLettersViewProps {
  entries: Entry[];
  onSelectLetter: (id: string) => void;
  onNewLetter: () => void;
  onDeleteLetter?: (id: string) => void;
}

export const SentLettersView: React.FC<SentLettersViewProps> = ({
  entries,
  onSelectLetter,
  onNewLetter,
  onDeleteLetter,
}) => {
  const [filter, setFilter] = useState<'all' | 'for_you' | 'for_them'>('all');

  const forYouCount = entries.filter(e => e.for_you).length;
  const forThemCount = entries.filter(e => e.for_them || e.tags?.includes('For Them')).length;
  const filtered = entries.filter((e) => {
    if (filter === 'for_you') return e.for_you;
    if (filter === 'for_them') return Boolean(e.for_them || e.tags?.includes('For Them'));
    return true;
  });

  return (
    <div style={{
      flex: 1,
      height: '100vh',
      background: '#FAFAFA',
      overflowY: 'auto',
      padding: '36px 48px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '28px',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.02em',
          }}>
            Letters
          </h1>
          <p style={{
            fontSize: '0.86rem',
            color: '#6B7280',
            marginTop: '4px',
          }}>
            A private archive of fragments and thoughts for the person you may one day love.
          </p>
        </div>

        <button
          onClick={onNewLetter}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#5C59ED',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '999px',
            fontSize: '0.86rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>Write a letter</span>
        </button>
      </div>

      {/* Filter Tabs: All and For You only (No fake sent/scheduled/future me) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '32px',
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.84rem',
            fontWeight: 500,
            background: filter === 'all' ? '#111827' : '#EEEEEE',
            color: filter === 'all' ? '#FFFFFF' : '#4B5563',
            transition: 'all 0.15s ease',
          }}
        >
          All ({entries.length})
        </button>

        <button
          onClick={() => setFilter('for_you')}
          style={{
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.84rem',
            fontWeight: 500,
            background: filter === 'for_you' ? '#EC4899' : '#EEEEEE',
            color: filter === 'for_you' ? '#FFFFFF' : '#4B5563',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: filter === 'for_you' ? '#FFFFFF' : '#EC4899',
            display: 'inline-block',
          }} />
          <span>For You ({forYouCount})</span>
        </button>

        <button
          onClick={() => setFilter('for_them')}
          style={{
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '0.84rem',
            fontWeight: 500,
            background: filter === 'for_them' ? '#F59E0B' : '#EEEEEE',
            color: filter === 'for_them' ? '#FFFFFF' : '#4B5563',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: filter === 'for_them' ? '#FFFFFF' : '#F59E0B',
            display: 'inline-block',
          }} />
          <span>For Them ({forThemCount})</span>
        </button>
      </div>

      {/* Content: List or Empty state */}
      {filtered.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '6px',
          }}>
            No letters yet
          </h3>

          <p style={{
            fontSize: '0.86rem',
            color: '#6B7280',
            maxWidth: '340px',
            lineHeight: 1.5,
            marginBottom: '18px',
          }}>
            These are the small, tender things you wish you could tell them right now. Write your first letter.
          </p>

          <button
            onClick={onNewLetter}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              background: '#5C59ED',
              color: '#FFFFFF',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
          >
            Start writing
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {filtered.map((letter) => {
            const dateStr = new Date(letter.entry_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });

            return (
              <div
                key={letter.id}
                onClick={() => onSelectLetter(letter.id)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'border-color 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              >
                {/* Paper mini preview with authentic background */}
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    padding: '18px 20px',
                    fontSize: '0.86rem',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    fontFamily: letter.font_family || 'Schoolbell',
                    borderRadius: '10px',
                    backgroundImage: "url('/paper-bg.jpg')",
                    backgroundSize: '118% 118%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    color: '#1F2937',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {letter.body ? letter.body : <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>A quiet, unwritten letter...</span>}
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                        {dateStr}
                      </span>
                      {letter.for_you && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#EC4899',
                          background: '#FDF2F8',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}>
                          <span style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#EC4899',
                            display: 'inline-block',
                          }} />
                          <span>For You</span>
                        </span>
                      )}
                      {(letter.for_them || letter.tags?.includes('For Them')) && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#B45309',
                          background: '#FEF3C7',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}>
                          <span style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#F59E0B',
                            display: 'inline-block',
                          }} />
                          <span>For Them</span>
                        </span>
                      )}
                    </div>

                    {/* Delete Letter Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this letter?')) {
                          onDeleteLetter?.(letter.id);
                        }
                      }}
                      style={{
                        color: '#9CA3AF',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease, background 0.15s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#EF4444';
                        e.currentTarget.style.background = '#FEE2E2';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#9CA3AF';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Delete letter"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 style={{
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {(letter.title && letter.title !== 'Untitled Letter' && letter.title !== 'Untitled')
                      ? letter.title
                      : (letter.body.trim().split('\n')[0].slice(0, 36) || 'New letter')}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
