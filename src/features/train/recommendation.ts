import type { Metric } from './metrics';
import type { Readiness, RecoveryReading } from './readiness';

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
 * Tudo aqui é puro — `import type` e funções sem React nem rede. A prontidão já calculada
 * (fase 007) entra pronta; este ficheiro só a interpreta.
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
 * A recomendação, com a prontidão que a justifica à vista.
 *
 * A prontidão inteira viaja para o ecrã montar o "Por quê?" com os números reais, sem
 * recalcular nada — é a mesma leitura que o cartão da fase 007 mostra, e por isso os dois
 * nunca podem discordar.
 *
 * `readiness` é `null` num caso e só num: **o dia de descanso de quem ainda não registou
 * nada**. Aí a razão não vem do registo, vem do plano ("hoje é descanso"), e continua a ser
 * uma razão verdadeira. Num dia de treino sem histórico não há recomendação nenhuma —
 * `ok:false` — porque aí a razão teria de ser inventada.
 */
export type Recommendation = {
  shape: DayShape;
  stance: Stance;
  readiness: Readiness | null;
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
