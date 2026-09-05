import { describe, expect, it } from 'vitest';

import { BLOCKS, DAYS, type BlockKey } from '../../content';
import { blockSummary } from './block-summary';
import { resolveDayEntries } from './day-entries';

/**
 * What a phase costs on a day.
 *
 * The figures the rail prints are the first ones in this app that are computed rather
 * than prescribed, so the thing worth pinning is not a particular number but that the
 * number comes from the programme: the same day costs less on the deload than in the
 * heavy block, because the deload prescribes fewer sets, and a rest day costs nothing
 * at all rather than "~0 min".
 */

const EMPTY = { customs: [], overrides: [], hidden: [], order: [], catalog: [], additions: [] };

function summaryOf(dayNo: number, block: BlockKey) {
  const day = DAYS.find((d) => d.id === dayNo) ?? null;
  return blockSummary(resolveDayEntries({ day, dayNo, block, ...EMPTY }).entries);
}

describe('blockSummary', () => {
  it('counts the exercises the day actually resolves to', () => {
    // Day 1 ships six slots; the count is the same in every block, because a block
    // changes the targets and not the list.
    for (const block of BLOCKS) {
      expect(summaryOf(1, block.k as BlockKey).count).toBe(6);
    }
  });

  it('estimates fewer minutes on the deload than on the heavy block', () => {
    const heavy = summaryOf(1, 'b3').minutes!;
    const deload = summaryOf(1, 'dl').minutes!;
    expect(heavy).toBeGreaterThan(deload);
  });

  it('derives the estimate from sets and prescribed rest, and nothing else', () => {
    const day = DAYS.find((d) => d.id === 1)!;
    const expected = (day.items ?? []).reduce((total, item) => {
      const match = item.b1.rest.match(/(\d+)/);
      const value = match ? Number(match[1]) : 90;
      const seconds = /min/i.test(item.b1.rest) ? value * 60 : value;
      return total + item.b1.s * seconds;
    }, 0);
    expect(summaryOf(1, 'b1').minutes).toBe(Math.round(expected / 60));
  });

  it('gives a rest day no duration at all rather than zero', () => {
    const rest = summaryOf(7, 'b1');
    expect(rest.count).toBe(0);
    expect(rest.minutes).toBeNull();
  });

  it('gives no duration when every exercise has been taken out of the day', () => {
    const day = DAYS.find((d) => d.id === 1)!;
    const hidden = (day.items ?? []).map((item, index) => ({
      user_id: '00000000-0000-4000-8000-000000000001',
      updated_at: '2026-01-01T00:00:00Z',
      id: `hidden-${index}`,
      day_no: 1,
      ex_key: item.ex,
      deleted: false,
    }));
    const resolved = resolveDayEntries({ ...EMPTY, day, dayNo: 1, block: 'b1', hidden });
    expect(blockSummary(resolved.entries)).toEqual({ count: 0, minutes: null });
  });
});
