import { useEffect, useRef } from 'react';

import type { Clip } from './clips';

/**
 * A demonstração: o clipe local, parado no primeiro frame enquanto a contagem corre, e
 * a andar a partir do fim do "1". Passa UMA vez e fecha — bug B1 de
 * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`: "é para demonstrar o
 * exercício antes de iniciar e depois ele fecha". Sem `loop`; no fim, `onEnded`.
 * `playing` é o único interruptor, e parado volta ao primeiro frame. O `<video>` é
 * remontado com a chave do exercício, por isso começa sempre do princípio. Com
 * movimento reduzido não arranca sozinho.
 */
export function Demo({
  clip,
  playing,
  hold,
  label,
  backdrop = false,
  onEnded,
  onProgress,
}: {
  clip: Clip;
  playing: boolean;
  /** Em pausa ("Terminar treino?" aberto): para onde está, sem voltar ao princípio. */
  hold: boolean;
  label: string;
  /**
   * A cópia desfocada que enche a janela por trás do clipe inteiro, a partir de 1024px
   * (erro 3). Abaixo disso o CSS esconde-a. Não se anuncia: é o mesmo vídeo.
   */
  backdrop?: boolean;
  /** O clipe chegou ao fim: a demonstração fecha. */
  onEnded?: () => void;
  /**
   * Onde o clipe vai, em segundos, enquanto anda — o mostrador enche com ele (B8 de
   * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`). Pausado, não chama.
   */
  onProgress?: (t: number, d: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(onProgress);
  useEffect(() => {
    progressRef.current = onProgress;
  });
  const follows = onProgress !== undefined;
  useEffect(() => {
    const video = ref.current;
    if (!video || !follows) return;
    let raf = 0;
    const report = () => progressRef.current?.(video.currentTime, video.duration);
    const loop = () => {
      report();
      raf = requestAnimationFrame(loop);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const halt = () => {
      cancelAnimationFrame(raf);
      report();
    };
    video.addEventListener('playing', run);
    video.addEventListener('pause', halt);
    video.addEventListener('ended', halt);
    video.addEventListener('seeked', report);
    video.addEventListener('loadedmetadata', report);
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('playing', run);
      video.removeEventListener('pause', halt);
      video.removeEventListener('ended', halt);
      video.removeEventListener('seeked', report);
      video.removeEventListener('loadedmetadata', report);
    };
  }, [follows]);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    /* A cópia desfocada só se vê a partir de 1024px; abaixo disso não gasta bateria. */
    if (backdrop && !window.matchMedia?.('(min-width: 1024px)').matches) {
      video.pause();
      return;
    }
    if (playing && !hold) {
      video.play().catch(() => {});
    } else if (hold) {
      video.pause();
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* ainda sem metadados: já está no princípio */
      }
    }
  }, [playing, hold, backdrop]);
  return (
    <video
      ref={ref}
      className={backdrop ? 'run-wide-bg' : undefined}
      muted
      playsInline
      onEnded={onEnded}
      preload={backdrop ? 'metadata' : 'auto'}
      poster={clip.poster || undefined}
      aria-label={backdrop ? undefined : label}
      aria-hidden={backdrop || undefined}
    >
      {/* An uploaded clip has no webm twin, and may be a .mov: no type, the browser sniffs it. */}
      {clip.webm ? <source src={clip.webm} type="video/webm" /> : null}
      <source src={clip.mp4} type={clip.webm ? 'video/mp4' : undefined} />
    </video>
  );
}
