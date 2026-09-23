import { describe, expect, it } from 'vitest';

import { DIAL_START, DIAL_TICKS, demoDial, dialAt, dialSeconds, litTicks, restDial, tickDial } from './run-dial';

describe('the Executar dial', () => {
  it('counts the set up from 0:00 and lights ticks as it goes', () => {
    let dial = DIAL_START;
    expect(dialSeconds(dial)).toBe(0);
    expect(litTicks(dial)).toBe(0);
    dial = tickDial(tickDial(dial));
    expect(dialSeconds(dial)).toBe(2);
    expect(litTicks(dial)).toBeGreaterThan(0);
    for (let i = 2; i < 30; i++) dial = tickDial(dial);
    expect(litTicks(dial)).toBe(Math.round(DIAL_TICKS / 2));
  });

  it('keeps every tick lit on the minute, then starts the next lap', () => {
    let dial = DIAL_START;
    for (let i = 0; i < 60; i++) dial = tickDial(dial);
    expect(litTicks(dial)).toBe(DIAL_TICKS);
    expect(litTicks(tickDial(dial))).toBe(1);
  });

  it('counts the rest down once a set is ticked, then goes back to the set at zero', () => {
    let dial = restDial(3);
    expect(dialSeconds(dial)).toBe(3);
    expect(litTicks(dial)).toBe(0);
    dial = tickDial(dial);
    expect(dialSeconds(dial)).toBe(2);
    dial = tickDial(tickDial(dial));
    expect(dial).toEqual(DIAL_START);
  });
});

describe('the dial from its anchor', () => {
  it('reads the set and the rest from the clock', () => {
    expect(dialAt({ mode: 'set', since: 0 }, 2500)).toEqual({ mode: 'set', up: 2 });
    expect(dialAt({ mode: 'rest', since: 0, total: 90 }, 30_000)).toEqual({ mode: 'rest', left: 60, total: 90 });
    expect(dialAt({ mode: 'rest', since: 0, total: 90 }, 93_000)).toEqual({ mode: 'set', up: 3 });
  });
});

describe('the dial during the demonstration', () => {
  it('fills with the video and counts down what is left', () => {
    expect(demoDial(0, 6)).toEqual({ lit: 0, left: 6 });
    expect(demoDial(3, 6).lit).toBe(Math.round(DIAL_TICKS / 2));
    expect(demoDial(6, 6)).toEqual({ lit: DIAL_TICKS, left: 0 });
    expect(demoDial(0.8, 6).left).toBe(6);
  });

  it('never goes past the ends', () => {
    expect(demoDial(9, 6)).toEqual({ lit: DIAL_TICKS, left: 0 });
    expect(demoDial(-1, 6)).toEqual({ lit: 0, left: 6 });
  });

  it('stays at zero while the video has no length', () => {
    expect(demoDial(1, 0)).toEqual({ lit: 0, left: 0 });
    expect(demoDial(1, Number.NaN)).toEqual({ lit: 0, left: 0 });
    expect(demoDial(1, Number.POSITIVE_INFINITY)).toEqual({ lit: 0, left: 0 });
  });
});
