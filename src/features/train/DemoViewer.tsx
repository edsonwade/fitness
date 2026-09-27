import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useT } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import type { Clip } from './clips';
import { Demo } from './DemoClip';
import { DialTicks } from './DialTicks';
import { demoDial } from './run-dial';

const KG = /(\d+(?:[.,]\d+)?)\s*kg/i;
const PER_HAND = /m[ãa]o|hand|mano|main/i;

/** Os segundos em m:ss, como o relógio do mostrador do Executar. */
function clock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * Ver como se faz, sem começar treino (B2 de `.claude/skills/demo-nao-marca-series/PLANO.md`,
 * skill `demonstracao-separada-do-treino`): "a pessoa pode ver um video antes de começar
 * os exercicios".
 *
 * O clipe a ecrã inteiro e ao alto, a repetir-se até ao ✕ — nunca fecha sozinho. Por cima,
 * o que a imagem da Ladder mostra, a mexer (skill `demonstracao-inteira-e-com-mostrador`,
 * como `proto/v2/03-treino.html` `#sheet-demo`): as reps, o mostrador de traços que acende
 * ao ritmo do vídeo com o relógio do que falta, o peso, os anéis a pulsar nas bordas e o
 * cartão do nome. As reps e o peso são a prescrição que o cartão do dia já mostra.
 *
 * O ✕ e o Esc só fecham. Não abre sessão, não conta tempo, não grava nada e não pergunta
 * nada — por isso não sabe nada da camada de dados. Vai para o `body` porque o cartão do
 * dia vive dentro de uma lista que se arrasta, e um `fixed` dentro de um `transform` não
 * cobre o ecrã.
 */
export function DemoViewer({
  clip,
  name,
  sets,
  reps,
  load,
  onClose,
}: {
  clip: Clip;
  name: string;
  sets: number | string;
  reps: string;
  /** A carga como o cartão a escreve ("60 kg a calibrar", "10 kg/mão"), ou nada. */
  load: string | null;
  onClose: () => void;
}) {
  const r = useT().run;
  const [fill, setFill] = useState({ lit: 0, left: 0 });
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function follow(t: number, d: number) {
    const next = demoDial(t, d);
    setFill((prev) => (prev.lit === next.lit && prev.left === next.left ? prev : next));
  }

  const kg = load ? KG.exec(load) : null;

  return createPortal(
    <div
      className={playing ? 'demo-viewer is-demo' : 'demo-viewer'}
      role="dialog"
      aria-modal="true"
      aria-label={`${r.replayDemo} · ${name}`}
      onPlaying={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
    >
      <Demo clip={clip} playing hold={false} label={name} backdrop loop />
      <Demo clip={clip} playing hold={false} label={name} loop onProgress={follow} />
      <div className="demo-rings" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="demo-viewer-top">
        <button type="button" className="btn btn-icon on-media" aria-label={r.demoClose} autoFocus onClick={onClose}>
          <Icon name="x" size={19} strokeWidth={2.2} />
        </button>
      </div>
      <div className="media-bottom">
        <div className="media-numbers">
          <div className="media-num">
            <p className="v">{reps}</p>
            <p className="k">{r.reps}</p>
          </div>
          <div className="media-dial">
            <DialTicks lit={fill.lit} />
            <p className="t" aria-live="off">
              {clock(fill.left)}
            </p>
          </div>
          <div className="media-num">
            <p className="v">
              {kg ? kg[1] : '—'}
              {kg ? <span className="u">kg</span> : null}
            </p>
            <p className="k">{load && PER_HAND.test(load) ? r.perHand : r.weight}</p>
          </div>
        </div>
        <div className="media-name">
          <span className="n">{name}</span>
          <span className="o">
            {sets} × {reps}
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
