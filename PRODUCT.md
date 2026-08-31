# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: any committed lifter**, training hypertrophy in a commercial gym, phone in hand.
This is a real multi-user product, not a personal tool with signup left switched on. Signup is
open, strangers are expected, and people who never met the author publish their own exercises
and post to a shared wall.

The author's own 7-day split ships as the built-in baseline programme every account starts from.
It is the product's opinionated default, not a private document.

Secondary audiences present in the data model and confirmed in use:

- **Publishers** who add exercises and day items to the shared catalog for everyone.
- **Community posters** who write to the wall, comment, react, and mention other users.
- **Coached lifters** who track named trainers, their specialities, availability and sessions.

## Product Purpose

A phone-first hypertrophy training app in Portuguese and English that a lifter uses **during the
session, on the gym floor**, not at a desk afterwards.

It carries three things at once:

1. **The programme.** A 7-day split with 4 periodization blocks (Volume, Intensity, Heavy,
   Deload), full per-exercise prescription (sets, reps, load, RPE, rest), and complete bilingual
   technique instruction: step-by-step execution, target muscles, breathing, and paired
   error/correction notes.
2. **The record.** Weight, reps performed, per-set completion, and free-text notes, saved
   continuously and synced across devices, with editable history, goals, and progress charts.
3. **The people.** A shared exercise catalog, a community wall, and trainer records.

Success is a lifter finishing a working set, glancing at the phone for two seconds, logging what
they did without breaking rhythm, and never once leaving the app to look something up.

## Positioning

**The demonstration plays inside the card.** Every one of the 36 exercises has a checked video,
and the app never opens another tab, never links out to YouTube, and never hands the user to a
feed that will keep them. A poster image is local; the iframe is created only on tap. A rest
timer that a video ad interrupts is a rest timer that failed.

Two further commitments a neighbouring product could not truthfully copy:

- **The technique text is authored, not scraped.** Every exercise carries bilingual execution
  steps, breathing, and specific error/correction pairs written for this programme.
- **It works with no network.** The entire baseline programme, every technique text and every
  poster image ship in the bundle, so a gym basement with no signal is a working session.

## Operating Context

The usage scene is confirmed and binding. All four conditions are real, not hypothetical:

- **One-handed, mid-set.** The phone is held in one hand, often with the other hand still on a
  bar or dumbbell. Thumb reach zones and one-handed paths are a functional requirement, not a
  refinement.
- **Degraded touch accuracy.** Sweat, chalk, gloves, and hands still shaking after a heavy set.
  Small targets and precise gestures fail in practice, not just in theory.
- **Harsh gym light.** Bright overhead lighting and screen glare, plus dim free-weight corners.
  Both themes must survive real light, not a desk.
- **Interrupted attention.** Two or three second glances between sets, never sustained reading.
  A screen must be re-readable after looking away, with no lost place and no re-orientation cost.

Rituals the product sits inside: the rest interval between sets, the walk between machines, the
weekly block change, and the post-session review at home on a larger screen.

## Capabilities and Constraints

**Confirmed capabilities.** Day and week training views; per-exercise prescription and technique;
inline video; set logging with free-text weight and reps; editable history; goals with cover
images and a reached state; trainer records with sessions; a 5-step skippable first-run setup;
JSON export and import; a shared exercise catalog; a community wall with comments, likes and
reactions; full PT/EN bilingual UI; dark and light themes; cross-device cloud sync.

**Technical constraints, binding.**

- **Static hosting only.** GitHub Pages. No server, no SSR. The database is reached from the
  browser.
- **Offline is required.** The app must open and run a full session with no network.
- **`file://` is not supported.** Dropped deliberately.
- **PWA**, installable, service-worker cached.
- **Supabase** for auth and Postgres with Row Level Security. Two migrations are already run in
  production and the app is live with real user data.
- **Target stack, user-specified and not substitutable without asking:** React, TypeScript, Vite,
  React Router, Tailwind CSS, a controlled component system, TanStack Query, Zod, Motion,
  Supabase. Static hosting with no SSR settles React Router into library mode.

**Free-text weight and reps is deliberate.** The inputs accept `60`, `12,5` and `10/hand`. This
is a product decision, not a validation gap, and must not be coerced to numeric.

**Terminology.** Portuguese is the source language and the default locale. Block names, day
names, muscle names and equipment names are authored in both PT and EN; 17 muscle keys carry a
name in each.

