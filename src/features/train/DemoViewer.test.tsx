// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyFor } from '../../i18n';
import { DemoViewer } from './DemoViewer';

/*
 * B2 de .claude/skills/demo-nao-marca-series/PLANO.md (skill demonstracao-separada-do-treino):
 * "a pessoa pode ver um video antes de começar os exercicios". Ver o vídeo não começa
 * treino, não grava e não pergunta nada: o ✕ fecha.
 *
 * Skill demonstracao-inteira-e-com-mostrador (ele, 2026-09-27): "o vídeo de demonstração
 * acaba muito rápido … volta a colocar o semi circle no vídeo de demonstração … dinâmico
 * não estático". O clipe repete-se até ao ✕, e por cima estão o mostrador de traços ao
 * ritmo do vídeo, o relógio, as reps, o peso, os anéis e o cartão do nome.
 */
const r = copyFor('pt').run;
const clip = { webm: '/c.webm', mp4: '/c.mp4', poster: '/c.jpg' };

beforeEach(() => {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => {};
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});
afterEach(cleanup);

function mount(onClose = vi.fn()) {
  render(
    <DemoViewer clip={clip} name="Remada" sets="4" reps="10-12" load="60 kg a calibrar" onClose={onClose} />,
  );
  return onClose;
}

function at(video: HTMLVideoElement, t: number, d: number) {
  Object.defineProperty(video, 'duration', { value: d, configurable: true });
  Object.defineProperty(video, 'currentTime', { value: t, writable: true, configurable: true });
  act(() => {
    fireEvent.timeUpdate(video);
  });
}

