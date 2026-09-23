import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { Reorder } from 'motion/react';

import { useT } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { formatValue } from '../../ui/scales';
import type { DayEntry } from './day-entries';
import type { Preset } from '../../ui/PresetRow';
import { SetGrid, type SetField, type SetRow } from './SetGrid';
import { ChipWheel } from './ChipWheel';
import { ReorderHandle, ReorderableCard } from './ReorderableCard';
import { ReorderContext } from './reorder-context';

/**
 * A FOLHA DAS SÉRIES — «as séries para marcar».
 *
 * Portada de `proto/v2/04-executar.html`, a `#sheet-registo` do frame 4, e das duas
 * imagens da Ladder que ele mandou na tarefa 7. Por ordem:
 *
 * 1. o cabeçalho, que é a mesma linha do cartão que a abriu (`Nome · 1 de 3`);
 * 2. a miniatura com o nome do exercício;
 * 3. os QUATRO chips numa linha que rola de lado — equipamento ⇅, Notas, Histórico,
 *    Saltar. O do equipamento É uma roda, e roda dentro de si (`ChipWheel`, erro 2 e
 *    bug B1); Notas e Histórico abrem o seu painel dentro da folha;
 * 4. a `.setgrid` de cinco colunas — `SetGrid`;
 * 5. os outros exercícios do dia, cada um com o cabeçalho grande e o ▶| que o põe a
 *    decorrer, e a linha com miniatura, nome e círculos: primeiro os que faltam, depois
 *    os já feitos sob "Já feitos" — a lista nunca fica vazia (erro 4);
 * 6. a `.session-bar` com o volume da sessão e o fechar.
 *
 * A FOLHA VIVE DENTRO DO TELEFONE, POR CIMA DO VÍDEO
 *
 * É vidro: o vídeo a correr vê-se desfocado e a mexer por trás dela, como na primeira
 * imagem da Ladder. Por isso não é o `<Sheet>` genérico (que vai para o fim do `body`,
 * longe do vídeo) mas uma camada irmã do ecrã do vídeo — a `.picker-layer` do
 * protótipo. Está sempre montada; fechada, está por baixo da borda e `inert`.
 *
 * SOBE COM O DEDO
 *
 * Deslizar PARA CIMA no cartão do nome puxa-a de baixo (`drag`, medido pelo
 * `RunSession`), e deslizar para baixo no cabeçalho devolve-a. Passado um quarto da
 * altura, ou com velocidade, completa o gesto; antes disso, volta ao sítio. Palavras
 * dele: "deslizar pra cima, nada de esquerda ou direita, e aparece o próximo que vem
 * de baixo".
 */

function Thumb({ photo, fallback, alt }: { photo: string; fallback: string | null; alt: string }) {
  const [src, setSrc] = useState(photo);
  return (
    <img
      className="thumb"
      src={src}
      alt={alt}
      onError={() => {
        if (fallback && src !== fallback) setSrc(fallback);
      }}
    />
  );
}

export function EntryThumb({ entry }: { entry: DayEntry }) {
  const photo = entry.clip?.poster ?? entry.photo;
  return photo ? (
    <Thumb key={photo} photo={photo} fallback={entry.fallbackPhoto} alt="" />
  ) : (
    <span className="thumb" aria-hidden="true" />
  );
}

