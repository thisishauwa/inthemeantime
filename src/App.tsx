import { useState, useEffect, useRef } from 'react';
import type { Entry, AppSettings, PlacedPhoto } from './types';
import { 
  getAllEntries, 
  saveEntry, 
  deleteEntry,
  getSettings, 
  saveSettings 
} from './lib/storage';
import { PostheartsSidebar } from './components/posthearts/PostheartsSidebar';
import { PromptInputBar } from './components/posthearts/PromptInputBar';
import { PaperCanvas } from './components/posthearts/PaperCanvas';
import { SentLettersView } from './components/posthearts/SentLettersView';
import { ExportModal } from './components/ExportModal';
import { DownloadModal } from './components/posthearts/DownloadModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileNoticeScreen } from './components/MobileNoticeScreen';
import { 
  openPrintBookView, 
  exportConsolidatedMarkdown, 
  exportJSON, 
  exportZIPArchive 
} from './lib/exportUtils';

export function App() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // 'editor' | 'sent'
  const [activeView, setActiveView] = useState<'editor' | 'sent'>('editor');
  
  // Expand writing field to top of screen
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const autosaveTimerRef = useRef<number | null>(null);

  // Load initial entries & settings
  const loadData = async () => {
    try {
      const [fetchedEntries, fetchedSettings] = await Promise.all([
        getAllEntries(),
        getSettings(),
      ]);

      setEntries(fetchedEntries);
      setSettings(fetchedSettings);

      if (fetchedEntries.length > 0) {
        setActiveEntryId(fetchedEntries[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeEntry: Entry = entries.find((e) => e.id === activeEntryId) || {
    id: 'new_' + Date.now(),
    title: 'Fragment',
    body: 'today i wished you were in the passenger seat.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    entry_date: new Date().toISOString(),
    for_you: true,
    paper_style: 'pink',
    backdrop_color: '#237A57',
    font_family: 'Schoolbell',
    font_size: 18,
    text_align: 'left',
    stickers: [],
    photos: [],
    tags: ['ordinary days'],
    attachments: [],
    status: 'instant',
  };

  // Update active entry with debounced autosave
  const handleUpdateActiveEntry = (updated: Entry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      } else {
        return [updated, ...prev];
      }
    });

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(async () => {
      await saveEntry(updated);
    }, 600);
  };

  const handleNewLetter = () => {
    const newId = 'letter_' + Date.now();
    const newLetter: Entry = {
      id: newId,
      title: 'Untitled Letter',
      body: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entry_date: new Date().toISOString(),
      for_you: true,
      paper_style: 'pink',
      backdrop_color: '#237A57',
      font_family: 'Schoolbell',
      font_size: 18,
      text_align: 'left',
      stickers: [],
      photos: [],
      tags: [],
      attachments: [],
      status: 'instant',
    };

    setEntries((prev) => [newLetter, ...prev]);
    setActiveEntryId(newId);
    setActiveView('editor');
    setIsInputExpanded(false);
    saveEntry(newLetter);
  };

  const handleDeleteEntry = async (idToDelete: string) => {
    await deleteEntry(idToDelete);
    setEntries((prev) => {
      const remaining = prev.filter((e) => e.id !== idToDelete);
      if (activeEntryId === idToDelete) {
        if (remaining.length > 0) {
          setActiveEntryId(remaining[0].id);
        } else {
          // If all letters deleted, start a fresh letter
          const newId = 'letter_' + Date.now();
          const newLetter: Entry = {
            id: newId,
            title: 'Untitled Letter',
            body: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            entry_date: new Date().toISOString(),
            for_you: true,
            paper_style: 'pink',
            backdrop_color: '#237A57',
            font_family: 'Schoolbell',
            font_size: 18,
            text_align: 'left',
            stickers: [],
            photos: [],
            tags: [],
            attachments: [],
            status: 'instant',
          };
          saveEntry(newLetter);
          setActiveEntryId(newId);
          return [newLetter];
        }
      }
      return remaining;
    });
  };

  const handleRenameEntry = (id: string, newTitle: string) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      handleUpdateActiveEntry({ ...entry, title: newTitle });
    }
  };

  const handleDuplicateEntry = (id: string) => {
    const original = entries.find((e) => e.id === id);
    if (!original) return;
    const newId = 'letter_' + Date.now();
    const duplicated: Entry = {
      ...original,
      id: newId,
      title: `${original.title || 'Untitled'} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entry_date: new Date().toISOString(),
    };
    setEntries((prev) => [duplicated, ...prev]);
    setActiveEntryId(newId);
    saveEntry(duplicated);
  };

  // Handle Photo Upload -> Cellotaped to the paper sheet!
  const handlePhotoUploaded = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      const newPhoto: PlacedPhoto = {
        id: 'pht_' + Date.now(),
        url: base64Url,
        frame: 'polaroid',
        x: 20,
        y: 35,
        rotate: Math.floor(Math.random() * 8) - 4, // subtle natural angle
      };

      const currentPhotos = activeEntry.photos || [];
      handleUpdateActiveEntry({
        ...activeEntry,
        photos: [...currentPhotos, newPhoto],
      });
    };
    reader.readAsDataURL(file);
  };

  // Audio recording voice note
  const handleAudioRecorded = (audioDataUrl: string, durationSec: number) => {
    const newAtt = {
      id: 'aud_' + Date.now(),
      entry_id: activeEntry.id,
      type: 'audio' as const,
      file_url: audioDataUrl,
      filename: `voice_note_${durationSec}s.webm`,
      duration: durationSec,
      created_at: new Date().toISOString(),
    };
    const currentAtts = activeEntry.attachments || [];
    handleUpdateActiveEntry({
      ...activeEntry,
      attachments: [...currentAtts, newAtt],
    });
  };

  const handleExportFormat = async (format: 'png' | 'pdf' | 'zip' | 'md' | 'json') => {
    if (format === 'pdf') {
      openPrintBookView([activeEntry], activeEntry.for_you, settings?.partnerSalutation || 'To you, in the meantime');
    } else if (format === 'zip') {
      await exportZIPArchive([activeEntry], activeEntry.for_you);
    } else if (format === 'md') {
      exportConsolidatedMarkdown([activeEntry], activeEntry.title || 'In the Meantime — Letter');
    } else if (format === 'json') {
      exportJSON([activeEntry], `in-the-meantime-${activeEntry.id}.json`);
    } else if (format === 'png') {
      window.print();
    }
  };

  if (loading || !settings) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAFAFA',
        fontFamily: 'var(--font-inter)',
        color: '#6B7280',
        fontSize: '0.9rem',
      }}>
        Opening In the Meantime...
      </div>
    );
  }

  return (
    <>
      {/* Mobile & Tablet Notice: instructs user to open on laptop */}
      <MobileNoticeScreen />

      <div
        className="desktop-app-container"
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          background: '#FAFAFA',
          overflow: 'hidden',
        }}
      >
      {/* 1. Left Sidebar */}
      <PostheartsSidebar
        entries={entries}
        activeEntryId={activeEntryId}
        onSelectEntry={(id) => {
          setActiveEntryId(id);
          setActiveView('editor');
        }}
        onNewLetter={handleNewLetter}
        onDeleteEntry={handleDeleteEntry}
        onRenameEntry={handleRenameEntry}
        onDuplicateEntry={handleDuplicateEntry}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Main Content Area: 50% Express how you feel & 50% Letter Canvas */}
      {activeView === 'editor' ? (
        <div style={{
          flex: 1,
          height: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          padding: '20px',
          overflow: 'hidden',
          boxSizing: 'border-box',
          background: '#FAFAFA',
        }}>
          {/* Left half: Express how you feel section (50%) */}
          <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isInputExpanded ? 'stretch' : 'flex-end',
            overflow: 'hidden',
          }}>
            {/* The Auto-wrapping & Expandable Prompt Input Bar */}
            <PromptInputBar
              value={activeEntry.body}
              onChange={(val) => {
                handleUpdateActiveEntry({ ...activeEntry, body: val });
              }}
              onClear={() => {
                handleUpdateActiveEntry({ ...activeEntry, body: '' });
              }}
              forYou={activeEntry.for_you}
              onToggleForYou={() => {
                handleUpdateActiveEntry({ ...activeEntry, for_you: !activeEntry.for_you });
              }}
              onAudioRecorded={handleAudioRecorded}
              onPhotoUploaded={handlePhotoUploaded}
              isExpanded={isInputExpanded}
              onToggleExpand={() => setIsInputExpanded(!isInputExpanded)}
            />
          </div>

          {/* Right half: Letter section (50%) */}
          <div style={{
            height: '100%',
            width: '100%',
            overflow: 'hidden',
          }}>
            <PaperCanvas
              entry={activeEntry}
              onUpdateEntry={handleUpdateActiveEntry}
              onExport={handleExportFormat}
              onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            />
          </div>
        </div>
      ) : (
        /* Sent Letters / Archive View */
        <SentLettersView
          entries={entries}
          onSelectLetter={(id) => {
            setActiveEntryId(id);
            setActiveView('editor');
          }}
          onNewLetter={handleNewLetter}
          onDeleteLetter={handleDeleteEntry}
        />
      )}

      {/* Download modal with timeframe & visual options */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        entries={entries}
        activeEntryId={activeEntryId}
      />

      {/* Export modal */}
      {isExportOpen && (
        <ExportModal
          entries={entries}
          settings={settings}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* Settings & Privacy modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={async (s) => {
            setSettings(s);
            await saveSettings(s);
          }}
          onClose={() => setIsSettingsOpen(false)}
          onReloadEntries={loadData}
        />
      )}
      </div>
    </>
  );
}

export default App;
