import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import clsx from 'clsx';

import type { BlockKey } from '../../content';
import { useLocale } from '../../i18n/locale-context';
import {
  useMergeExerciseLog,
  useRecordSession,
  type LogFields,
  type SetsPatch,
} from '../../data/mutations';
import { useRows } from '../../data/queries';
import { Icon } from '../../ui/Icon';
import type { Preset } from '../../ui/PresetRow';
import { SCALES, stepValue } from '../../ui/scales';
import { ValuePill } from '../../ui/ValuePill';
import { Screen, SessionSplash } from '../../ui/Screen';
import { useDays } from './custom-days';
import { useProgramme, type DayEntry } from './day-entries';
import {
  BLOCK_KEYS,
  dayProgress,
  exerciseState,
  logId,
  parseRestSeconds,
  parseRpe,
  sessionVolume,
  setsDoneFor,
  setValuesFor,
  useExerciseLogs,
} from './logs';
import { parseLoadKg, parseReps } from './metrics';
import { RestTimer } from './RestTimer';
import {
  buildSessionEntries,
  localDate,
  sessionFor,
  totalSetsDone,
  useSessions,
} from './sessions';
import { DIAL_START, demoDial, dialAt, dialSeconds, litTicks, type DialAnchor } from './run-dial';
import { GO_MS, countFrom, finishAction, shiftAnchor } from './run-pause';
import { sheetQueue, wheelNames } from './run-queue';
import { EntryThumb, SetSheet, type HistoryLine } from './SetSheet';
import { useDayEditing } from './use-day-editing';
import { EQUIP_NAMES, variantsOf } from './variants';
import type { Clip } from './clips';
import { MusicBar, MusicSheet } from './MusicPlayer';
import { useSuggestions } from './suggestion';
import { useRestDefault } from '../profile/rest-default';
import type { SetField, SetRow } from './SetGrid';
import { ThemeToggle } from '../../ui/ThemeToggle';

function isBlockKey(value: string | null): value is BlockKey {
  return value !== null && (BLOCK_KEYS as readonly string[]).includes(value);
}

/**
 * A contagem 3 · 2 · 1 do estado preparar, portada de `proto/v2/proto.js` §14.
 *
 * Correção dele, 2026-09-22: a pílula `Somar tempo para preparar` da gravação saiu —
 * "se clicares aumenta o tempo e nem tens como diminuir (…) é pointless". No lugar dela,
 * o que ele pediu: "1, 2, 3 e começa o vídeo de demonstração". Enquanto conta, o vídeo
 * está parado no primeiro frame; nos últimos 240 ms do "1" o véu dissolve e o vídeo
 * arranca; aos 3 s a série entra.
 */
const COUNT_TICKS = 36;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * O anel da contagem: 36 traços acesos a volt que se apagam um a um, no sentido dos
 * ponteiros, ao longo dos 3 s — a mesma peça do mostrador a dizer a mesma coisa, o
 * tempo. O apagar é CSS (`.count-ticks line`, um atraso por traço), e não um tique
 * de React a redesenhar 36 linhas por frame.
 */
function CountTicks() {
  return (
    <svg className="count-ticks" width="168" height="168" viewBox="0 0 168 168" aria-hidden="true">
      {Array.from({ length: COUNT_TICKS }, (_, i) => {
        const a = (i / COUNT_TICKS) * 2 * Math.PI;
        const at = (r: number) => [84 + r * Math.sin(a), 84 - r * Math.cos(a)].map((n) => n.toFixed(1));
        const [x1, y1] = at(70);
        const [x2, y2] = at(80);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            style={{ '--i': i } as CSSProperties}
          />
        );
      })}
    </svg>
  );
}

/**
 * Os três algarismos. Montado de novo a cada exercício (a chave é o exercício), por
 * isso cada entrada num exercício conta desde o 3. O algarismo muda de chave a cada
 * segundo para a animação de entrada recomeçar.
 */
function PrepCount({ label, onGo, paused }: { label: string; onGo: () => void; paused: boolean }) {
  const [digit, setDigit] = useState<3 | 2 | 1>(3);
  const go = useRef(onGo);
  /* Quanto da contagem já passou. Com "Terminar treino?" aberto a contagem para, e ao
     continuar retoma daqui — bug B4, e não do 3 outra vez. */
  const spent = useRef(0);
  useEffect(() => {
    go.current = onGo;
  });
  useEffect(() => {
    if (paused) return;
    const started = performance.now();
    const timers = countFrom(spent.current).next.map(({ delay, step }) =>
      window.setTimeout(() => (step === 'go' ? go.current() : setDigit(step)), delay),
    );
    return () => {
      spent.current += performance.now() - started;
      timers.forEach(window.clearTimeout);
    };
  }, [paused]);
  return (
    <div className={clsx('prep-count', paused && 'is-paused')} role="group" aria-label={label}>
      <CountTicks />
      <p className="count-n" aria-live="assertive" aria-atomic="true">
        <span key={digit}>{digit}</span>
      </p>
    </div>
  );
}

/**
 * A demonstração: o clipe local, parado no primeiro frame enquanto a contagem corre, e
 * a andar a partir do fim do "1". Passa UMA vez e fecha — bug B1 de
 * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`: "é para demonstrar o
 * exercício antes de iniciar e depois ele fecha". Sem `loop`; no fim, `onEnded`.
 * `playing` é o único interruptor, e parado volta ao primeiro frame. O `<video>` é
 * remontado com a chave do exercício, por isso começa sempre do princípio. Com
 * movimento reduzido não arranca sozinho.
 */
