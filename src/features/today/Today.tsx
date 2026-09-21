import { Link } from 'react-router';

import { pt } from '../../i18n/pt';
import { ReadinessCard } from '../train/ReadinessCard';

/**
 * O ecrã HOJE — o separador que abre a aplicação.
 *
 * Alvo no protótipo: `proto/v2/02-hoje.html`, a barra de topo do frame 1 e o cartão
 * de prontidão que vem logo a seguir.
 *
 * O QUE ESTE ECRÃ É, HOJE, E PORQUÊ
 *
 * O porte do sistema cria o SÍTIO; as fases 008 a 019 é que o enchem — o objetivo do
 * dia com o "Por quê?" (008), a hierarquia (009), a ação principal (010), o
 * progresso com contexto (013), o coach (016), a evolução (017) e a montagem final
 * do §11 (019). Escrever aqui qualquer uma dessas coisas seria andar as fases fora
 * de ordem, e a regra do projeto é uma fase de cada vez.
 *
 * O que já existe e pertence aqui é a **prontidão**, construída na fase 007 e
 * aprovada a 2026-09-06. No protótipo ela é o primeiro cartão do HOJE, e era do
 * ecrã de treino que ela estava a ser emprestada. Mudou de sítio com o porte, por
 * escolha dele — "HOJE com a prontidão" — e o componente não foi tocado: é o mesmo
 * cálculo, o mesmo texto e o mesmo caso de conta sem histórico.
 *
 * O resto do ecrã diz o que falta pelo nome, com o padrão de estado do protótipo
 * (`.empty`). Um ecrã que promete e não entrega é pior do que um que diz o que
 * ainda não faz — e isto é a porta de entrada da app, por isso tem de ser honesta.
 *
 * SEM NÚMEROS INVENTADOS (§14). O protótipo mostra aqui um chip de "5 dias" de
 * sequência com a etiqueta *exemplo*; a sequência não está calculada em lado nenhum
 * de `src/`, por isso não entra. A saudação não traz nome porque a conta não guarda
 * nenhum — e o frame 2 do protótipo mostra exatamente "Olá", sem nome.
 */

const t = pt.today;

export function Today() {
  const today = new Date();
  /* "sábado, 12 de setembro", que é como a barra de topo do protótipo o escreve. */
  const stamp = new Intl.DateTimeFormat('pt-PT', {
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

        {/* O padrão `.empty` de `proto/v2/09-estados.html`, com as medidas de lá:
            ícone a 40px e traço de 1,6, título em `.title-2`, e a ação a `--sp-4`. */}
        <div className="empty">
          <svg
            viewBox="0 0 24 24"
            width="40"
            height="40"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <p className="title-2">{t.pendingTitle}</p>
          <p>{t.pendingBody}</p>
          <Link to="/treino" className="btn btn-primary mt-4">
            {t.toTrain}
          </Link>
        </div>
      </div>
    </div>
  );
}
