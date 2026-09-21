import { useEffect, useRef } from 'react';

import { formatValue } from './scales';

/**
 * A RODA. É isto que substitui o teclado numérico.
 *
 * Portada de `proto/v2/proto.js` e de `.wheel` em `proto/v2/system.css`. Uma coluna
 * de valores com encaixe (`scroll-snap`), a janela de seleção fixa no meio, e o
 * valor do centro é o escolhido. Rola-se com o polegar, sem olhar para as teclas.
 *
 * TRÊS COISAS QUE NÃO SE PODEM PERDER NUM PORTE:
 *
 * 1. **`role="radiogroup"` com `aria-checked` em cada degrau.** Quem usa leitor de
 *    ecrã tem de ouvir uma escolha entre opções, não uma lista de botões.
 * 2. **As setas do teclado físico.** Cima/baixo andam um degrau, Home e End vão aos
 *    extremos, Enter confirma. Sem isto a peça fica só para dedos, e o requisito de
 *    acessibilidade do plano pede a alternativa.
 * 3. **O assentar.** O `scroll` dispara dezenas de vezes por gesto; só quando para
 *    60ms é que se lê o centro. Ler a cada frame faz a seleção tremer e gasta
 *    bateria por nada.
 *
 * As almofadas de cima e de baixo (`.wheel-pad`, 78px = metade da altura menos meia
 * linha) existem para o primeiro e o último valor conseguirem chegar ao centro.
 *
 * É controlada: não guarda o valor, recebe o índice e devolve o novo. Quem confirma
 * é quem a abriu.
 */

/** A altura de um degrau, em pixéis. Tem de bater certo com `.wheel-opt` no CSS. */
const OPT_H = 52;

export function Wheel({
  values,
  index,
  onSelect,
  unit,
  dec,
  label,
  onConfirm,
}: {
  values: number[];
  index: number;
  onSelect: (index: number) => void;
  unit: string;
  dec: number;
  label: string;
  /** Enter na roda confirma, como no protótipo. */
  onConfirm?: () => void;
}) {
  const wheel = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /*
   * Enquanto a roda anda sozinha até ao degrau escolhido, o `scroll` que ela própria
   * provoca não pode ser lido como uma escolha nova: dava um pingue-pongue entre o
   * degrau pedido e o que estava a passar.
   */
  const programmatic = useRef(false);

  /* Abrir já no degrau certo, sem animação: ninguém pediu para ver a roda a voar. */
  useEffect(() => {
    const el = wheel.current;
    if (!el) return;
    programmatic.current = true;
    el.scrollTop = index * OPT_H;
    const id = setTimeout(() => {
      programmatic.current = false;
    }, 80);
    return () => clearTimeout(id);
    // Só na montagem: daqui para a frente quem manda no scroll é o gesto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearTimeout(settle.current), []);

  function scrollTo(i: number) {
    const el = wheel.current;
    if (!el) return;
    programmatic.current = true;
    el.scrollTo({
      top: i * OPT_H,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      programmatic.current = false;
    }, 320);
  }

  function move(to: number) {
    const i = Math.max(0, Math.min(values.length - 1, to));
    onSelect(i);
    scrollTo(i);
  }

  function onScroll() {
    if (programmatic.current) return;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = wheel.current;
      if (!el) return;
      const i = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / OPT_H)));
      if (i !== index) onSelect(i);
    }, 60);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      move(index + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      move(index - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(values.length - 1);
    } else if (onConfirm && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onConfirm();
    }
  }

  return (
    <div className="wheel-frame">
      <div className="wheel-window" aria-hidden="true" />
      <div
        ref={wheel}
        className="wheel"
        role="radiogroup"
        aria-label={label}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
      >
        <div className="wheel-pad" aria-hidden="true" />
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            className="wheel-opt"
            role="radio"
            tabIndex={-1}
            aria-checked={i === index}
            onClick={() => move(i)}
          >
            {formatValue(v, dec)}
            {unit ? <span className="u">{unit}</span> : null}
          </button>
        ))}
        <div className="wheel-pad" aria-hidden="true" />
      </div>
    </div>
  );
}
