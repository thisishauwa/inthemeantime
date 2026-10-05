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

export function isDemoEntry(e: Entry): boolean {
  if (!e) return false;
  return (
    e.id.startsWith('seed-') ||
    e.title === "I'd be using" ||
    e.title === "The apartment when it rains" ||
    e.title === "Checkout line laughter" ||
    (typeof e.body === 'string' && e.body.includes("passenger seat"))
  );
}

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

      if (!error && data) {
        // Scrub demo entries if any exist in Supabase
        const demoIds = (data as Entry[]).filter(isDemoEntry).map(e => e.id);
        if (demoIds.length > 0) {
          await supabase.from('entries').delete().in('id', demoIds);
        }

        const validEntries = (data as Entry[]).filter(e => !isDemoEntry(e));

        // Sync valid entries to IndexedDB and purge demo entries locally
        const db = await openDB();
        const tx = db.transaction(STORE_ENTRIES, 'readwrite');
        const store = tx.objectStore(STORE_ENTRIES);
        demoIds.forEach(id => store.delete(id));
        validEntries.forEach((e) => store.put(e));

        return validEntries;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local database:', err);
    }
  }

  // Fallback to local IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = transaction.objectStore(STORE_ENTRIES);
    const request = store.getAll();

    request.onsuccess = async () => {
      const all: Entry[] = request.result || [];
      // Clean out any demo entries that were stored locally
      const cleanEntries: Entry[] = [];
      for (const e of all) {
        if (isDemoEntry(e)) {
          store.delete(e.id);
        } else {
          cleanEntries.push(e);
        }
      }

      cleanEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
      resolve(cleanEntries);
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
