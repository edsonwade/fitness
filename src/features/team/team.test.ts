import { describe, expect, it } from 'vitest';

import { openDays, rank, startsAt, tonnes } from './team';

const R = (user_id: string, volume_kg: number, sessions = 3, prev: number | null = null) => ({
  user_id,
  name: user_id,
  photo: null,
  sessions,
  volume_kg,
  prev_volume_kg: prev,
});

describe('a Equipa', () => {
  it('ordena por volume, numera, marca os três primeiros e a tua linha', () => {
    const rows = rank([R('a', 100), R('me', 300, 3, 200), R('b', 500), R('c', 0)], 'me');
    expect(rows.map((r) => r.user_id)).toEqual(['b', 'me', 'a', 'c']);
    expect(rows[1]).toMatchObject({ rank: 2, isYou: true, isTop: true, delta: 100 });
    expect(rows[3].isTop).toBe(false);
  });

  it('toneladas com uma casa', () => {
    expect(tonnes(44720)).toBe(44.7);
  });

  it('sem disponibilidade não há dias; com ela, só os dias dela', () => {
    expect(openDays([], new Date(2026, 8, 12))).toEqual([]);
    // a partir de sáb 12: qua 16, qui 17, sáb 19, qua 23, qui 24, sáb 26
    const days = openDays([3, 4, 6], new Date(2026, 8, 12));
    expect(days.map((d) => d.getDate())).toEqual([16, 17, 19, 23, 24, 26]);
  });

  it('a hora marcada é a hora local', () => {
    const iso = startsAt(new Date(2026, 8, 16), 18);
    expect(new Date(iso).getHours()).toBe(18);
  });
});
