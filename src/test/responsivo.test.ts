import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { openSync, type Font } from 'fontkit';
import { describe, expect, it } from 'vitest';

import { DICTIONARIES, LOCALE_NAMES, LOCALES, type Locale } from '../i18n';
import { shortWeekday } from '../ui/weekday';

/*
 * B8 de .claude/skills/nutricao-sem-erros/PLANO.md, foto 20:10: "Macros" cortado a 360 e
 * 390 px. A app inteira tem de caber de 320 a 430 px, nas quatro línguas, e isto prova-se
 * sem browser: cada texto de cada fila fixa é medido com as fontes que a app carrega
 * (public/fonts/), com o tamanho, o peso, a caixa e o espaçamento que o CSS lhe dá, e a
 * soma com padding e gaps é comparada com a largura de cada ecrã.
 *
 * O Archivo é variável e o fontkit só mede a instância por omissão (600) de um woff2; o que
 * no CSS é 700 leva mais 4 %, que é mais do que a diferença real — o erro é para o lado seguro.
 */

const ROOT = process.cwd();
const WIDTHS = [320, 360, 390, 430] as const;
const APP_MAX = 424; // max-w-[26.5rem] da casca: acima disto a app não cresce
const GUTTER = 20; // --sp-5, a margem de cada lado de .screen-pad, .appbar e da folha

const archivo = openSync(join(ROOT, 'public/fonts/archivo-var.woff2')) as Font;
const anton = openSync(join(ROOT, 'public/fonts/anton.woff2')) as Font;

type Type = { size: number; weight?: number; upper?: boolean; spacing?: number; display?: boolean };

function measure(text: string, type: Type): number {
  const font = type.display ? anton : archivo;
  const s = type.upper ? text.toLocaleUpperCase() : text;
  const raw = (font.layout(s).advanceWidth / font.unitsPerEm) * type.size;
  const bold = !type.display && (type.weight ?? 600) >= 700 ? 1.04 : 1;
  return raw * bold + (type.spacing ?? 0) * type.size * [...s].length;
}

const css = readFileSync(join(ROOT, 'src/styles/system.css'), 'utf8');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

type Row = { screen: string; piece: string; locale: Locale; vw: number; need: number; room: number; text: string };
const rows: Row[] = [];

function check(screen: string, piece: string, locale: Locale, vw: number, text: string, need: number, room: number) {
  rows.push({ screen, piece, locale, vw, need: Math.ceil(need), room: Math.floor(room), text });
}

const CHIP: Type = { size: 13, weight: 600 };
const chipWidth = (s: string) => measure(s, CHIP) + 28 + 2; // padding 8/14, borda 1
const SEG: Type = { size: 13, weight: 600 };
const BTN: Type = { size: 15, weight: 700 };
const LABEL: Type = { size: 11, weight: 600, upper: true, spacing: 0.06 };

