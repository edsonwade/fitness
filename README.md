<div align="center">

# Vanilson Workout

**O teu plano de treino, sessão a sessão.**

A Portuguese-first training app built for the place it is actually used:
a phone, in a gym, with one bar of signal or none at all.

[![CI &amp; Deploy](https://github.com/edsonwade/fitness/actions/workflows/deploy.yml/badge.svg)](https://github.com/edsonwade/fitness/actions/workflows/deploy.yml)
[![React 19](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-offline%20first-5A0FC8?logo=pwa&logoColor=white)](#offline-is-the-baseline-not-a-fallback)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## The one idea

> **The plan is everybody's. The record is yours.**

Two people train the same week. When one of them adds an exercise to Wednesday,
reorders a block, or takes something out, that *is* the week — it lands on the other
account over realtime, not at their next reload. What stays private is what each
person actually did: the loads, the reps, the ticked sets, the goals, the profile.

That sentence is not a slogan bolted on afterwards. It is enforced in three places
that cannot drift apart:

| Layer | Where | What it does |
|---|---|---|
| Database | `supabase/009_shared_plan.sql` | RLS stops scoping the shared tables to `auth.uid()` |
| Client | `SHARED_TABLES` in `src/data/entities.ts` | One list, read by the fetch, the realtime bridge and the write path |
| Keys | `PRIMARY_KEYS` in `src/data/entities.ts` | No shared table has `user_id` in its key, so one fact is stored once |

Before `009`, widening the client list would have changed nothing at all: the rows
simply would not have arrived.

---

## What it does

### Treino — the week
Seven authored training days. Open one and you get the exercises in order, the
prescription for each, technique text, a poster, an embedded demo video, and a rest
timer that starts the moment a set is ticked — counting *down*, because the one
question between sets is how much longer. Ticking a set writes immediately; correcting
the weight afterwards writes again, and the two arrive in that order even if the
phone was offline for both.

### Catálogo — the shared library
Exercises anyone publishes, available to everyone, with a real photograph rather than
an icon. Publishing is a single write (`007_publish_shared_exercise.sql`) rather than
an insert plus an update that can half-fail.

### Days beyond the seven
`day_no` carries the whole design. `1–7` is the bundled programme. `8–100` is left
empty for it to grow. `101` and up is what people add — and since `009`, those numbers
are handed out from a shared table, so "day 101" is *one* day named the same thing in
both accounts, not two days that happen to collide on a number.

### Not built yet
**Objetivos**, **Treinadores** and **Perfil** are routed to an honest
"ainda não construído" screen rather than left out of the table. The shell already
ships their tabs, and a tab that lands on *page not found* tells the user the app is
broken when the truth is that the screen is not written yet.

---

## Offline is the baseline, not a fallback

The scene the whole architecture is built for: a basement gym with no bars, a session
logged anyway, and the app closed before the walk home. Two separate things have to
work for that, and they are built separately.

**Reading.** Successful queries are written to IndexedDB and hydrated at startup, so
opening the app underground shows last week's weights instead of an empty screen.

**Writing.** A mutation started with no signal is neither failed nor lost. React Query
pauses it, the paused mutation is persisted alongside the cache, and on reconnect — or
on the next cold launch — everything replays **in the order it was made**. Order is not
a detail: ticking a set and then correcting the weight are two writes to the same row,
and replaying them backwards would store the correction and then undo it.

Nothing uses `localStorage` for this. The previous implementation kept its state there
and had a documented failure when it filled.

**The programme itself never depended on any of it.** Every exercise, every line of
technique text and all seven posters ship inside the bundle.

---

## Realtime without flicker

Postgres Changes applies RLS per subscriber, so what a subscription is *allowed* to
deliver is decided in the database, not in the client. Three rules make it an
improvement rather than a source of jitter:

1. **A device never receives its own write as news.** Every mutation is stamped with
   `updated_by_client`; an echo carrying this tab's id is dropped.
2. **A change never repaints over an open sheet or a focused input.** It is *held*,
   not discarded, and applied the moment the guard lifts.
3. **A late change never beats a newer one.** `updated_at` is compared before writing.

---

## Content lives in the bundle, on purpose

```
36 exercises · 38 videos · 7 days · 36 day slots · 4 blocks · 17 muscles · 2 cardio
```

These numbers are asserted in `CONTENT_INVARIANTS` and re-checked by a test, so a
broken port fails the build rather than a screen.

Keeping the programme out of the database buys two things:

1. **Preservation is structural.** There is no row for anyone to edit, delete or
   soft-delete, so *"remove a preserved exercise for everyone"* is not a permission to
   get right — it is an operation that does not exist.
2. **A cold start with no network draws a complete screen.**

User-published exercises and day additions live in Supabase and are merged *over* this
baseline at read time in `src/features/train/day-entries.ts`. They never replace it.

---

## Stack

| | |
|---|---|
| **UI** | React 19, React Router 8 (Portuguese paths), Base UI, Motion |
| **Styling** | Tailwind 4 + a token layer in `src/styles/tokens.css` |
| **State** | TanStack Query 5 — cache, offline persistence and outbox in one |
| **Data** | Supabase (Postgres + RLS + Realtime + Storage) |
| **Validation** | Zod 4 on every row that crosses the network |
| **Local** | `idb` — IndexedDB, never `localStorage` |
| **Build** | Vite 8, TypeScript strict, `vite-plugin-pwa` |
| **Tests** | Vitest — 116 tests across 8 files |

**Routes are Portuguese** (`/catalogo`, `/treino/:dia`, `/entrar`) because the product
is Portuguese-first and a URL the user reads in their own language is part of the
product, not an implementation detail.

---

## Getting started

```bash
npm install
npm run dev
```

The Supabase URL and **publishable** key are committed in `src/data/supabase.ts` and
that is deliberate — the publishable key is public by design and RLS is what actually
scopes every read and write. A `service_role` key must never appear in this repository.

### Database

The migrations are numbered, idempotent, and run by hand in the Supabase SQL editor.
Run them in order; each can be re-run safely.

| File | What it establishes |
|---|---|
| `001_shared_catalog.sql` | Shared exercise library and plans |
| `002_community.sql` | Community wall |
| `003_new_app_schema.sql` | The normalized private state — the schema the app reads today |
| `004_day_editing.sql` | `kind` on a user-made exercise |
| `005_custom_days.sql` | Days of your own |
| `006_shared_catalog.sql` | Opens *write* on the shared catalogue |
| `007_publish_shared_exercise.sql` | Publishing as one write, not two |
| `008_scoped_day_additions.sql` | An addition knows whose day it is |
| `009_shared_plan.sql` | **The plan is everybody's; the record is each person's** |

If a migration has not been run, the app fails loudly at the data layer with the table
and column named, rather than three screens later as `undefined`. That is what the Zod
read schemas are for.

---

## Scripts

| Command | |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` then production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest, single run |
| `npm run check:contrast` | Asserts WCAG AA in both themes |
| `npm run verify` | lint → build → test → contrast |

> `scripts/` is gitignored, so `check:contrast` and `verify` are local-only. CI runs
> `lint`, `test` and `build`, which is the part a fresh checkout can run.

---

## Deployment

Pushed to GitHub Pages by `.github/workflows/deploy.yml`.

- Every branch and every PR into `main` runs **lint → test → build**.
- Only `main` uploads the artifact and publishes.
- `base: '/fitness/'` in `vite.config.ts`, read back through `import.meta.env.BASE_URL`
  so the router's `basename` cannot drift from it.
- `dist/index.html` is copied to `dist/404.html`, because Pages has no rewrite rules
  and a reload on `/fitness/treino/3` would otherwise be a miss.

**Pages source must be set to "GitHub Actions"** in repository settings. With it still
on "deploy from a branch", every check passes and the final publish step fails.

---

## Details worth knowing

**Three themes, not two.** `system` writes no attribute and lets `prefers-color-scheme`
decide; an explicit choice stamps `data-theme` and wins in both directions. Contrast is
asserted at AA in both.

**Photos are resized on the device.** A 6 MB camera capture is redrawn to 1080px on its
long edge and re-encoded as JPEG before it leaves the phone. There is no upload queue:
offline, the exercise saves with all its text and the screen says plainly that the photo
has not gone up.

**Weights and reps are text, everywhere.** `60`, `12,5` and `10/hand` are all real
values real people typed. A number type would be a validation gate this product never
agreed to.

**The catalogue is updated, never upserted.** PostgREST sends an upsert as
`insert … on conflict do update`, and Postgres evaluates the *insert* policy on the
offered row before it ever chooses the update branch — so editing a row published by
another account was refused with `42501` no matter what the update policy said.
`src/data/db.test.ts` pins the verb so nobody quietly reverts it.

---

## License

MIT © vanilson muhongo — see [LICENSE](LICENSE).
