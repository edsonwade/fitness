import { describe, expect, it } from 'vitest';

import { datesWithEvents, eventsOn, mondayAt, pendingReminders, reminderAt } from './events';

const ev = (id: string, local_date: string, local_time: string | null, notify = true, title = id) => ({
  id,
  local_date,
  local_time,
  title,
  notify,
});

describe('os eventos de um dia', () => {
  it('só os desse dia, os sem hora primeiro e depois pela hora', () => {
    const list = [ev('b', '2026-09-24', '18:00'), ev('a', '2026-09-24', null), ev('c', '2026-09-24', '07:30'), ev('x', '2026-09-25', null)];
    expect(eventsOn(list, '2026-09-24').map((e) => e.id)).toEqual(['a', 'c', 'b']);
  });

  it('qualquer dia pode ter eventos, passado ou de outro ano', () => {
    const list = [ev('p', '2025-01-01', null), ev('f', '2027-12-31', '10:00')];
    expect(datesWithEvents(list)).toEqual(new Set(['2025-01-01', '2027-12-31']));
    expect(eventsOn(list, '2025-01-01')).toHaveLength(1);
  });
});

describe('quando o evento avisa', () => {
  it('à hora marcada, ou às 09:00 sem hora', () => {
    expect(reminderAt(ev('a', '2026-09-24', '18:30'))).toEqual(new Date(2026, 8, 24, 18, 30));
    expect(reminderAt(ev('a', '2026-09-24', null))).toEqual(new Date(2026, 8, 24, 9, 0));
  });

  it('dá já os de hoje cuja hora passou, e agenda os que vêm dentro do horizonte', () => {
    const now = new Date(2026, 8, 24, 10, 0);
    const list = [ev('passou', '2026-09-24', '08:00'), ev('logo', '2026-09-24', '10:30'), ev('amanha', '2026-09-25', '08:00')];
    const out = pendingReminders(list, now, new Set(), 60 * 60 * 1000);
    expect(out.map((r) => [r.event.id, r.delay])).toEqual([
      ['passou', 0],
      ['logo', 30 * 60 * 1000],
    ]);
  });

  it('não repete um aviso já dado, nem avisa sem "Avisar-me", nem acorda um dia que já passou', () => {
    const now = new Date(2026, 8, 24, 10, 0);
    const list = [ev('dado', '2026-09-24', '08:00'), ev('mudo', '2026-09-24', '08:00', false), ev('ontem', '2026-09-23', '08:00')];
    expect(pendingReminders(list, now, new Set(['dado']), 60 * 60 * 1000)).toEqual([]);
  });
});

describe('a semana à vista', () => {
  it('a Segunda desta semana, da anterior e da seguinte', () => {
    // 2026-09-23 é uma quarta-feira.
    expect(mondayAt('2026-09-23', 0)).toBe('2026-09-21');
    expect(mondayAt('2026-09-23', -1)).toBe('2026-09-14');
    expect(mondayAt('2026-09-23', 1)).toBe('2026-09-28');
  });

  it('um domingo pertence à semana que começou na segunda antes dele', () => {
    expect(mondayAt('2026-09-27', 0)).toBe('2026-09-21');
  });

  it('atravessa meses e anos sem limite', () => {
    expect(mondayAt('2026-09-23', 15)).toBe('2027-01-04');
    expect(mondayAt('2026-09-23', -52)).toBe('2025-09-22');
  });
});