describe('DemoViewer — ver o vídeo sem começar treino', () => {
  it('o ✕ só fecha o vídeo', () => {
    const onClose = mount();
    fireEvent.click(screen.getByRole('button', { name: r.demoClose }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(r.quitTitle)).toBeNull();
  });

  it('o clipe repete-se e o fim não fecha', () => {
    const onClose = mount();
    const video = document.querySelector<HTMLVideoElement>('.demo-viewer > video:not(.run-wide-bg)')!;
    expect(video.loop).toBe(true);
    fireEvent.ended(video);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('o mostrador de 33 traços acende ao ritmo do vídeo, e o relógio conta o que falta', () => {
    mount();
    const video = document.querySelector<HTMLVideoElement>('.demo-viewer > video:not(.run-wide-bg)')!;
    const box = document.querySelector('.demo-viewer .media-dial')!;
    expect(box.querySelectorAll('.dial-ticks line')).toHaveLength(33);
    /* A 0,5× (T6), um clipe de 6 s leva 12 s de relógio. */
    at(video, 0, 6);
    expect(box.querySelectorAll('line.is-on')).toHaveLength(0);
    expect(box.querySelector('.t')!.textContent).toBe('0:12');
    at(video, 3, 6);
    expect(box.querySelectorAll('line.is-on')).toHaveLength(17);
    expect(box.querySelector('.t')!.textContent).toBe('0:06');
    /* Uma passagem nova: o loop volta ao princípio, e o mostrador também. */
    at(video, 0.1, 6);
    expect(box.querySelectorAll('line.is-on')).toHaveLength(1);
    expect(box.querySelector('.t')!.textContent).toBe('0:12');
  });

  it('por cima do vídeo: reps, peso, anéis e o cartão do nome', () => {
    mount();
    const v = document.querySelector('.demo-viewer')!;
    const nums = v.querySelectorAll('.media-num');
    expect(nums[0].querySelector('.v')!.textContent).toBe('10-12');
    expect(nums[0].querySelector('.k')!.textContent).toBe(r.reps);
    expect(nums[1].querySelector('.v')!.textContent).toBe('60kg');
    expect(v.querySelectorAll('.demo-rings i').length).toBeGreaterThan(0);
    expect(v.querySelector('.media-name .n')!.textContent).toBe('Remada');
    expect(v.querySelector('.media-name .o')!.textContent).toBe('4 × 10-12');
  });

  /*
   * T5 (ele, 2026-09-27 21:30: "alguns vídeos estão a travar"): o fundo desfocado era uma
   * segunda cópia do vídeo, com blur a ecrã inteiro refeito em cada frame. Agora é a foto
   * do clipe — um só vídeo a descodificar.
   */
  it('um só vídeo: o fundo desfocado é a foto do clipe, não outro vídeo', () => {
    mount();
    expect(document.querySelectorAll('.demo-viewer video')).toHaveLength(1);
    const bg = document.querySelector<HTMLImageElement>('.demo-viewer > img.run-wide-bg');
    expect(bg?.getAttribute('src')).toBe(clip.poster);
    expect(bg?.getAttribute('alt')).toBe('');
  });

  /* T6 (ele, 2026-09-27): "não podem ser muito rápidos porque senão não se aprende nada". */
  it('passa a metade da velocidade', () => {
    mount();
    const video = document.querySelector<HTMLVideoElement>('.demo-viewer video')!;
    fireEvent.loadedMetadata(video);
    expect(video.playbackRate).toBe(0.5);
    expect(video.defaultPlaybackRate).toBe(0.5);
  });

  /* T6: "terminam quando o usuário fechar isso e não com tempo". */
  it('tocar no vídeo não o fecha, só o ✕', () => {
    const onClose = mount();
    const video = document.querySelector<HTMLVideoElement>('.demo-viewer video')!;
    fireEvent.click(video);
    fireEvent.click(document.querySelector('.demo-viewer')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  /* T6: "tem muitos leaks os vídeos" — ao fechar, o vídeo larga o ficheiro e o descodificador. */
  it('ao fechar, o vídeo para e larga a fonte', () => {
    const pause = vi.fn();
    HTMLMediaElement.prototype.pause = pause;
    const load = vi.fn();
    HTMLMediaElement.prototype.load = load;
    const { unmount } = render(
      <DemoViewer clip={clip} name="Remada" sets="4" reps="10" load="" onClose={vi.fn()} />,
    );
    const video = document.querySelector<HTMLVideoElement>('.demo-viewer video')!;
    pause.mockClear();
    unmount();
    expect(pause).toHaveBeenCalled();
    expect(load).toHaveBeenCalled();
    expect(video.querySelectorAll('source[src]')).toHaveLength(0);
  });

  it('não sabe gravar: não importa nada da camada de dados', () => {
    const src = readFileSync(join(__dirname, 'DemoViewer.tsx'), 'utf8');
    expect(src).not.toMatch(/data\/(mutations|queries)/);
  });
});

describe('o treino não liga o vídeo sozinho, e a demonstração repete-se até ao ✕', () => {
  const src = readFileSync(join(__dirname, 'RunSession.tsx'), 'utf8');

  it('RunSession decide a demonstração só por demoOn (pedido dele)', () => {
    expect(src).toMatch(/const demoing = demoOn\(/);
  });

  it('um só vídeo no palco, em loop, e o fim do clipe não abre as séries', () => {
    const demos = src.match(/<Demo\b[\s\S]*?\/>/g) ?? [];
    expect(demos).toHaveLength(1);
    expect(demos[0]).toMatch(/\bloop\b/);
    expect(demos[0]).not.toMatch(/onEnded/);
    expect(demos[0]).not.toMatch(/\bbackdrop\b/);
  });

  it('o fundo desfocado do palco é a foto do clipe (T5: o segundo vídeo fazia travar)', () => {
    expect(src).toMatch(/<img className="run-wide-bg" src=\{entry\.clip\.poster\}/);
  });

  it('tocar no ecrã não fecha a demonstração: não há botão de saltar (T6)', () => {
    expect(src).not.toMatch(/demo-skip/);
    expect(src).not.toMatch(/endDemo/);
  });

  it('com o vídeo a passar, o ✕ fecha só o vídeo e volta às séries', () => {
    expect(src).toMatch(/if \(replayFor !== null\) \{\s*closeDemo\(\);\s*return;/);
    expect(src).toMatch(/function closeDemo\(\) \{\s*setReplayFor\(null\);\s*setSheetOpen\(true\);/);
  });

  it('os anéis estão no palco e ligam-se com a demonstração', () => {
    expect(src).toMatch(/className="demo-rings"/);
    expect(src).toMatch(/demoing && 'is-demo'/);
  });
});
