import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';

import { ITEM_H, SETTLE_MS, centred, clampIndex, dragPos, tapResult, wheelStep } from './chip-wheel';

/**
 * O chip do equipamento É a roda — erro 2 e bug B1 de
 * `.claude/skills/executar-quatro-erros-do-browser/PLANO.md`, portados de `wheelSetup`
 * em `proto/v2/04-executar.html`.
 *
 * Palavras dele: "é estar no barbell e fazer scroll com a mão ou dedo e vai aparecendo os
 * outros, e depois clica… aquelas setas de dentro é assim." Não se abre painel nenhum.
 *
 * - a roda do rato e o trackpad: um passo por ~40px, com `preventDefault` num listener
 *   que não é passivo, para a folha não rolar por baixo;
 * - o dedo e o rato arrastam, com a captura do ponteiro no PRÓPRIO chip;
 * - o toque decide-se no `pointerup`: numa candidata escolhe, senão avança uma;
 * - ↑↓ passam uma a uma, Enter e Espaço escolhem.
 *
 * Parada numa que ainda não é a escolhida, o contorno fica volt; escolher dá um lampejo.
 */
export function ChipWheel({
  options,
  value,
  label,
  onPick,
}: {
  options: readonly string[];
  value: string | null;
  label: string;
  onPick: (option: string) => void;
}) {
  const id = useId();
  const last = options.length - 1;
  const chosen = Math.max(0, value === null ? 0 : options.indexOf(value));
  const [pos, setPos] = useState(chosen);
  const [rolling, setRolling] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const acc = useRef(0);
  const posRef = useRef(pos);
  const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null);
  const quiet = useRef<number | undefined>(undefined);
  const flash = useRef<number | undefined>(undefined);

  /*
   * A escolha gravada mudou, ou as opções: a roda assenta nela. Antes, `pos` só se lia
   * na primeira vez, e a roda ficava numa opção com a escolha noutra — o toque seguinte
   * escolhia a errada (B2 de `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`).
   */
  const sig = `${chosen}|${options.join('|')}`;
  const [seen, setSeen] = useState(sig);
  if (seen !== sig) {
    setSeen(sig);
    setPos(chosen);
  }

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(
    () => () => {
      window.clearTimeout(quiet.current);
      window.clearTimeout(flash.current);
    },
    [],
  );

  const centre = centred(pos, last);

  function go(i: number) {
    setPos(clampIndex(i, last));
    setRolling(true);
    window.clearTimeout(quiet.current);
    quiet.current = window.setTimeout(() => setRolling(false), SETTLE_MS);
  }
  function pick(i: number) {
    setPos(i);
    setRolling(false);
    setPicked(true);
    window.clearTimeout(flash.current);
    flash.current = window.setTimeout(() => setPicked(false), 650);
    if (i !== chosen) onPick(options[i]);
  }
  function tap() {
    const result = tapResult(centred(posRef.current, last), chosen, last);
    if ('pick' in result) pick(result.pick);
    else go(result.go);
  }

  /* A roda do rato tem de poder chamar `preventDefault`: o `onWheel` do React é passivo. */
  const wheelRef = useRef<(event: WheelEvent) => void>(() => {});
  useEffect(() => {
    wheelRef.current = (event: WheelEvent) => {
      event.preventDefault();
      const r = wheelStep(acc.current, event.deltaY, event.deltaMode);
      acc.current = r.acc;
      if (r.step !== 0) go(centred(posRef.current, last) + r.step);
    };
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => wheelRef.current(event);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(
        'chip chip-wheel',
        rolling && 'is-rolling',
        dragging && 'is-dragging',
        !rolling && !dragging && !picked && centre !== chosen && 'is-candidate',
        picked && 'is-picked',
      )}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`${id}-${centre}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        drag.current = { y: event.clientY, start: posRef.current, moved: false };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const d = drag.current;
        if (!d) return;
        const dy = event.clientY - d.y;
        if (!d.moved && Math.abs(dy) < 5) return;
        d.moved = true;
        setRolling(true);
        setPos(dragPos(d.start, dy, last));
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        setDragging(false);
        if (!d) return;
        if (d.moved) go(Math.round(posRef.current));
        else tap();
      }}
      onPointerCancel={() => {
        const d = drag.current;
        drag.current = null;
        setDragging(false);
        if (d) go(Math.round(posRef.current));
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          go(centre + 1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          go(centre - 1);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          pick(centre);
        }
      }}
    >
      <div className="wheel-roll">
        <div className="wheel-track" style={{ transform: `translateY(${-pos * ITEM_H}px)` }}>
          {options.map((option, i) => (
            <div
              key={option}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === chosen}
              className={clsx('wheel-opt', i === centre && 'is-centre')}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
