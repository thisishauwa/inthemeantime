import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Mic, 
  Tag as TagIcon, 
  Calendar, 
  Check, 
  X, 
  ChevronDown, 
  Trash2, 
  ArrowLeft
} from 'lucide-react';
import type { Entry, Attachment } from '../types';
import { AudioRecorder } from './AudioRecorder';

interface WriteViewProps {
  initialEntry?: Entry | null;
  onSave: (entry: Entry) => Promise<void>;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

const COMMON_TAGS = [
  'ordinary days',
  'night thoughts',
  'drives',
  'rain',
  'unspoken',
  'music',
  'home',
  'solitude',
  'fragments'
];

export const WriteView: React.FC<WriteViewProps> = ({
  initialEntry,
  onSave,
  onClose,
  onDelete,
}) => {
  const [id] = useState(initialEntry ? initialEntry.id : 'entry_' + Date.now());
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [showTitleInput, setShowTitleInput] = useState(Boolean(initialEntry?.title));
  const [body, setBody] = useState(initialEntry?.body || '');
  const [entryDate, setEntryDate] = useState(
    initialEntry ? initialEntry.entry_date : new Date().toISOString()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [forYou, setForYou] = useState(initialEntry?.for_you ?? false);
  const [isFavorite] = useState(initialEntry?.is_favorite ?? false);
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(initialEntry?.attachments || []);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autosaveTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus on text area on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor at end of text if existing
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

  // Autosave logic (triggered when body, title, tags, forYou, attachments change)
  useEffect(() => {
    // Only autosave if there is some content or an attachment
    if (!body.trim() && !title.trim() && attachments.length === 0) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(async () => {
      const entryToSave: Entry = {
        id,
        title: title.trim() ? title.trim() : null,
        body,
        created_at: initialEntry?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        entry_date: entryDate,
        for_you: forYou,
        is_favorite: isFavorite,
        tags,
        attachments,
      };

      try {
        await onSave(entryToSave);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('idle');
      }
    }, 700);

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    };
  }, [body, title, entryDate, forYou, isFavorite, tags, attachments]);

  // Handle Photo selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const newAtt: Attachment = {
        id: 'img_' + Date.now(),
        entry_id: id,
        type: 'image',
        file_url: base64,
        filename: file.name,
        mime_type: file.type,
        created_at: new Date().toISOString(),
      };
      setAttachments(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  const removeAttachment = (attId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const toggleTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      setTags(tags.filter(t => t !== tagName));
    } else {
      setTags([...tags, tagName]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const clean = customTagInput.trim().toLowerCase();
      if (!tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setCustomTagInput('');
    }
  };

  const formattedDate = () => {
    try {
      const d = new Date(entryDate);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Today';
    }
  };

  return (
    <div className="fade-in reading-width" style={{ padding: '24px 0 80px 0' }}>
      {/* Top Bar: Return link & Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.84rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Archive</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Autosave quiet indicator */}
          <div style={{
            fontSize: '0.74rem',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            {saveStatus === 'saving' && <span>Saving...</span>}
            {saveStatus === 'saved' && (
              <>
                <Check size={12} style={{ color: 'var(--accent)' }} />
                <span>Saved quietly</span>
              </>
            )}
            {saveStatus === 'idle' && <span>Draft</span>}
          </div>

          {/* Delete entry (if existing) */}
          {initialEntry && onDelete && (
            <button
              onClick={async () => {
                if (window.confirm('Delete this letter from the archive?')) {
                  await onDelete(initialEntry.id);
                  onClose();
                }
              }}
              style={{
                color: 'var(--text-muted)',
                padding: '4px',
              }}
              title="Delete letter"
            >
              <Trash2 size={15} />
            </button>
          )}

          {/* "For You" toggle button */}
          <button
            onClick={() => setForYou(!forYou)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 500,
              background: forYou ? 'var(--for-you-bg)' : 'var(--bg-secondary)',
              color: forYou ? 'var(--for-you-color)' : 'var(--text-secondary)',
              border: `1px solid ${forYou ? 'var(--for-you-color)' : 'var(--border-light)'}`,
              transition: 'all 0.15s ease',
            }}
            title={forYou ? 'Marked for curated collection for them' : 'Click to mark as one you would give to your future person'}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#EC4899',
              display: 'inline-block',
            }} />
            <span>For You</span>
            {forYou && <Check size={12} />}
          </button>
        </div>
      </div>

      {/* Date & Optional Meta row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {/* Date Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem',
              color: 'var(--accent)',
              fontFamily: 'var(--font-serif)',
              letterSpacing: '0.02em',
            }}
          >
            <Calendar size={13} />
            <span>{formattedDate()}</span>
            <ChevronDown size={12} />
          </button>

          {showDatePicker && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 30,
              marginTop: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Set memory date &amp; time
              </label>
              <input
                type="datetime-local"
                value={entryDate.slice(0, 16)}
                onChange={(e) => {
                  if (e.target.value) {
                    setEntryDate(new Date(e.target.value).toISOString());
                  }
                }}
                style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '0.82rem',
                }}
              />
              <div style={{ marginTop: '8px', textAlign: 'right' }}>
                <button
                  onClick={() => setShowDatePicker(false)}
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--accent)',
                    fontWeight: 500,
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick reveal title button if not visible */}
        {!showTitleInput && (
          <button
            onClick={() => setShowTitleInput(true)}
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            + Add optional title
          </button>
        )}
      </div>

      {/* Optional Title input */}
      {showTitleInput && (
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="A title or subject (optional)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              padding: '4px 0',
              borderBottom: '1px dashed var(--border-light)',
            }}
          />
        </div>
      )}

