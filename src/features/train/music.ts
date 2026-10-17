import { useEffect, useSyncExternalStore } from 'react';

import { idbTrackStore, isAudioFile, titleFromFile, type StoredTrack, type TrackStore } from './music-store';

/**
 * A música do treino — fase 012, `proto/v2/04-executar.html` (`.musicbar`, folha Música).
 *
 * Escolha dele, 2026-09-12: **os ficheiros dele + Media Session API**. Spotify recusado.
 *
 * Os ficheiros vivem em `public/audio/`, e a lista está em `public/audio/tracks.json`
 * (`[{ "file": "faixa.mp3", "title": "…", "artist": "…" }]`). Lista vazia ou sem ficheiro:
 * a barra não aparece de todo, e o ecrã de treino fica igual ao da fase 011.
 *
 * Um só `<audio>` para a app inteira, fora do React: a música não pode parar quando o
 * ecrã muda de exercício, nem quando a folha abre e fecha.
 *
 * B1, 2026-09-27: num telemóvel não há como pôr ficheiros em `public/audio/`, e a barra
 * nunca aparecia. As músicas passam a escolher-se no telemóvel (`addFiles`) e ficam em
 * IndexedDB, só no aparelho (`music-store.ts`). O `tracks.json` continua a valer.
 */
export type Track = {
  file: string;
  title: string;
  artist: string;
  art?: string;
  /** Só nas escolhidas no telemóvel: a chave no IndexedDB e o object URL do ficheiro. */
  id?: string;
  src?: string;
};

export type MusicState = {
  tracks: Track[];
  index: number;
  playing: boolean;
  time: number;
  duration: number;
  ducked: boolean;
};

/** "3:07" — minutos sem zero, segundos com dois dígitos. */
export function fmtTime(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Nos últimos 3 segundos do descanso o volume desce para 30% (−70%). */
export const DUCK_VOLUME = 0.3;
export function shouldDuck(remaining: number): boolean {
  return remaining > 0 && remaining <= 3;
}

/** Só entra na lista o que tem ficheiro e título; o resto não se mostra. */
export function parseTracks(raw: unknown): Track[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((t) => {
    if (!t || typeof t !== 'object') return [];
    const { file, title, artist, art } = t as Record<string, unknown>;
    if (typeof file !== 'string' || file.trim() === '') return [];
    return [
      {
        file,
        title: typeof title === 'string' && title.trim() !== '' ? title : file,
        artist: typeof artist === 'string' ? artist : '',
        ...(typeof art === 'string' ? { art } : {}),
      },
    ];
  });
}

let state: MusicState = { tracks: [], index: 0, playing: false, time: 0, duration: 0, ducked: false };
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;
let loaded = false;
let store: TrackStore = idbTrackStore;

/** Para os testes: outro armazenamento e o estado do princípio. */
export function __resetMusic(next: TrackStore = idbTrackStore) {
  audio?.pause();
  state.tracks.forEach(revoke);
  store = next;
  loaded = false;
  audio = null;
  state = { tracks: [], index: 0, playing: false, time: 0, duration: 0, ducked: false };
  listeners.forEach((l) => l());
}

function fromStored(t: StoredTrack): Track {
  const src = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(t.blob) : '';
  return { id: t.id, file: t.title, title: t.title, artist: t.artist, src };
}

function revoke(t: Track) {
  if (t.id && t.src && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(t.src);
}

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function set(patch: Partial<MusicState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function base() {
  return `${import.meta.env.BASE_URL}audio/`;
}

function ensureAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'metadata';
  audio.addEventListener('play', () => set({ playing: true }));
  audio.addEventListener('pause', () => set({ playing: false }));
  audio.addEventListener('timeupdate', () => set({ time: audio!.currentTime }));
  audio.addEventListener('loadedmetadata', () => set({ duration: audio!.duration || 0 }));
  audio.addEventListener('ended', () => next());
  return audio;
}

function mediaSession(track: Track) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    artwork: track.art ? [{ src: `${base()}${track.art}`, sizes: '512x512', type: 'image/jpeg' }] : [],
  });
  navigator.mediaSession.setActionHandler('play', () => void play());
  navigator.mediaSession.setActionHandler('pause', () => pause());
  navigator.mediaSession.setActionHandler('previoustrack', () => previous());
  navigator.mediaSession.setActionHandler('nexttrack', () => next());
}

function load(index: number) {
  const el = ensureAudio();
  const track = state.tracks[index];
  if (!el || !track) return;
  el.src = track.src ?? `${base()}${track.file}`;
  set({ index, time: 0, duration: 0 });
  mediaSession(track);
}