function Demo({
  clip,
  playing,
  hold,
  label,
  backdrop = false,
  onEnded,
  onProgress,
}: {
  clip: Clip;
  playing: boolean;
  /** Em pausa ("Terminar treino?" aberto): para onde está, sem voltar ao princípio. */
  hold: boolean;
  label: string;
  /**
   * A cópia desfocada que enche a janela por trás do clipe inteiro, a partir de 1024px
   * (erro 3). Abaixo disso o CSS esconde-a. Não se anuncia: é o mesmo vídeo.
   */
  backdrop?: boolean;
  /** O clipe chegou ao fim: a demonstração fecha. */
  onEnded?: () => void;
  /**
   * Onde o clipe vai, em segundos, enquanto anda — o mostrador enche com ele (B8 de
   * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`). Pausado, não chama.
   */
  onProgress?: (t: number, d: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(onProgress);
  useEffect(() => {
    progressRef.current = onProgress;
  });
  const follows = onProgress !== undefined;
  useEffect(() => {
    const video = ref.current;
    if (!video || !follows) return;
    let raf = 0;
    const report = () => progressRef.current?.(video.currentTime, video.duration);
    const loop = () => {
      report();
      raf = requestAnimationFrame(loop);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const halt = () => {
      cancelAnimationFrame(raf);
      report();
    };
    video.addEventListener('playing', run);
    video.addEventListener('pause', halt);
    video.addEventListener('ended', halt);
    video.addEventListener('seeked', report);
    video.addEventListener('loadedmetadata', report);
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener('playing', run);
      video.removeEventListener('pause', halt);
      video.removeEventListener('ended', halt);
      video.removeEventListener('seeked', report);
      video.removeEventListener('loadedmetadata', report);
    };
  }, [follows]);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    /* A cópia desfocada só se vê a partir de 1024px; abaixo disso não gasta bateria. */
    if (backdrop && !window.matchMedia?.('(min-width: 1024px)').matches) {
      video.pause();
      return;
    }
    if (playing && !hold) {
      video.play().catch(() => {});
    } else if (hold) {
      video.pause();
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        /* ainda sem metadados: já está no princípio */
      }
    }
  }, [playing, hold, backdrop]);
  return (
    <video
      ref={ref}
      className={backdrop ? 'run-wide-bg' : undefined}
      muted
      playsInline
      onEnded={onEnded}
      preload={backdrop ? 'metadata' : 'auto'}
      poster={clip.poster}
      aria-label={backdrop ? undefined : label}
      aria-hidden={backdrop || undefined}
    >
      <source src={clip.webm} type="video/webm" />
      <source src={clip.mp4} type="video/mp4" />
    </video>
  );
}

function clock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * O mostrador de traços — um calibre, e não um anel liso.
 *
 * Trinta e três traços radiais, copiados de `proto/v2/04-executar.html` frame 4, que é
 * o desenho que ele aprovou no Passo A. Acendem-se a volt da ponta de baixo à esquerda
 * no sentido dos ponteiros: na série à medida que ela sobe, no descanso à medida que
 * ele passa — `litTicks` em `run-dial.ts`.
 */
function DialTicks({ lit }: { lit: number }) {
  const ticks: readonly (readonly [number, number, number, number])[] = [
    [21.8, 80.5, 13.1, 85.5], [19.3, 75.5, 10.0, 79.3], [17.5, 70.1, 7.8, 72.7],
    [16.4, 64.6, 6.5, 65.9], [16.0, 59.0, 6.0, 59.0], [16.4, 53.4, 6.5, 52.1],
    [17.5, 47.9, 7.8, 45.3], [19.3, 42.5, 10.0, 38.7], [21.8, 37.5, 13.1, 32.5],
    [24.9, 32.8, 17.0, 26.7], [28.6, 28.6, 21.5, 21.5], [32.8, 24.9, 26.7, 17.0],
    [37.5, 21.8, 32.5, 13.1], [42.5, 19.3, 38.7, 10.0], [47.9, 17.5, 45.3, 7.8],
    [53.4, 16.4, 52.1, 6.5], [59.0, 16.0, 59.0, 6.0], [64.6, 16.4, 65.9, 6.5],
    [70.1, 17.5, 72.7, 7.8], [75.5, 19.3, 79.3, 10.0], [80.5, 21.8, 85.5, 13.1],
    [85.2, 24.9, 91.3, 17.0], [89.4, 28.6, 96.5, 21.5], [93.1, 32.8, 101.0, 26.7],
    [96.2, 37.5, 104.9, 32.5], [98.7, 42.5, 108.0, 38.7], [100.5, 47.9, 110.2, 45.3],
    [101.6, 53.4, 111.5, 52.1], [102.0, 59.0, 112.0, 59.0], [101.6, 64.6, 111.5, 65.9],
    [100.5, 70.1, 110.2, 72.7], [98.7, 75.5, 108.0, 79.3], [96.2, 80.5, 104.9, 85.5],
  ];
  return (
    <svg className="dial-ticks" width="118" height="118" viewBox="0 0 118 118" aria-hidden="true">
      {ticks.map(([x1, y1, x2, y2], i) => (
        <line
          key={`${x1}-${y1}`}
          className={i < lit ? 'is-on' : undefined}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
        />
      ))}
    </svg>
  );
}

/**
 * A fotografia do exercício, inteira e não cortada.
 *
 * Duas vezes a mesma imagem: uma desfocada a encher a moldura 9:16 (`media-bg`) e a
 * outra ao centro, inteira (`is-fit`). As fotos do programa são deitadas, 1000×667, e
 * cortar cabeças para encher o ecrã é o defeito que o protótipo resolveu assim.
 *
 * O recuo para a foto de reserva acontece uma vez por exercício — o componente é
 * remontado com a chave do exercício, por isso o estado não transita de um para o
 * seguinte.
 */
function Poster({ photo, fallback, alt }: { photo: string; fallback: string | null; alt: string }) {
  const [src, setSrc] = useState(photo);
  const onError = () => {
    if (fallback && src !== fallback) setSrc(fallback);
  };
  return (
    <>
      <img className="media-bg" src={src} alt="" aria-hidden="true" onError={onError} />
      <img src={src} alt={alt} onError={onError} />
    </>
  );
}


