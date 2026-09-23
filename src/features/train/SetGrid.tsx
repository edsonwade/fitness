import clsx from 'clsx';

import { useT } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import type { Preset } from '../../ui/PresetRow';
import { ValuePill } from '../../ui/ValuePill';
import type { ScaleKey } from '../../ui/scales';

/**
 * A TABELA DE CINCO COLUNAS. Uma linha por série prescrita.
 *
 * Portada de `proto/v2/04-executar.html`, a `.setgrid` que vive dentro da folha das
 * séries do frame 4 — as mesmas cinco colunas pela mesma ordem: **Registar, Descanso,
 * Esforço, Reps, Peso**. O CSS já estava em produção desde o porte do sistema v2
 * (`.setgrid`, `.valuepill`, `.set-check`), por isso aqui não nasce estilo nenhum: o
 * que nasce é a linha que lê a prescrição e o registo.
 *
 * CADA CÉLULA ABRE A RODA, E CADA SÉRIE GUARDA OS SEUS NÚMEROS
 *
 * Descanso, esforço, reps e peso são `ValuePill` — tocar abre a roda, nunca o teclado.
 * O que se escolhe grava-se **nesta série** e em mais nenhuma (`exercise_logs.sets`,
 * migração `014`): a série 1 a 60 kg e a série 3 a 62,5 kg são duas linhas diferentes,
 * e é essa a forma da fotografia dele. O visto da primeira coluna é o `.set-check-tap`
 * de 44px do protótipo, e marcar uma série é o que põe o descanso a correr.
 *
 * Um número que ainda é só plano — nem esta série nem o exercício o gravaram — fica
 * a tracejado, com o valor prescrito à vista.
 *
 * As três marcas de estado são as do protótipo, e cada uma diz uma coisa:
 *
 * - `is-done` na linha — a série está no registo;
 * - `is-now` na linha — é a próxima a fazer: fundo azeitonado e barra volt à esquerda;
 * - `is-empty` na célula — **por preencher**, com a borda a tracejado. Um travessão e
 *   não um zero, porque zero é um valor e vazio não é.
 */

/** Os quatro números de uma série, pelo nome que têm em `exercise_logs.sets`. */
export type SetField = 'rest' | 'rpe' | 'reps' | 'weight';

export type SetRow = {
  /** O descanso — o desta série se o houver, senão o prescrito, em segundos. */
  rest: number;
  /** O esforço em RPE. `null` quando nem a série nem a prescrição o dizem em número. */
  rpe: number | null;
  /** As reps — as desta série, senão as do exercício, senão as prescritas. */
  reps: number | null;
  /** O peso, pela mesma ordem que as reps. */
  weight: number | null;
  /** Que números vieram do registo, e não do plano. O resto desenha-se a tracejado. */
  logged: Record<SetField, boolean>;
  /** Esta série está feita. */
  done: boolean;
};

/**
 * Uma célula da grelha. A pílula por baixo é a mesma `ValuePill` do registo inteiro da
 * app; o que esta função acrescenta é o tracejado de *por cumprir* quando o número ainda
 * é o do plano, que é a convenção da fotografia dele.
 */
function Cell({
  value,
  scale,
  unit,
  title,
  presets,
  volt,
  pending,
  onChange,
}: {
  value: number | null;
  scale: ScaleKey;
  unit?: string;
  title: string;
  presets?: Preset[];
  volt?: boolean;
  pending: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <ValuePill
      value={value}
      scale={scale}
      unit={unit}
      title={title}
      presets={presets}
      variant={volt ? 'volt' : undefined}
      className={clsx(pending && value !== null && 'is-empty')}
      onChange={onChange}
    />
  );
}

export function SetGrid({
  rows,
  /** A série a decorrer: a primeira por fazer. `-1` quando já não há nenhuma. */
  current,
  label,
  presets,
  onTick,
  onPick,
}: {
  rows: readonly SetRow[];
  current: number;
  label: string;
  /** As sugestões da roda por coluna — o prescrito e os seus vizinhos. */
  presets: Partial<Record<SetField, Preset[]>>;
  onTick: (index: number) => void;
  onPick: (index: number, field: SetField, value: number) => void;
}) {
  const copy = useT();
  const t = copy.train;
  const r = copy.run;

  return (
    <table className="setgrid" aria-label={label}>
      <thead>
        <tr>
          {/* Cabeçalhos próprios e curtos, para caberem a 360 px nas quatro línguas —
              correção da tarefa 5, medida no protótipo a 0 cortes. */}
          <th scope="col" className="is-current">
            {r.colLog}
          </th>
          <th scope="col">{r.colRest}</th>
          <th scope="col">{r.colEffort}</th>
          <th scope="col">{r.colReps}</th>
          <th scope="col">{r.colWeight}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const set = `${t.setLabel} ${i + 1}`;
          return (
            <tr key={i} className={clsx(row.done && 'is-done', i === current && 'is-now')}>
              <td>
                <button
                  type="button"
                  className="set-check-tap"
                  aria-pressed={row.done}
                  aria-label={row.done ? `${set} · ${r.setDone}` : `${r.markSet} ${i + 1}`}
                  onClick={() => onTick(i)}
                >
                  <span className={clsx('set-check', row.done && 'is-on')} aria-hidden="true">
                    <Icon name="check" size={15} strokeWidth={3} />
                  </span>
                </button>
              </td>
              <td>
                <Cell
                  value={row.rest}
                  scale="seg"
                  title={`${t.rest} · ${set}`}
                  pending={!row.logged.rest}
                  onChange={(v) => onPick(i, 'rest', v)}
                />
              </td>
              <td>
                <Cell
                  value={row.rpe}
                  scale="rpe"
                  unit={t.rpe}
                  title={`${copy.common.effort} · ${set}`}
                  presets={presets.rpe}
                  volt
                  pending={!row.logged.rpe}
                  onChange={(v) => onPick(i, 'rpe', v)}
                />
              </td>
              <td>
                <Cell
                  value={row.reps}
                  scale="reps"
                  title={`${t.reps} · ${set}`}
                  presets={presets.reps}
                  pending={!row.logged.reps}
                  onChange={(v) => onPick(i, 'reps', v)}
                />
              </td>
              <td>
                <Cell
                  value={row.weight}
                  scale="kg"
                  title={`${t.weight} · ${set}`}
                  presets={presets.weight}
                  pending={!row.logged.weight}
                  onChange={(v) => onPick(i, 'weight', v)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