/** Um exercício que ainda não chegou: cabeçalho grande com ▶|, e a linha com os círculos. */
function Queued({
  entry,
  done,
  first,
  onGo,
}: {
  entry: DayEntry;
  done: readonly boolean[];
  first: boolean;
  onGo: () => void;
}) {
  const copy = useT();
  const t = copy.train;
  const r = copy.run;
  const sets = entry.prescription.s;
  /* Na fila do que falta, prime e segura (ou a pega) muda a ordem — B5. */
  const reorder = useContext(ReorderContext);

  return (
    <div
      {...reorder?.rootProps}
      className={clsx(
        'select-none transition-transform duration-[180ms] motion-reduce:transition-none',
        reorder?.lifted && 'queued-lifted',
      )}
      style={reorder?.lifted ? { touchAction: 'none' } : undefined}
    >
      <div className="blockhead" style={{ marginTop: first ? 'var(--sp-7)' : 'var(--sp-5)' }}>
        <div className="min-w-0 flex-1">
          <p className="t truncate">{entry.name}</p>
          <p className="s">
            {entry.equipment ? `${entry.equipment} · ` : ''}
            {sets} {sets === 1 ? t.serie : t.series}
          </p>
        </div>
        <ReorderHandle name={entry.name} words={copy.editor} />
        <button type="button" aria-label={`${r.goTo} ${entry.name}`} onClick={onGo}>
          <Icon name="skip" size={20} strokeWidth={2.2} />
        </button>
      </div>
      <button type="button" className="queued-tap" onClick={onGo} aria-label={`${r.goTo} ${entry.name}`}>
        <EntryThumb entry={entry} />
        <span className="min-w-0">
          <span className="title-3 block truncate">{entry.name}</span>
          <span className="setdots" aria-hidden="true">
            {done.map((isDone, i) => (
              <i key={i} className={isDone ? 'is-done' : undefined}>
                {i + 1}
              </i>
            ))}
          </span>
        </span>
      </button>
    </div>
  );
}

export type HistoryLine = { date: string; sets: string; detail: string };

type Panel = 'none' | 'note' | 'history';

