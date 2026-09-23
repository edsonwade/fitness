import { describe, expect, it, vi } from 'vitest';

vi.mock('../../data/db', () => ({ fetchRows: vi.fn(), upsertRow: vi.fn() }));

const { FORMAT, PRIVATE_TABLES, importPlan } = await import('./data-port');

describe('exportar e importar', () => {
  it('só as tabelas da própria conta, nunca o plano partilhado', () => {
    expect(PRIVATE_TABLES).toContain('sessions');
    expect(PRIVATE_TABLES).toContain('goals');
    expect(PRIVATE_TABLES).not.toContain('custom_days');
    expect(PRIVATE_TABLES).not.toContain('day_order');
  });

  it('diz o que vai escrever antes de escrever', () => {
    const plan = importPlan({
      format: FORMAT,
      version: 1,
      tables: { sessions: [{ id: 'a' }, { id: 'b' }], goals: [{ id: 'g' }], custom_days: [{ day_no: 101 }] },
    });
    expect(plan.ok).toBe(true);
    if (plan.ok) {
      expect(plan.total).toBe(3);
      expect(plan.tables.map((t) => t.table).sort()).toEqual(['goals', 'sessions']);
    }
  });

  it('recusa um ficheiro que não é desta app', () => {
    expect(importPlan({ foo: 1 }).ok).toBe(false);
    expect(importPlan(null).ok).toBe(false);
    expect(importPlan({ format: FORMAT, tables: {} }).ok).toBe(false);
  });
});