/* A hora de uma âncora do mostrador, tirada no toque dele — nunca durante o render. */
const stamp = () => Date.now();

/* A carga por mão diz-se por baixo do número, como no protótipo (`10 kg · por mão`). */
const PER_HAND = /m[ãa]o|hand|mano|main/i;

/* Os exercícios de uma sessão guardada que o Histórico lê: as últimas deste dia. */
const HISTORY_SESSIONS = 8;

/**
 * O ecrã Executar — a sessão conduzida, série a série.
 *
 * Fora da casca dos separadores, e pela mesma razão que o dia está: uma barra de
 * separadores a meio de uma série são cinco maneiras de perder o sítio.
 *
 * É `proto/v2/04-executar.html` frame 4 e as duas imagens da Ladder que ele mandou na
 * tarefa 7, peça por peça — "faz o que te pedem, não da tua maneira":
 *
 * - por cima do vídeo, numa linha só: o ✕ (que pergunta "Terminar treino?"), o relógio
 *   e a percentagem, a música e as definições; em baixo a bolha da treinadora, os três
 *   números e o cartão do nome;
 * - **o mostrador** conta a série a SUBIR com os traços a acender, e o descanso a
 *   descer depois de marcar (`run-dial.ts`);
 * - **o peso** é número e unidade, e tocar-lhe abre a roda do peso desta série;
 * - por baixo do cartão do nome **espreita o exercício seguinte**; deslizar PARA CIMA
 *   no cartão faz subir a folha das séries com o dedo, e nunca há gesto para os lados;
 * - na folha, **Saltar** e o ▶| de cada exercício da fila mudam o exercício a decorrer.
 */