export function SetSheet({
  open,
  onOpenChange,
  drag,
  entry,
  index,
  count,
  rows,
  current,
  queue,
  finished,
  volume,
  presets,
  onTick,
  onPick,
  onSkip,
  onGo,
  onReorderQueue,
  onReplayDemo,
  equipmentChoices,
  equipmentValue,
  onEquipment,
  history,
  onHistory,
  rest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quantos px o dedo já puxou para cima a partir do cartão, enquanto puxa. */
  drag: number | null;
  /** O exercício a decorrer: é dele que a folha fala. */
  entry: DayEntry;
  index: number;
  count: number;
  rows: readonly SetRow[];
  current: number;
  /** O que vem a seguir neste dia, já com as séries feitas de cada um. */
  queue: readonly { entry: DayEntry; done: readonly boolean[]; at: number }[];
  /** Os já feitos, sob "Já feitos", para a lista nunca ficar vazia (erro 4). */
  finished: readonly { entry: DayEntry; done: readonly boolean[]; at: number }[];
  /** O volume da sessão em quilos, para a barra do fundo. */
  volume: number;
  presets: Partial<Record<SetField, Preset[]>>;
  onTick: (index: number) => void;
  onPick: (index: number, field: SetField, value: number) => void;
  onSkip: () => void;
  onGo: (at: number) => void;
  /** A fila do que falta, na ordem em que ele a arrastou. */
  onReorderQueue: (keys: string[]) => void;
  /** "Ver demonstração": passa o clipe outra vez, uma vez. Sem clipe, não há chip. */
  onReplayDemo?: () => void;
  /** As escolhas de equipamento; vazio quando este exercício não se pode trocar aqui. */
  equipmentChoices: readonly string[];
  /** A variante a decorrer, como aparece na roda. */
  equipmentValue: string | null;
  onEquipment: (equipment: string) => void;
  /** `null` enquanto não se pediu ou está a carregar. */
  history: readonly HistoryLine[] | null;
  onHistory: () => void;
  /** O descanso a correr, quando o há. Ocupa o rodapé no lugar da barra do total. */
  rest?: ReactNode;
}) {
  const copy = useT();
  const t = copy.train;
  const r = copy.run;
  const [panel, setPanel] = useState<Panel>('none');
  const sheetRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(0);
  /* O arrasto para baixo, no cabeçalho, para fechar. */
  const [down, setDown] = useState<number | null>(null);
  const downStart = useRef<{ y: number; t: number } | null>(null);

  /*
   * A fila do que falta, reordenável (B5 de
   * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`). A ordem vive aqui enquanto
   * o dedo arrasta, e só o largar a grava; a que chega do servidor adota-se, mas nunca a
   * meio de um arrasto.
   */
  const queueSig = queue.map((item) => item.entry.key).join('\n');
  const [liveQueue, setLiveQueue] = useState<string[]>(() => (queueSig ? queueSig.split('\n') : []));
  const liveQueueRef = useRef(liveQueue);
  const draggingQueue = useRef(false);
  const hintId = useId();
  useEffect(() => {
    if (draggingQueue.current) return;
    const next = queueSig ? queueSig.split('\n') : [];
    setLiveQueue((prev) => (prev.join('\n') === queueSig ? prev : next));
    liveQueueRef.current = next;
  }, [queueSig]);
  const queueBy = new Map(queue.map((item) => [item.entry.key, item]));
  const shownQueue = [
    ...liveQueue.filter((key) => queueBy.has(key)),
    ...queue.map((item) => item.entry.key).filter((key) => !liveQueue.includes(key)),
  ];
  function reflowQueue(next: string[]) {
    liveQueueRef.current = next;
    setLiveQueue(next);
  }
  function commitQueue(next: string[]) {
    if (next.join('\n') === queueSig) return;
    onReorderQueue(next);
  }
  function moveQueued(key: string, direction: 'up' | 'down') {
    const current = liveQueueRef.current.slice();
    const at = current.indexOf(key);
    const to = direction === 'up' ? at - 1 : at + 1;
    if (at < 0 || to < 0 || to >= current.length) return;
    [current[at], current[to]] = [current[to], current[at]];
    reflowQueue(current);
    commitQueue(current);
  }

  /* Outro exercício, outros painéis: o que estava aberto era do anterior. */
  const [panelFor, setPanelFor] = useState(entry.key);
  if (panelFor !== entry.key) {
    setPanelFor(entry.key);
    setPanel('none');
  }

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* O Esc fecha primeiro o painel, depois a folha. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      /* A roda de um valor abre por cima, noutro sítio do documento, e o Esc é dela. */
      if (!sheetRef.current?.contains(document.activeElement)) return;
      event.preventDefault();
      onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  /* Ao abrir, o foco entra na folha; ao fechar, volta ao cartão do nome (o RunSession). */
  useEffect(() => {
    if (open) sheetRef.current?.focus({ preventScroll: true });
  }, [open]);

  function toggle(which: Panel) {
    if (which === 'history' && panel !== 'history') onHistory();
    setPanel((p) => (p === which ? 'none' : which));
  }

  const total = entry.prescription.s;
  const setNo = Math.min(rows.filter((row) => row.done).length + 1, total);

  /* Onde a folha está: fechada por baixo da borda, aberta no sítio, ou onde o dedo a leva. */
  let offset: string;
  let progress: number;
  if (drag !== null && height > 0) {
    const px = Math.max(0, height - drag);
    offset = `${px}px`;
    progress = 1 - px / height;
  } else if (down !== null) {
    offset = `${Math.max(0, down)}px`;
    progress = height > 0 ? 1 - Math.max(0, down) / height : 1;
  } else {
    offset = open ? '0px' : '100%';
    progress = open ? 1 : 0;
  }
  const moving = drag !== null || down !== null;
  const visible = open || moving;

  return (
    <div
      className={clsx('run-layer', moving && 'is-dragging')}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div
        className="scrim"
        style={{ opacity: progress }}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <section
        ref={sheetRef}
        className="sheet logsheet"
        role="dialog"
        aria-modal={open}
        aria-label={`${r.sheetOf} ${entry.name}`}
        tabIndex={-1}
        style={{ '--drag': offset } as CSSProperties}
      >
        <div
          className="sheet-grab"
          onPointerDown={(e) => {
            downStart.current = { y: e.clientY, t: performance.now() };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!downStart.current) return;
            const dy = e.clientY - downStart.current.y;
            if (dy > 4 || down !== null) setDown(dy);
          }}
          onPointerUp={(e) => {
            const start = downStart.current;
            downStart.current = null;
            if (!start || down === null) {
              setDown(null);
              return;
            }
            const dy = e.clientY - start.y;
            const speed = dy / Math.max(1, performance.now() - start.t);
            setDown(null);
            if (dy > height * 0.25 || speed > 0.6) onOpenChange(false);
          }}
          onPointerCancel={() => {
            downStart.current = null;
            setDown(null);
          }}
          style={{ touchAction: 'none' }}
        >
          <div className="sheet-handle" aria-hidden="true" />
          <div className="sheet-head">
            <p className="h">{entry.name}</p>
            <p className="of">
              {index + 1} {r.of} {count}
            </p>
          </div>
        </div>

        <div className="sheet-body">
          <p className="sr-only">
            {t.setLabel} {setNo} {r.of} {total}
          </p>
          <div className="queued-row pt-0">
            <EntryThumb entry={entry} />
            <p className="title-3">{entry.name}</p>
          </div>

          <div className="ctx-chips">
            {equipmentChoices.length > 1 ? (
              <ChipWheel
                key={entry.key}
                options={equipmentChoices}
                value={equipmentValue ?? equipmentChoices[0]}
                label={r.equipment}
                onPick={onEquipment}
              />
            ) : (
              <span className="chip">{entry.equipment ?? r.equipment}</span>
            )}
            {onReplayDemo ? (
              <button type="button" className="chip" onClick={onReplayDemo}>
                <Icon name="play" size={15} strokeWidth={2.2} />
                {r.replayDemo}
              </button>
            ) : null}
            <button
              type="button"
              className="chip"
              aria-expanded={panel === 'note'}
              onClick={() => toggle('note')}
            >
              <Icon name="edit" size={15} strokeWidth={2} />
              {r.notes}
            </button>
            <button
              type="button"
              className="chip"
              aria-expanded={panel === 'history'}
              onClick={() => toggle('history')}
            >
              <Icon name="history" size={15} strokeWidth={2} />
              {r.history}
            </button>
            <button type="button" className="chip" onClick={onSkip}>
              <Icon name="skip" size={15} strokeWidth={2.2} />
              {r.skip}
            </button>
          </div>

          {panel === 'note' ? (
            <div className="run-panel">
              <p>{entry.note ?? r.noNote}</p>
            </div>
          ) : null}

          {panel === 'history' ? (
            <div className="run-panel" aria-live="polite">
              {history === null ? (
                <p>{copy.common.loading}</p>
              ) : history.length === 0 ? (
                <p>{r.noHistory}</p>
              ) : (
                history.map((line) => (
                  <p key={line.date} className="row-h">
                    <span>{line.date}</span>
                    <b>
                      {line.sets}
                      {line.detail ? ` · ${line.detail}` : ''}
                    </b>
                  </p>
                ))
              )}
            </div>
          ) : null}

          <SetGrid
            rows={rows}
            current={current}
            label={`${t.sets} · ${entry.name}`}
            presets={presets}
            onTick={onTick}
            onPick={onPick}
          />

          <p id={hintId} className="sr-only">
            {copy.editor.reorderHint}
          </p>
          <Reorder.Group
            as="ul"
            axis="y"
            values={shownQueue}
            onReorder={reflowQueue}
            className="m-0 list-none p-0"
          >
            {shownQueue.map((key, i) => {
              const item = queueBy.get(key)!;
              return (
                <ReorderableCard
                  key={key}
                  value={key}
                  position={i + 1}
                  total={shownQueue.length}
                  hintId={hintId}
                  onPickup={() => {
                    draggingQueue.current = true;
                  }}
                  onDrop={() => {
                    draggingQueue.current = false;
                    commitQueue(liveQueueRef.current);
                  }}
                  onKeyMove={(direction) => moveQueued(key, direction)}
                >
                  <Queued
                    entry={item.entry}
                    done={item.done}
                    first={i === 0}
                    onGo={() => onGo(item.at)}
                  />
                </ReorderableCard>
              );
            })}
          </Reorder.Group>

          {finished.length > 0 ? (
            <>
              <p className="label queue-label">{r.queueDone}</p>
              {finished.map((item) => (
                <Queued
                  key={item.entry.key}
                  entry={item.entry}
                  done={item.done}
                  first={false}
                  onGo={() => onGo(item.at)}
                />
              ))}
            </>
          ) : null}
        </div>

        {rest ?? (
          <div className="session-bar">
            <div>
              <p className="tot-label">{r.sessionVolume}</p>
              <p className="tot-value">
                <span>{formatValue(Math.round(volume), 0)}</span>
                <span className="u">kg</span>
              </p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => onOpenChange(false)}>
              {copy.common.close}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