**Undecided, recorded rather than invented.** How long the post-cutover verification period runs
before legacy tables are retired. Whether the provisional decorative photograph set gets a
curated re-pick.

## Brand Commitments

- **Name: Vanilson Workout.** Present in the repo, the README and the export filename
  `vanilson-workout-data.json`.
- **Voice: Portuguese-first, direct, second person, coach-like.** The authored technique copy
  instructs without hedging and without motivational filler. English is a faithful translation of
  that voice, not a re-write.
- **Photography is the imagery.** 76 real photographs, pinned by the user as preserved content.
  No illustration set, no icon-as-hero, no generated imagery replaces them.
- **The app never sends the user somewhere else.** No outbound links from a training surface.

## Evidence on Hand

Real, verified by reading the source. Counts below were confirmed by evaluating `old/js/data.js`,
not estimated:

| Asset | Count | Location |
|---|---|---|
| Exercises, fully bilingual with technique text | 36 | `old/js/data.js` `EX` |
| Video ids, one per exercise plus treadmill and bike | 38 | `old/js/data.js` `VIDEOS` |
| Exercises with no video | 0 | verified |
| Cardio entries with their own shape | 2 | `old/js/data.js` `CARDIO` |
| Days, holding 36 item slots over 34 distinct exercises | 7 | `old/js/data.js` `DAYS` |
| Periodization blocks generated by `prog()` | 4 | `old/js/data.js` `BLOCKS` |
| Muscle names, PT and EN | 17 each | `MUSNAME` / `MUSNAME_EN` |
| Photographs | 76 | `img/` |
| Bilingual UI copy | 650 lines | `old/js/i18n.js` |
| Live SQL migrations, both run in production | 2 | `supabase/` |

Per-day slot counts are 6, 6, 6, 8, 6, 4, 0. Two exercises, `legcurl_l` and `birddog`, have
videos and technique text but are prescribed on no day; they are referenced as documented swap
alternatives inside other exercises' safety notes and are preserved.

**Photography provenance is documented and honest.** `img/attribution.md` records Pexels ids and
sources for every file, and carries the author's own warning that the `coach-*`, `goal-*` and
`onboard-*` presets are a provisional set where several files are the same photograph under two
names. They ship as-is. The per-exercise `ex-*` set was individually inspected before install.
One file, `ex-pallof.jpg`, is a frame from the same demonstration video the card plays, credited
in that file.

**Fonts on hand:** Anton and Archivo, self-hosted woff2, latin subset, SIL OFL 1.1, no CDN.

**Absences that must not be fabricated.** There are no testimonials, no user counts, no
benchmarks, no press, no pricing, and no case studies. Nothing may claim them.

## Product Principles

1. **The set is the clock.** Every interaction is measured against a lifter mid-rest with
   seconds of attention. If a screen cannot be re-read after looking away, it has failed,
   whatever it looks like.
2. **Never hand the user to another app.** The video plays in the card. The technique is in the
   card. Leaving is the failure state.
3. **The authored programme is the product's spine.** The 36 exercises, their technique text and
   their videos are the reason to open it. They are preserved verbatim and are never
   "improved" in passing.
4. **Degraded input is the normal case.** Sweaty, one-handed, shaking, glancing. Design for that
   as the default, not as an accessibility afterthought.
5. **Two languages, one voice.** Portuguese is the source. English is a faithful carry of the
   same directness, never a softer re-write.

## Accessibility & Inclusion

**WCAG 2.2 AA is committed as a hard requirement.** Failures are blocking, not advisory, and are
treated as such in the Pre-Flight and the finish review.

Concretely binding:

- Text contrast at least 4.5:1, and 3:1 for large text and meaningful non-text, **in both themes**
- Minimum 24x24 CSS px target size, with the gym-floor scene pushing the practical floor well
  above the standard's minimum for anything tapped mid-set
- Complete keyboard paths, visible focus, and no keyboard trap in sheets or overlays
- `prefers-reduced-motion` honoured as gentler and fewer, keeping opacity and colour transitions
  that aid comprehension while dropping transform-based movement
- Bilingual copy with correct `lang` attributes so screen readers pronounce both languages

The four operating conditions above are inclusion requirements in their own right: they describe
temporary and situational impairment (occupied hands, reduced dexterity, glare, divided
attention) that affects every user of this product, every session.
