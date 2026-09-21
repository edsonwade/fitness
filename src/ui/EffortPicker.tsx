import { EFFORT_STEPS, formatValue } from './scales';

/**
 * O ESFORÇO, EM DEGRAUS FIXOS. Nunca escrito.
 *
 * Portado de `.effortpicker` em `proto/v2/system.css` e da fila de degraus de
 * `proto/v2/00-sistema.html`. Oito degraus e não uma escala contínua, porque é
 * assim que o RPE se usa a sério: ninguém distingue 8,2 de 8,3 com a barra ainda na
 * mão, e um campo que deixe escrever 8,27 finge uma precisão que não existe.
 *
 * Os degraus são os do protótipo, tal e qual — **6 a 9 de meio em meio, e depois o
 * 10**. Não há 9,5: quem está a 9,5 diz 10, e o degrau que faltava era o que fazia a
 * fila transbordar num ecrã de 360px.
 *
 * `role="radiogroup"` com `aria-checked`, como a roda. Uma escolha entre opções.
 */

export function EffortPicker({
  value,
  onChange,
  label = 'Esforço',
}: {
  /** O degrau escolhido, ou `null` enquanto o esforço não foi dito. */
  value: number | null;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <div className="effortpicker" role="radiogroup" aria-label={label}>
      {EFFORT_STEPS.map((step) => (
        <button
          key={step}
          type="button"
          role="radio"
          aria-checked={value === step}
          onClick={() => onChange(step)}
        >
          {formatValue(step, 1)}
        </button>
      ))}
    </div>
  );
}
