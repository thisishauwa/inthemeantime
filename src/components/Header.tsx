import React from 'react';
import { PenLine, BookOpen, Download, Moon, Sun, Coffee, Plus, Settings } from 'lucide-react';
import type { AppSettings } from '../types';

interface HeaderProps {
  activeView: 'write' | 'archive' | 'detail';
  setActiveView: (view: 'write' | 'archive') => void;
  onNewEntry: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onNewEntry,
  onOpenExport,
  onOpenSettings,
  settings,
  onUpdateSettings,
}) => {
  const cycleTheme = () => {
    const nextTheme: AppSettings['theme'] = 
      settings.theme === 'paper' ? 'night' : 
      settings.theme === 'night' ? 'sepia' : 'paper';
    
    onUpdateSettings({ ...settings, theme: nextTheme });
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-light)',
      background: 'var(--bg-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(8px)',
      transition: 'background-color 0.2s ease',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
      }}>
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveView('archive')}
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.45rem',
            letterSpacing: '0.02em',
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>In the Meantime</span>
          </div>
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            marginTop: '-2px'
          }}>
            letters &amp; fragments for one day
          </span>
        </div>

        {/* Center Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-secondary)',
          padding: '3px 4px',
          borderRadius: '999px',
          border: '1px solid var(--border-light)',
        }}>
          <button
            onClick={() => {
              onNewEntry();
              setActiveView('write');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: activeView === 'write' ? 500 : 400,
              color: activeView === 'write' ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: activeView === 'write' ? 'var(--bg-card)' : 'transparent',
              boxShadow: activeView === 'write' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <PenLine size={14} style={{ color: 'var(--accent)' }} />
            <span>Write</span>
          </button>

          <button
            onClick={() => setActiveView('archive')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: activeView === 'archive' || activeView === 'detail' ? 500 : 400,
              color: activeView === 'archive' || activeView === 'detail' ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: activeView === 'archive' || activeView === 'detail' ? 'var(--bg-card)' : 'transparent',
              boxShadow: activeView === 'archive' || activeView === 'detail' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <BookOpen size={14} />
            <span>Archive</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeView !== 'write' && (
            <button
              onClick={() => {
                onNewEntry();
                setActiveView('write');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
              title="New Entry"
            >
              <Plus size={14} />
              <span className="hide-on-mobile">New</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8rem',
              border: '1px solid var(--border-light)',
            }}
            title="Export Archive & Book"
          >
            <Download size={14} />
            <span className="hide-on-mobile">Export</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            onClick={cycleTheme}
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
            }}
            title={`Current theme: ${settings.theme}. Click to switch theme.`}
          >
            {settings.theme === 'paper' && <Sun size={15} />}
            {settings.theme === 'night' && <Moon size={15} />}
            {settings.theme === 'sepia' && <Coffee size={15} />}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
            }}
            title="Settings & Privacy"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