      {/* The Writing Area - Heart of the App */}
      <textarea
        ref={textareaRef}
        className="writing-textarea"
        placeholder="today i wished you were here..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {attachments.map((att) => (
            <div
              key={att.id}
              style={{
                position: 'relative',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: att.type === 'audio' ? '12px 16px' : '8px',
                overflow: 'hidden',
              }}
            >
              {att.type === 'image' ? (
                <div>
                  <img
                    src={att.file_url}
                    alt={att.filename}
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    padding: '0 4px',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {att.filename}
                    </span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      style={{ color: 'var(--text-muted)' }}
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: '85%' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      🎙️ Voice Fragment ({att.duration ? `${att.duration}s` : 'audio'})
                    </div>
                    <audio controls src={att.file_url} style={{ width: '100%', height: '36px' }} />
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    style={{ color: 'var(--text-muted)' }}
                    title="Remove voice fragment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio Recorder Area */}
      {showAudioRecorder && (
        <AudioRecorder
          onAudioRecorded={(att) => {
            setAttachments(prev => [...prev, att]);
            setShowAudioRecorder(false);
          }}
          onCancel={() => setShowAudioRecorder(false)}
        />
      )}

      {/* Tags Chips Bar */}
      {(tags.length > 0 || showTagSelector) && (
        <div style={{
          marginTop: '20px',
          padding: '12px 0',
          borderTop: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>
              Tags:
            </span>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                }}
              >
                #{t}
                <button
                  onClick={() => toggleTag(t)}
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}

            {showTagSelector && (
              <input
                type="text"
                placeholder="type tag + Enter..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  width: '130px',
                }}
              />
            )}
          </div>

          {/* Quick Tag suggestions */}
          {showTagSelector && (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMMON_TAGS.filter(t => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  +{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Secondary Controls Toolbar */}
      <div style={{
        marginTop: '28px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Attachment Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Photo upload trigger */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              background: 'var(--bg-secondary)',
            }}
          >
            <Camera size={14} />
            <span>Photo</span>
          </button>

          {/* Voice Note trigger */}
          <button
            onClick={() => setShowAudioRecorder(!showAudioRecorder)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              color: showAudioRecorder ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              background: 'var(--bg-secondary)',
            }}
          >
            <Mic size={14} />
            <span>Voice Note</span>
          </button>

          {/* Tag trigger */}
          <button
            onClick={() => setShowTagSelector(!showTagSelector)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              color: tags.length > 0 || showTagSelector ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              background: 'var(--bg-secondary)',
            }}
          >
            <TagIcon size={13} />
            <span>Tags</span>
          </button>
        </div>

        {/* Right finish / done action */}
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 18px',
            borderRadius: '999px',
            background: 'var(--accent)',
            color: '#FFFFFF',
            fontSize: '0.82rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <span>Done &amp; Archive</span>
        </button>
      </div>
    </div>
  );
};
