// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyFor } from '../../i18n';
import { DemoViewer } from './DemoViewer';

/*
 * B2 de .claude/skills/demo-nao-marca-series/PLANO.md (skill demonstracao-separada-do-treino):
 * "a pessoa pode ver um video antes de começar os exercicios". Ver o vídeo não começa
 * treino, não grava e não pergunta nada: o ✕ fecha, e o fim do clipe fecha.
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
  render(<DemoViewer clip={clip} name="Remada" onClose={onClose} />);
  return onClose;
}

describe('DemoViewer — ver o vídeo sem começar treino', () => {
  it('o ✕ só fecha o vídeo', () => {
    const onClose = mount();
    fireEvent.click(screen.getByRole('button', { name: r.demoClose }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(r.quitTitle)).toBeNull();
  });

  it('o fim do clipe fecha, e o clipe não repete', () => {
    const onClose = mount();
    const video = document.querySelector('video')!;
    expect(video.loop).toBe(false);
    fireEvent.ended(video);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não sabe gravar: não importa nada da camada de dados', () => {
    const src = readFileSync(join(__dirname, 'DemoViewer.tsx'), 'utf8');
    expect(src).not.toMatch(/data\/(mutations|queries)/);
  });
});

describe('o treino não liga o vídeo sozinho', () => {
  it('RunSession decide a demonstração só por demoOn (pedido dele)', () => {
    const src = readFileSync(join(__dirname, 'RunSession.tsx'), 'utf8');
    expect(src).toMatch(/const demoing = demoOn\(/);
  });
});
