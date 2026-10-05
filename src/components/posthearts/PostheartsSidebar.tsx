import React, { useState, useEffect } from 'react';
import { PlusCircle, BookOpen, MoreHorizontal, Pencil, Copy, Trash2, Lock, Unlock } from 'lucide-react';
import type { Entry } from '../../types';

interface PostheartsSidebarProps {
  entries: Entry[];
  activeEntryId: string | null;
  onSelectEntry: (id: string) => void;
  onNewLetter: () => void;
  onDeleteEntry?: (id: string) => void;
  onRenameEntry?: (id: string, newTitle: string) => void;
  onDuplicateEntry?: (id: string) => void;
  activeView: 'editor' | 'sent';
  setActiveView: (view: 'editor' | 'sent') => void;
  isArchiveUnlocked?: boolean;
  onOpenPasscodeModal?: (targetEntryId?: string) => void;
  onLockArchive?: () => void;
}

export const PostheartsSidebar: React.FC<PostheartsSidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewLetter,
  onDeleteEntry,
  onRenameEntry,
  onDuplicateEntry,
  activeView,
  setActiveView,
  isArchiveUnlocked = false,
  onOpenPasscodeModal,
  onLockArchive,
}) => {
  const [menuOpenEntryId, setMenuOpenEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    const handleOutsideClick = () => {
      setMenuOpenEntryId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #ECEFF1',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Brand: In the Meantime (Just clean text, NO circular logo) */}
      <div style={{ padding: '28px 22px 18px 22px' }}>
        <div 
          onClick={() => {
            setActiveView('editor');
            if (entries.length > 0) onSelectEntry(entries[0].id);
          }}
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#080808',
            letterSpacing: '-0.02em',
          }}>
            In the Meantime
          </div>

          <span style={{
            fontSize: '0.74rem',
            color: '#8C8C8C',
            fontWeight: 400,
            marginTop: '4px',
          }}>
            Letters and fragments for one day
          </span>
        </div>
      </div>

      {/* Primary Actions */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <button
          onClick={() => {
            setActiveView('editor');
            onNewLetter();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 14px',
            borderRadius: '9px',
            fontSize: '0.92rem',
            fontWeight: 500,
            color: activeView === 'editor' && !activeEntryId ? '#080808' : '#1F2937',
            background: activeView === 'editor' && !activeEntryId ? '#F0F0F0' : 'transparent',
            textAlign: 'left',
            transition: 'background 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#F5F5F5')}
          onMouseOut={(e) => {
            e.currentTarget.style.background = activeView === 'editor' && !activeEntryId ? '#F0F0F0' : 'transparent';
          }}
        >
          <PlusCircle size={18} style={{ color: '#5C59ED' }} />
          <span>New letter</span>
        </button>

        <button
          onClick={() => {
            if (isArchiveUnlocked) {
              setActiveView('sent');
            } else {
              onOpenPasscodeModal?.();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '9px',
            fontSize: '0.88rem',
            fontWeight: 500,
            color: activeView === 'sent' ? '#080808' : '#374151',
            background: activeView === 'sent' ? '#F0F0F0' : 'transparent',
            textAlign: 'left',
            transition: 'background 0.15s ease',
            width: '100%',
            boxSizing: 'border-box',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#F5F5F5')}
          onMouseOut={(e) => {
            e.currentTarget.style.background = activeView === 'sent' ? '#F0F0F0' : 'transparent';
          }}
        >
          <BookOpen size={17} style={{ color: '#595959' }} />
          <span>Letters ({entries.length})</span>
          {isArchiveUnlocked ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onLockArchive?.();
              }}
              title="Lock letters archive"
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                color: '#8C8C8C', /* Ash gray */
                padding: '2px 4px',
                cursor: 'pointer',
              }}
            >
              <Unlock size={14} />
            </span>
          ) : (
            <span
              title="Protected by passcode"
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                color: '#8C8C8C', /* Ash gray */
                padding: '2px 4px',
              }}
            >
              <Lock size={14} />
            </span>
          )}
        </button>
      </div>

      {/* Letters List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
        <div style={{
          fontSize: '0.82rem',
          color: '#6B7280',
          fontWeight: 500,
          padding: '16px 12px 10px 12px',
        }}>
          <span>Memories</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {entries.map((entry) => {
            const isSelected = activeView === 'editor' && activeEntryId === entry.id;
            const isMenuOpen = menuOpenEntryId === entry.id;
            const isEditing = editingEntryId === entry.id;
            const displayTitle = entry.title || (entry.body.trim().split('\n')[0].slice(0, 24) || 'Untitled');

            return (
              <div
                key={entry.id}
                style={{ position: 'relative', width: '100%' }}
              >
                <div
                  className={`letter-sidebar-row ${isSelected ? 'is-selected' : ''} ${isMenuOpen ? 'is-menu-open' : ''}`}
                  onClick={() => {
                    if (isArchiveUnlocked) {
                      setActiveView('editor');
                      onSelectEntry(entry.id);
                    } else {
                      onOpenPasscodeModal?.(entry.id);
                    }
                  }}
                >
                  {/* Left: Title or Inline Input */}
                  <div className="letter-title-slot">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim()) {
                            onRenameEntry?.(entry.id, editingTitle.trim());
                          }
                          setEditingEntryId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingTitle.trim()) {
                              onRenameEntry?.(entry.id, editingTitle.trim());
                            }
                            setEditingEntryId(null);
                          } else if (e.key === 'Escape') {
                            setEditingEntryId(null);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '0.84rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#FFFFFF',
                          border: '1px solid #3B82F6',
                          color: '#111827',
                          width: '100%',
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <span style={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#080808' : '#374151',
                      }}>
                        {displayTitle}
                      </span>
                    )}
                  </div>

                  {/* Right side: Fixed width action slot (Zero Layout Shift) */}
                  <div className="letter-action-slot">
                    {/* Pink dot for "for_you" letters (smoothly fades out when row is hovered or menu is open) */}
                    {entry.for_you && (
                      <div className="letter-pink-dot" title="For You" />
                    )}

                    {/* Three Dots Button (Always in DOM with fixed 26px size and 2px border, smoothly fades in) */}
                    <button
                      type="button"
                      className={`letter-dots-btn ${isMenuOpen ? 'menu-open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenEntryId(isMenuOpen ? null : entry.id);
                      }}
                      title="More options"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu matching user screenshot (Rename, Duplicate, Delete) */}
                {isMenuOpen && (
                  <div
                    className="letter-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Rename */}
                    <button
                      type="button"
                      className="letter-dropdown-item"
                      onClick={() => {
                        setEditingEntryId(entry.id);
                        setEditingTitle(entry.title || displayTitle);
                        setMenuOpenEntryId(null);
                      }}
                    >
                      <Pencil size={15} strokeWidth={2} style={{ color: '#6B7280' }} />
                      <span>Rename</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      className="letter-dropdown-item"
                      onClick={() => {
                        onDuplicateEntry?.(entry.id);
                        setMenuOpenEntryId(null);
                      }}
                    >
                      <Copy size={15} strokeWidth={2} style={{ color: '#6B7280' }} />
                      <span>Duplicate</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      className="letter-dropdown-item delete"
                      onClick={() => {
                        if (window.confirm('Delete this letter?')) {
                          onDeleteEntry?.(entry.id);
                        }
                        setMenuOpenEntryId(null);
                      }}
                    >
                      <Trash2 size={15} strokeWidth={2} style={{ color: '#6B7280' }} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </aside>
  );
};
