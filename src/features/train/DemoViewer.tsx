import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useT } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import type { Clip } from './clips';
import { Demo } from './DemoClip';

/**
 * Ver como se faz, sem começar treino (B2 de `.claude/skills/demo-nao-marca-series/PLANO.md`,
 * skill `demonstracao-separada-do-treino`): "a pessoa pode ver um video antes de começar
 * os exercicios".
 *
 * O clipe a ecrã inteiro e ao alto, uma vez, e fecha no fim. O ✕ e o Esc só fecham. Não
 * abre sessão, não conta tempo, não grava nada e não pergunta nada — por isso não sabe
 * nada da camada de dados. Vai para o `body` porque o cartão do dia vive dentro de uma
 * lista que se arrasta, e um `fixed` dentro de um `transform` não cobre o ecrã.
 */
export function DemoViewer({ clip, name, onClose }: { clip: Clip; name: string; onClose: () => void }) {
  const r = useT().run;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="demo-viewer" role="dialog" aria-modal="true" aria-label={`${r.replayDemo} · ${name}`}>
      <Demo clip={clip} playing hold={false} label={name} onEnded={onClose} />
      <div className="demo-viewer-top">
        <button type="button" className="btn btn-icon on-media" aria-label={r.demoClose} autoFocus onClick={onClose}>
          <Icon name="x" size={19} strokeWidth={2.2} />
        </button>
        <p className="demo-viewer-name">{name}</p>
      </div>
    </div>,
    document.body,
  );
}
