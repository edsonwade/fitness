import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { ReadinessCard } from '../train/ReadinessCard';
import { RecommendationCard } from '../train/RecommendationCard';

/**
 * O ecrã HOJE — o separador que abre a aplicação.
 *
 * Alvo no protótipo: `proto/v2/02-hoje.html`, a barra de topo do frame 1 e o cartão
 * de prontidão que vem logo a seguir.
 *
 * O QUE ESTE ECRÃ É, HOJE, E PORQUÊ
 *
 * O porte do sistema criou o SÍTIO; as fases 008 a 019 é que o enchem. A **008** já
 * entrou: o objetivo do dia com o "Por quê?", logo abaixo da prontidão, que é a
 * ordem do frame 1 do protótipo. Faltam a hierarquia (009), a ação principal (010),
 * o progresso com contexto (013), o coach (016), a evolução (017) e a montagem final
 * do §11 (019). Escrever aqui qualquer uma dessas coisas seria andar as fases fora
 * de ordem, e a regra do projeto é uma fase de cada vez.
 *
 * O que já existe e pertence aqui é a **prontidão**, construída na fase 007 e
 * aprovada a 2026-09-06. No protótipo ela é o primeiro cartão do HOJE, e era do
 * ecrã de treino que ela estava a ser emprestada. Mudou de sítio com o porte, por
 * escolha dele — "HOJE com a prontidão" — e o componente não foi tocado: é o mesmo
 * cálculo, o mesmo texto e o mesmo caso de conta sem histórico.
 *
 * O ecrã acaba aqui, e acaba de propósito. O frame 1 do protótipo continua com o
 * cartão do dia, o `Começar treino`, o progresso, o plano da semana e o coach — e
 * nenhum deles é desta fase. **O que o protótipo não desenha não entra**, nem sequer
 * como aviso do que está para vir: um bloco a dizer "o resto chega a seguir" é peça
 * que nenhum frame tem, e a regra do projeto manda-a sair. Um ecrã curto e verdadeiro
 * é a forma honesta de estar a meio da construção; um ecrã cheio de andaimes não é.
 *
 * SEM NÚMEROS INVENTADOS (§14). O protótipo mostra aqui um chip de "5 dias" de
 * sequência com a etiqueta *exemplo*; a sequência não está calculada em lado nenhum
 * de `src/`, por isso não entra. A saudação não traz nome porque a conta não guarda
 * nenhum — e o frame 2 do protótipo mostra exatamente "Olá", sem nome.
 */

export function Today() {
  const { locale, t: copy } = useLocale();
  const t = copy.today;
  const today = new Date();
  /* "sábado, 12 de setembro", que é como a barra de topo do protótipo o escreve. */
  const stamp = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(today);

  return (
    <div className="min-h-full bg-ground">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="label">{stamp}</p>
          <p className="title-3">{t.greeting}</p>
        </div>
      </div>

      <div className="screen-pad stack-lg">
        <ReadinessCard />
        <RecommendationCard />
      </div>
    </div>
  );
}