async function folderTracks(): Promise<Track[]> {
  try {
    const res = await fetch(`${base()}tracks.json`, { cache: 'no-cache' });
    return res.ok ? parseTracks(await res.json()) : [];
  } catch {
    return [];
  }
}

async function deviceTracks(): Promise<Track[]> {
  try {
    return (await store.all()).map(fromStored);
  } catch {
    return [];
  }
}

/**
 * Lê as duas fontes uma vez: a pasta (`tracks.json`) e as escolhidas no telemóvel.
 * Sem nenhuma, fica vazia — e isso não é um erro: a barra não aparece.
 */
export async function loadTracks(): Promise<void> {
  if (loaded) return;
  loaded = true;
  const [folder, device] = await Promise.all([folderTracks(), deviceTracks()]);
  // Se ele juntou músicas antes de a lista chegar, essas ficam à frente e sem repetir.
  const have = new Set(state.tracks.map((t) => t.id));
  device.filter((t) => have.has(t.id)).forEach(revoke);
  const tracks = [...state.tracks, ...folder, ...device.filter((t) => !have.has(t.id))];
  if (!tracks.length) return;
  set({ tracks });
  if (!audio?.src) load(state.index < tracks.length ? state.index : 0);
}

/**
 * Juntar as músicas escolhidas no telemóvel. Ficam guardadas no aparelho; se o
 * browser não deixar guardar (janela privada), tocam na mesma até fechar a app.
 */
export async function addFiles(files: ArrayLike<File>): Promise<void> {
  const picked = Array.from(files).filter(isAudioFile);
  if (!picked.length) return;
  const added: Track[] = [];
  for (const f of picked) {
    const row: StoredTrack = { id: newId(), title: titleFromFile(f.name), artist: '', blob: f, addedAt: Date.now() };
    try {
      await store.put(row);
    } catch {
      /* Não ficou guardada, mas toca nesta sessão. */
    }
    added.push(fromStored(row));
  }
  const wasEmpty = state.tracks.length === 0;
  set({ tracks: [...state.tracks, ...added] });
  if (wasEmpty) load(0);
}

/** Tirar uma música da lista e do aparelho. A que está a tocar passa à seguinte. */
export async function removeTrack(i: number): Promise<void> {
  const track = state.tracks[i];
  if (!track) return;
  if (track.id) {
    try {
      await store.remove(track.id);
    } catch {
      /* Sai da lista na mesma. */
    }
  }
  revoke(track);
  const tracks = state.tracks.filter((_, k) => k !== i);
  const wasPlaying = state.playing;
  if (!tracks.length) {
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
    }
    set({ tracks, index: 0, time: 0, duration: 0, playing: false });
    return;
  }
  if (i === state.index) {
    set({ tracks });
    load(Math.min(i, tracks.length - 1));
    if (wasPlaying) void play();
  } else {
    set({ tracks, index: i < state.index ? state.index - 1 : state.index });
  }
}

/** Tocar uma faixa da lista, a partir do toque nela. */
export function playAt(i: number) {
  if (!state.tracks[i]) return;
  load(i);
  void play();
}

/** Tocar só depois de um gesto: é o que os browsers exigem, e é daqui que é chamado. */
export async function play() {
  const el = ensureAudio();
  if (!el || !state.tracks.length) return;
  if (!el.getAttribute('src')) load(state.index);
  try {
    await el.play();
  } catch {
    set({ playing: false });
  }
}

export function pause() {
  audio?.pause();
}

export function toggle() {
  if (state.playing) pause();
  else void play();
}

export function seek(to: number) {
  if (!audio) return;
  audio.currentTime = Math.max(0, Math.min(to, audio.duration || to));
}

export function skipBy(delta: number) {
  if (audio) seek(audio.currentTime + delta);
}

export function next() {
  if (!state.tracks.length) return;
  const wasPlaying = state.playing;
  load((state.index + 1) % state.tracks.length);
  if (wasPlaying) void play();
}

export function previous() {
  if (audio && audio.currentTime > 3) {
    seek(0);
    return;
  }
  if (!state.tracks.length) return;
  const wasPlaying = state.playing;
  load((state.index - 1 + state.tracks.length) % state.tracks.length);
  if (wasPlaying) void play();
}

/** O descanso a acabar: −70% de volume enquanto durar, e volta ao fim. */
export function duck(on: boolean) {
  if (!audio || state.ducked === on) return;
  audio.volume = on ? DUCK_VOLUME : 1;
  set({ ducked: on });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMusic(): MusicState {
  useEffect(() => {
    void loadTracks();
  }, []);
  return useSyncExternalStore(subscribe, () => state, () => state);
}