export function RunSession() {
  const { t: copy, locale } = useLocale();
  const t = copy.train;
  const r = copy.run;
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const dayId = Number(params.dia);
  const week = useDays();
  const dayRef = week.dayOf(dayId);
  const blockParam = searchParams.get('bloco');
  const block: BlockKey = isBlockKey(blockParam) ? blockParam : 'b1';

  const programme = useProgramme(block);
  const logs = useExerciseLogs();
  const { entries } = programme.resolve(dayRef?.day ?? null, dayId);
  const editing = useDayEditing(dayId);

  /* O relógio do canto. */
  const [elapsed, setElapsed] = useState(0);
  /*
   * Em que ponto da contagem está cada exercício. `going` é o exercício cujo véu está a
   * dissolver (os 240 ms finais do "1"); `setFor` é o exercício que já está em série.
   * Guardar a CHAVE, e não um booleano, faz a contagem recomeçar sozinha quando o
   * exercício muda — sem efeito a repor estado.
   */
  const [going, setGoing] = useState<string | null>(null);
  const [setFor, setSetFor] = useState<string | null>(null);
  const [reduced] = useState(prefersReducedMotion);
  /* O exercício que ele escolheu com Saltar ou com o ▶| da fila. */
  const [chosen, setChosen] = useState<string | null>(null);
  /* Um exercício já feito que ele reabriu pelo ▶| de "Já feitos": fica a decorrer mesmo
     completo, até escolher outro. */
  const [reopened, setReopened] = useState<string | null>(null);
  /* A folha das séries. Fechada é o estado de partida: quem entra quer ver a demonstração. */
  const [sheetOpen, setSheetOpen] = useState(false);
  /* O exercício de que a folha fala. Muda o exercício, a folha fecha, para a demonstração
     do seguinte se ver antes das séries dele (B1). */
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  /*
   * A demonstração (B1): o exercício cuja demonstração já passou, ou que ele saltou. Com
   * movimento reduzido não passa sozinha; `replayFor` é o exercício em que ele pediu
   * "Ver demonstração", e `replay` remonta o vídeo para começar do princípio.
   */
  const [demoOver, setDemoOver] = useState<string | null>(null);
  const [replayFor, setReplayFor] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);
  /* O mostrador durante a demonstração: o que o vídeo com esta chave já andou (B8). */
  const [demoFill, setDemoFill] = useState<{ key: string; lit: number; left: number } | null>(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const restDefault = useRestDefault();
  const suggestions = useSuggestions();
  /* Quantos px o dedo já puxou a folha para cima, enquanto puxa. */
  const [drag, setDrag] = useState<number | null>(null);
  const pull = useRef<{ x: number; y: number; t: number; dragging: boolean } | null>(null);
  const swallowClick = useRef(false);
  const nameRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /*
   * O mostrador: a âncora de um exercício — o instante em que a série (ou o descanso)
   * começou. Outro exercício, outra âncora; sem âncora, o mostrador está a zeros. É
   * posta no fim da contagem, e o tique de cada segundo (`now`) faz o resto.
   */
  const [now, setNow] = useState(() => Date.now());
  const [anchor, setAnchor] = useState<{ key: string; at: DialAnchor } | null>(null);
  /*
   * O descanso do rodapé da folha (`RestTimer`) — o mesmo descanso que o mostrador
   * desenha a descer.
   */
  const [rest, setRest] = useState<{ id: number; seconds: number; name: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  /*
   * "Terminar treino?" (bug B4). Aberto, a sessão fica em pausa por trás: o relógio, a
   * contagem, o vídeo, o mostrador e o descanso param. `since` é quando a pausa começou,
   * para o mostrador saber quanto empurrar a âncora ao continuar.
   */
  const [quit, setQuit] = useState<{ since: number } | null>(null);
  const paused = quit !== null;
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const merge = useMergeExerciseLog();
  const recordSession = useRecordSession();
  const sessions = useSessions();

  /* As últimas sessões deste dia, para o Histórico. Só se leem quando ele o abre. */
  const historySessions = useMemo(
    () =>
      (sessions.data ?? [])
        .filter((row) => row.day_no === dayId)
        .sort((a, b) => (b.local_date ?? b.performed_at).localeCompare(a.local_date ?? a.performed_at))
        .slice(0, HISTORY_SESSIONS),
    [sessions.data, dayId],
  );
  const historyEntries = useRows(
    'session_entries',
    historyOpen ? historySessions.map((row) => row.id) : [],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!pausedRef.current) setElapsed((s) => s + 1);
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Abrir "Terminar treino?" pausa a sessão; continuar retoma-a onde estava. */
  function openQuit() {
    setQuit((cur) => cur ?? { since: Date.now() });
  }
  function resume() {
    if (!quit) return;
    const gap = Date.now() - quit.since;
    setAnchor((cur) => (cur ? { key: cur.key, at: shiftAnchor(cur.at, gap) } : cur));
    setQuit(null);
  }

  /*
   * A saída do ecrã: o ✕ no topo e, no teclado, o Esc — os dois perguntam "Terminar
   * treino?" (erro 3 e bug B4 de `.claude/skills/executar-quatro-erros-do-browser/`).
   * Com o diálogo aberto, o Esc é "Continuar a treinar".
   */
  useEffect(() => {
    /* Com a folha aberta, o Esc é dela — fecha a roda ou a folha, e não a sessão. */
    if (sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (quit) resume();
      else openQuit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* A folha fechou: o foco volta ao cartão do nome, que a abriu. */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !sheetOpen) nameRef.current?.focus({ preventScroll: true });
    wasOpen.current = sheetOpen;
  }, [sheetOpen]);

  if (!dayRef && week.isPending) return <SessionSplash label={copy.common.loading} />;

  if (!dayRef) {
    return (
      <Screen title={t.dayNotFoundTitle} body={t.dayNotFoundBody}>
        <Link
          to="/treino"
          className="inline-flex min-h-[48px] items-center rounded-full bg-accent px-6 font-ui text-[14px] font-700 text-accent-ink"
        >
          {t.title}
        </Link>
      </Screen>
    );
  }

  /*
   * Um dia sem exercícios não é um ecrã preto: é um dia de descanso, e diz-se isso.
   */
  if (entries.length === 0) {
    return (
      <Screen title={t.restDay} body={t.restDayBody}>
        <Link
          to={`/treino/${dayId}?bloco=${block}`}
          className="inline-flex min-h-[48px] items-center rounded-full bg-accent px-6 font-ui text-[14px] font-700 text-accent-ink"
        >
          {copy.common.back}
        </Link>
      </Screen>
    );
  }

  const progress = dayProgress(dayId, block, entries, logs.byKey);

  const setsOf = (entry: DayEntry) =>
    setsDoneFor(logs.byKey.get(logId(dayId, block, entry.logKey ?? entry.key)), entry.prescription.s);

  /*
   * O exercício a decorrer: o que ele escolheu com Saltar ou com o ▶|, enquanto não
   * estiver completo; senão o primeiro que ainda não está. Quando todos estiverem, é o
   * último — o ecrã não fica sem exercício nenhum para mostrar.
   */
  const firstOpen = entries.findIndex((entry) => exerciseState(setsOf(entry)) !== 'done');
  const chosenAt = chosen === null ? -1 : entries.findIndex((entry) => entry.key === chosen);
  const index =
    chosenAt !== -1 &&
    (exerciseState(setsOf(entries[chosenAt])) !== 'done' || reopened === entries[chosenAt].key)
      ? chosenAt
      : firstOpen === -1
        ? entries.length - 1
        : firstOpen;
  const entry = entries[index];
  const prescription = entry.prescription;
  const done = setsOf(entry).filter(Boolean).length;
  const setNo = Math.min(done + 1, prescription.s);
  const phase: 'prep' | 'set' = reduced || setFor === entry.key ? 'set' : 'prep';
  const isGoing = phase === 'prep' && going === entry.key;
  if (sheetFor !== entry.key) {
    setSheetFor(entry.key);
    if (sheetFor !== null) setSheetOpen(false);
  }
  /* A demonstração a passar: depois da contagem, até ao fim do clipe, uma vez só. */
  const demoing =
    entry.clip !== null &&
    phase === 'set' &&
    demoOver !== entry.key &&
    (!reduced || replayFor === entry.key);
  /* O vídeo anda desde o fim do "1" — já durante os 240 ms do véu a dissolver. */
  const playing = (!reduced && isGoing) || demoing;
  /*
   * O mostrador só conta o DESCANSO, depois de se marcar uma série, e a zeros no resto do
   * tempo. A série a subir saiu (B1): "não tem que gravar isso". O descanso continua
   * pelo exercício seguinte, que é quando a demonstração dele passa. Em pausa, fica no
   * instante em que a pausa começou.
   */
  const dialNow = anchor ? dialAt(anchor.at, quit ? quit.since : now) : null;
  const shownDial = dialNow && dialNow.mode === 'rest' ? dialNow : DIAL_START;
  /*
   * Enquanto a demonstração passa, o mostrador é ela: os traços enchem ao ritmo do vídeo
   * e o relógio desce o que falta. Nunca sobe (B1). Fora dela, volta ao de cima.
   */
  const demoKey = `${entry.key}-${replay}`;
  const shownDemo = demoing ? (demoFill?.key === demoKey ? demoFill : { lit: 0, left: 0 }) : null;
  function followDemo(key: string, t: number, d: number) {
    const next = demoDial(t, d);
    setDemoFill((prev) =>
      prev && prev.key === key && prev.lit === next.lit && prev.left === next.left
        ? prev
        : { key, ...next },
    );
  }

  /* A demonstração fechou (acabou, ou ele saltou-a): as séries aparecem para marcar. */
  function endDemo(key: string) {
    if (key !== entry.key) return;
    setDemoOver(key);
    setReplayFor(null);
    setSheetOpen(true);
  }

  /* "Ver demonstração", da folha: passa outra vez desde o princípio, e fecha no fim. */
  function replayDemo() {
    setDemoOver(null);
    setReplayFor(entry.key);
    setReplay((n) => n + 1);
    setSheetOpen(false);
  }

  /* Fim da contagem, ou o toque dele a saltá-la: o véu dissolve, e 240 ms depois a série
     entra. A chave vai fechada no momento do toque, para um exercício que mude pelo
     meio não herdar a série do anterior. */
  function goSet() {
    if (phase !== 'prep' || isGoing) return;
    const key = entry.key;
    const hasClip = entry.clip !== null;
    setGoing(key);
    window.setTimeout(() => {
      setSetFor(key);
      /* Sem clipe não há demonstração: as séries aparecem logo. */
      if (!hasClip) {
        setDemoOver(key);
        setSheetOpen(true);
      }
    }, GO_MS);
  }

  /* Pôr outro exercício a decorrer: vídeo, contagem e mostrador recomeçam. */
  function goTo(at: number) {
    const next = entries[at];
    if (!next || next.key === entry.key) return;
    setChosen(next.key);
    setReopened(exerciseState(setsOf(next)) === 'done' ? next.key : null);
    setRest(null);
    setAnchor(null);
    setHistoryOpen(false);
  }

  /*
   * A fila da folha arrastada para outra ordem (B5). Grava a ordem do dia inteira, pela
   * mesma escrita do dia (`exercise_order`): primeiro o que já não está na fila (o
   * exercício a decorrer e os feitos), na ordem em que estavam, e depois a fila tal como
   * ele a deixou — que é exatamente a ordem por que os seguintes vão aparecer.
   */
  function reorderQueue(keys: string[]) {
    const inQueue = new Set(keys);
    editing.saveOrder([...entries.map((item) => item.key).filter((key) => !inQueue.has(key)), ...keys]);
  }

  /* Saltar: o seguinte da ordem do dia que ainda não esteja feito; senão, o primeiro. */
  function skip() {
    const order = [...entries.keys()].map((k) => (index + 1 + k) % entries.length);
    const at = order.find((k) => k !== index && exerciseState(setsOf(entries[k])) !== 'done');
    if (at !== undefined) goTo(at);
  }

  const photoAlt = `${t.videoOf} ${entry.name}`;

  /*
   * O que a folha das séries mostra, série a série, tirado do registo e da prescrição e
   * de mais lado nenhum. Para cada número, pela ordem: o desta série (`sets`, do `014`),
   * o do exercício inteiro (as colunas antigas, onde vive tudo o que se gravou antes do
   * `014`), e por fim o prescrito — este último a tracejado, porque ainda é plano.
   */
  const log = logs.byKey.get(logId(dayId, block, entry.logKey ?? entry.key));
  const doneFlags = setsOf(entry);
  const values = setValuesFor(log, prescription.s);
  const wholeReps = parseReps(log?.reps ?? null);
  const wholeWeight = parseLoadKg(log?.weight ?? null);
  const plan = {
    rest: parseRestSeconds(prescription.rest, restDefault),
    rpe: parseRpe(prescription.rpe),
    reps: parseReps(prescription.r),
    /* A carga prescrita é texto nas quatro línguas: `60 kg` dá um número, `base + carga`
       e `— preencher` não dão nenhum, e aí o número é um travessão em vez de inventar. */
    weight: parseLoadKg(prescription.l),
  };
  const rows: SetRow[] = doneFlags.map((isDone, i) => {
    const own = values[i];
    const reps = own.reps ?? wholeReps;
    const weight = own.weight ?? wholeWeight;
    return {
      rest: own.rest ?? plan.rest,
      rpe: own.rpe ?? plan.rpe,
      reps: reps ?? plan.reps,
      weight: weight ?? plan.weight,
      logged: {
        rest: own.rest != null,
        rpe: own.rpe != null,
        reps: reps != null,
        weight: weight != null,
      },
      done: isDone,
    };
  });
  const nowRow = rows[setNo - 1];

  /* As sugestões da roda, como no protótipo: o prescrito ao meio e um degrau de cada
     lado (`57,5 · 60 prescrito · 62,5`). Sem número prescrito, não há sugestão. */
  const suggestion = suggestions.get(entry.key) ?? null;
  const around = (value: number | null, scale: typeof SCALES.kg): Preset[] =>
    value === null
      ? []
      : [
          { value: stepValue(value, -1, scale) },
          { value, note: copy.common.pickPrescribed },
          { value: stepValue(value, 1, scale) },
        ];
  const presets: Partial<Record<SetField, Preset[]>> = {
    rpe: plan.rpe === null ? [] : [{ value: plan.rpe, note: copy.common.pickPrescribed }],
    reps: around(plan.reps, SCALES.reps),
    weight: [
      ...around(plan.weight, SCALES.kg),
      /* Fase 013: a carga sugerida do histórico, ao lado do prescrito. Sem histórico, nada. */
      ...(suggestion && !around(plan.weight, SCALES.kg).some((x) => x.value === suggestion.kg)
        ? [{ value: suggestion.kg, note: copy.common.pickFromHistory }]
        : []),
    ],
  };

  /* As séries da variante a decorrer (B3): as da Barra não são as dos Halteres. */
  const where = { day_no: dayId, block, ex_key: entry.logKey ?? entry.key };

  /*
   * Marcar uma série grava duas coisas numa só escrita: o visto, e os números que a
   * linha estava a mostrar e que ainda não eram desta série. Quem marca a série 2 com
   * `12 × 60 kg` à vista está a dizer que fez 12 a 60 — e é isso que o volume da sessão,
   * e daqui a umas fases o histórico, passam a contar. Desmarcar tira só o visto: os
   * números ficam, porque foram escolhidos, e voltar a marcar não os deve perder.
   *
   * Marcar põe o mostrador a descer o descanso; desmarcar volta a série ao zero.
   */
  function onTick(i: number) {
    const row = rows[i];
    const flags = doneFlags.slice();
    flags[i] = !flags[i];
    const fields: { sets_done: boolean[]; sets?: SetsPatch } = {
      sets_done: flags,
    };
    if (flags[i]) {
      const snapshot: SetsPatch[number] = {};
      if (values[i].rest == null) snapshot.rest = row.rest;
      if (values[i].rpe == null && row.rpe !== null) snapshot.rpe = row.rpe;
      if (values[i].reps == null && row.reps !== null) snapshot.reps = row.reps;
      if (values[i].weight == null && row.weight !== null) snapshot.weight = row.weight;
      if (Object.keys(snapshot).length > 0) fields.sets = { [i]: snapshot };
      setRest({ id: (rest?.id ?? 0) + 1, seconds: row.rest, name: entry.name });
      setAnchor({ key: entry.key, at: { mode: 'rest', since: stamp(), total: row.rest } });
    } else {
      setRest(null);
      setAnchor(null);
    }
    save(fields);
  }

  /*
   * "Terminar e guardar": grava a sessão como terminada — o mesmo que o TERMINAR TREINO
   * do dia (`DayView`, `finish`) — e vai para o dia, que é o resumo: "concluído" e as
   * séries por fazer. Nunca volta ao vídeo. Sem nenhuma série feita não houve treino, e
   * só se sai.
   */
  function finishAndSave() {
    if (finishAction(progress.done) === 'record') {
      const at = new Date();
      recordSession.record({
        day_no: dayId,
        block,
        day_name: dayRef?.name ?? null,
        local_date: localDate(at),
        performed_at: at.toISOString(),
        entries: buildSessionEntries(dayId, block, entries, logs.byKey),
        finished: true,
      });
    }
    navigate(`/treino/${dayId}?bloco=${block}`, { replace: true });
  }

  function onPick(i: number, field: SetField, value: number) {
    save({ sets: { [i]: { [field]: value } } });
  }

  /*
   * Uma escrita no registo, e a sessão com data da fase 005 atrás dela — o mesmo par que
   * o ecrã do dia já escreve quando se marca uma série lá. Sem isto, um treino feito só
   * aqui não chegava ao histórico.
   *
   * A sessão só nasce quando há pelo menos uma série marcada no dia, e é a regra de
   * `workoutState`: escolher um peso antes de marcar a primeira série não é um treino a
   * decorrer. Uma sessão que já existe hoje é sempre atualizada, e com `finished: false`
   * — que nunca reabre um treino terminado (`012` §2).
   */
  function save(fields: LogFields) {
    merge.log(where, fields);
    const now = new Date();
    const date = localDate(now);
    const snapshot = buildSessionEntries(dayId, block, entries, logs.byKey, {
      exKey: entry.logKey ?? entry.key,
      fields,
    });
    const exists = sessionFor(sessions.data ?? [], dayId, date) !== undefined;
    if (!exists && totalSetsDone(snapshot) === 0) return;
    recordSession.record({
      day_no: dayId,
      block,
      day_name: dayRef?.name ?? null,
      local_date: date,
      performed_at: now.toISOString(),
      entries: snapshot,
      finished: false,
    });
  }

  /*
   * O equipamento ⇅ do protótipo. Cada opção é uma VARIANTE a sério (`variants.ts`, B2 e
   * B4 de `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`): outro nome, outro
   * vídeo e as suas séries. Só o equipamento que o movimento tem, numa ordem fixa com a
   * de origem primeiro, e grava-se o id — nunca o texto traduzido. Trocar escreve o
   * override pelo caminho que o dia já usa (`saveOverride`), com os outros campos tal
   * como estão. Só nos exercícios do programa.
   */
  /* A roda dos exercícios do dia (B3 de `.claude/skills/folha-series-e-seletor/PLANO.md`). */
  const exerciseChoices = wheelNames(entries.map((item) => item.name));
  const variants = entry.kind === 'built' ? variantsOf(entry.key) : [];
  const equipmentChoices = variants.map((v) => EQUIP_NAMES[v.equip][locale]);
  const equipmentValue = entry.equip ? EQUIP_NAMES[entry.equip][locale] : null;
  function onEquipment(label: string) {
    const picked = variants[equipmentChoices.indexOf(label)];
    if (!picked || picked.equip === entry.equip) return;
    const o = entry.override;
    editing.saveOverride(entry.key, {
      name: o?.name ?? '',
      equipment: picked.equip,
      kind: 'acc',
      sets: o?.sets ?? '',
      reps: o?.reps ?? '',
      load: o?.load ?? '',
      rest: o?.rest ?? '',
      videoId: o?.video_id ?? '',
      photoUrl: o?.photo_url ?? null,
      visibility: 'day',
    });
  }

  /* O Histórico: as sessões deste dia em que este exercício teve séries feitas. */
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const history: HistoryLine[] | null =
    historyEntries.isPending && historySessions.length > 0
      ? null
      : historySessions.flatMap((session) => {
          const line = (historyEntries.data ?? []).find(
            (row) => row.session_id === session.id && row.ex_key === (entry.logKey ?? entry.key) && (row.sets_done ?? 0) > 0,
          );
          if (!line) return [];
          const day = session.local_date ?? session.performed_at.slice(0, 10);
          const weight = line.weight
            ? /^\d+([.,]\d+)?$/.test(line.weight.trim())
              ? `${line.weight.trim()} kg`
              : line.weight
            : null;
          return [
            {
              date: dateFmt.format(new Date(`${day}T12:00:00`)),
              sets: `${line.sets_done}/${line.sets_total ?? prescription.s} ${r.historySets}`,
              detail: [line.reps ? `${line.reps}×` : null, weight].filter(Boolean).join(' '),
            },
          ];
        });

  const lines = entries.map((item, at) => ({ entry: item, done: setsOf(item), at }));
  const order = sheetQueue(
    lines.map((item) => exerciseState(item.done) === 'done'),
    index,
  );
  const queue = order.next.map((at) => lines[at]);
  const finishedQueue = order.finished.map((at) => lines[at]);
  const next = queue[0];

  /*
   * Deslizar PARA CIMA no cartão do nome: a folha acompanha o dedo, e passado um quinto
   * do ecrã (ou com um gesto rápido) abre. Um gesto que começa mais de lado do que para
   * cima não é deste cartão — não há mudança de exercício de lado.
   */
  function pullStart(e: React.PointerEvent<HTMLButtonElement>) {
    pull.current = { x: e.clientX, y: e.clientY, t: performance.now(), dragging: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function pullMove(e: React.PointerEvent<HTMLButtonElement>) {
    const p = pull.current;
    if (!p) return;
    const up = p.y - e.clientY;
    const side = Math.abs(e.clientX - p.x);
    if (!p.dragging) {
      if (side > 10 && side > Math.abs(up)) {
        pull.current = null;
        return;
      }
      if (up < 8) return;
      p.dragging = true;
    }
    setDrag(Math.max(0, up));
  }
  function pullEnd(e: React.PointerEvent<HTMLButtonElement>) {
    const p = pull.current;
    pull.current = null;
    if (!p || !p.dragging) return;
    swallowClick.current = true;
    const up = p.y - e.clientY;
    const speed = up / Math.max(1, performance.now() - p.t);
    const frame = frameRef.current?.getBoundingClientRect().height ?? 700;
    setDrag(null);
    if (up > frame * 0.2 || speed > 0.5) setSheetOpen(true);
  }

  const weightTitle = `${r.weight} · ${t.setLabel} ${setNo}`;

  return (
    <div className="min-h-[100dvh] bg-page py-0 sm:py-8 lg:py-0">
      {/*
        No telefone e no tablet, a moldura de telefone. A partir de 1024px, a janela
        inteira (erro 3: "no browser tem que estar grande e completo"), e a folha das
        séries passa a painel à direita — `.run-frame` em `system.css`.
      */}
      <div
        ref={frameRef}
        className={clsx(
          'run-frame relative mx-auto flex min-h-[100dvh] w-full max-w-[26.5rem] flex-col overflow-hidden bg-black',
          'sm:min-h-[32rem] sm:rounded-[40px] sm:shadow-[var(--shadow-float)]',
          'lg:h-[100dvh] lg:min-h-[100dvh] lg:max-w-none lg:rounded-none lg:shadow-none',
          sheetOpen && 'is-panel',
        )}
      >
        <p className="sr-only">{r.leaveHint}</p>

        <div
          className={clsx(
            'media-screen media-run',
            /* O clipe é do molde de scripts/clips/make.mjs (9:16, chão livre em baixo) e
               enche o ecrã; a foto é deitada e fica inteira. */
            !entry.clip && 'is-fit',
            phase === 'set' && 'is-set',
            isGoing && 'is-going',
          )}
          style={{ borderRadius: 0, boxShadow: 'none' }}
        >
          {entry.clip ? (
            <>
              <Demo
                key={`${entry.key}-bg-${replay}`}
                clip={entry.clip}
                playing={playing}
                hold={paused}
                label={photoAlt}
                backdrop
              />
              <Demo
                key={demoKey}
                clip={entry.clip}
                playing={playing}
                hold={paused}
                label={photoAlt}
                onEnded={() => endDemo(entry.key)}
                onProgress={(t, d) => followDemo(demoKey, t, d)}
              />
            </>
          ) : entry.photo ? (
            <Poster
              key={entry.key}
              photo={entry.photo}
              fallback={entry.fallbackPhoto}
              alt={photoAlt}
            />
          ) : (
            /* Uma variante sem vídeo próprio diz isso, e não mostra o de outro exercício (B4). */
            <p className="run-nodemo">{r.noDemo}</p>
          )}

          {/*
            O topo é UMA linha: ✕ e relógio à esquerda, música e definições à direita. A
            tira dos exercícios saiu — passava no pescoço de quem está no vídeo (erro 1:
            "tira essa merda de barra"). O "n de N" continua no cartão do nome, em baixo.
          */}
          <div className="media-top">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-icon on-media"
                  aria-label={r.quit}
                  aria-haspopup="dialog"
                  onClick={openQuit}
                >
                  <Icon name="x" size={19} strokeWidth={2.2} />
                </button>
                <p className="media-clock">
                  {clock(elapsed)} · {progress.pct}%
                </p>
              </div>
              {/*
                Música e definições da sessão estão no ecrã porque o protótipo as tem, e
                estão desativadas porque ainda não têm para onde ir — a música é a fase 012.
              */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-icon on-media"
                  aria-label={r.music}
                  aria-haspopup="dialog"
                  onClick={() => setMusicOpen(true)}
                >
                  <Icon name="music" size={19} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="btn btn-icon on-media"
                  aria-label={r.sessionSettings}
                  disabled
                >
                  <Icon name="target" size={19} strokeWidth={2} />
                </button>
                <ThemeToggle onMedia />
              </div>
            </div>

          </div>

          {/* Durante a demonstração, tocar no ecrã salta-a e abre as séries. */}
          {demoing ? (
            <button
              type="button"
              className="prep-skip demo-skip"
              aria-label={r.demoSkip}
              onClick={() => endDemo(entry.key)}
            />
          ) : null}

          <div className="media-prep">
            {/*
              Tocar no ecrã salta a contagem — sem botão à vista, ninguém fica preso. É um
              botão a sério, transparente e por baixo do título e dos números, para o
              teclado e o leitor de ecrã também o poderem usar.
            */}
            <button type="button" className="prep-skip" aria-label={r.countSkip} onClick={goSet} />
            <div className="prep-title">
              <p className="s">
                {t.setLabel} {setNo} {r.of} {prescription.s}
              </p>
              <p className="n">
                <b>{prescription.r}×</b> {entry.name}
              </p>
            </div>
            {phase === 'prep' ? (
              <PrepCount key={entry.key} label={r.countdown} onGo={goSet} paused={paused} />
            ) : null}
          </div>

          <div className="media-bottom">
            <div className="media-set">
              {/* A bolha é a PRIMEIRA LINHA desta coluna e os números a segunda: por
                  construção não se tocam. Contorno volt enquanto a série corre. */}
              <div className="media-coachrow">
                <div
                  className={clsx('media-coach', shownDial.mode === 'set' && 'is-speaking')}
                >
                  <img src={`${import.meta.env.BASE_URL}img/coach-1.jpg`} alt={r.coach} />
                </div>
              </div>

              <div className="media-numbers">
                <div className="media-num">
                  <p className="v">{nowRow?.reps ?? prescription.r}</p>
                  <p className="k">{r.reps}</p>
                </div>
                <div className="media-dial">
                  <DialTicks lit={shownDemo ? shownDemo.lit : litTicks(shownDial)} />
                  <p className="t" aria-live="off">
                    {clock(shownDemo ? shownDemo.left : dialSeconds(shownDial))}
                  </p>
                </div>
                <ValuePill
                  value={nowRow?.weight ?? null}
                  scale="kg"
                  title={weightTitle}
                  presets={presets.weight}
                  onChange={(value) => onPick(setNo - 1, 'weight', value)}
                  trigger={({ shown, suffix, label, open }) => (
                    <button type="button" className="media-num" aria-label={label} onClick={open}>
                      <span className="v block">
                        {shown}
                        <span className="u">{suffix}</span>
                      </span>
                      <span className="k block">
                        {PER_HAND.test(prescription.l) ? r.perHand : r.weight}
                      </span>
                    </button>
                  )}
                />
              </div>
            </div>

            {/*
              O cartão do nome É a pega da folha: tocar abre-a, e deslizar para cima puxa-a
              com o dedo. A pega cinzenta vive lá dentro, ao centro, por cima do texto.
            */}
            <button
              ref={nameRef}
              type="button"
              className="media-name"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              onPointerDown={pullStart}
              onPointerMove={pullMove}
              onPointerUp={pullEnd}
              onPointerCancel={() => {
                pull.current = null;
                setDrag(null);
              }}
              onClick={() => {
                if (swallowClick.current) {
                  swallowClick.current = false;
                  return;
                }
                setSheetOpen(true);
              }}
            >
              <span className="n">{entry.name}</span>
              <span className="o">
                {index + 1} {r.of} {entries.length}
              </span>
              <span className="sr-only">{r.openSets}</span>
            </button>

            {/* O seguinte, a espreitar por baixo do cartão e cortado pela borda — a
                primeira imagem da Ladder. */}
            {next ? (
              <div className="run-peek" aria-hidden="true">
                <EntryThumb entry={next.entry} />
                <p className="truncate">{next.entry.name}</p>
              </div>
            ) : null}
            <MusicBar onOpen={() => setMusicOpen(true)} />
          </div>
        </div>

        <MusicSheet open={musicOpen} onOpenChange={setMusicOpen} />

        <SetSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          drag={drag}
          entry={entry}
          index={index}
          count={entries.length}
          rows={rows}
          current={doneFlags.findIndex((isDone) => !isDone)}
          queue={queue}
          finished={finishedQueue}
          volume={sessionVolume(dayId, block, entries, logs.byKey)}
          presets={presets}
          onTick={onTick}
          onPick={onPick}
          onSkip={skip}
          onGo={goTo}
          onReplayDemo={entry.clip ? replayDemo : undefined}
          onReorderQueue={reorderQueue}
          exerciseChoices={exerciseChoices}
          equipmentChoices={equipmentChoices}
          equipmentValue={equipmentValue}
          onEquipment={onEquipment}
          history={history}
          onHistory={() => setHistoryOpen(true)}
          rest={
            rest ? (
              <div className="session-bar" style={{ display: 'block' }}>
                <RestTimer
                  key={rest.id}
                  inline
                  paused={paused}
                  seconds={rest.seconds}
                  exerciseName={rest.name}
                  onAdd={(n) =>
                    setAnchor((cur) =>
                      cur && cur.at.mode === 'rest'
                        ? { key: cur.key, at: { ...cur.at, total: cur.at.total + n } }
                        : cur,
                    )
                  }
                  onClose={() => {
                    setRest(null);
                    setAnchor(null);
                  }}
                />
              </div>
            ) : undefined
          }
        />

        {/*
          "Terminar treino?" — a camada do protótipo (`#sheet-terminar`, frame 4), dentro
          da moldura e por cima do vídeo parado. Tocar fora é continuar.
        */}
        {quit ? (
          <div
            className="run-quit"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--sp-5)',
            }}
          >
            <div className="scrim" onClick={resume} aria-hidden="true" />
            <div
              className="dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="run-quit-t"
              aria-describedby="run-quit-b"
              style={{ position: 'relative', width: '100%' }}
            >
              <h2 className="title-2" id="run-quit-t">
                {r.quitTitle}
              </h2>
              <p className="body-2 muted" id="run-quit-b" style={{ marginTop: 'var(--sp-2)' }}>
                {r.quitBody}
              </p>
              <div className="stack-sm" style={{ marginTop: 'var(--sp-5)' }}>
                <button type="button" className="btn btn-secondary btn-block" autoFocus onClick={resume}>
                  {r.quitContinue}
                </button>
                <button type="button" className="btn btn-danger btn-block" onClick={finishAndSave}>
                  {r.quitFinish}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
