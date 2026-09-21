import { formatValue } from './scales';

/**
 * OS CHIPS DE VALOR: a prescrição e a última sessão, a um toque.
 *
 * Portado de `.presetrow` / `.preset` em `proto/v2/system.css`. É a peça que faz com
 * que, na maior parte das séries, ninguém precise sequer da roda: o valor que o
 * programa manda e o valor que o histórico sugere estão ali, e tocar num deles
 * acaba a escolha.
 *
 * DUAS NOTAS, E A DIFERENÇA ENTRE ELAS É O PRODUTO INTEIRO:
 *
 * - **prescrito** — vem do programa autorado. É o que o plano diz.
 * - **sugerido** — vem do teu histórico. É o que o registo propõe.
 *
 * Quando os dois aparecem juntos, manda o prescrito enquanto ninguém tocar no outro:
 * uma sugestão é uma sugestão, não uma alteração ao plano. Quem escreve a nota é
 * quem chama esta peça, e a nota é obrigatória quando há mais do que um chip — sem
 * ela, dois números iguais em dois chips não se distinguem.
 *
 * `aria-pressed` carrega o estado, e é ele que a folha usa para pintar o chip
 * escolhido a accent. Dentro do chip escolhido a nota passa a tinta do accent: era
 * volt sobre volt, e portanto invisível, até 2026-09-13.
 */

export type Preset = {
  value: number;
  /** "prescrito", "sugerido". Maiúsculas pequenas são do CSS, não se escrevem aqui. */
  note?: string;
};

export function PresetRow({
  options,
  selected,
  onPick,
  unit,
  dec,
  label,
}: {
  options: Preset[];
  /** O valor escolhido, ou `null` enquanto ninguém tocou em nenhum. */
  selected: number | null;
  onPick: (value: number) => void;
  unit: string;
  dec: number;
  label: string;
}) {
  if (options.length === 0) return null;

  return (
    <div className="presetrow" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={`${o.value}-${o.note ?? ''}`}
          type="button"
          className="preset"
          aria-pressed={selected === o.value}
          onClick={() => onPick(o.value)}
        >
          {formatValue(o.value, dec)}
          {unit ? <span className="u">{unit}</span> : null}
          {o.note ? <span className="preset-note">{o.note}</span> : null}
        </button>
      ))}
    </div>
  );
}
