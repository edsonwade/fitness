import { describe, expect, it } from 'vitest';

import {
  formatLoad,
  formatReps,
  formatRest,
  parseLoad,
  parseReps,
  parseRest,
  parseSets,
} from './prescription-values';

describe('prescription values', () => {
  it('reads sets and keeps them between 1 and 10', () => {
    expect(parseSets('3')).toBe(3);
    expect(parseSets('12')).toBe(10);
    expect(parseSets('')).toBeNull();
    expect(parseSets('0')).toBeNull();
  });

  it('reads a rep range, a fixed count, and nothing', () => {
    expect(parseReps('10-12')).toEqual({ min: 10, max: 12 });
    expect(parseReps('12–8')).toEqual({ min: 8, max: 12 });
    expect(parseReps('15')).toEqual({ min: 15, max: 15 });
    expect(parseReps('AMRAP')).toBeNull();
  });

  it('writes a range, and a fixed count when both ends meet', () => {
    expect(formatReps({ min: 8, max: 12 })).toBe('8-12');
    expect(formatReps({ min: 12, max: 8 })).toBe('8-12');
    expect(formatReps({ min: 10, max: 10 })).toBe('10');
  });

  it('reads rest in minutes, seconds and clock form', () => {
    expect(parseRest('2 min')).toBe(120);
    expect(parseRest('1,5 min')).toBe(90);
    expect(parseRest('90 s')).toBe(90);
    expect(parseRest('90s')).toBe(90);
    expect(parseRest('1:30')).toBe(90);
    expect(parseRest('')).toBeNull();
    expect(formatRest(120)).toBe('120 s');
  });

  it('reads a load and leaves the unfilled one empty', () => {
    expect(parseLoad('20 kg/hand')).toBe(20);
    expect(parseLoad('62,5 kg')).toBe(62.5);
    expect(parseLoad('— to fill in')).toBeNull();
  });

  it('writes the load back into its own text', () => {
    expect(formatLoad(22.5, '20 kg/hand')).toBe('22,5 kg/hand');
    expect(formatLoad(40, '— to fill in')).toBe('40 kg');
    expect(formatLoad(40, '')).toBe('40 kg');
  });
});
