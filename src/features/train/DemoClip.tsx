import { useEffect, useRef } from 'react';

import { DEMO_RATE, type Clip } from './clips';

/**
 * A demonstração: o clipe local, parado no primeiro frame enquanto a contagem corre, e
 * a andar a partir do fim do "1". Com `loop` repete-se até ao ✕ — skill
 * `demonstracao-inteira-e-com-mostrador` (ele, 2026-09-27: "o vídeo de demonstração acaba
 * muito rápido"), que substitui o "passa UMA vez e fecha" do B1 de
 * `executar-demo-equipamento-ordem`. Sem `loop`, no fim chama `onEnded`.
 * `playing` é o único interruptor, e parado volta ao primeiro frame. O `<video>` é
 * remontado com a chave do exercício, por isso começa sempre do princípio. Com
 * movimento reduzido não arranca sozinho.
 *
 * T6 (ele, 2026-09-27): passa a `DEMO_RATE` (metade da velocidade) — "não podem ser muito
 * rápidos porque senão não se aprende nada" —, e ao desmontar larga o ficheiro e o
 * descodificador, para trocar de exercício muitas vezes não ir acumulando vídeos presos
 * em memória ("tem muitos leaks os vídeos").
 */
export function Demo({
  clip,
  playing,
  hold,
  label,
  loop = false,
  onEnded,
  onProgress,
}: {
  clip: Clip;
  playing: boolean;
  /** Em pausa ("Terminar treino?" aberto): para onde está, sem voltar ao princípio. */
  hold: boolean;
  label: string;
  /** Repete-se até ao ✕: nunca chega ao fim, e o mostrador dá uma volta por passagem. */
  loop?: boolean;
  /** O clipe chegou ao fim (só sem `loop`). */
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
  /*
   * Abrandado, e largado ao desmontar. Quem larga as fontes é quem as repõe: no
   * StrictMode o React monta, desmonta e volta a montar, e não repõe o `src` que o
   * cleanup tirou, porque para ele o atributo não mudou. Sem isto ficava só o poster
   * (B1 de `.claude/skills/demonstracao-inteira-e-com-mostrador/PLANO.md`, "os vídeos não
   * se movem, está imagem parada").
   */
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let restored = false;
    for (const source of video.querySelectorAll('source')) {
      const want = source.dataset.src;
      if (want && source.getAttribute('src') !== want) {
        source.setAttribute('src', want);
        restored = true;
      }
    }
    if (restored) video.load();
    const slow = () => {
      video.defaultPlaybackRate = DEMO_RATE;
      video.playbackRate = DEMO_RATE;
    };
    slow();
    video.addEventListener('loadedmetadata', slow);
    return () => {
      video.removeEventListener('loadedmetadata', slow);
      video.pause();
      for (const source of video.querySelectorAll('source')) source.removeAttribute('src');
      video.removeAttribute('src');
      video.load();
    };
  }, []);
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
    video.addEventListener('timeupdate', report);
    video.addEventListener('loadedmetadata', report);
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('playing', run);
      video.removeEventListener('pause', halt);
      video.removeEventListener('ended', halt);
      video.removeEventListener('seeked', report);
      video.removeEventListener('timeupdate', report);
      video.removeEventListener('loadedmetadata', report);
    };
  }, [follows]);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing && !hold) {
      video.playbackRate = DEMO_RATE;
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
  }, [playing, hold]);
  return (
    <video
      ref={ref}
      muted
      playsInline
      loop={loop}
      onEnded={onEnded}
      preload="auto"
      poster={clip.poster || undefined}
      aria-label={label}
    >
      {/* An uploaded clip has no webm twin, and may be a .mov: no type, the browser sniffs it. */}
      {clip.webm ? <source src={clip.webm} data-src={clip.webm} type="video/webm" /> : null}
      <source src={clip.mp4} data-src={clip.mp4} type={clip.webm ? 'video/mp4' : undefined} />
    </video>
  );
}
