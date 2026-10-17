/**
 * As músicas que ele escolhe no telemóvel — B1 de
 * `.claude/skills/phase-012-musica-no-treino/PLANO.md` (2026-09-27).
 *
 * Ficam **só neste aparelho**, em IndexedDB. Nunca vão para o Supabase: são ficheiros
 * dele, e a app não escreve na base de dados por conta própria.
 */
export type StoredTrack = { id: string; title: string; artist: string; blob: Blob; addedAt: number };

export interface TrackStore {
  all(): Promise<StoredTrack[]>;
  put(track: StoredTrack): Promise<void>;
  remove(id: string): Promise<void>;
}

const DB = 'fitness-music';
const STORE = 'tracks';

/** "02 - Eye of the Tiger.mp3" → "02 - Eye of the Tiger". */
export function titleFromFile(name: string): string {
  const t = name.replace(/\.[^./]+$/, '').trim();
  return t || name;
}

/** O que o seletor deixa passar: áudio pelo tipo, ou pela extensão quando o tipo vem vazio. */
export function isAudioFile(f: { name: string; type: string }): boolean {
  return f.type.startsWith('audio/') || /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac)$/i.test(f.name);
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export const idbTrackStore: TrackStore = {
  async all() {
    if (typeof indexedDB === 'undefined') return [];
    const rows = await run<StoredTrack[]>('readonly', (s) => s.getAll() as IDBRequest<StoredTrack[]>);
    return [...rows].sort((a, b) => a.addedAt - b.addedAt);
  },
  async put(track) {
    if (typeof indexedDB === 'undefined') return;
    await run('readwrite', (s) => s.put(track));
  },
  async remove(id) {
    if (typeof indexedDB === 'undefined') return;
    await run('readwrite', (s) => s.delete(id));
  },
};
