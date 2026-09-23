import { shiftDays } from '../train/readiness';

/**
 * As contas do Calendário — fase 015, `proto/v2/10-calendario.html`.
 *
 * Datas como `YYYY-MM-DD` locais, a mesma chave que `sessionDate` usa: uma sessão às 23:40
 * cai no dia em que se treinou. A semana começa à segunda. O número de dias de cada mês sai
 * do próprio `Date` (dia 0 do mês seguinte), sem contas à mão, e os bissextos vêm de graça.
 */
export type DayState = 'done' | 'planned' | 'missed' | 'rest' | 'none';

export type Cell = { date: string; day: number; inMonth: boolean };

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Segunda = 0 … Domingo = 6. */
export function weekdayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

/** O mês em semanas completas, de segunda a domingo, com os dias de fora marcados. */
export function monthGrid(year: number, month: number): Cell[] {
  const first = iso(year, month, 1);
  const lead = weekdayIndex(first);
  const count = daysInMonth(year, month);
  const cells: Cell[] = [];
  for (let i = lead; i > 0; i -= 1) {
    const date = shiftDays(first, -i);
    cells.push({ date, day: Number(date.slice(8)), inMonth: false });
  }
  for (let d = 1; d <= count; d += 1) cells.push({ date: iso(year, month, d), day: d, inMonth: true });
  while (cells.length % 7 !== 0) {
    const date = shiftDays(cells[cells.length - 1].date, 1);
    cells.push({ date, day: Number(date.slice(8)), inMonth: false });
  }
  return cells;
}

/**
 * O estado de um dia. Feito = houve sessão. Descanso = o plano marca a ranhura como descanso.
 * Por vir (hoje incluído) = planeado. Passado sem sessão = falhado — mas só depois da primeira
 * sessão gravada: antes disso não há histórico, e o dia não se pinta como falha.
 */
export function dayState(
  date: string,
  today: string,
  restSlots: ReadonlySet<number>,
  doneDates: ReadonlySet<string>,
  firstSession: string | null,
): DayState {
  if (doneDates.has(date)) return 'done';
  if (restSlots.has(weekdayIndex(date))) return 'rest';
  if (date >= today) return 'planned';
  if (firstSession !== null && date >= firstSession) return 'missed';
  return 'none';
}

/**
 * O que a folha de um dia mostra — B2 de .claude/skills/calendario-ir-para-hoje/PLANO.md.
 * Tocar num dia NUNCA sai do Calendário: abre sempre esta folha, e só o botão dela navega.
 * Um dia feito mostra a sessão; um descanso diz que é descanso; o resto (planeado, falhado,
 * sem registo) mostra o treino que o plano tem para esse dia da semana.
 */
export type SheetKind = 'session' | 'plan' | 'rest';

export function daySheet(state: DayState, hasSession: boolean): SheetKind {
  if (state === 'done' && hasSession) return 'session';
  if (state === 'rest') return 'rest';
  return 'plan';
}

/** O resumo do mês até hoje: feitas, planeadas até hoje, e as datas falhadas. */
export function monthSummary(
  cells: readonly Cell[],
  today: string,
  restSlots: ReadonlySet<number>,
  doneDates: ReadonlySet<string>,
  firstSession: string | null,
): { done: number; planned: number; missed: string[] } {
  let done = 0;
  let planned = 0;
  const missed: string[] = [];
  for (const c of cells) {
    if (!c.inMonth || c.date > today) continue;
    const s = dayState(c.date, today, restSlots, doneDates, firstSession);
    if (s === 'done') done += 1;
    if (s === 'missed') missed.push(c.date);
    if (s === 'done' || s === 'missed' || (s === 'planned' && c.date === today)) planned += 1;
  }
  return { done, planned, missed };
}

/**
 * O mapa do ano: uma coluna por semana (segunda a domingo), da semana da primeira sessão até
 * à de hoje. "O ano inteiro precisa de um ano de dados": mostra-se só o que existe.
 */
export function yearMap(firstSession: string | null, today: string): string[][] {
  if (firstSession === null) return [];
  let monday = shiftDays(firstSession, -weekdayIndex(firstSession));
  const weeks: string[][] = [];
  while (monday <= today) {
    weeks.push(Array.from({ length: 7 }, (_, i) => shiftDays(monday, i)));
    monday = shiftDays(monday, 7);
  }
  return weeks;
}
