// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyFor } from '../../i18n';
import { __resetMusic, addFiles, removeTrack, useMusic } from './music';
import type { StoredTrack, TrackStore } from './music-store';
import { MusicBar, MusicSheet } from './MusicPlayer';

/*
 * B1 de .claude/skills/phase-012-musica-no-treino/PLANO.md (ele, 2026-09-27): "porque não
 * implementaste a parte da música (...) quero ver isso a funcionar". Sem ficheiros em
 * public/audio/ a barra nunca aparecia, e num telemóvel não há como lá pôr nenhum.
 * As músicas passam a escolher-se no telemóvel e ficam só no aparelho.
 */
const t = copyFor('pt').music;

function memoryStore(): TrackStore & { rows: StoredTrack[] } {
  const rows: StoredTrack[] = [];
  return {
    rows,
    all: async () => [...rows],
    put: async (r) => {
      rows.push(r);
    },
    remove: async (id) => {
      const i = rows.findIndex((r) => r.id === id);
      if (i >= 0) rows.splice(i, 1);
    },
  };
}

const mp3 = (name: string) => new File(['x'], name, { type: 'audio/mpeg' });

let store: ReturnType<typeof memoryStore>;

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLMediaElement.prototype.pause = () => {};
  URL.createObjectURL = vi.fn((b: Blob) => `blob:${(b as File).name}`);
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
  store = memoryStore();
  __resetMusic(store);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Screen() {
  return (
    <>
      <MusicBar onOpen={() => {}} />
      <MusicSheet open onOpenChange={() => {}} />
    </>
  );
}

describe('escolher músicas no telemóvel', () => {
  it('sem músicas não há barra, e a folha oferece "Escolher músicas"', async () => {
    render(<Screen />);
    expect(await screen.findByRole('button', { name: t.pick })).toBeTruthy();
    expect(screen.queryByRole('group', { name: t.open, hidden: true })).toBeNull();
  });

  it('escolher um ficheiro faz aparecer a barra, com o nome da música, e guarda-a no aparelho', async () => {
    render(<Screen />);
    const input = screen.getByTestId('music-input') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [mp3('Eye of the Tiger.mp3')] } });
    });
    await waitFor(() => expect(screen.getByRole('group', { name: t.open, hidden: true })).toBeTruthy());
    expect(screen.getAllByText('Eye of the Tiger').length).toBeGreaterThan(0);
    expect(store.rows.map((r) => r.title)).toEqual(['Eye of the Tiger']);
  });

  it('ficheiros que não são áudio não entram', async () => {
    await act(() => addFiles([new File(['x'], 'foto.jpg', { type: 'image/jpeg' })]));
    expect(store.rows).toEqual([]);
  });

  it('o ✕ pede confirmação antes de tirar, e tirar a última esconde a barra', async () => {
    render(<Screen />);
    await act(() => addFiles([mp3('A.mp3')]));
    fireEvent.click(await screen.findByRole('button', { name: `${t.remove}: A` }));
    expect(store.rows.length).toBe(1);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t.removeYes }));
    });
    await waitFor(() => expect(screen.queryByRole('group', { name: t.open, hidden: true })).toBeNull());
    expect(store.rows).toEqual([]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:A.mp3');
  });

  it('as músicas guardadas voltam quando a app abre de novo', async () => {
    store.rows.push({ id: 'k1', title: 'Guardada', artist: '', blob: mp3('g.mp3'), addedAt: 1 });
    render(<Screen />);
    expect(await screen.findAllByText('Guardada')).toBeTruthy();
    expect(screen.getByRole('group', { name: t.open, hidden: true })).toBeTruthy();
  });
});

describe('tirar uma música acerta a que está a tocar', () => {
  function Probe({ onState }: { onState: (s: ReturnType<typeof useMusic>) => void }) {
    onState(useMusic());
    return null;
  }

  it('tirar uma antes da atual mantém a mesma a tocar', async () => {
    let s!: ReturnType<typeof useMusic>;
    render(<Probe onState={(x) => (s = x)} />);
    await act(() => addFiles([mp3('A.mp3'), mp3('B.mp3'), mp3('C.mp3')]));
    const { playAt } = await import('./music');
    act(() => playAt(2));
    expect(s.tracks[s.index].title).toBe('C');
    await act(() => removeTrack(0));
    expect(s.tracks.map((x) => x.title)).toEqual(['B', 'C']);
    expect(s.tracks[s.index].title).toBe('C');
  });
});
