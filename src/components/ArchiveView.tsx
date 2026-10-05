import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Image as ImageIcon, 
  Mic, 
  Plus, 
  ArrowUpDown
} from 'lucide-react';
import type { Entry } from '../types';

interface ArchiveViewProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
  onNewEntry: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyForYou, setOnlyForYou] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'audio'>('all');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => {
      e.tags?.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchBody = entry.body.toLowerCase().includes(q);
          const matchTitle = entry.title?.toLowerCase().includes(q) || false;
          const matchTags = entry.tags?.some(t => t.toLowerCase().includes(q)) || false;
          if (!matchBody && !matchTitle && !matchTags) return false;
        }

        // Only "For You"
        if (onlyForYou && !entry.for_you) {
          return false;
        }

        // Tag filter
        if (selectedTag && (!entry.tags || !entry.tags.includes(selectedTag))) {
          return false;
        }

        // Media filter
        if (mediaFilter === 'image') {
          if (!entry.attachments?.some(a => a.type === 'image')) return false;
        } else if (mediaFilter === 'audio') {
          if (!entry.attachments?.some(a => a.type === 'audio')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.entry_date).getTime();
        const timeB = new Date(b.entry_date).getTime();
        return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [entries, searchQuery, onlyForYou, selectedTag, mediaFilter, dateSort]);

  const forYouCount = entries.filter(e => e.for_you).length;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fade-in container" style={{ padding: '24px 0 100px 0' }}>
      {/* Intro Header & Tone */}
      <div style={{
        marginBottom: '28px',
        textAlign: 'center',
        padding: '10px 0 20px 0',
      }}>
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          margin: '0 auto 8px auto',
          lineHeight: 1.6,
        }}>
          “I am living an entire life before this person arrives. These are the things I would have told them if they were already here.”
        </p>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          {entries.length} memories in the archive &bull; {forYouCount} marked for you
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* Search input line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search within letters, thoughts, and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ color: 'var(--text-muted)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {/* All toggle */}
            <button
              onClick={() => {
                setOnlyForYou(false);
                setSelectedTag(null);
                setMediaFilter('all');
              }}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '999px',
                background: !onlyForYou && !selectedTag && mediaFilter === 'all' ? 'var(--bg-card)' : 'transparent',
                color: !onlyForYou && !selectedTag && mediaFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                fontWeight: !onlyForYou && !selectedTag && mediaFilter === 'all' ? 500 : 400,
              }}
            >
              All ({entries.length})
            </button>

            {/* "For You" Filter */}
            <button
              onClick={() => setOnlyForYou(!onlyForYou)}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '999px',
                background: onlyForYou ? 'var(--for-you-bg)' : 'transparent',
                color: onlyForYou ? 'var(--for-you-color)' : 'var(--text-secondary)',
                border: `1px solid ${onlyForYou ? 'var(--for-you-color)' : 'var(--border-light)'}`,
                fontWeight: onlyForYou ? 500 : 400,
              }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#EC4899',
                display: 'inline-block',
                marginRight: '6px',
              }} />
              <span>For You ({forYouCount})</span>
            </button>

            {/* Photos */}
            <button
              onClick={() => setMediaFilter(mediaFilter === 'image' ? 'all' : 'image')}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '999px',
                background: mediaFilter === 'image' ? 'var(--bg-card)' : 'transparent',
                color: mediaFilter === 'image' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ImageIcon size={11} />
              <span>Photos</span>
            </button>

            {/* Audio */}
            <button
              onClick={() => setMediaFilter(mediaFilter === 'audio' ? 'all' : 'audio')}
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '999px',
                background: mediaFilter === 'audio' ? 'var(--bg-card)' : 'transparent',
                color: mediaFilter === 'audio' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Mic size={11} />
              <span>Voice Notes</span>
            </button>

            {/* Tags selector */}
            {allTags.length > 0 && (
              <select
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value ? e.target.value : null)}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-light)',
                  background: selectedTag ? 'var(--bg-card)' : 'transparent',
                  color: selectedTag ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Tags ({allTags.length})</option>
                {allTags.map(t => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>
            )}
          </div>

          {/* Sort order */}
          <button
            onClick={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Toggle chronological order"
          >
            <ArrowUpDown size={11} />
            <span>{dateSort === 'desc' ? 'Newest first' : 'Oldest first'}</span>
          </button>
        </div>
      </div>

      {/* Archive Entries List */}
      {filteredEntries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          border: '1px dashed var(--border-light)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
        }}>
          <p style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            marginBottom: '14px',
          }}>
            {searchQuery || onlyForYou || selectedTag
              ? 'No letters found matching this search or filter.'
              : 'The archive is currently waiting for your first words.'}
          </p>
          <button
            onClick={onNewEntry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'var(--accent)',
              color: '#FFFFFF',
              fontSize: '0.84rem',
              fontWeight: 500,
            }}
          >
            <Plus size={15} />
            <span>Write a letter</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredEntries.map((entry) => {
            const hasImage = entry.attachments?.some(a => a.type === 'image');
            const hasAudio = entry.attachments?.some(a => a.type === 'audio');
            const firstImage = entry.attachments?.find(a => a.type === 'image');

            return (
              <article
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '22px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header: Date & Indicators */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}>
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-serif)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span>{formatDate(entry.entry_date)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                    <span style={{ color: 'var(--text-muted)', textTransform: 'none' }}>
                      {formatTime(entry.entry_date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasAudio && (
                      <span
                        title="Contains voice fragment"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Mic size={12} />
                      </span>
                    )}

                    {hasImage && (
                      <span
                        title="Contains photograph"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <ImageIcon size={12} />
                      </span>
                    )}

                    {entry.for_you && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          background: 'var(--for-you-bg)',
                          color: 'var(--for-you-color)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontWeight: 500,
                        }}
                      >
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#EC4899',
                          display: 'inline-block',
                          marginRight: '4px',
                        }} />
                        <span>For You</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content preview */}
                <div style={{
                  display: 'flex',
                  gap: '18px',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {entry.title && (
                      <h2 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.45rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: '6px',
                        lineHeight: 1.25,
                      }}>
                        {entry.title}
                      </h2>
                    )}

                    <p style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.05rem',
                      lineHeight: 1.7,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {entry.body}
                    </p>
                  </div>

                  {/* Thumbnail if present */}
                  {firstImage && (
                    <div style={{
                      width: '80px',
                      height: '80px',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-light)',
                    }}>
                      <img
                        src={firstImage.file_url}
                        alt="attachment"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Tags footer */}
                {entry.tags && entry.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '12px',
                  }}>
                    {entry.tags.map(t => (
                      <span
                        key={t}
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          fontFamily: 'var(--font-serif)',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
