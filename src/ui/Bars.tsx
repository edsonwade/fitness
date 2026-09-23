import { useState } from 'react';

/**
 * O gráfico de barras do protótipo (`.bars` de `proto/v2/05-progresso.html`).
 *
 * Uma série só. Todas as barras neutras (`is-ghost`) menos uma, a volt: a mais recente, ou
 * a que se tocou para ler. O eixo começa no zero — a altura é a proporção do máximo, sem
 * exagerar a subida. O `aria-label` diz os valores por extenso, e tocar numa barra mostra o
 * valor dela por cima do gráfico.
 */
export function Bars({
  points,
  label,
  format,
  height,
}: {
  points: readonly { x: string; value: number }[];
  /** O que o gráfico é, com a unidade — é também o princípio do `aria-label`. */
  label: string;
  format: (value: number) => string;
  height?: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.value), 0) || 1;
  const active = picked ?? points.length - 1;

  return (
    <div>
      <p className="body-2 muted tabular" aria-live="polite">
        {points[active].x} · {format(points[active].value)}
      </p>
      <div
        className="bars mt-2"
        style={height ? { height } : undefined}
        role="img"
        aria-label={`${label}: ${points.map((p) => format(p.value)).join(', ')}`}
      >
        {points.map((p, i) => (
          <div key={`${p.x}-${i}`}>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className={i === active ? 'b' : 'b is-ghost'}
              style={{ height: `${Math.max(2, (p.value / max) * 100)}%`, border: 0, padding: 0, cursor: 'pointer' }}
              onClick={() => setPicked(i)}
            />
            <span className="x">{p.x}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
