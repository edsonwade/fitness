/**
 * English copy.
 *
 * Portuguese is the source language (`pt.ts` is where the wording is decided); this
 * is a translation of it. `satisfies Copy` is what keeps the two in step: a key that
 * exists in `pt.ts` and not here fails the build, and so does a key invented here.
 *
 * Translated, not transliterated. The voice is the same one the product has in
 * Portuguese: second person, coach in the room, no hedging, and no em-dashes in
 * authored copy. Where English has no equivalent of a Portuguese construction the
 * English sentence is written from scratch to do the same job.
 *
 * Two things stay Portuguese on purpose:
 *   - the KEYS of `train.readiness.recovery`, which are slugs the code computes;
 *   - `kg`, which is a unit and not a word.
 */
import type { Copy } from './pt';

export const en = {
  gate: {
    tabSignIn: 'Sign in',
    tabSignUp: 'Create account',
    tablist: 'Sign in or create an account',

    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    subtitleSignIn: 'Pick up where you left off.',
    subtitleSignUp: 'Take your plan with you to the gym.',

    name: 'Name',
    namePlaceholder: 'What should we call you',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',

    show: 'Show password',
    hide: 'Hide password',

    signIn: 'Sign in',
    signUp: 'Create account',
    signingIn: 'Signing in',
    creating: 'Creating account',
    forgot: 'I forgot my password',
    sendingReset: 'Sending',

    pwRuleShort: 'At least 8 characters',
    pwRuleLetter: 'One letter',
    pwRuleDigit: 'One number',
    pwRuleSymbol: 'One symbol',

    errNameRequired: 'Write your name.',
    errEmailRequired: 'Write your email.',
    errEmailFormat: 'That email does not look valid.',
    errEmailDomain: 'Use an email from a known provider, for example gmail.com.',
    errPasswordRequired: 'Write your password.',
    errPasswordShort: 'Your password needs at least 8 characters.',
    errPasswordLetter: 'A letter is missing.',
    errPasswordDigit: 'A number is missing.',
    errPasswordSymbol: 'A symbol is missing.',
    errConfirmMismatch: 'The passwords do not match.',

    errNoAccount: 'Wrong email or password.',
    errExists: 'An account with this email already exists. Sign in instead of creating one.',
    errUnconfirmed: 'Confirm your email before signing in. Check your inbox.',
    errRateLimit: 'Too many attempts. Wait a moment and try again.',
    errOffline: 'No connection. Check the internet and try again.',
    errUnknown: 'Something went wrong. Try again.',

    createdTitle: 'Account created',
    createdBody: 'Confirm your email and then sign in here.',
    resetSent: 'We sent a recovery link to your email.',
    resetNeedEmail: 'Write your email first.',
  },

  nav: {
    today: 'Today',
    train: 'Train',
    nutrition: 'Nutrition',
    team: 'Team',
    profile: 'Profile',
    catalog: 'Catalogue',
    landmark: 'Main',
  },

  theme: {
    label: 'Theme',
    hint: 'Tap to change.',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    languageHint: 'Changes the whole app, and is remembered on this device.',
  },

  today: {
    greeting: 'Hello',
  },

  pending: {
    title: 'Not built yet',
    body: 'This screen arrives in a later phase. The week of training already works.',
    action: 'Back to training',
  },

  errors: {
    notFoundTitle: 'Page not found',
    notFoundBody: 'That address does not match any screen in the app.',
    notFoundAction: 'Go to training',
    crashTitle: 'Something went wrong',
    crashBody: 'The screen could not open. Going back to training usually fixes it.',
    crashAction: 'Back to training',
  },

  common: {
    back: 'Back',
    save: 'Save',
    saving: 'Saving',
    saved: 'Saved',
    cancel: 'Cancel',
    add: 'Add',
    create: 'Create',
    edit: 'Edit',
    remove: 'Remove',
    close: 'Close',
    retry: 'Try again',
    loading: 'Loading',
    loadError: 'Could not load. Try again.',
    offlineNote: 'No connection. Your changes are saved and go up when the internet is back.',
    required: 'This field is required.',
    optional: 'optional',

    opening: 'Opening the app',
    effort: 'Effort',

    writeBody: 'Everything else you did was saved. This one can be tried again.',
    writeRetry: 'Try again',
    writeDismiss: 'Dismiss',
    writeDetails: 'See what the server answered',
    writeDetailsHide: 'Hide the server answer',
  },

  train: {
    title: 'Train',
    subtitle: 'Your week of training.',
    blocksLabel: 'Programme phase',
    exercises: 'exercises',
    exercise: 'exercise',
    series: 'sets',
    serie: 'set',
    open: 'Open day',
    restDay: 'Rest day',
    restDayBody: 'No exercises today. Recover, sleep and eat well for the next phase.',

    phase: {
      b1: 'Beginner',
      b2: 'Intermediate',
      b3: 'Advanced',
      dl: 'Recover',
    },

    phaseInfo: {
      b1: {
        title: 'Fundamentals',
        body: 'Fundamental movements and simpler exercises.',
      },
      b2: {
        title: 'More variety',
        body: 'More experience, wider variety and slightly more complex exercises.',
      },
      b3: {
        title: 'Advanced movements',
        body: 'For experienced lifters, with advanced movements.',
      },
      dl: {
        /*
         * "Lighter week", not "Deload week". §8.1 retires the technical term because
         * it does not say what the phase is for, and that complaint survives
         * translation: a beginner reading English does not know "deload" either.
         * `phase-journey.test.ts` holds all four dictionaries to it.
         */
        title: 'Lighter week',
        body: 'A planned drop in load. This week the programme asks less of you, on purpose, so the body recovers before the next cycle.',
      },
    },

    about: 'about',
    minutes: 'min',
    minutesLong: 'minutes',
    logsError: 'Could not load your load history. The plan is still visible.',

    dayOf: 'Day',
    dayNotFoundTitle: 'Day not found',
    dayNotFoundBody: 'This training day does not exist.',
    sets: 'Sets',
    setLabel: 'Set',
    weight: 'Load',
    weightPlaceholder: 'e.g. 60',
    reps: 'Reps',
    repsPlaceholder: 'e.g. 10',
    note: 'Note',
    notePlaceholder: 'How it went',
    target: 'Target',
    rpe: 'RPE',
    rest: 'Rest',
    goal: 'Goal for the day',
    warmup: 'Warm-up',
    muscles: 'Muscles',

    failRecordSession: 'The set was marked, but today’s workout did not reach your history.',

    technique: 'Execution',
    commonErrors: 'Common mistakes',
    fix: 'Fix it',
    safety: 'Safety',
    breathing: 'Breathing',
    details: 'See technique',
    hideDetails: 'Hide technique',

    watchVideo: 'Watch demonstration',
    videoOf: 'Demonstration of',
    closeVideo: 'Close video',

    startRest: 'Start rest',
    restRunning: 'Rest counting',
    skipRest: 'Skip',
    addSeconds: '15s more',
    restDone: 'Rest finished',

    exIdle: 'Not started',
    exDoing: 'In progress',
    exDone: 'Complete',

    exerciseOne: 'exercise',
    exerciseMany: 'exercises',
    completeOne: 'complete',
    completeMany: 'complete',

    workoutOpen: 'Workout in progress',
    workoutDone: 'Workout finished',
    setsPendingOne: 'set not completed',
    setsPendingMany: 'sets not completed',
    allSetsDone: 'No sets left',
    finish: 'Finish workout',
    finishing: 'Finishing…',
    finishHint: 'Mark at least one set before you can finish the workout.',
    reopen: 'Reopen workout',
    reopening: 'Reopening…',
    failReopenSession: 'Could not reopen the workout.',

    progressLabel: 'Progress today',

    readiness: {
      title: 'Readiness today',
      label: 'Readiness',
      outOf: '/ 100',
      recoveryLabel: 'Recovery',
      loadLabel: 'Load',
      lastSession: 'last session',
      recovery: {
        'treino-hoje': 'Trained today',
        recente: 'Recent',
        boa: 'Good',
        completa: 'Complete',
        'pausa-longa': 'Long break',
      },
      whyLabel: 'Why?',
      trainedToday: 'You trained today.',
      trainedYesterday: 'You trained yesterday.',
      trainedAgoPre: 'You trained',
      trainedAgoPost: 'days ago.',
      window: 'Two to three days is the gap that recovers best.',
      dense: 'Many sessions back to back — readiness drops to leave room to recover.',
      sessionsWeekOne: 'session in the last 7 days.',
      sessionsWeekMany: 'sessions in the last 7 days.',
      lastLoadPre: 'Last session:',
      kg: 'kg',
      noLoad: 'no load recorded',
      disclaimer: 'A reading of your log, not a medical measurement.',
      emptyTitle: 'No readiness yet',
      emptyBody:
        'Record a workout and the app starts reading your readiness from it. With no dated workouts there is nothing to read, and we do not invent a number.',
    },

    recommend: {
      title: 'Goal for today',
      stanceTrain: 'Good day to train',
      stanceModerate: 'Train with room to recover',
      stanceRest: 'Rest day',
      restWhy: 'Your plan marks today as rest.',
      restBody: 'Resting is part of the plan: recover, sleep and eat well for the next session.',
      whyLabel: 'Why?',
      minutes: 'min',
      scorePre: 'Readiness is at',
      noReason: 'With no dated workouts there is no reason to show yet, and we do not invent one.',
    },
  },

  catalog: {
    title: 'Catalogue',
    subtitle: 'What the accounts have published, visible to everyone.',

    emptyTitle: 'Nothing in the catalogue yet',
    emptyBody: 'Inside a day, create an exercise and choose "Also in the catalogue". It shows up here, ready to drop into another day.',

    loadError: 'Could not load the catalogue. Try again.',

    failSave: 'The changes to this exercise were not saved.',
    failRemove: 'The exercise was not deleted from the catalogue.',
    failAddition: 'The exercise was deleted, but it is still added to a day.',
    failPlace: 'The exercise was not put into the day.',
    failUnplace: 'The exercise did not leave the day.',

    onDay: 'In day',
    onDays: 'In days',
    onNoDay: 'Not in any day yet',
    dayGone: 'a deleted day',
    countOne: 'exercise published',
    countMany: 'exercises published',

    addToDay: 'Put into a day',
    addToDayTitle: 'Which day?',
    addToDayHint: 'The exercise already belongs to everyone. What you choose here is which day it goes into.',
    addToDayEvery: 'Goes into that day for every account',
    addToDayConfirm:
      'Put this exercise into this day? The week is the same for every account, so the card shows up for everyone. You can take it out later.',
    addToDayAlready: 'Already in this day',
    addToDayNone: 'No days to put it into yet.',
  },

  days: {
    create: 'Create day',
    newTitle: 'New day',
    newHint: 'Joins the week after the seven from the plan, in every account.',
    editTitle: 'Edit day',
    edit: 'Edit this day',

    name: 'Day name',
    namePlaceholder: 'e.g. Arms and shoulders',
    type: 'Kind of day',
    typeStrength: 'Training',
    typeRest: 'Rest',
    typeHint: 'A rest day still opens and still takes exercises, if you change your mind.',
    goal: 'Goal for the day',
    goalPlaceholder: 'What this day works',
    warm: 'Warm-up',
    warmPlaceholder: 'How you start',

    errName: 'Write the name of the day.',

    own: 'Added',
    untitled: 'Day with no name',

    remove: 'Delete day',
    removeConfirm:
      'Delete this day and the exercises added to it? It leaves the week for every account. Exercises that are also in the catalogue stay there, and loads already recorded stay saved.',

    failCreate: 'The new day was not saved.',
    failSave: 'The changes to this day were not saved.',
    failDelete: 'The day was not deleted and is still in the week.',
    failExercises: 'The day was deleted, but an exercise of its own is still attached to it.',
    failHidden: 'The day was deleted, but a hidden-exercise mark is still on it.',
    failOrder: 'The day was deleted, but the order you gave it is still saved.',
    failAddition:
      'The day left the week, but an exercise from the catalogue is still added to it.',

    reorder: 'Reorder day',
    reorderHint:
      'Press and hold a day and drag to change the week. With a keyboard, focus the handle and use the up and down arrows.',
    position: 'position',
    positionOf: 'of',

    orderLabel: 'Week order',
    orderShared: 'Shared',
    orderOwn: 'Mine',
    orderReset: 'Restore the shared one',
    orderResetDefault: 'Reset to default',
    orderResetDefaultConfirm: 'Restore the original order of the week, for every account?',
    orderOwnActive: 'You are looking at your own order. The week of the other accounts does not change.',
    orderSharedActive: 'This is everyone’s order. Dragging changes it in every account.',
    failWeekOrder: 'The new week order was not saved.',
  },

  editor: {
    add: 'Add exercise',
    newTitle: 'New exercise',
    newHint: 'Stays in this day, for every account. You can change everything later.',
    editOwnTitle: 'Edit exercise',
    editBuiltTitle: 'Edit prescription',
    editBuiltHint:
      'Change what this exercise asks for, in every account. The original plan stays intact and you restore it whenever you want.',

    name: 'Name',
    namePlaceholder: 'e.g. Seated cable row',
    equipment: 'Equipment',
    equipmentPlaceholder: 'e.g. Row machine',

    kind: 'Kind of movement',
    kindComp: 'Compound',
    kindAcc: 'Accessory',
    kindIso: 'Isolation',
    kindCore: 'Core',
    kindHint: 'Decides how sets and reps change from Beginner to Recover.',

    sets: 'Sets',
    setsPlaceholder: 'e.g. 3',
    reps: 'Reps',
    repsPlaceholder: 'e.g. 10-12',
    load: 'Load',
    loadPlaceholder: 'e.g. 20 kg/hand',
    rest: 'Rest',
    restPlaceholder: 'e.g. 90 s',

    video: 'Demonstration video',
    videoPlaceholder: 'Paste the YouTube link',
    videoHint: 'Optional. The video plays inside the card, without sending you somewhere else.',
    videoNone: 'No demonstration yet.',

    photo: 'Photo',
    photoAdd: 'Choose photo',
    photoChange: 'Change photo',
    photoRemove: 'Remove photo',
    photoHint: 'Optional. With no photo the card stays neutral, and it never borrows another exercise’s photo.',
    photoSending: 'Sending the photo',
    photoOffline: 'No connection. Save now and add the photo when the internet is back.',
    photoFailed: 'The photo did not upload. Try again, or save without it.',
    photoBadFile: 'I could not read that file as an image.',

    failSave: 'This exercise was not saved.',
    failDelete: 'The exercise was not deleted and is still in the day.',
    failOverride: 'The change to the prescription was not saved.',
    failRestore: 'The original prescription was not restored.',
    failHide: 'The exercise did not leave the day.',
    failUnhide: 'The hidden exercises did not come back to the day.',
    failOrder: 'The new order was not saved.',
    failPublish: 'Publishing to the catalogue did not go through, and nothing was published.',

    errName: 'Write the name of the exercise.',
    errVideo: 'That link is not a YouTube video.',

    preview: 'How it looks across the four phases',

    create: 'Create exercise',
    remove: 'Delete exercise',
    removeConfirm:
      'Delete this exercise? It leaves the day in every account. The load records stay saved.',
    restoreOriginal: 'Restore the original',
    restoreOriginalConfirm: 'Restore the original prescription of this exercise, for every account?',

    hide: 'Take out of the day',
    hiddenOne: 'exercise out of the day',
    hiddenMany: 'exercises out of the day',
    restore: 'Restore',

    reorder: 'Reorder',
    reorderHint:
      'Press and hold and drag to change the order. With a keyboard, focus here and use the up and down arrows.',
    position: 'position',
    positionOf: 'of',
    resetOrderDefault: 'Reset to default',
    resetOrderDefaultConfirm: 'Restore the original order of this day’s exercises, for every account?',

    visibility: 'Where this exercise lives',
    visPrivate: 'Only in this day',
    visShared: 'Also in the catalogue',
    visHintPrivate: 'Stays in this day, and everyone sees it here.',
    visHintShared:
      'Stays in this day and joins the Catalogue, for anyone to put into another day. Anyone can change or delete it.',
    publishConfirm:
      'Put this exercise in the Catalogue? It becomes usable in other days, and anyone can change or delete it. The load records stay.',

    sharedTitle: 'Edit for everyone',
    sharedHint: 'This exercise is in the Catalogue. What you change here changes in every day it is in.',
    removeShared: 'Delete for everyone',
    removeSharedConfirm:
      'Delete this exercise from the Catalogue? It leaves every day it is in, in every account. The load records each person made stay saved.',
    hideShared: 'Take out of this day',
    hideSharedHint: 'Leaves this day for every account. It stays in the Catalogue, ready to put back.',

    badgeChanged: 'Changed',
    badgeOwn: 'This day’s',
    badgeShared: 'From the catalogue',

    emptyTitle: 'This day has no exercises yet',
    emptyBody: 'Add the first one and it stays here, with the sets, the video and the load record.',
  },
} satisfies Copy;
