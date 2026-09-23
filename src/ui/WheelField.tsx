import { useMemo } from 'react';

import { Wheel } from './Wheel';
import { SCALES, type ScaleKey, buildValues, nearestIndex } from './scales';

/**
 * A roda à vista, sem folha por cima — B4 de `.claude/skills/nutricao-sem-erros/PLANO.md`.
 *
 * Palavras dele, 2026-09-23: "não pode ser botão … tem que ter os valores já definidos e a
 * pessoa faz scroll e seleciona o que quer. Para colocar 100 kg demora muito." Substitui o
 * Stepper (− valor +) em todo o lado onde o número já vive dentro de uma folha.
 *
 * Uma escala com decimais (o peso de 100 em 100 g, a altura ao centímetro) parte-se em duas
 * colunas, inteiros e décimas, como o seletor do telemóvel: de 80 a 100 kg são 20 degraus e
 * não 200. Uma escala inteira é uma coluna só.
 */
export function WheelField({
  value,
  onChange,
  scale: scaleKey,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  scale: ScaleKey;
  label: string;
}) {
  const scale = SCALES[scaleKey];
  const split = scale.step < 1 && scale.dec > 0;

  const whole = useMemo(() => {
    if (!split) return buildValues(scale);
    const out: number[] = [];
    for (let v = Math.floor(scale.min); v <= Math.floor(scale.max); v++) out.push(v);
    return out;
  }, [scale, split]);
  /* As décimas em degraus inteiros: 0…9 para 0,1; 0…99 para 0,01; 0…1 para 0,5. */
  const parts = split ? Math.round(1 / scale.step) : 1;
  const fraction = useMemo(() => Array.from({ length: parts }, (_, k) => k), [parts]);

  const clamp = (v: number) => Math.round(Math.min(scale.max, Math.max(scale.min, v)) * 1000) / 1000;

  if (!split) {
    return (
      <Wheel
        values={whole}
        index={nearestIndex(whole, value)}
        onSelect={(i) => onChange(whole[i])}
        unit={scale.unit}
        dec={scale.dec}
        label={label}
      />
    );
  }

  const w = Math.floor(value + 1e-9);
  const k = Math.round((value - w) / scale.step) % parts;
  const digits = String(parts - 1).length;
  const fracLabel = (n: number) => String(Math.round(n * scale.step * 10 ** scale.dec)).padStart(digits, '0');

  return (
    <div className="wheelfield" role="group" aria-label={label}>
      <Wheel
        values={whole}
        index={nearestIndex(whole, w)}
        onSelect={(i) => onChange(clamp(whole[i] + k * scale.step))}
        unit=""
        dec={0}
        label={label}
      />
      <span className="wheelfield-sep" aria-hidden="true">
        ,
      </span>
      <Wheel
        values={fraction}
        index={k}
        onSelect={(i) => onChange(clamp(w + i * scale.step))}
        unit=""
        dec={0}
        label={`${label} (,${fracLabel(1)})`}
        format={fracLabel}
      />
      <span className="wheelfield-unit" aria-hidden="true">
        {scale.unit}
      </span>
    </div>
  );
}
