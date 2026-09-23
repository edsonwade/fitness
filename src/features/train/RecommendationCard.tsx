import { useMemo } from 'react';

import type { Locale } from '../../i18n';
import { useLocale, useT } from '../../i18n/locale-context';
import { blockSummary } from './block-summary';
import { useDays, type DayRef } from './custom-days';
import { useProgramme } from './day-entries';
import { readiness } from './readiness';
import { blockOfLatest, recommendation, shapeOf, weekSlot } from './recommendation';
import { localDate, sessionDate, useSessions } from './sessions';


/**
 * O objetivo de hoje, com contexto — a fase 008.
 *
 * Alvo no protótipo: `proto/v2/02-hoje.html`, os frames 1, 2 e 3. O objetivo do dia deixa de
 * ser uma frase parada e passa a trazer três coisas (§4):
 *
 *  - **o quê** — vem do dia, autorado, e não se reescreve aqui;
 *  - **porquê** — vem da prontidão da fase 007, com os números reais da pessoa;
 *  - **quanto custa** — os minutos de `blockSummary` (fase 001) e a categoria do dia.
 *
 * A REGRA QUE SEPARA UMA RECOMENDAÇÃO DE UMA ORDEM, e que decide qual dos três frames sai:
 * **ou há uma razão que se pode mostrar, ou não há moldura de recomendação.** Sem prontidão —
 * conta sem sessões com data — o cartão perde o destaque, perde os chips e perde o "Por quê?",
 * e fica só com o objetivo cru. É o frame 2, e é literal: não se inventa um motivo para encher
 * a moldura (§4.3, §14).
 *
 * O DIA DE DESCANSO NÃO PASSA POR ESSA REGRA, e é de propósito. `recommendation()` devolve
 * `ok:false` sem prontidão, mas a razão de um dia de descanso não vem do registo — vem do
 * plano, que o marcou como descanso, e isso é verdade com ou sem histórico. Por isso o
 * descanso decide-se aqui pela forma do dia, antes de se perguntar à prontidão seja o que for.
 * É o frame 3: uma decisão, não um vazio.
 *
 * NENHUM NÚMERO DO DOCUMENTO ENTRA AQUI. O "45 min" e o "7/10" do §4.2 são exemplos de
 * interface. Os minutos que saem deste cartão são a soma dos descansos que o programa prescreve
 * para este dia nesta fase; quando não há nada para estimar, o chip não aparece — o protótipo
 * mostra ali a etiqueta *exemplo* porque não tem dados, e a produção tem.
 *
 * NENHUMA AÇÃO. O `[ COMEÇAR TREINO ]` do §4.2 é da fase 010 e leva ao ecrã da 011. Esta fase
 * cria o sítio onde ele vai ficar, e mais nada.
 */
