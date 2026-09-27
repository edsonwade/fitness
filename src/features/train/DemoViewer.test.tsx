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
    at(video, 0, 6);
    expect(box.querySelectorAll('line.is-on')).toHaveLength(0);
    expect(box.querySelector('.t')!.textContent).toBe('0:06');
    at(video, 3, 6);
    expect(box.querySelectorAll('line.is-on')).toHaveLength(17);
    expect(box.querySelector('.t')!.textContent).toBe('0:03');
    /* Uma passagem nova: o loop volta ao princípio, e o mostrador também. */
    at(video, 0.1, 6);
    expect(box.querySelectorAll('line.is-on')).toHaveLength(1);
    expect(box.querySelector('.t')!.textContent).toBe('0:06');
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

  it('os dois vídeos do palco estão em loop, e o fim do clipe não abre as séries', () => {
    const demos = src.match(/<Demo\b[\s\S]*?\/>/g) ?? [];
    expect(demos).toHaveLength(2);
    for (const d of demos) {
      expect(d).toMatch(/\bloop\b/);
      expect(d).not.toMatch(/onEnded/);
    }
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
