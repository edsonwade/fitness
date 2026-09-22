/**
 * French copy.
 *
 * Portuguese is the source language (`pt.ts` is where the wording is decided); this
 * is a translation of it. `satisfies Copy` keeps the two in step: a key that exists
 * in `pt.ts` and not here fails the build, and so does a key invented here.
 *
 * Voice: tutoiement, coach in the room, no hedging. French says things at a
 * different length from Portuguese, and the buttons are the place it shows: the
 * labels here are kept short on purpose so they do not wrap under the thumb.
 *
 * Two things stay Portuguese on purpose:
 *   - the KEYS of `train.readiness.recovery`, which are slugs the code computes;
 *   - `kg`, which is a unit and not a word.
 */
import type { Copy } from './pt';

export const fr = {
  gate: {
    tabSignIn: 'Se connecter',
    tabSignUp: 'Créer un compte',
    tablist: 'Se connecter ou créer un compte',

    welcomeBack: 'Content de te revoir',
    createAccount: 'Crée ton compte',
    subtitleSignIn: 'Reprends où tu en étais.',
    subtitleSignUp: 'Emporte ton plan à la salle.',

    name: 'Prénom',
    namePlaceholder: 'Comment on t’appelle',
    email: 'Email',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',

    show: 'Afficher le mot de passe',
    hide: 'Masquer le mot de passe',

    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    signingIn: 'Connexion',
    creating: 'Création du compte',
    forgot: 'J’ai oublié mon mot de passe',
    sendingReset: 'Envoi',

    pwRuleShort: 'Au moins 8 caractères',
    pwRuleLetter: 'Une lettre',
    pwRuleDigit: 'Un chiffre',
    pwRuleSymbol: 'Un symbole',

    errNameRequired: 'Écris ton prénom.',
    errEmailRequired: 'Écris ton email.',
    errEmailFormat: 'Cet email ne semble pas valide.',
    errEmailDomain: 'Utilise un email d’un fournisseur connu, par exemple gmail.com.',
    errPasswordRequired: 'Écris ton mot de passe.',
    errPasswordShort: 'Le mot de passe demande au moins 8 caractères.',
    errPasswordLetter: 'Il manque une lettre.',
    errPasswordDigit: 'Il manque un chiffre.',
    errPasswordSymbol: 'Il manque un symbole.',
    errConfirmMismatch: 'Les mots de passe ne correspondent pas.',

    errNoAccount: 'Email ou mot de passe incorrect.',
    errExists: 'Un compte existe déjà avec cet email. Connecte-toi au lieu d’en créer un.',
    errUnconfirmed: 'Confirme ton email avant de te connecter. Regarde ta boîte de réception.',
    errRateLimit: 'Trop de tentatives. Attends un peu et réessaie.',
    errOffline: 'Pas de connexion. Vérifie internet et réessaie.',
    errUnknown: 'Quelque chose a mal tourné. Réessaie.',

    createdTitle: 'Compte créé',
    createdBody: 'Confirme ton email, puis connecte-toi ici.',
    resetSent: 'Nous avons envoyé un lien de récupération à ton email.',
    resetNeedEmail: 'Écris d’abord ton email.',
  },

  nav: {
    today: 'Aujourd’hui',
    train: 'Séance',
    nutrition: 'Nutrition',
    team: 'Équipe',
    profile: 'Profil',
    catalog: 'Catalogue',
    landmark: 'Principal',
  },

  theme: {
    label: 'Thème',
    hint: 'Touche pour changer.',
    system: 'Système',
    light: 'Clair',
    dark: 'Sombre',
  },

  settings: {
    title: 'Réglages',
    language: 'Langue',
    languageHint: 'Change toute l\u2019app, et reste gardé sur cet appareil.',
  },

  today: {
    greeting: 'Salut',
  },

  pending: {
    title: 'Pas encore construit',
    body: 'Cet écran arrive dans une phase suivante. La semaine d’entraînement fonctionne déjà.',
    action: 'Retour à la séance',
  },

  errors: {
    notFoundTitle: 'Page introuvable',
    notFoundBody: 'Cette adresse ne correspond à aucun écran de l\u2019application.',
    notFoundAction: 'Aller à la séance',
    crashTitle: 'Quelque chose a mal tourné',
    crashBody: 'L\u2019écran n\u2019a pas pu s\u2019ouvrir. Revenir à la séance règle souvent le problème.',
    crashAction: 'Revenir à la séance',
  },

  common: {
    back: 'Retour',
    save: 'Enregistrer',
    saving: 'Enregistrement',
    saved: 'Enregistré',
    cancel: 'Annuler',
    add: 'Ajouter',
    create: 'Créer',
    edit: 'Modifier',
    remove: 'Retirer',
    close: 'Fermer',
    retry: 'Réessayer',
    loading: 'Chargement',
    loadError: 'Impossible de charger. Réessaie.',
    offlineNote: 'Pas de connexion. Tes changements sont gardés et partent dès que internet revient.',
    required: 'Ce champ est obligatoire.',
    optional: 'facultatif',

    opening: 'Ouverture de l\u2019application',
    effort: 'Effort',

    writeBody: 'Tout le reste de ce que tu as fait est enregistré. Ceci peut être retenté.',
    writeRetry: 'Réessayer',
    writeDismiss: 'Ignorer',
    writeDetails: 'Voir la réponse du serveur',
    writeDetailsHide: 'Masquer la réponse du serveur',
  },

  train: {
    title: 'Séance',
    subtitle: 'Ton plan de la semaine.',
    blocksLabel: 'Phase du programme',
    exercises: 'exercices',
    exercise: 'exercice',
    series: 'séries',
    serie: 'série',
    open: 'Ouvrir le jour',
    restDay: 'Jour de repos',
    restDayBody: 'Pas d’exercices aujourd’hui. Récupère, dors et mange bien pour la phase suivante.',

    phase: {
      b1: 'Débutant',
      b2: 'Intermédiaire',
      b3: 'Avancé',
      dl: 'Récupérer',
    },

    phaseInfo: {
      b1: {
        title: 'Fondamentaux',
        body: 'Mouvements fondamentaux et exercices plus simples.',
      },
      b2: {
        title: 'Plus de variété',
        body: 'Plus d’expérience, plus de variété et des exercices un peu plus complexes.',
      },
      b3: {
        title: 'Mouvements avancés',
        body: 'Pour les pratiquants expérimentés, avec des mouvements avancés.',
      },
      dl: {
        title: 'Semaine de décharge',
        body: 'Baisse planifiée de la charge. Cette semaine le programme te demande moins, exprès, pour que le corps récupère avant le cycle suivant.',
      },
    },

    about: 'environ',
    minutes: 'min',
    minutesLong: 'minutes',
    logsError: 'Impossible de charger ton historique de charges. Le plan reste visible.',

    dayOf: 'Jour',
    dayNotFoundTitle: 'Jour introuvable',
    dayNotFoundBody: 'Ce jour d\u2019entraînement n\u2019existe pas.',
    sets: 'Séries',
    setLabel: 'Série',
    weight: 'Charge',
    weightPlaceholder: 'ex : 60',
    reps: 'Reps',
    repsPlaceholder: 'ex : 10',
    note: 'Note',
    notePlaceholder: 'Comment ça s’est passé',
    target: 'Cible',
    rpe: 'RPE',
    rest: 'Repos',
    goal: 'Objectif du jour',
    warmup: 'Échauffement',
    muscles: 'Muscles',

    failRecordSession: 'La série est marquée, mais la séance du jour n’est pas entrée dans ton historique.',

    technique: 'Exécution',
    commonErrors: 'Erreurs fréquentes',
    fix: 'Corrige',
    safety: 'Sécurité',
    breathing: 'Respiration',
    details: 'Voir la technique',
    hideDetails: 'Masquer la technique',

    watchVideo: 'Voir la démonstration',
    videoOf: 'Démonstration de',
    closeVideo: 'Fermer la vidéo',

    startRest: 'Lancer le repos',
    restRunning: 'Repos en cours',
    skipRest: 'Passer',
    addSeconds: '15s de plus',
    restDone: 'Repos terminé',

    exIdle: 'Pas commencé',
    exDoing: 'En cours',
    exDone: 'Terminé',

    exerciseOne: 'exercice',
    exerciseMany: 'exercices',
    completeOne: 'terminé',
    completeMany: 'terminés',

    workoutOpen: 'Séance en cours',
    workoutDone: 'Séance terminée',
    setsPendingOne: 'série non terminée',
    setsPendingMany: 'séries non terminées',
    allSetsDone: 'Aucune série en attente',
    finish: 'Terminer la séance',
    finishing: 'Fin de séance…',
    finishHint: 'Marque au moins une série pour pouvoir terminer la séance.',
    reopen: 'Rouvrir la séance',
    reopening: 'Réouverture…',
    failReopenSession: 'Impossible de rouvrir la séance.',

    progressLabel: 'Progression du jour',

    readiness: {
      title: 'Forme du jour',
      label: 'Forme',
      outOf: '/ 100',
      recoveryLabel: 'Récupération',
      loadLabel: 'Charge',
      lastSession: 'dernière séance',
      recovery: {
        'treino-hoje': 'Séance aujourd’hui',
        recente: 'Récente',
        boa: 'Bonne',
        completa: 'Complète',
        'pausa-longa': 'Longue pause',
      },
      whyLabel: 'Pourquoi ?',
      trainedToday: 'Tu as fait une séance aujourd’hui.',
      trainedYesterday: 'Tu as fait une séance hier.',
      trainedAgoPre: 'Dernière séance il y a',
      trainedAgoPost: 'jours.',
      window: 'L’intervalle de 2 à 3 jours est celui qui récupère le mieux.',
      dense: 'Beaucoup de séances à la suite — la forme baisse pour laisser de la marge à la récupération.',
      sessionsWeekOne: 'séance sur les 7 derniers jours.',
      sessionsWeekMany: 'séances sur les 7 derniers jours.',
      lastLoadPre: 'Dernière séance :',
      kg: 'kg',
      noLoad: 'aucune charge enregistrée',
      disclaimer: 'Une lecture de ton historique, pas une mesure médicale.',
      emptyTitle: 'Pas encore de forme',
      emptyBody:
        'Enregistre une séance et l’app se met à lire ta forme à partir de là. Sans séances datées il n’y a rien à lire, et on n’invente pas un chiffre.',
    },

    recommend: {
      title: 'Objectif du jour',
      stanceTrain: 'Bon jour pour une séance',
      stanceModerate: 'Entraîne-toi en gardant de la marge',
      stanceRest: 'Jour de repos',
      restWhy: 'Ton plan marque aujourd’hui comme repos.',
      restBody: 'Le repos fait partie du plan : récupère, dors et mange bien pour la prochaine séance.',
      whyLabel: 'Pourquoi ?',
      minutes: 'min',
      scorePre: 'La forme est à',
      noReason: 'Sans séances datées il n’y a pas encore de raison à montrer, et on n’en invente pas.',
    },
  },

  catalog: {
    title: 'Catalogue',
    subtitle: 'Ce que les comptes ont publié, visible par tout le monde.',

    emptyTitle: 'Rien dans le catalogue pour l’instant',
    emptyBody: 'Dans un jour, crée un exercice et choisis « Aussi dans le catalogue ». Il apparaît ici, prêt à être mis dans un autre jour.',

    loadError: 'Impossible de charger le catalogue. Réessaie.',

    failSave: 'Les changements sur cet exercice n’ont pas été enregistrés.',
    failRemove: 'L’exercice n’a pas été supprimé du catalogue.',
    failAddition: 'L’exercice a été supprimé, mais il reste ajouté à un jour.',
    failPlace: 'L’exercice n’a pas été mis dans le jour.',
    failUnplace: 'L’exercice n’est pas sorti du jour.',

    onDay: 'Dans le jour',
    onDays: 'Dans les jours',
    onNoDay: 'Dans aucun jour pour l’instant',
    dayGone: 'un jour supprimé',
    countOne: 'exercice publié',
    countMany: 'exercices publiés',

    addToDay: 'Mettre dans un jour',
    addToDayTitle: 'Dans quel jour ?',
    addToDayHint: 'L’exercice appartient déjà à tout le monde. Ce que tu choisis ici, c’est dans quel jour il entre.',
    addToDayEvery: 'Entre dans le jour de tous les comptes',
    addToDayConfirm:
      'Mettre cet exercice dans ce jour ? La semaine est la même pour tous les comptes, donc la carte apparaît pour tout le monde. Tu peux la retirer après.',
    addToDayAlready: 'Déjà dans ce jour',
    addToDayNone: 'Aucun jour où le mettre pour l’instant.',
  },

  days: {
    create: 'Créer un jour',
    newTitle: 'Nouveau jour',
    newHint: 'Entre dans la semaine après les sept du plan, dans tous les comptes.',
    editTitle: 'Modifier le jour',
    edit: 'Modifier ce jour',

    name: 'Nom du jour',
    namePlaceholder: 'ex : Bras et épaules',
    type: 'Type de jour',
    typeStrength: 'Séance',
    typeRest: 'Repos',
    typeHint: 'Un jour de repos s’ouvre quand même et accepte des exercices, si tu changes d’avis.',
    goal: 'Objectif du jour',
    goalPlaceholder: 'Ce que ce jour travaille',
    warm: 'Échauffement',
    warmPlaceholder: 'Comment tu commences',

    errName: 'Écris le nom du jour.',

    own: 'Ajouté',
    untitled: 'Jour sans nom',

    remove: 'Supprimer le jour',
    removeConfirm:
      'Supprimer ce jour et les exercices qui lui ont été ajoutés ? Il sort de la semaine de tous les comptes. Les exercices qui sont aussi dans le catalogue y restent, et les charges déjà enregistrées restent gardées.',

    failCreate: 'Le nouveau jour n’a pas été enregistré.',
    failSave: 'Les changements sur ce jour n’ont pas été enregistrés.',
    failDelete: 'Le jour n’a pas été supprimé et reste dans la semaine.',
    failExercises: 'Le jour a été supprimé, mais un exercice qui lui appartient y est encore accroché.',
    failHidden: 'Le jour a été supprimé, mais une marque d’exercice masqué y reste.',
    failOrder: 'Le jour a été supprimé, mais l’ordre que tu lui avais donné reste enregistré.',
    failAddition:
      'Le jour est sorti de la semaine, mais un exercice du catalogue y reste ajouté.',

    reorder: 'Réordonner le jour',
    reorderHint:
      'Maintiens un jour appuyé et fais-le glisser pour changer la semaine. Au clavier, place le focus sur la poignée et utilise les flèches haut et bas.',
    position: 'position',
    positionOf: 'sur',

    orderLabel: 'Ordre de la semaine',
    orderShared: 'Partagé',
    orderOwn: 'Le mien',
    orderReset: 'Remettre le partagé',
    orderResetDefault: 'Remettre par défaut',
    orderResetDefaultConfirm: 'Remettre l’ordre d’origine de la semaine, pour tous les comptes ?',
    orderOwnActive: 'Tu vois ton ordre. La semaine des autres comptes ne change pas.',
    orderSharedActive: 'C’est l’ordre de tout le monde. Le faire glisser le change dans tous les comptes.',
    failWeekOrder: 'Le nouvel ordre de la semaine n’a pas été enregistré.',
  },

  editor: {
    add: 'Ajouter un exercice',
    newTitle: 'Nouvel exercice',
    newHint: 'Reste dans ce jour, pour tous les comptes. Tu peux tout changer plus tard.',
    editOwnTitle: 'Modifier l’exercice',
    editBuiltTitle: 'Modifier la prescription',
    editBuiltHint:
      'Change ce que cet exercice demande, pour tous les comptes. Le plan d’origine reste intact et tu le remets quand tu veux.',

    name: 'Nom',
    namePlaceholder: 'ex : Rowing assis à la machine',
    equipment: 'Matériel',
    equipmentPlaceholder: 'ex : Machine à rowing',

    kind: 'Type de mouvement',
    kindComp: 'Polyarticulaire',
    kindAcc: 'Accessoire',
    kindIso: 'Isolation',
    kindCore: 'Gainage',
    kindHint: 'Décide comment les séries et les reps changent de Débutant à Récupérer.',

    sets: 'Séries',
    setsPlaceholder: 'ex : 3',
    reps: 'Reps',
    repsPlaceholder: 'ex : 10-12',
    load: 'Charge',
    loadPlaceholder: 'ex : 20 kg/main',
    rest: 'Repos',
    restPlaceholder: 'ex : 90 s',

    video: 'Vidéo de démonstration',
    videoPlaceholder: 'Colle le lien YouTube',
    videoHint: 'Facultatif. La vidéo se lit dans la carte, sans t’envoyer ailleurs.',
    videoNone: 'Pas encore de démonstration.',

    photo: 'Photo',
    photoAdd: 'Choisir une photo',
    photoChange: 'Changer la photo',
    photoRemove: 'Retirer la photo',
    photoHint: 'Facultatif. Sans photo la carte reste neutre, et elle n’emprunte jamais la photo d’un autre exercice.',
    photoSending: 'Envoi de la photo',
    photoOffline: 'Pas de connexion. Enregistre maintenant et ajoute la photo quand internet revient.',
    photoFailed: 'La photo n’est pas partie. Réessaie, ou enregistre sans elle.',
    photoBadFile: 'Je n’ai pas pu lire ce fichier comme une image.',

    failSave: 'Cet exercice n’a pas été enregistré.',
    failDelete: 'L’exercice n’a pas été supprimé et reste dans le jour.',
    failOverride: 'Le changement de prescription n’a pas été enregistré.',
    failRestore: 'La prescription d’origine n’a pas été remise.',
    failHide: 'L’exercice n’est pas sorti du jour.',
    failUnhide: 'Les exercices masqués ne sont pas revenus dans le jour.',
    failOrder: 'Le nouvel ordre n’a pas été enregistré.',
    failPublish: 'La publication au catalogue n’est pas passée, et rien n’a été publié.',

    errName: 'Écris le nom de l’exercice.',
    errVideo: 'Ce lien n’est pas une vidéo YouTube.',

    preview: 'Ce que ça donne sur les quatre phases',

    create: 'Créer l’exercice',
    remove: 'Supprimer l’exercice',
    removeConfirm:
      'Supprimer cet exercice ? Il sort du jour dans tous les comptes. Les charges enregistrées restent gardées.',
    restoreOriginal: 'Remettre l’original',
    restoreOriginalConfirm: 'Remettre la prescription d’origine de cet exercice, pour tous les comptes ?',

    hide: 'Retirer du jour',
    hiddenOne: 'exercice hors du jour',
    hiddenMany: 'exercices hors du jour',
    restore: 'Remettre',

    reorder: 'Réordonner',
    reorderHint:
      'Maintiens appuyé et fais glisser pour changer l’ordre. Au clavier, place le focus ici et utilise les flèches haut et bas.',
    position: 'position',
    positionOf: 'sur',
    resetOrderDefault: 'Remettre par défaut',
    resetOrderDefaultConfirm: 'Remettre l’ordre d’origine des exercices de ce jour, pour tous les comptes ?',

    visibility: 'Où cet exercice reste',
    visPrivate: 'Seulement dans ce jour',
    visShared: 'Aussi dans le catalogue',
    visHintPrivate: 'Reste dans ce jour, et tout le monde le voit ici.',
    visHintShared:
      'Reste dans ce jour et entre au Catalogue, pour que n’importe qui le mette dans un autre jour. N’importe qui peut le changer ou le supprimer.',
    publishConfirm:
      'Mettre cet exercice au Catalogue ? Il devient utilisable dans d’autres jours, et n’importe qui peut le changer ou le supprimer. Les charges enregistrées restent.',

    sharedTitle: 'Modifier pour tout le monde',
    sharedHint: 'Cet exercice est au Catalogue. Ce que tu changes ici change dans tous les jours où il se trouve.',
    removeShared: 'Supprimer pour tout le monde',
    removeSharedConfirm:
      'Supprimer cet exercice du Catalogue ? Il sort de tous les jours où il se trouve, dans tous les comptes. Les charges que chacun a enregistrées restent gardées.',
    hideShared: 'Retirer de ce jour',
    hideSharedHint: 'Sort de ce jour pour tous les comptes. Il reste au Catalogue, prêt à être remis.',

    badgeChanged: 'Modifié',
    badgeOwn: 'De ce jour',
    badgeShared: 'Du catalogue',

    emptyTitle: 'Ce jour n’a pas encore d’exercices',
    emptyBody: 'Ajoute le premier et il reste ici, avec les séries, la vidéo et l’historique de charge.',
  },
} satisfies Copy;
