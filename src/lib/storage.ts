import type { Entry, AppSettings } from '../types';
import { supabase } from './supabase';

const DB_NAME = 'in_the_meantime_posthearts_db';
const DB_VERSION = 2;
const STORE_ENTRIES = 'entries';
const STORE_SETTINGS = 'settings';

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  partnerSalutation: 'To you, in the meantime',
  theme: 'paper',
  passcodeEnabled: true,
  passcode: '1805',
};

const SEED_ENTRIES: Entry[] = [
  {
    id: 'seed-1',
    title: "I'd be using",
    body: "I'd be using\n\ntoday i wished you were in the passenger seat.\n\nthe sunset was the color of persimmons and the radio played that old song you would have either loved or teased me endlessly about. i took the long way home just to keep driving.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    for_you: true,
    is_favorite: true,
    tags: ['ordinary days', 'drives'],
    attachments: [],
    paper_style: 'pink',
    backdrop_color: '#237A57', // Forest green matching Screenshot 1
    font_family: 'Schoolbell',
    font_size: 18,
    text_align: 'left',
    stickers: [
      {
        id: 'st-love-init',
        type: 'sticker',
        content: `<svg viewBox="0 0 160 80" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 45 C10 20, 30 10, 48 24 C55 12, 85 10, 95 28 C108 14, 135 15, 145 35 C152 48, 142 68, 120 72 C95 76, 75 66, 60 70 C40 75, 15 70, 12 45 Z" fill="#FFFFFF"/>
          <path d="M18 45 C16 25, 32 16, 48 27 C54 18, 80 16, 90 32 C102 20, 128 21, 138 38 C144 50, 135 64, 116 67 C93 70, 75 62, 60 65 C42 69, 21 65, 18 45 Z" fill="#2E1065"/>
          <text x="80" y="52" text-anchor="middle" font-family="'Gloria Hallelujah', cursive, sans-serif" font-weight="900" font-size="38" fill="#F472B6" stroke="#FFFFFF" stroke-width="1.5">love</text>
        </svg>`,
        name: 'Love',
        x: 6,
        y: 84, // Bottom left corner matching Screenshot 1
        rotate: -12,
        scale: 1.15,
      },
    ],
    photos: [],
    status: 'instant',
  },
  {
    id: 'seed-2',
    title: 'The apartment when it rains',
    body: 'There is a particular kind of quiet in this apartment when the rain hits the fire escape outside the bedroom window.\n\nI made too much soup again. I always cook as if there are two of us here. I sat at the small round wooden table and read three pages of a novel before looking up, half-expecting to see your coat hanging by the doorway.\n\nI want you to know this version of me too—the one who learned how to be solitary without being bitter.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    for_you: true,
    is_favorite: false,
    tags: ['home', 'solitude', 'rain'],
    attachments: [],
    paper_style: 'brown',
    backdrop_color: '#944F00', // Caramel brown matching Screenshot 5
    font_family: 'Instrument Serif',
    font_size: 19,
    text_align: 'left',
    stickers: [],
    photos: [],
    status: 'scheduled',
  },
  {
    id: 'seed-3',
    title: 'Checkout line laughter',
    body: "I heard someone laugh today in the checkout line and it caught my attention so sharply my heart leaped for a split second, wondering if it belonged to you. Then I remembered I don't even know what your laugh sounds like yet.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    entry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
    for_you: false,
    is_favorite: false,
    tags: ['fragments'],
    attachments: [],
    paper_style: 'notebook',
    backdrop_color: '#1A2B4C',
    font_family: 'Schoolbell',
    font_size: 17,
    text_align: 'left',
    stickers: [
      {
        id: 'st-goodvibes-init',
        type: 'sticker',
        content: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="44" fill="#FFFFFF"/>
          <circle cx="50" cy="50" r="38" fill="#F59E0B"/>
          <text x="50" y="45" text-anchor="middle" font-family="'Schoolbell', sans-serif" font-weight="bold" font-size="14" fill="#FFFFFF">GOOD</text>
          <text x="50" y="62" text-anchor="middle" font-family="'Schoolbell', sans-serif" font-weight="bold" font-size="15" fill="#FFFFFF">VIBES</text>
        </svg>`,
        name: 'Good Vibes',
        x: 75,
        y: 8,
        rotate: 15,
        scale: 1,
      }
    ],
    photos: [],
    status: 'instant',
  }
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const entryStore = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
        entryStore.createIndex('entry_date', 'entry_date', { unique: false });
        entryStore.createIndex('for_you', 'for_you', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllEntries(): Promise<Entry[]> {
  // First, if Supabase is connected, try to fetch from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (!error && data && data.length > 0) {
        // Cache to IndexedDB in background
        const db = await openDB();
        const tx = db.transaction(STORE_ENTRIES, 'readwrite');
        const store = tx.objectStore(STORE_ENTRIES);
        data.forEach((e) => store.put(e as Entry));
        return data as Entry[];
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local database:', err);
    }
  }

  // Fallback to local IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_ENTRIES, 'readonly');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.getAll();

    request.onsuccess = async () => {
      let entries: Entry[] = request.result || [];
      if (entries.length === 0) {
        for (const seed of SEED_ENTRIES) {
          await saveEntry(seed);
        }
        entries = [...SEED_ENTRIES];
      }
      entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
      resolve(entries);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getEntryById(id: string): Promise<Entry | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_ENTRIES, 'readonly');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEntry(entry: Entry): Promise<Entry> {
  // 1. Save locally to IndexedDB for instant UI response
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // 2. Sync to Supabase in background
  if (supabase) {
    try {
      await supabase.from('entries').upsert(entry);
    } catch (err) {
      console.warn('Supabase upsert failed:', err);
    }
  }

  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  // 1. Delete locally from IndexedDB
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // 2. Sync deletion to Supabase
  if (supabase) {
    try {
      await supabase.from('entries').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }
}

export async function getSettings(): Promise<AppSettings> {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_SETTINGS, 'readonly');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.get('app_settings');

    request.onsuccess = () => {
      if (request.result && request.result.value) {
        resolve({ ...DEFAULT_SETTINGS, ...request.result.value });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    request.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORE_SETTINGS);
    const request = store.put({ key: 'app_settings', value: settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function resetArchiveToEmpty(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function importEntries(entries: Entry[]): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    let count = 0;
    entries.forEach((e) => {
      store.put(e);
      count++;
    });
    transaction.oncomplete = () => resolve(count);
    transaction.onerror = () => reject(transaction.error);
  });
}
