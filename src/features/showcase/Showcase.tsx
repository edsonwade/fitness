import { useState } from 'react';
import clsx from 'clsx';

import { BLOCKS, DAYS, EXERCISES } from '../../content';
import { useTheme, type ThemePreference } from '../../app/theme';

/**
 * Programs screen, built against the pinned reference image.
 *
 * Layout is taken from the reference screen by screen: a wash under the status bar,
 * circular back and menu buttons flanking a centred title, an ask bar with a
 * reversed mic button, a row of filter pills with one selected, a photographic hero
 * card carrying its own CTA, then a list of cards each with the photograph inset on
 * the right, a pill action and a progress ring. A round floating action sits over
 * the lot.
 *
 * TWO references, not one. Light follows the sand-and-orange image; dark follows the
 * cool near-black, mint-accented image pinned on 2026-08-31. Nothing here branches on
 * the mode: every colour comes from a role token and tokens.css decides what the role
 * resolves to. The chip and the mic disc are the two roles the references genuinely
 * disagree about, which is why they exist as roles at all.
 *
 * All content is real: the seven days, the block names, the exercise photographs.
 */
export function Showcase() {
  const { theme, setTheme } = useTheme();
  const [blockIndex, setBlockIndex] = useState(0);
  const programs = DAYS.filter((d) => d.type !== 'rest');
  const hero = programs[3];

  return (
    <div className="min-h-[100dvh] bg-page py-0 sm:py-8">
      {/*
        The app sits on the page background like the phone in the reference mockup:
        centred, rounded, its own ground, with the page colour framing it on a wide
        window. On a phone it fills the viewport and the frame disappears.
      */}
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[26.5rem] overflow-hidden bg-ground sm:min-h-0 sm:rounded-[40px] sm:shadow-[var(--shadow-float)]">
        {/* The peach wash bleeding down from the top of the screen. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-wash-from from-15% via-wash-from/75 via-45% to-wash-to"
        />

        <div className="relative px-7 pb-32">
          <TopBar theme={theme} setTheme={setTheme} />
          <AskBar />

          <SectionHeading title="Escolhe um plano" action="Ver tudo" />
          <BlockChips active={blockIndex} onSelect={setBlockIndex} />

          <HeroCard day={hero} blockIndex={blockIndex} />

          <h2 className="pb-3 pt-6 font-ui text-[17px] font-700 text-text">Lista de programas</h2>
          <ProgramList programs={programs} blockIndex={blockIndex} />
        </div>

        <FloatingAction />
      </div>
    </div>
  );
}

/* ---------- top bar --------------------------------------------------------- */

function TopBar({
  theme,
  setTheme,
}: {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
}) {
  const next: Record<ThemePreference, ThemePreference> = {
    system: 'light',
    light: 'dark',
    dark: 'system',
  };
  const labels: Record<ThemePreference, string> = {
    system: 'Sistema',
    light: 'Claro',
    dark: 'Escuro',
  };

  return (
    <header className="flex items-center gap-3 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <RoundButton label="Voltar">
        <path d="M15 5l-7 7 7 7" />
      </RoundButton>

      <h1 className="flex-1 text-center font-ui text-[21px] font-600 text-text">Programas</h1>

      {/*
        The theme control. The reference puts a settings gear here; this is the same
        slot, doing the one job that needs to be reachable while the look is being
        approved. It cycles system, light, dark and names the current state, so it
        is never a mystery icon.
      */}
      {/*
        Same slot as the reference's gear. It cycles system, light and dark, and
        names the current state to a screen reader rather than relying on the icon.
      */}
      <button
        type="button"
        onClick={() => setTheme(next[theme])}
        aria-label={`Tema: ${labels[theme]}. Tocar para mudar.`}
        className={clsx(
          'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-text',
          'shadow-[var(--shadow-card)]',
          'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
          'active:scale-[0.96] motion-reduce:active:scale-100',
        )}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {theme === 'dark' ? (
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
          ) : theme === 'light' ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
            </>
          ) : (
            <>
              <rect x="3" y="5" width="18" height="12" rx="2" />
              <path d="M8 21h8" />
            </>
          )}
        </svg>
      </button>
    </header>
  );
}

function RoundButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(
        'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-text',
        'shadow-[var(--shadow-card)]',
        'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'active:scale-[0.96] motion-reduce:active:scale-100',
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

function AskBar() {
  return (
    <div className="mt-5 flex items-center gap-2 rounded-full bg-surface p-2 pl-4 shadow-[var(--shadow-card)]">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted" aria-hidden="true">
        <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
      </svg>
      <input
        type="text"
        placeholder="Pergunta sobre os teus treinos"
        aria-label="Pergunta sobre os teus treinos"
        className="min-w-0 flex-1 bg-transparent font-ui text-[14px] text-text outline-none placeholder:text-text-muted"
      />
      {/*
        The disc reverses against the bar it sits in: near-black with a white icon
        in light, sunken to the ground colour with a mint icon in dark, which is
        how the dark reference draws the same control.
      */}
      <button
        type="button"
        aria-label="Falar"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-control text-control-ink transition-transform duration-[160ms] active:scale-[0.94] motion-reduce:active:scale-100"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
    </div>
  );
}

/* ---------- section heading ------------------------------------------------- */

function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-baseline justify-between pb-2.5 pt-5">
      <h2 className="font-ui text-[17px] font-700 text-text">{title}</h2>
      {action ? (
        <button
          type="button"
          className="font-ui text-[13px] font-500 text-text-muted transition-colors duration-[180ms] pointer-hover:text-text"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

/* ---------- filter pills (carousel) ----------------------------------------- */

function BlockChips({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  return (
    <div className="rail -mx-7 gap-2.5 px-7 pb-1" role="tablist" aria-label="Blocos de periodização">
      {BLOCKS.map((block, index) => {
        const selected = index === active;
        return (
          <button
            key={block.k}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onSelect(index)}
            className={clsx(
              'min-h-[44px] rounded-full px-5 font-ui text-[13.5px] font-500',
              'transition-colors duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
              'active:scale-[0.97] motion-reduce:active:scale-100',
              /*
                Both modes read their fill from the chip role, because the two
                pinned references disagree about what a selected chip is: light
                fills it orange, dark raises it to the card colour and leaves the
                rest bare on the ground. aria-selected above carries the state
                regardless of how close the two fills sit.
              */
              selected
                ? 'bg-chip-selected font-600 text-chip-selected-ink'
                : 'bg-chip text-chip-ink',
            )}
          >
            {block.t.pt}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- hero card ------------------------------------------------------- */

const BLOCK_KEYS = ['b1', 'b2', 'b3', 'dl'] as const;

function HeroCard({ day, blockIndex }: { day: (typeof DAYS)[number]; blockIndex: number }) {
  const items = day.items ?? [];
  const key = BLOCK_KEYS[blockIndex];
  const sets = items.reduce((total, item) => total + item[key].s, 0);

  return (
    <article className="relative mt-3 overflow-hidden rounded-[20px] shadow-[var(--shadow-float)]">
      <img src={`/img/day-${day.id}.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* Scrim, so white text on a photograph is a measured 4.5:1 and not a hope. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />

      <button
        type="button"
        aria-label="Abrir programa"
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition-transform duration-[160ms] active:scale-[0.94] motion-reduce:active:scale-100"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </button>

      <div className="relative flex min-h-[238px] flex-col justify-end p-5">
        <h3 className="font-ui text-[23px] font-700 leading-[1.12] text-white">{day.name.pt}</h3>
        <p className="mt-1.5 line-clamp-1 font-ui text-[13px] text-white/80">{day.eyebrow.pt}</p>

        <ul className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-[12px] text-white/85">
          <MetaItem icon="M7 3v3M17 3v3M4 9h16M5 6h14v14H5z">{items.length} exercícios</MetaItem>
          <MetaItem icon="M12 3v18M5 8l7-5 7 5">{sets} séries</MetaItem>
          <MetaItem icon="M4 18V9M10 18V5M16 18v-7M22 18h-20">{BLOCKS[blockIndex].s.pt}</MetaItem>
        </ul>

        <span className="mt-4 inline-flex w-fit items-center rounded-full bg-accent px-5 py-3 font-ui text-[13px] font-700 text-accent-ink">
          Começar programa
        </span>
      </div>
    </article>
  );
}

function MetaItem({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-1">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={icon} />
      </svg>
      {children}
    </li>
  );
}

/* ---------- program list ---------------------------------------------------- */

function ProgramList({
  programs,
  blockIndex,
}: {
  programs: (typeof DAYS)[number][];
  blockIndex: number;
}) {
  const key = BLOCK_KEYS[blockIndex];

  return (
    <ul className="flex flex-col gap-2.5">
      {programs.map((day, i) => {
        const items = day.items ?? [];
        const first = items[0];
        const photo = first ? `/img/ex-${first.ex.replace('_', '')}.jpg` : `/img/day-${day.id}.jpg`;
        const sets = items.reduce((total, item) => total + item[key].s, 0);

        return (
          <li key={day.id}>
            <article className="relative flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-[var(--shadow-card)]">
              <div className="min-w-0 flex-1 py-1 pl-1">
                <h3 className="truncate font-ui text-[18px] font-700 text-text">{day.name.pt}</h3>

                <p className="mt-1.5 flex items-center gap-1.5 font-ui text-[12px] text-text-muted">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                    <rect x="4" y="6" width="16" height="14" rx="2" />
                    <path d="M8 3v4M16 3v4M4 11h16" />
                  </svg>
                  {items.length} exercícios
                  <span aria-hidden="true">·</span>
                  {sets} séries
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-accent px-4 py-2.5 font-ui text-[12px] font-700 text-accent-ink">
                    Ver tudo
                  </span>
                  <Ring value={[45, 62, 30, 78, 20, 55][i] ?? 40} />
                </div>
              </div>

              {/*
                Rounded and inset inside the card, matching the reference. It does
                not bleed to the card edge: that was my first reading and it is
                visibly wrong beside the original.
              */}
              <img
                src={photo}
                alt=""
                onError={(e) => {
                  e.currentTarget.src = `/img/day-${day.id}.jpg`;
                }}
                className="h-[112px] w-[112px] shrink-0 rounded-[16px] object-cover"
              />
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The progress ring from the reference. The arc uses the deeper `accent-line`
 * token, not the vivid fill: a 4px stroke of the fill colour measures 2.4:1 on
 * white and would fail the non-text contrast gate, while the fill on pills stays
 * exactly as vivid as the reference.
 */
function Ring({ value }: { value: number }) {
  const size = 38;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso ilustrativo"
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-accent-soft" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="text-accent-line"
        />
      </svg>
      <span className="tabular absolute font-ui text-[10px] font-700 leading-none text-text">
        {value}%
      </span>
    </div>
  );
}

/* ---------- floating action ------------------------------------------------- */

function FloatingAction() {
  return (
    <button
      type="button"
      aria-label="Adicionar treino"
      className={clsx(
        'absolute bottom-7 left-1/2 z-20 grid h-16 w-16 -translate-x-1/2 place-items-center',
        'rounded-full bg-accent text-accent-ink shadow-[var(--shadow-float)]',
        'transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]',
        'active:scale-[0.94] motion-reduce:active:scale-100',
      )}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

/* Referenced so the exercise catalogue stays wired while the list uses day photos. */
void EXERCISES;
