import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Check, Volume2 } from 'lucide-react';
import type { Attachment } from '../types';

interface AudioRecorderProps {
  onAudioRecorded: (attachment: Attachment) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioRecorded, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMsg('Microphone access denied or unavailable in this environment.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSaveAudio = () => {
    if (!audioBlob) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const newAttachment: Attachment = {
        id: 'aud_' + Date.now(),
        entry_id: '',
        type: 'audio',
        file_url: base64Data,
        filename: `voice_fragment_${new Date().toISOString().split('T')[0]}.webm`,
        mime_type: 'audio/webm',
        duration: recordingSeconds,
        created_at: new Date().toISOString(),
      };
      onAudioRecorded(newAttachment);
    };
    reader.readAsDataURL(audioBlob);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      margin: '12px 0',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isRecording ? 'var(--accent)' : 'var(--bg-subtle)',
            color: isRecording ? '#FFF' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            <Volume2 size={16} />
          </div>

          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {isRecording ? 'Recording voice fragment...' : audioUrl ? 'Voice fragment ready' : 'Record voice note'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isRecording
                ? `Speaking into the quiet • ${formatTime(recordingSeconds)}`
                : audioUrl
                ? `Duration: ${formatTime(recordingSeconds)}`
                : 'A recorded whisper or quiet thought'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'var(--accent)',
                color: '#FFF',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              <Mic size={14} />
              <span>Record</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              <Square size={13} fill="currentColor" />
              <span>Stop ({formatTime(recordingSeconds)})</span>
            </button>
          )}

          {audioUrl && (
            <>
              <button
                onClick={handleSaveAudio}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: 'var(--accent)',
                  color: '#FFF',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <Check size={14} />
                <span>Attach</span>
              </button>

              <button
                onClick={() => {
                  setAudioUrl(null);
                  setAudioBlob(null);
                }}
                style={{
                  padding: '6px',
                  borderRadius: '50%',
                  color: 'var(--text-muted)',
                }}
                title="Discard audio"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}

          <button
            onClick={onCancel}
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              padding: '6px 8px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Audio Playback preview */}
      {audioUrl && (
        <div style={{ marginTop: '12px' }}>
          <audio controls src={audioUrl} style={{ width: '100%', height: '36px' }} />
        </div>
      )}

      {errorMsg && (
        <div style={{
          marginTop: '8px',
          fontSize: '0.75rem',
          color: '#B43C3C',
          fontStyle: 'italic'
        }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
};
