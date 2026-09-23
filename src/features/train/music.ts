import { useEffect, useSyncExternalStore } from 'react';

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
 */
export type Track = { file: string; title: string; artist: string; art?: string };

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
  el.src = `${base()}${track.file}`;
  set({ index, time: 0, duration: 0 });
  mediaSession(track);
}

/** Lê a lista uma vez. Sem ficheiro de lista, fica vazia — e isso não é um erro. */
export async function loadTracks(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const res = await fetch(`${base()}tracks.json`, { cache: 'no-cache' });
    if (!res.ok) return;
    const tracks = parseTracks(await res.json());
    set({ tracks });
    if (tracks.length) load(0);
  } catch {
    /* Sem lista não há música, e a barra não aparece. */
  }
}

/** Tocar só depois de um gesto: é o que os browsers exigem, e é daqui que é chamado. */
export async function play() {
  const el = ensureAudio();
  if (!el || !state.tracks.length) return;
  if (!el.src) load(state.index);
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
