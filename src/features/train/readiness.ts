import type { Session, SessionEntry } from '../../data/entities';
import { sessionDate, sessionsBetween } from './sessions';
import { sessionLoad, type Metric } from './metrics';

/**
 * Prontidão: uma leitura do que fazer hoje, tirada só do que a app tem.
 *
 * Esta app regista sessões de treino e mais nada — não tem sono, não tem frequência
 * cardíaca, não tem HRV, não tem peso corporal. Por isso a prontidão **não é uma medição
 * fisiológica**; é uma leitura honesta de duas coisas que o registo (fase 005) sabe mesmo:
 * há quanto tempo foi o último treino, e quantas sessões houve na última semana. A camada de
 * cálculo por baixo (fase 006, `metrics.ts`) dá a carga; aqui não se repetem essas contas.
 *
 * A regra que molda tudo é a mesma do §10.2, herdada de `metrics.ts`: **ou há dados e há
 * leitura, ou diz-se que não há.** Sem uma única sessão registada não existe prontidão — nem
 * 50 por omissão, nem "—" com um anel à volta. Por isso o resultado é um `Metric<Readiness>`:
 * o ecrã que se esquecer do caso vazio apanha um erro de tipo, não um número inventado.
 *
 * Tudo aqui é puro — `import type` e funções sem React nem rede. Quem sabe das linhas e da
 * rede passa-as; este ficheiro só lê o intervalo e conta as sessões.
 */

/**
 * A recuperação, lida pelo intervalo desde o último treino. É uma leitura do intervalo, não
 * um diagnóstico: "boa" quer dizer "o tempo desde o último treino é o de melhor recuperação",
 * e nada sobre músculos, hormonas ou sono, que a app não mede.
 */
export type RecoveryReading = 'treino-hoje' | 'recente' | 'boa' | 'completa' | 'pausa-longa';

/**
 * O estado de prontidão para hoje, com o que o produziu à vista.
 *
 * `score` é 0–100, mas é uma leitura e não uma medição — a fórmula que o gera está escrita
 * por baixo, em português, e o ecrã mostra-a. `load` é a carga da última sessão (o esforço de
 * que o corpo está a recuperar), trazida de `metrics.sessionLoad`; é um facto ao lado da
 * leitura, e **não** entra no número, porque sem um peso de referência da pessoa dizer que
 * "2500 kg é muito" seria inventar. As parcelas (`daysSinceLast`, `sessionsLast7`) viajam para
 * o ecrã as explicar sem ter de as recalcular.
 */
export type Readiness = {
  score: number;
  recovery: RecoveryReading;
  daysSinceLast: number;
  sessionsLast7: number;
  load: Metric<number>;
};

/** Meia-noite UTC de uma data `YYYY-MM-DD`, para contar dias sem apanhar horário de verão. */
function utcMidnight(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Dias inteiros de `from` para `to`, ambas `YYYY-MM-DD`. Negativo se `to` for anterior. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcMidnight(to) - utcMidnight(from)) / 86_400_000);
}

/** A data `YYYY-MM-DD` deslocada de `delta` dias, para abrir a janela dos últimos sete. */
export function shiftDays(date: string, delta: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const at = new Date(Date.UTC(year, month - 1, day + delta));
  const yyyy = at.getUTCFullYear();
  const mm = String(at.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(at.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * A recuperação pelo intervalo, como base do número.
 *
 * A janela de melhor recuperação para o mesmo esforço é de **2 a 3 dias**: antes, o corpo
 * ainda está a recuperar do último treino; muito depois, o intervalo já é uma pausa e a forma
 * começa a descer. A curva reflete isto — sobe até à janela, e desce a partir dela, com um
 * piso porque a app não sabe o suficiente para mandar a prontidão a zero por inatividade.
 */
function recoveryBase(days: number): number {
  if (days <= 0) return 55; // treinou hoje: o esforço foi agora, ainda há fadiga
  if (days === 1) return 80; // um dia: recuperação a caminho
  if (days <= 3) return 100; // 2–3 dias: a janela
  return Math.max(40, 100 - (days - 3) * 8); // a partir daí desce, com piso em 40
}

/**
 * Fadiga acumulada por sessões muito juntas.
 *
 * Cinco ou mais sessões em sete dias é uma semana densa, e uma semana densa deixa menos margem
 * de recuperação mesmo com o intervalo certo — por isso baixa a prontidão. Abaixo de quatro
 * não penaliza: treinar é o que se quer, não o que se castiga.
 */
function densityPenalty(sessionsLast7: number): number {
  if (sessionsLast7 >= 5) return 15;
  if (sessionsLast7 >= 4) return 10;
  return 0;
}

/** O nome da recuperação para o intervalo — a leitura que o ecrã mostra por palavras. */
export function recoveryReading(days: number): RecoveryReading {
  if (days <= 0) return 'treino-hoje';
  if (days === 1) return 'recente';
  if (days <= 3) return 'boa';
  if (days <= 6) return 'completa';
  return 'pausa-longa';
}

/**
 * A prontidão de `today`, a partir das sessões registadas.
 *
 * `lastEntries` são as entradas da sessão mais recente (o chamador lê-as por `session_id`);
 * `null` quando ainda não chegaram, e aí a carga fica sem valor — o número não depende dela.
 * Sem uma única sessão, não há prontidão: `sem-dados`, e o ecrã diz o que falta.
 */
export function readiness(
  sessions: readonly Session[],
  lastEntries: readonly SessionEntry[] | null,
  today: string,
): Metric<Readiness> {
  if (sessions.length === 0) return { ok: false, reason: 'sem-dados' };

  const latest = [...sessions].sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)))[0];
  /* Uma sessão com data no futuro é um erro de relógio, não recuperação negativa: piso a 0. */
  const daysSinceLast = Math.max(0, daysBetween(sessionDate(latest), today));
  const sessionsLast7 = sessionsBetween(sessions, shiftDays(today, -6), today).length;

  const score = Math.max(0, Math.min(100, Math.round(recoveryBase(daysSinceLast) - densityPenalty(sessionsLast7))));
  const load = sessionLoad(lastEntries ?? []);

  return {
    ok: true,
    value: { score, recovery: recoveryReading(daysSinceLast), daysSinceLast, sessionsLast7, load },
    excluded: [],
  };
}