export function RecommendationCard() {
  const { locale, t: copy } = useLocale();
  const t = copy.train.recommend;
  const r = copy.train.readiness;
  const days = useDays();
  const sessions = useSessions();

  const now = useMemo(() => new Date(), []);
  const rows = useMemo(() => sessions.data ?? [], [sessions.data]);

  /* O dia que está na ranhura de hoje. Desde a 004 é a posição que manda, não o conteúdo. */
  const dayRef: DayRef | null = days.days[weekSlot(now)] ?? null;

  /* A fase em que a pessoa está, para o custo ser o do disco que ela tem à frente. */
  const block = useMemo(() => blockOfLatest(rows, sessionDate), [rows]);
  const programme = useProgramme(block);

  /*
   * A prontidão, das mesmas linhas que o cartão acima lê. As entradas da última sessão entram
   * a `null` porque a carga não aparece neste cartão: o "Por quê?" daqui é a leitura, não o
   * peso. Uma consulta que não se mostra é uma consulta que não se faz.
   */
  const state = useMemo(() => readiness(rows, null, localDate(now)), [rows, now]);

  const summary = useMemo(() => {
    if (!dayRef || programme.isPending) return null;
    return blockSummary(programme.resolve(dayRef.day, dayRef.no).entries);
  }, [dayRef, programme]);

  /*
   * Ainda a carregar: um lugar da altura do cartão, não um falso vazio. O programa entra na
   * condição com a semana e o registo de propósito — sem ele não há custo, e um cartão que
   * aparece e depois cresce um chip por baixo do veredito é pior, num relance de dois segundos,
   * do que um cartão que aparece inteiro um instante mais tarde.
   */
  if (days.isPending || sessions.isPending || programme.isPending) {
    return (
      <section className="card" aria-busy="true">
        <p className="label">{t.title}</p>
        <span
          aria-hidden="true"
          className="mt-2 block h-9 w-52 max-w-full animate-pulse rounded-[10px] bg-surface-sunken motion-reduce:animate-none"
        />
      </section>
    );
  }

  /* A semana não carregou. O resto do ecrã continua útil, e um cartão vazio não ajudaria. */
  if (days.isError || !dayRef) return null;

  const shape = shapeOf(dayRef.type);

  /*
   * O descanso, antes de tudo o resto: é decisão do plano e não depende do registo.
   * Sem chips de custo — não há nada a custar — e sem ação, que é o que o frame 3 mostra.
   */
  if (shape === 'rest') {
    return (
      <section className="card card-accent">
        <p className="label text-text">{t.title}</p>
        <p className="display display-2 mt-2">{t.stanceRest}</p>
        <p className="body-1 mt-4">{t.restBody}</p>
        <Why>{t.restWhy}</Why>
      </section>
    );
  }

  const result = recommendation(shape, state);

  /*
   * Sem prontidão, o objetivo cru: cartão normal, sem realce, sem custo e sem razão. O registo
   * pode também ter falhado a carregar, e a resposta honesta é a mesma — não se sabe, logo não
   * se diz.
   */
  if (!result.ok || sessions.isError) {
    return (
      <section className="card">
        <p className="label">{t.title}</p>
        <p className="display display-3 mt-2">{dayRef.name}</p>
        <p className="body-2 muted mt-2">{t.noReason}</p>
      </section>
    );
  }

  const rec = result.value;

  /*
   * A razão, montada dos mesmos pedaços que o cartão de prontidão usa, com os números reais.
   * A linha da densidade entra só quando é ela que explica o "com margem" — quando o que o
   * explica é ter treinado hoje, a primeira linha já o disse.
   */
  const why: string[] = [`${t.scorePre} ${rec.score}.`];
  if (rec.daysSinceLast <= 0) why.push(r.trainedToday);
  else if (rec.daysSinceLast === 1) why.push(r.trainedYesterday);
  else why.push(`${r.trainedAgoPre} ${rec.daysSinceLast} ${r.trainedAgoPost}`);
  why.push(r.window);
  if (rec.stance === 'moderar' && rec.sessionsLast7 >= 5) why.push(r.dense);
  why.push(
    `${rec.sessionsLast7} ${rec.sessionsLast7 === 1 ? r.sessionsWeekOne : r.sessionsWeekMany}`,
  );

  const minutes = summary?.minutes ?? null;
  const category = categoryOf(dayRef, locale);

  return (
    <section className="card card-accent">
      <p className="label text-text">{t.title}</p>
      <p className="display display-2 mt-2">
        {rec.stance === 'moderar' ? t.stanceModerate : t.stanceTrain}
      </p>

      {/* Quanto custa. Cada chip só existe se se conseguir derivar — nenhum é decorativo. */}
      {minutes !== null || category !== null ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {minutes !== null ? (
            <span className="chip chip-sm tabular">
              ~{minutes} {t.minutes}
            </span>
          ) : null}
          {category !== null ? <span className="chip chip-sm">{category}</span> : null}
        </div>
      ) : null}

      <Why>{why.join(' ')}</Why>
    </section>
  );
}

/**
 * O "Por quê?", aberto por quem o quiser. É obrigatório existir (§4.2) e não é obrigatório
 * ocupar o ecrã: o veredito responde à pergunta, e a razão está a um toque de quem duvidar.
 *
 * `<details>` nativo, porque é exatamente isto que ele é — e porque traz de graça o teclado,
 * o leitor de ecrã e o estado aberto, que uma div com `onClick` teria de refazer pior. O alvo
 * leva `py-1` para passar os 24px do critério de tamanho com a mão suada do §Operating Context.
 */
function Why({ children }: { children: string }) {
  const t = useT().train.recommend;
  return (
    <details className="mt-4">
      <summary className="body-2 body-med cursor-pointer py-1">{t.whyLabel}</summary>
      <p className="body-2 mt-2">{children}</p>
    </details>
  );
}

/**
 * A categoria do dia — "Condicionamento", "Inferior", "Push" — tirada da sobrancelha autorada,
 * que a escreve como "Dia 6 · Condicionamento". É a segunda metade, e é conteúdo do programa:
 * não se reescreve e não se inventa aqui. Traduzida, sim — desde o Passo F a sobrancelha é
 * autorada nas quatro línguas, e a categoria é a metade de trás da frase que já está escrita
 * em espanhol e em francês. Partir a autorada é que seria inventar.
 *
 * Um dia criado por alguém não tem sobrancelha nenhuma, e então não há chip. Metade de um custo
 * verdadeiro vale mais do que um custo inteiro com uma palavra inventada lá dentro.
 */
function categoryOf(dayRef: DayRef, locale: Locale): string | null {
  const eyebrow = dayRef.day?.eyebrow[locale] ?? '';
  const parts = eyebrow.split('·');
  if (parts.length < 2) return null;
  const category = parts[1].trim();
  return category === '' ? null : category;
}
