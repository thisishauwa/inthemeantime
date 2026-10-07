import React, { useState, useRef, useEffect } from 'react';
import { Square, Camera, Check } from 'lucide-react';
import { splitLetterIntoPages } from '../../lib/pagination';

interface PromptInputBarProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  forYou: boolean;
  onToggleForYou: () => void;
  forThem?: boolean;
  onToggleForThem?: () => void;
  onAudioRecorded?: (audioDataUrl: string, durationSec: number) => void;
  onPhotoUploaded?: (file: File) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PromptInputBar: React.FC<PromptInputBarProps> = ({
  value,
  onChange,
  onClear,
  forYou,
  onToggleForYou,
  forThem = false,
  onToggleForThem,
  onAudioRecorded,
  onPhotoUploaded,
  isExpanded,
  onToggleExpand,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  useEffect(() => {
    if (textareaRef.current) {
      if (isExpanded) {
        textareaRef.current.style.height = '100%';
      } else {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 40), 200)}px`;
      }
    }
  }, [value, isExpanded]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleStartMic = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (onAudioRecorded) {
            onAudioRecorded(reader.result as string, recordSec);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start();
      setIsRecording(true);
      setRecordSec(0);
      timerRef.current = window.setInterval(() => setRecordSec(p => p + 1), 1000);
    } catch {
      alert('Microphone access unavailable or denied.');
    }
  };

  const handleStopMic = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onPhotoUploaded) {
      files.forEach((file) => onPhotoUploaded(file));
    }
    e.target.value = '';
  };

  return (
    <div style={{
      width: '100%',
      height: isExpanded ? '100%' : 'auto',
      background: '#F0F0F0',
      borderRadius: '24px',
      padding: '16px 20px 14px 20px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'height 0.25s ease',
      boxShadow: 'none',
      border: 'none',
    }}>
      {/* Top row: Label, options, and Expand/Collapse matching Images 1 & 2 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#595959', fontWeight: 500 }}>
            Express how you feel
          </span>

          {/* Photo attach (multiple allowed) */}
          <input
            type="file"
            accept="image/*"
            multiple
            ref={photoInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            style={{
              fontSize: '0.72rem',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '999px',
              background: '#E2E2E4',
            }}
            title="Attach a photo to cellotape to letter"
          >
            <Camera size={11} />
            <span>Photo</span>
          </button>

          {/* For You toggle */}
          <button
            onClick={onToggleForYou}
            style={{
              fontSize: '0.72rem',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '999px',
              background: forYou ? '#FBCFE8' : '#E2E2E4',
              color: forYou ? '#9D174D' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={forYou ? 'Marked for your person' : 'Mark for your person'}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#EC4899',
              display: 'inline-block',
            }} />
            <span>For You</span>
            {forYou && <Check size={10} strokeWidth={3} />}
          </button>

          {/* For Them toggle (Letters for future kids) */}
          {onToggleForThem && (
            <button
              onClick={onToggleForThem}
              style={{
                fontSize: '0.72rem',
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: '999px',
                background: forThem ? '#FEF3C7' : '#E2E2E4',
                color: forThem ? '#92400E' : '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.15s ease',
              }}
              title={forThem ? 'Marked for your future kids (For Them)' : 'Mark for your future kids (For Them)'}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#F59E0B',
                display: 'inline-block',
              }} />
              <span>For Them</span>
              {forThem && <Check size={10} strokeWidth={3} />}
            </button>
          )}
        </div>

        {/* Expand / Collapse Button matching Image 1 & 2 */}
        {isExpanded ? (
          <button
            onClick={onToggleExpand}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#3B82F6',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Collapse"
          >
            {/* Collapse Icon (Inward arrows) */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onToggleExpand}
            style={{
              color: '#6B7280',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            title="Expand to full height"
          >
            {/* Expand Icon (Outward arrows) matching Image 1 */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Middle White Box: wraps around text, stretches when expanded */}
      <div style={{
        flex: isExpanded ? 1 : 'none',
        background: '#FFFFFF',
        borderRadius: '18px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: isExpanded ? 'flex-start' : 'center',
        gap: '12px',
        boxShadow: 'none',
        border: 'none',
      }}>
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write a letter..."
          style={{
            flex: 1,
            height: isExpanded ? '100%' : 'auto',
            paddingTop: isExpanded ? '2px' : '0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        />

        {/* Audio Recording Waveform Icon matching Image 1 & 2 */}
        <div style={{ flexShrink: 0, alignSelf: isExpanded ? 'flex-start' : 'center', paddingTop: isExpanded ? '2px' : '0' }}>
          {isRecording ? (
            <button
              onClick={handleStopMic}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#EF4444',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <Square size={10} fill="currentColor" />
              <span>{recordSec}s</span>
            </button>
          ) : (
            <button
              onClick={handleStartMic}
              style={{
                color: '#6B7280',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Record voice note"
            >
              {/* Waveform bars matching screenshot */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 10v4" />
                <path d="M8 6v12" />
                <path d="M12 3v18" />
                <path d="M16 7v10" />
                <path d="M20 10v4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Word & Char Counter, Clear matching Images 1 & 2 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '12px',
        padding: '0 2px',
        fontSize: '0.78rem',
        color: '#8C8C8C',
      }}>
        <span>
          Words: {wordCount} &nbsp; Characters: {charCount}
          {splitLetterIntoPages(value).length > 1 && (
            <span style={{ marginLeft: '10px', color: '#5C59ED', fontWeight: 600 }}>
              • {splitLetterIntoPages(value).length} Pages
            </span>
          )}
        </span>

        <button
          onClick={onClear}
          style={{
            fontSize: '0.78rem',
            color: '#8C8C8C',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#111827')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#8C8C8C')}
        >
          Clear
        </button>
      </div>
    </div>
  );
};
