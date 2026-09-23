/**
 * O mostrador de traços do ecrã Executar, em números.
 *
 * Decisão dele, 2026-09-22: durante a SÉRIE o mostrador conta a subir (0:00, 0:01…) e
 * os traços acendem-se ao longo de um minuto; ao marcar a série passa a DESCANSO e
 * conta para baixo, com os traços a acender à medida que o descanso passa. Quando o
 * descanso acaba, a série seguinte volta a contar do zero. Portado de `paintUp`,
 * `paintDial` e `enterSet` em `proto/v2/proto.js`.
 */

export const DIAL_TICKS = 33;
/** Uma volta dos traços, na série: um minuto. */
export const SET_CYCLE = 60;

export type Dial =
  | { mode: 'set'; up: number }
  | { mode: 'rest'; left: number; total: number };

export const DIAL_START: Dial = { mode: 'set', up: 0 };

/** Um segundo depois. */
export function tickDial(dial: Dial): Dial {
  if (dial.mode === 'set') return { mode: 'set', up: dial.up + 1 };
  const left = Math.max(0, dial.left - 1);
  return left === 0 ? DIAL_START : { ...dial, left };
}

/** Marcar uma série põe o descanso a correr. */
export function restDial(seconds: number): Dial {
  return seconds > 0 ? { mode: 'rest', left: seconds, total: seconds } : DIAL_START;
}

/** Os segundos que o mostrador escreve ao centro. */
export function dialSeconds(dial: Dial): number {
  return dial.mode === 'set' ? dial.up : dial.left;
}

/** Quantos traços estão acesos, de 0 a 33. */
export function litTicks(dial: Dial): number {
  if (dial.mode === 'set') {
    const within = dial.up % SET_CYCLE || (dial.up ? SET_CYCLE : 0);
    return Math.round((within / SET_CYCLE) * DIAL_TICKS);
  }
  if (dial.total <= 0) return 0;
  return Math.round(((dial.total - dial.left) / dial.total) * DIAL_TICKS);
}

/**
 * Onde o mostrador está ancorado: o instante em que a série ou o descanso começou.
 * O ecrã guarda a âncora e deriva o mostrador da hora, a cada segundo — nada conta às
 * escondidas, e mudar de exercício é mudar de âncora.
 */
export type DialAnchor = { mode: 'set'; since: number } | { mode: 'rest'; since: number; total: number };

/** O mostrador de uma âncora, à hora `now` (ms). O descanso que acaba volta à série. */
export function dialAt(anchor: DialAnchor, now: number): Dial {
  const s = Math.max(0, Math.floor((now - anchor.since) / 1000));
  if (anchor.mode === 'set') return { mode: 'set', up: s };
  const left = anchor.total - s;
  return left > 0 ? { mode: 'rest', left, total: anchor.total } : { mode: 'set', up: -left };
}

/**
 * O mostrador durante a demonstração em vídeo (B8 de
 * `.claude/skills/executar-demo-equipamento-ordem/PLANO.md`): os traços acendem-se na
 * proporção do vídeo já visto e o relógio conta a descer o que falta. Portado de
 * `paintDemo` em `proto/v2/proto.js`.
 */
export function demoDial(t: number, d: number): { lit: number; left: number } {
  if (!Number.isFinite(d) || d <= 0) return { lit: 0, left: 0 };
  const at = Number.isFinite(t) ? Math.max(0, t) : 0;
  const lit = Math.min(DIAL_TICKS, Math.max(0, Math.round((at / d) * DIAL_TICKS)));
  return { lit, left: Math.max(0, Math.ceil(d - at)) };
}
