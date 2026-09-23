import { describe, expect, it } from 'vitest';

import type { Goal } from '../../data/entities';
import { goalPct, nearest, num, remaining } from './goals';

const G = (start: string | null, target: string | null, current: string | null, hit_at: string | null = null) =>
  ({ id: `${start}-${target}-${current}`, start_value: start, target_value: target, current_value: current, hit_at }) as Goal;

describe('os objetivos', () => {
  it('lê o primeiro número do texto', () => {
    expect(num('66 kg')).toBe(66);
    expect(num('60,5')).toBe(60.5);
    expect(num('—')).toBeNull();
  });

  it('o progresso serve para descer (peso) e para subir (carga)', () => {
    expect(goalPct(G('76', '66', '68'))).toBe(80);
    expect(goalPct(G('50', '60', '55'))).toBe(50);
    expect(goalPct(G('50', '60', null))).toBeNull();
  });

  it('quanto falta', () => {
    expect(remaining(G('76', '66', '67,8'))).toBe(1.8);
    expect(remaining(G('50', '60', '62'))).toBe(0);
  });

  it('o objetivo perto é o mais adiantado, sem os atingidos', () => {
    const a = G('76', '66', '68');
    const b = G('50', '60', '52');
    const c = G('3', '4', '4', '2026-09-11');
    expect(nearest([a, b, c])).toBe(a);
    expect(nearest([])).toBeNull();
  });
});
