import { SCALES, type ScaleKey, formatValue, stepValue } from './scales';

/**
 * O STEPPER: o mesmo valor, pelo incremento de disco.
 *
 * Portado de `.stepper` em `proto/v2/system.css` e do comportamento em
 * `proto/v2/proto.js`. Onde a roda serve para saltar de 40 para 80, isto serve para
 * ir de 60 para 62,5 — o ajuste pequeno que se faz com o telemóvel numa mão.
 *
 * **O degrau é o degrau real da coisa**, e vem da escala: 2,5 kg (o par de discos de
 * 1,25), 1 repetição, meio ponto de RPE. Quem chamar pode apertar o degrau
 * (`step`), mas nunca deixar escrever um valor que não exista.
 *
 * `role="spinbutton"` com `aria-valuenow` e `aria-valuetext`: o leitor de ecrã diz
 * "62,5 kg", não "62.5". E as setas cima/baixo no próprio valor fazem o que os dois
 * botões fazem — é isso que o torna um spinbutton verdadeiro e não dois botões com
 * um número no meio.
 *
 * Os botões desligam-se nos extremos em vez de deixarem carregar sem efeito: um
 * botão que não faz nada é um botão que parece avariado.
 */

export function Stepper({
  value,
  onChange,
  scale: scaleKey = 'kg',
  step,
  label,
  size = 'md',
}: {
  value: number;
  onChange: (value: number) => void;
  scale?: ScaleKey;
  /** Degrau à medida. Por omissão, o degrau real da escala. */
  step?: number;
  label: string;
  size?: 'md' | 'sm';
}) {
  const scale = SCALES[scaleKey];
  const by = step ?? scale.step;
  const atMin = value <= scale.min;
  const atMax = value >= scale.max;
  const spoken = `${formatValue(value, scale.dec)}${scale.unit ? ` ${scale.unit}` : ''}`;

  function nudge(direction: 1 | -1) {
    const next = stepValue(value, direction, scale, by);
    if (next !== value) onChange(next);
  }

  return (
    <div>
      <div className={size === 'sm' ? 'stepper stepper-sm' : 'stepper'}>
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={atMin}
          aria-label={`Menos ${formatValue(by, scale.dec)}${scale.unit ? ` ${scale.unit}` : ''}`}
        >
          &minus;
        </button>
        <span
          className="stepper-value"
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={scale.min}
          aria-valuemax={scale.max}
          aria-valuenow={value}
          aria-valuetext={spoken}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              nudge(1);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              nudge(-1);
            }
          }}
        >
          {formatValue(value, scale.dec)}
          {scale.unit ? <span className="u">{scale.unit}</span> : null}
        </span>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={atMax}
          aria-label={`Mais ${formatValue(by, scale.dec)}${scale.unit ? ` ${scale.unit}` : ''}`}
        >
          +
        </button>
      </div>
      <p className="stepper-step" aria-hidden="true">
        {formatValue(by, scale.dec)}
        {scale.unit ? ` ${scale.unit}` : ''}
      </p>
    </div>
  );
}
