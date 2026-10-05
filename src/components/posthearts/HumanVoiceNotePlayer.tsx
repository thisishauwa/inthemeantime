import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';

interface HumanVoiceNotePlayerProps {
  id: string;
  url: string;
  duration?: number;
  filename?: string;
  onDelete?: () => void;
}

export const HumanVoiceNotePlayer: React.FC<HumanVoiceNotePlayerProps> = ({
  id,
  url,
  duration = 0,
  onDelete,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current && (!totalDuration || totalDuration === 0)) {
          setTotalDuration(Math.round(audioRef.current.duration) || duration);
        }
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
    }
  }, [url, duration, totalDuration]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
      });
    }
  };

  const handleScrub = (index: number, totalBars: number) => {
    if (!audioRef.current || !totalDuration) return;
    const seekTime = (index / totalBars) * totalDuration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Generate organic, natural acoustic bar heights (deterministic per voice note)
  const barCount = 22;
  const bars = React.useMemo(() => {
    const seed = (id || 'note').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: barCount }, (_, i) => {
      // Natural speech cadence pattern (lower at ends, varied middle peaks)
      const base = Math.sin((i / barCount) * Math.PI) * 16;
      const variation = Math.abs(Math.sin((seed + i * 17) * 0.7)) * 14;
      return Math.max(5, Math.min(26, Math.round(base + variation)));
    });
  }, [id]);

  const progressFraction = totalDuration > 0 ? currentTime / totalDuration : 0;
  const currentBarIndex = Math.floor(progressFraction * barCount);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        margin: '14px 0 10px 0',
        padding: '9px 14px 9px 12px',
        background: '#FAF8F5', // Warm linen/parchment tone
        border: '1px solid rgba(80, 60, 40, 0.12)',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
        userSelect: 'none',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Frosted Cellotape Accent on corner */}
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          left: '14px',
          width: '42px',
          height: '14px',
          background: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.75)',
          transform: 'rotate(-2deg)',
          pointerEvents: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      />

      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Tactile Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        title={isPlaying ? 'Pause voice note' : 'Play voice note'}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isPlaying ? '#2D2825' : '#3E3733',
          border: 'none',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'transform 0.1s ease, background 0.15s ease',
          transform: isPlaying ? 'scale(0.96)' : 'scale(1)',
          padding: 0,
        }}
      >
        {isPlaying ? (
          <Pause size={13} fill="#FFFFFF" color="#FFFFFF" />
        ) : (
          <Play size={13} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '2px' }} />
        )}
      </button>

      {/* Acoustic Rhythm Bars */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          height: '28px',
          padding: '0 2px',
          cursor: 'pointer',
        }}
        title="Click to scrub audio"
      >
        {bars.map((height, i) => {
          const isPassed = i <= currentBarIndex && currentTime > 0;
          return (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                handleScrub(i, barCount);
              }}
              style={{
                width: '3px',
                height: `${height}px`,
                borderRadius: '1.5px',
                background: isPassed ? '#2D2825' : '#D4CEBE',
                transition: 'background 0.1s ease, height 0.15s ease',
              }}
            />
          );
        })}
      </div>

      {/* Time & Handwritten Label */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          lineHeight: 1.2,
          paddingLeft: '2px',
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', Menlo, monospace",
            fontSize: '0.72rem',
            color: '#4A403A',
            letterSpacing: '0.02em',
          }}
        >
          {isPlaying ? formatTime(currentTime) : formatTime(totalDuration || duration)}
        </span>
        <span
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '0.70rem',
            fontStyle: 'italic',
            color: '#8C827A',
          }}
        >
          voice memo
        </span>
      </div>

      {/* Delete / Trash button */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove voice note"
          style={{
            background: 'transparent',
            border: 'none',
            color: isHovered ? '#8C827A' : 'transparent',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8C827A')}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};