for (const locale of LOCALES) {
  const t = DICTIONARIES[locale];
  for (const vw of WIDTHS) {
    const W = Math.min(vw, APP_MAX) - GUTTER * 2;

    /* A barra de baixo: cinco colunas iguais, rótulo de 10.5 px. */
    for (const k of ['today', 'train', 'nutrition', 'team', 'profile'] as const) {
      check('Barra de baixo', 'separador', locale, vw, t.nav[k], measure(t.nav[k], { size: 10.5 }), Math.min(vw, APP_MAX) / 5 - 4);
    }

    /* As barras de topo: o título Anton 18 px e dois botões redondos de 44 com gap de 12. */
    const titles: [string, string][] = [
      ['Nutrição', t.nutrition.title],
      ['Equipa', t.team.title],
      ['Perfil', t.profile.title],
      ['Progresso', t.progress.title],
      ['Calendário', t.calendar.title],
      ['Evolução', t.evolution.title],
      ['Treino', t.train.title],
    ];
    for (const [screen, title] of titles) {
      const need = measure(title, { size: 18, display: true, upper: true, spacing: 0.025 });
      check(screen, 'título da barra de topo', locale, vw, title, need, W - 2 * 44 - 2 * 12);
    }

    /* Os separadores do Nutrição: numa linha só enquanto forem .hscroll; em linhas com .chipwrap. */
    const tabs = [t.nutrition.tabToday, t.nutrition.tabHistory, t.nutrition.tabQuick, t.nutrition.tabRecipes, t.nutrition.tabMacros];
    if (/className="hscroll"[^>]*>\s*\{tabs\.map/.test(read('src/features/nutrition/Nutrition.tsx'))) {
      const need = tabs.reduce((s, x) => s + chipWidth(x), 0) + 8 * (tabs.length - 1);
      check('Nutrição', 'separadores (numa linha)', locale, vw, tabs.join(' · '), need, W);
    } else {
      for (const x of tabs) check('Nutrição', 'separador', locale, vw, x, chipWidth(x), W);
    }

    /* A tira da semana: sete colunas, o dia abreviado em maiúsculas de 10.5 px. */
    for (let d = 0; d < 7; d++) {
      const day = shortWeekday(locale, new Date(2026, 8, 21 + d));
      check('Nutrição', 'tira da semana', locale, vw, day, measure(day, { size: 10.5, upper: true }), (W - 6 * 4) / 7 - 4);
    }

    /* Os quatro números da folha do alimento. */
    const macroCols = /@media \(min-width: 400px\) \{ \.food-macros \{ grid-template-columns: repeat\(4/.test(css) ? (vw >= 400 ? 4 : 2) : 4;
    const macroCol = (W - (macroCols - 1) * 8) / macroCols - 18;
    for (const label of [t.nutrition.calories, t.nutrition.protein, t.nutrition.carbs, t.nutrition.fat]) {
      check('Nutrição · folha do alimento', `números (${macroCols} colunas)`, locale, vw, label, measure(label, LABEL), macroCol);
    }
    check('Nutrição · folha do alimento', `números (${macroCols} colunas)`, locale, vw, '1250 kcal', measure('1250 kcal', { size: 15, weight: 500 }), macroCol);

    /* Os botões da folha do alimento: ícone 16 + gap 8 + padding 24×2 + borda. */
    /* Com flex-wrap, um botão que não cabe ao lado do outro desce: cada um só precisa de caber na linha. */
    const wraps = /\.food-actions \{ display: flex; flex-wrap: wrap;/.test(css);
    const actionCols = wraps ? 1 : 2;
    const actionCol = (W - (actionCols - 1) * 12) / actionCols;
    const pairs = [
      [t.nutrition.deleteFood, t.nutrition.addShort],
      [t.nutrition.photoChangeShort, t.nutrition.photoRemoveShort],
      [t.nutrition.cancel, t.nutrition.save],
    ];
    for (const label of pairs.flat()) {
      check('Nutrição · folha do alimento', wraps ? 'botões (partem em linhas)' : 'botões (2 por linha)', locale, vw, label, measure(label, BTN) + 48 + 3 + 24, actionCol);
    }

    /* Os controlos segmentados: colunas iguais, o padding do CSS de cada lado, 3 px de caixa. */
    const segmented: [string, string[]][] = [
      ['Equipa · secções', [t.team.table, t.team.wall, t.team.trainers]],
      ['Equipa · período', [t.team.p7, t.team.p30, t.team.pAll]],
      ['Progresso · período', [t.progress.p7, t.progress.p30, t.progress.pAll]],
      ['Calendário · vista', [t.calendar.month, t.calendar.year]],
      ['Perfil · tema', [t.profile.dark, t.profile.light, t.profile.system]],
      ['Perfil · unidade', [t.profile.unitKg, t.profile.unitCount]],
    ];
    const narrowSeg = vw <= 340 && /@media \(max-width: 340px\) \{ \.segmented button \{ padding-inline: 6px; font-size: 12px; \} \}/.test(css);
    const segPad = narrowSeg ? 12 : /\.segmented button \{ padding-inline: 8px; \}/.test(css) ? 16 : 24;
    const segType: Type = narrowSeg ? { size: 12, weight: 600 } : SEG;
    for (const [screen, labels] of segmented) {
      const col = (W - 6) / labels.length - segPad;
      for (const label of labels) check(screen, 'segmentado', locale, vw, label, measure(label, segType), col);
    }

    /* A língua, nas Definições: presets que partem em linhas (antes, um segmentado de 4). */
    const lang = read('src/features/profile/Profile.tsx');
    const langWraps = /className="presetrow" role="radiogroup" aria-label=\{t\.language\}/.test(lang);
    for (const l of LOCALES) {
      const name = LOCALE_NAMES[l];
      const need = langWraps ? measure(name, { size: 14 }) + 32 + 2 : measure(name, SEG);
      check('Perfil · língua', langWraps ? 'preset' : 'segmentado', locale, vw, name, need, langWraps ? W : (W - 6) / 4 - segPad);
    }

    /* A câmara: a pílula dos quatro modos ao lado da lupa. */
    const lupa = vw <= 370 ? 52 : 46;
    const modeCol = (Math.min(vw, APP_MAX) - 32 - lupa - 8 - 12 - 6) / 4 - 4;
    for (const m of [t.nutrition.voice, t.nutrition.text, t.nutrition.ai, t.nutrition.code]) {
      check('Nutrição · câmara', 'modo', locale, vw, m, measure(m, { size: vw <= 370 ? 9.5 : 10.5 }), modeCol);
    }

    /* A grelha das séries: 68 · resto · resto · 46 · resto, cabeçalhos de 9.5 px. */
    const narrowGrid = /@media \(max-width: 340px\) \{ \.setgrid th \{ font-size: 9px; letter-spacing: 0; \} \}/.test(css);
    const H: Type = narrowGrid && vw <= 340 ? { size: 9, upper: true } : { size: 9.5, upper: true, spacing: 0.01 };
    const rest = (W - 68 - 46) / 3 - 2;
    const r = t.run;
    check('Executar · séries', 'cabeçalho', locale, vw, r.colLog, measure(r.colLog, H), 68 - 10);
    check('Executar · séries', 'cabeçalho', locale, vw, r.colRest, measure(r.colRest, H), rest);
    check('Executar · séries', 'cabeçalho', locale, vw, r.colEffort, measure(r.colEffort, H), rest);
    check('Executar · séries', 'cabeçalho', locale, vw, r.colReps, measure(r.colReps, H), 46 - 2);
    check('Executar · séries', 'cabeçalho', locale, vw, r.colWeight, measure(r.colWeight, H), rest);
  }
}

function report() {
  const bad = rows.filter((x) => x.need > x.room);
  const lines = [
    '# Relatório B8: o que cabe a 320, 360, 390 e 430 px',
    '',
    'Gerado por `src/test/responsivo.test.ts`, que mede cada texto com `public/fonts/archivo-var.woff2` e `public/fonts/anton.woff2`.',
    `O relatório tem ${rows.length} medições, e ${bad.length} delas não cabem.`,
    '',
    '| Ecrã | Peça | Língua | Largura | Texto | Precisa | Tem | Cabe? |',
    '|---|---|---|---|---|---|---|---|',
    ...[...bad, ...rows.filter((x) => x.need <= x.room)].map(
      (x) => `| ${x.screen} | ${x.piece} | ${x.locale} | ${x.vw} | ${x.text} | ${x.need} | ${x.room} | ${x.need > x.room ? 'não' : 'sim'} |`,
    ),
  ];
  const reportDir = join(ROOT, '.claude/skills/nutricao-sem-erros');
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(join(reportDir, 'relatorio-b8.md'), lines.join('\n') + '\n');
  return bad;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('B8 · a app cabe de 320 a 430 px, nas quatro línguas', () => {
  it('orçamento de largura: todas as filas fixas cabem a 320, 360, 390 e 430 px', () => {
    const bad = report();
    expect(bad.map((x) => `${x.screen} · ${x.piece} · ${x.locale} · ${x.vw}px · "${x.text}" precisa ${x.need}, tem ${x.room}`)).toEqual([]);
  });

  it('nenhuma fila de separadores ou de escolha rola de lado escondida (.hscroll)', () => {
    const offenders = walk(join(ROOT, 'src/features'))
      .filter((p) => p.endsWith('.tsx') && !p.includes('.test.'))
      .filter((p) => /className="hscroll"/.test(readFileSync(p, 'utf8')))
      .map((p) => p.slice(ROOT.length + 1));
    expect(offenders).toEqual([]);
  });

  it('nenhuma largura fixa acima de 320 px sem max-width, no CSS e no Tailwind', () => {
    const cssBad = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, , body]) => {
        const w = /(?:^|[;\s])(?:min-)?width:\s*(\d+)px/.exec(body);
        return w && Number(w[1]) > 320 && !/max-width:\s*100%/.test(body);
      })
      .map(([, sel]) => sel.trim());
    const twBad = walk(join(ROOT, 'src'))
      .filter((p) => p.endsWith('.tsx'))
      .flatMap((p) => [...readFileSync(p, 'utf8').matchAll(/\b(?:min-)?w-\[(\d+)px\]/g)].filter((m) => Number(m[1]) > 320).map((m) => `${p}: ${m[0]}`));
    expect([...cssBad, ...twBad]).toEqual([]);
  });
});
