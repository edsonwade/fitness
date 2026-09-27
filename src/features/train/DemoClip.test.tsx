// @vitest-environment jsdom
import { StrictMode } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Clip } from './clips';
import { Demo } from './DemoClip';

/*
 * B1 de .claude/skills/demonstracao-inteira-e-com-mostrador/PLANO.md (ele, 2026-09-27):
 * "os vídeos não se movem, está imagem parada". O cleanup da T6 tirava o src aos
 * <source>, e na segunda montagem do StrictMode o React não o repunha: ficava o poster.
 */
const clip = { mp4: '/video/ex-x.mp4', webm: '/video/ex-x.webm', poster: '/video/ex-x.jpg' } as Clip;

const play = vi.fn(() => Promise.resolve());
beforeEach(() => {
  HTMLMediaElement.prototype.play = play;
  HTMLMediaElement.prototype.pause = () => {};
  HTMLMediaElement.prototype.load = () => {};
});
afterEach(() => {
  cleanup();
  play.mockClear();
});

function sources(video: HTMLVideoElement) {
  return Array.from(video.querySelectorAll('source')).map((s) => s.getAttribute('src'));
}

describe('a demonstração mexe-se', () => {
  it('em StrictMode o vídeo fica com as fontes e toca', () => {
    const { container } = render(
      <StrictMode>
        <Demo clip={clip} playing hold={false} label="demo" loop />
      </StrictMode>,
    );
    const video = container.querySelector('video')!;
    expect(sources(video)).toEqual(['/video/ex-x.webm', '/video/ex-x.mp4']);
    expect(play).toHaveBeenCalled();
    expect(video.playbackRate).toBe(0.5);
  });

  it('fechar a sério continua a largar o vídeo', () => {
    const { container, unmount } = render(<Demo clip={clip} playing hold={false} label="demo" loop />);
    const video = container.querySelector('video')!;
    unmount();
    expect(sources(video)).toEqual([null, null]);
  });
});
