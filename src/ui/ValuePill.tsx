import { useState, type ReactNode } from 'react';
import clsx from 'clsx';

import { useT } from '../i18n/locale-context';

import { PresetRow, type Preset } from './PresetRow';
import { Sheet } from './Sheet';
import { Wheel } from './Wheel';
import { SCALES, type ScaleKey, buildValues, formatValue, nearestIndex } from './scales';

/**
 * A CÉLULA TOCÁVEL. É ela que substitui o campo numérico.
 *
 * Portada de `.valuepill` em `proto/v2/system.css`. Cada peso, cada repetição, cada
 * descanso e cada esforço da grelha de registo é uma destas. Tocar abre a roda;
 * **nunca abre o teclado**, e não há caminho nenhum daqui para um `<input>`.
 *
 * A regra que isto cumpre é de 2026-09-12, palavras dele: *"não inserires pesos e
 * reps com a mão; deve existir já peso e o utilizador seleciona"*. Por isso zero
 * `type="number"`, zero `inputmode="numeric"`, zero `inputmode="decimal"` — e há um
 * grep no portão do porte a garantir que continua assim.
 *
 * TRÊS ESTADOS, todos do protótipo:
 *
 * - normal — o valor, com o sufixo pequeno ao lado;
 * - `is-empty` — ainda não há valor: um travessão e a borda a tracejado, que se lê
 *   como *por preencher* e não como zero. **Zero é um valor; vazio não é**;
 * - `is-volt` — o esforço, que é o número que se lê de relance a meio da série.
 *
 * ONDE FOI PARAR A `.picker-layer`
 *
 * No protótipo, a roda abre dentro de uma `.picker-layer` — uma classe SEM regra de
 * CSS nenhuma, que é âncora de JS e muda entre `position: absolute` (dentro do
 * telefone) e `fixed` (sobre o body). A skill do porte manda **portar a decisão, não
 * o nome**: em React a camada é o `<Sheet>`, que já traz o que o protótipo tinha de
 * imitar à mão — foco preso, Escape a fechar, o foco a voltar a esta pílula, a
 * página de trás sem rolar, e o `aria-modal` com o título ligado. Não se escreveu
 * uma `.picker-layer` em `src/`: quem a procurar não a vai encontrar, e é de
 * propósito.
 */

export function ValuePill({
  value,
  onChange,
  scale: scaleKey = 'kg',
  title,
  unit,
  presets = [],
  variant,
  disabled,
  className,
  trigger,
}: {
  /** `null` é *por preencher*. Zero é zero, e mostra-se como zero. */
  value: number | null;
  onChange: (value: number) => void;
  scale?: ScaleKey;
  /** O que a roda pergunta: "Peso da série 2", "Esforço". Vai para o leitor de ecrã. */
  title: string;
  /** Sufixo à medida. Por omissão, o da escala. Vazio esconde-o. */
  unit?: string;
  /** O prescrito do programa e o sugerido do histórico, quando existirem. */
  presets?: Preset[];
  variant?: 'volt';
  disabled?: boolean;
  className?: string;
  /**
   * Outro botão no lugar da pílula, para a mesma roda. É o número grande do peso no
   * ecrã Executar (tarefa 7): tocar-lhe abre esta roda, e não uma segunda cópia dela.
   */
  trigger?: (pill: { shown: string; suffix: string; label: string; open: () => void }) => ReactNode;
}) {
  const t = useT();
  const scale = SCALES[scaleKey];
  const suffix = unit ?? scale.unit;
  const values = buildValues(scale);

  const [open, setOpen] = useState(false);
  /* O que a roda está a mostrar agora. Só sai daqui para fora ao Confirmar. */
  const [draft, setDraft] = useState(0);

  function openPicker() {
    setDraft(nearestIndex(values, value ?? scale.min));
    setOpen(true);
  }

  function confirm() {
    onChange(values[draft]);
    setOpen(false);
  }

  const shown = value === null ? '—' : formatValue(value, scale.dec);
  const spoken =
    value === null ? `${title}: ${t.common.pickEmpty}` : `${title}: ${shown} ${suffix}`.trim();

  return (
    <>
      {trigger ? trigger({ shown, suffix, label: spoken, open: openPicker }) : (
      <button
        type="button"
        className={clsx(
          'valuepill',
          value === null && 'is-empty',
          variant === 'volt' && 'is-volt',
          className,
        )}
        aria-label={spoken}
        disabled={disabled}
        onClick={openPicker}
      >
        {shown}
        {suffix ? <span className="u">{suffix}</span> : null}
      </button>
      )}

      {open ? (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title={title}
          description={
            presets.length > 0 ? t.common.pickHintPresets : t.common.pickHint
          }
          footer={
            <button type="button" className="btn btn-primary btn-block" onClick={confirm}>
              {t.common.confirm}
            </button>
          }
        >
          {presets.length > 0 ? (
            <div className="mb-4">
              <PresetRow
                options={presets}
                selected={values[draft]}
                onPick={(v) => setDraft(nearestIndex(values, v))}
                unit={suffix}
                dec={scale.dec}
                label={`${t.common.pickSuggested} ${title}`}
              />
            </div>
          ) : null}

          <Wheel
            values={values}
            index={draft}
            onSelect={setDraft}
            unit={suffix}
            dec={scale.dec}
            label={title}
            onConfirm={confirm}
          />
        </Sheet>
      ) : null}
    </>
  );
}
