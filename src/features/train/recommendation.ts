import { BLOCKS, type BlockKey } from '../../content';
import type { Session } from '../../data/entities';
import type { DayType } from './custom-days';
import type { Metric } from './metrics';
import type { Readiness } from './readiness';

/**
 * A recomendação de hoje: o objetivo do dia com contexto e o "Por quê?" (§4).
 *
 * O plano quer que o objetivo do dia deixe de ser uma frase parada e passe a trazer três
 * coisas: **o quê**, **porquê** e **quanto custa**. Este módulo só produz o **porquê** — a
 * leitura que transforma "há aqui um treino" em "hoje é um bom dia para o fazer, e esta é a
 * razão". O **o quê** já vem do conteúdo do dia (o objetivo autorado, que não se reescreve) e
 * o **quanto custa** (duração, foco) deriva do plano do dia como na fase 001 (`blockSummary`);
 * nenhum dos dois se recalcula aqui.
 *
 * A regra dura é a mesma das fases 006/007, e é o que separa uma recomendação de uma ordem:
 * **ou há uma razão que se pode mostrar, ou não há moldura de recomendação.** Sem prontidão
 * (conta sem histórico), o resultado é `ok:false` e o ecrã mostra o objetivo cru, sem inventar
 * um motivo. Por isso o retorno é um `Metric<Recommendation>`: quem se esquecer do caso vazio
 * apanha um erro de tipo, não uma razão fabricada.
 *
 * Tudo aqui é puro — sem React e sem rede. A prontidão já calculada (fase 007) entra pronta;
 * este ficheiro só a interpreta. O único valor importado é `BLOCKS`, que é conteúdo do pacote.
 */

/** A forma do dia. Um dia de descanso também tem objetivo — descansar é decisão do plano. */
export type DayShape = 'strength' | 'rest';

/**
 * A postura recomendada para hoje, derivada da prontidão e da forma do dia.
 *
 * - `treinar` — o intervalo desde o último treino está na janela de recuperação; bom dia.
 * - `moderar` — treinou hoje, ou a semana foi densa; treina, mas com margem para recuperar.
 * - `descanso` — o plano marca hoje como descanso; descansar é o objetivo, não um vazio.
 *
 * É uma leitura do registo, não um diagnóstico: a linguagem que a acompanha no ecrã não pode
 * prometer uma medição fisiológica que a app não faz.
 */
export type Stance = 'treinar' | 'moderar' | 'descanso';

/**
 * A recomendação, com as parcelas da prontidão que a justificam à vista.
 *
 * As parcelas viajam para o ecrã montar o "Por quê?" com os números reais, sem recalcular
 * nada — são as mesmas que o cartão da fase 007 mostra, e por isso os dois nunca podem
 * discordar.
 *
 * Não há aqui um caso de recomendação sem prontidão: sem histórico o retorno é `ok:false`
 * (ver `recommendation`), porque aí a razão teria de ser inventada.
 */
export type Recommendation = {
  shape: DayShape;
  stance: Stance;
  score: number;
  recovery: Readiness['recovery'];
  daysSinceLast: number;
  sessionsLast7: number;
};

/**
 * A postura para hoje, a partir da forma do dia e da prontidão.
 *
 * Num dia de descanso a postura é sempre `descanso`: o plano decidiu-o, e a prontidão não o
 * transforma num dia de treino. Num dia de treino, olha-se para a recuperação: se o corpo ainda
 * está a recuperar do treino de hoje, ou a semana teve cinco ou mais sessões (a mesma densidade
 * que baixa a prontidão em `readiness.ts`), recomenda-se `moderar`; caso contrário, `treinar`.
 */
export function stanceFor(shape: DayShape, r: Readiness): Stance {
  if (shape === 'rest') return 'descanso';
  if (r.recovery === 'treino-hoje') return 'moderar';
  if (r.sessionsLast7 >= 5) return 'moderar';
  return 'treinar';
}

/**
 * A recomendação de `today`, a partir da prontidão já calculada.
 *
 * `readinessResult` é o `Metric<Readiness>` da fase 007. Se não houver prontidão (sem histórico),
 * não há razão que se possa mostrar: devolve-se `ok:false` com a mesma razão, e o ecrã mostra o
 * objetivo cru. Não se inventa um motivo para encher a moldura.
 */
export function recommendation(
  shape: DayShape,
  readinessResult: Metric<Readiness>,
): Metric<Recommendation> {
  if (!readinessResult.ok) return { ok: false, reason: readinessResult.reason };

  const r = readinessResult.value;
  return {
    ok: true,
    value: {
      shape,
      stance: stanceFor(shape, r),
      recovery: r.recovery,
      score: r.score,
      daysSinceLast: r.daysSinceLast,
      sessionsLast7: r.sessionsLast7,
    },
    excluded: [],
  };
}

/* ---------- o que o ecrã HOJE precisa de saber antes de perguntar ------------ */

/**
 * A forma do dia, a partir do tipo autorado.
 *
 * `DayType` tem três valores e a recomendação só distingue dois, porque só há duas posturas
 * possíveis: ou hoje se treina, ou hoje se descansa. **Cardio é treino** — o Dia 6 do programa é
 * `cardio` e o protótipo recomenda-o como dia de treino, com o seu custo e a sua razão. Só o
 * `rest` é descanso, e essa é uma decisão do plano que a prontidão não pode contrariar.
 */
export function shapeOf(type: DayType): DayShape {
  return type === 'rest' ? 'rest' : 'strength';
}

/**
 * A ranhura da semana em que hoje cai, para ler o dia que lá está.
 *
 * A semana ordenada começa na Segunda (`WEEKDAYS` sai de `DAYS` por ordem autorada, Seg…Dom),
 * e `Date.getDay()` começa no Domingo com 0. A rotação de seis põe as duas a falar a mesma
 * língua. É a ranhura que se lê, não o conteúdo: desde a fase 004 o dia da semana vem da
 * posição, e quem estiver na primeira posição é a Segunda, tenha o nome que tiver.
 */
export function weekSlot(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * A fase do programa em que a pessoa está, lida da última sessão que registou.
 *
 * O custo do dia — os minutos de `blockSummary` — muda com a fase, porque as séries mudam. O
 * ecrã do Treino tem chips para a escolher; o HOJE não tem nenhum, e inventar aqui uma fase
 * fixa mostraria o custo de Volume a quem está em Deload. A última sessão registada é a resposta
 * verdadeira, e existe sempre que existe recomendação: sem sessões não há prontidão, e sem
 * prontidão não há moldura nenhuma para pôr um custo dentro.
 *
 * `block` é texto livre na base (`nullableText`), por isso é confrontado com as quatro fases que
 * o programa autora antes de passar por uma. Sem sessões, ou com um valor que não é fase
 * nenhuma, fica `b1` — a primeira, que é onde a app abre.
 */
export function blockOfLatest(sessions: readonly Session[], dateOf: (s: Session) => string): BlockKey {
  let latest: Session | null = null;
  for (const session of sessions) {
    if (latest === null || dateOf(session).localeCompare(dateOf(latest)) > 0) latest = session;
  }

  const key = latest?.block ?? null;
  return BLOCKS.some((block) => block.k === key) ? (key as BlockKey) : 'b1';
}
