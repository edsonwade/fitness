/**
 * Spanish copy.
 *
 * Portuguese is the source language (`pt.ts` is where the wording is decided); this
 * is a translation of it. `satisfies Copy` keeps the two in step: a key that exists
 * in `pt.ts` and not here fails the build, and so does a key invented here.
 *
 * Voice: second person singular (tú), coach in the room, no hedging. Spanish is
 * close enough to Portuguese to invite word-for-word carryover, and that is exactly
 * the trap: "carga" and "descanso" travel, "Iniciante" does not, and a "false
 * friend" reads as broken Spanish. Each sentence is written to do the job, not to
 * mirror the Portuguese.
 *
 * Two things stay Portuguese on purpose:
 *   - the KEYS of `train.readiness.recovery`, which are slugs the code computes;
 *   - `kg`, which is a unit and not a word.
 */
import type { Copy } from './pt';

export const es = {
  gate: {
    tabSignIn: 'Entrar',
    tabSignUp: 'Crear cuenta',
    tablist: 'Entrar o crear cuenta',

    welcomeBack: 'Bienvenido de nuevo',
    createAccount: 'Crea tu cuenta',
    subtitleSignIn: 'Sigue donde lo dejaste.',
    subtitleSignUp: 'Llévate tu plan al gimnasio.',

    name: 'Nombre',
    namePlaceholder: 'Cómo quieres que te llamemos',
    email: 'Email',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',

    show: 'Mostrar contraseña',
    hide: 'Ocultar contraseña',

    signIn: 'Entrar',
    signUp: 'Crear cuenta',
    signingIn: 'Entrando',
    creating: 'Creando la cuenta',
    forgot: 'Olvidé mi contraseña',
    sendingReset: 'Enviando',

    pwRuleShort: 'Al menos 8 caracteres',
    pwRuleLetter: 'Una letra',
    pwRuleDigit: 'Un número',
    pwRuleSymbol: 'Un símbolo',

    errNameRequired: 'Escribe tu nombre.',
    errEmailRequired: 'Escribe tu email.',
    errEmailFormat: 'Este email no parece válido.',
    errEmailDomain: 'Usa un email de un proveedor conocido, por ejemplo gmail.com.',
    errPasswordRequired: 'Escribe tu contraseña.',
    errPasswordShort: 'La contraseña necesita al menos 8 caracteres.',
    errPasswordLetter: 'Falta una letra.',
    errPasswordDigit: 'Falta un número.',
    errPasswordSymbol: 'Falta un símbolo.',
    errConfirmMismatch: 'Las contraseñas no coinciden.',

    errNoAccount: 'Email o contraseña incorrectos.',
    errExists: 'Ya existe una cuenta con este email. Entra en vez de crear otra.',
    errUnconfirmed: 'Confirma el email antes de entrar. Mira tu bandeja de entrada.',
    errRateLimit: 'Demasiados intentos. Espera un poco e inténtalo otra vez.',
    errOffline: 'Sin conexión. Comprueba internet e inténtalo otra vez.',
    errUnknown: 'Algo salió mal. Inténtalo otra vez.',

    createdTitle: 'Cuenta creada',
    createdBody: 'Confirma el email y después entra aquí.',
    resetSent: 'Te enviamos un enlace de recuperación a tu email.',
    resetNeedEmail: 'Escribe tu email primero.',
  },

  nav: {
    today: 'Hoy',
    train: 'Entrenar',
    nutrition: 'Nutrición',
    team: 'Equipo',
    profile: 'Perfil',
    catalog: 'Catálogo',
    landmark: 'Principal',
  },

  theme: {
    label: 'Tema',
    hint: 'Toca para cambiar.',
    system: 'Sistema',
    light: 'Claro',
    dark: 'Oscuro',
  },

  settings: {
    title: 'Ajustes',
    language: 'Idioma',
    languageHint: 'Cambia la app entera, y queda guardado en este aparato.',
  },

  today: {
    greeting: 'Hola',
  },

  pending: {
    title: 'Todavía sin construir',
    body: 'Esta pantalla llega en una fase posterior. El entrenamiento de la semana ya funciona.',
    action: 'Volver al entrenamiento',
  },

  errors: {
    notFoundTitle: 'Página no encontrada',
    notFoundBody: 'La dirección no corresponde a ninguna pantalla de la aplicación.',
    notFoundAction: 'Ir al entrenamiento',
    crashTitle: 'Algo salió mal',
    crashBody: 'La pantalla no se pudo abrir. Volver al entrenamiento suele arreglarlo.',
    crashAction: 'Volver al entrenamiento',
  },

  common: {
    back: 'Volver',
    save: 'Guardar',
    saving: 'Guardando',
    saved: 'Guardado',
    cancel: 'Cancelar',
    add: 'Añadir',
    create: 'Crear',
    edit: 'Editar',
    remove: 'Quitar',
    close: 'Cerrar',
    retry: 'Intentar otra vez',
    loading: 'Cargando',
    loadError: 'No se pudo cargar. Inténtalo otra vez.',
    offlineNote: 'Sin conexión. Los cambios quedan guardados y suben cuando vuelvas a tener internet.',
    required: 'Este campo es obligatorio.',
    optional: 'opcional',

    opening: 'Abriendo la aplicación',
    effort: 'Esfuerzo',

    writeBody: 'Todo lo demás que hiciste quedó guardado. Esto se puede intentar otra vez.',
    writeRetry: 'Intentar otra vez',
    writeDismiss: 'Ignorar',
    writeDetails: 'Ver lo que respondió el servidor',
    writeDetailsHide: 'Ocultar la respuesta del servidor',
  },

  train: {
    title: 'Entrenar',
    subtitle: 'Tu plan de la semana.',
    blocksLabel: 'Fase del programa',
    exercises: 'ejercicios',
    exercise: 'ejercicio',
    series: 'series',
    serie: 'serie',
    open: 'Abrir día',
    restDay: 'Día de descanso',
    restDayBody: 'Hoy no hay ejercicios. Recupera, duerme y come bien para la próxima fase.',

    phase: {
      b1: 'Principiante',
      b2: 'Intermedio',
      b3: 'Avanzado',
      dl: 'Recuperar',
    },

    phaseInfo: {
      b1: {
        title: 'Fundamentos',
        body: 'Movimientos fundamentales y ejercicios más sencillos.',
      },
      b2: {
        title: 'Más variedad',
        body: 'Más experiencia, mayor variedad y ejercicios algo más complejos.',
      },
      b3: {
        title: 'Movimientos avanzados',
        body: 'Para quien ya tiene experiencia, con movimientos avanzados.',
      },
      dl: {
        title: 'Semana de descarga',
        body: 'Reducción planificada de la carga. Esta semana el programa te pide menos, a propósito, para que el cuerpo recupere antes del próximo ciclo.',
      },
    },

    about: 'unos',
    minutes: 'min',
    minutesLong: 'minutos',
    logsError: 'No se pudo cargar tu registro de cargas. El plan sigue visible.',

    dayOf: 'Día',
    dayNotFoundTitle: 'Día no encontrado',
    dayNotFoundBody: 'Este día de entrenamiento no existe.',
    sets: 'Series',
    setLabel: 'Serie',
    weight: 'Carga',
    weightPlaceholder: 'ej: 60',
    reps: 'Reps',
    repsPlaceholder: 'ej: 10',
    note: 'Nota',
    notePlaceholder: 'Cómo fue',
    target: 'Objetivo',
    rpe: 'RPE',
    rest: 'Descanso',
    goal: 'Objetivo del día',
    warmup: 'Calentamiento',
    muscles: 'Músculos',

    failRecordSession: 'La serie quedó marcada, pero el entrenamiento de hoy no entró en tu historial.',

    technique: 'Ejecución',
    commonErrors: 'Errores comunes',
    fix: 'Corrige',
    safety: 'Seguridad',
    breathing: 'Respiración',
    details: 'Ver técnica',
    hideDetails: 'Ocultar técnica',

    watchVideo: 'Ver demostración',
    videoOf: 'Demostración de',
    closeVideo: 'Cerrar vídeo',

    startRest: 'Iniciar descanso',
    restRunning: 'Descanso en marcha',
    skipRest: 'Saltar',
    addSeconds: '15s más',
    restDone: 'Descanso terminado',

    exIdle: 'Sin empezar',
    exDoing: 'En curso',
    exDone: 'Completo',

    exerciseOne: 'ejercicio',
    exerciseMany: 'ejercicios',
    completeOne: 'completo',
    completeMany: 'completos',

    workoutOpen: 'Entrenamiento en curso',
    workoutDone: 'Entrenamiento terminado',
    setsPendingOne: 'serie sin completar',
    setsPendingMany: 'series sin completar',
    allSetsDone: 'No queda ninguna serie',
    finish: 'Terminar entrenamiento',
    finishing: 'Terminando…',
    finishHint: 'Marca al menos una serie para poder terminar el entrenamiento.',
    reopen: 'Reabrir entrenamiento',
    reopening: 'Reabriendo…',
    failReopenSession: 'No se pudo reabrir el entrenamiento.',

    progressLabel: 'Progreso del día',

    readiness: {
      title: 'Preparación de hoy',
      label: 'Preparación',
      outOf: '/ 100',
      recoveryLabel: 'Recuperación',
      loadLabel: 'Carga',
      lastSession: 'última sesión',
      recovery: {
        'treino-hoje': 'Has entrenado hoy',
        recente: 'Reciente',
        boa: 'Buena',
        completa: 'Completa',
        'pausa-longa': 'Pausa larga',
      },
      whyLabel: '¿Por qué?',
      trainedToday: 'Has entrenado hoy.',
      trainedYesterday: 'Entrenaste ayer.',
      trainedAgoPre: 'Entrenaste hace',
      trainedAgoPost: 'días.',
      window: 'El intervalo de 2 a 3 días es el de mejor recuperación.',
      dense: 'Muchas sesiones seguidas — la preparación baja para dar margen a la recuperación.',
      sessionsWeekOne: 'sesión en los últimos 7 días.',
      sessionsWeekMany: 'sesiones en los últimos 7 días.',
      lastLoadPre: 'Última sesión:',
      kg: 'kg',
      noLoad: 'sin carga registrada',
      disclaimer: 'Una lectura de tu registro, no una medición médica.',
      emptyTitle: 'Todavía sin preparación',
      emptyBody:
        'Registra una sesión de entrenamiento y la app pasa a leer tu preparación a partir de ella. Sin entrenamientos con fecha no hay nada que leer, y no nos inventamos un número.',
    },

    recommend: {
      title: 'Objetivo de hoy',
      stanceTrain: 'Buen día para entrenar',
      stanceModerate: 'Entrena con margen para recuperar',
      stanceRest: 'Día de descanso',
      restWhy: 'Tu plan marca hoy como descanso.',
      restBody: 'Descansar forma parte del plan: recupera, duerme y come bien para la próxima sesión.',
      whyLabel: '¿Por qué?',
      minutes: 'min',
      scorePre: 'La preparación está en',
      noReason: 'Sin entrenamientos con fecha todavía no hay razón que mostrar, y no nos inventamos una.',
    },
  },

  catalog: {
    title: 'Catálogo',
    subtitle: 'Lo que las cuentas han publicado, visible para todo el mundo.',

    emptyTitle: 'Todavía no hay nada en el catálogo',
    emptyBody: 'Dentro de un día, crea un ejercicio y elige "También en el catálogo". Aparece aquí, listo para ponerlo en otro día.',

    loadError: 'No se pudo cargar el catálogo. Inténtalo otra vez.',

    failSave: 'Los cambios en este ejercicio no quedaron guardados.',
    failRemove: 'El ejercicio no se borró del catálogo.',
    failAddition: 'El ejercicio se borró, pero sigue añadido a un día.',
    failPlace: 'El ejercicio no se puso en el día.',
    failUnplace: 'El ejercicio no salió del día.',

    onDay: 'En el día',
    onDays: 'En los días',
    onNoDay: 'Todavía en ningún día',
    dayGone: 'un día borrado',
    countOne: 'ejercicio publicado',
    countMany: 'ejercicios publicados',

    addToDay: 'Poner en un día',
    addToDayTitle: '¿En qué día?',
    addToDayHint: 'El ejercicio ya es de todo el mundo. Lo que eliges aquí es en qué día entra.',
    addToDayEvery: 'Entra en el día de todas las cuentas',
    addToDayConfirm:
      '¿Poner este ejercicio en este día? La semana es la misma para todas las cuentas, así que la tarjeta aparece para todo el mundo. Puedes quitarlo después.',
    addToDayAlready: 'Ya está en este día',
    addToDayNone: 'Todavía no hay días donde ponerlo.',
  },

  days: {
    create: 'Crear día',
    newTitle: 'Día nuevo',
    newHint: 'Entra en la semana después de los siete del plan, en todas las cuentas.',
    editTitle: 'Editar día',
    edit: 'Editar este día',

    name: 'Nombre del día',
    namePlaceholder: 'ej: Brazo y hombro',
    type: 'Tipo de día',
    typeStrength: 'Entrenamiento',
    typeRest: 'Descanso',
    typeHint: 'Un día de descanso se abre igual y acepta ejercicios, si cambias de idea.',
    goal: 'Objetivo del día',
    goalPlaceholder: 'Lo que trabaja este día',
    warm: 'Calentamiento',
    warmPlaceholder: 'Cómo empiezas',

    errName: 'Escribe el nombre del día.',

    own: 'Añadido',
    untitled: 'Día sin nombre',

    remove: 'Borrar día',
    removeConfirm:
      '¿Borrar este día y los ejercicios que se le añadieron? Sale de la semana de todas las cuentas. Los ejercicios que también están en el catálogo siguen ahí, y las cargas ya registradas quedan guardadas.',

    failCreate: 'El día nuevo no quedó guardado.',
    failSave: 'Los cambios en este día no quedaron guardados.',
    failDelete: 'El día no se borró y sigue en la semana.',
    failExercises: 'El día se borró, pero un ejercicio propio sigue enganchado a él.',
    failHidden: 'El día se borró, pero una marca de ejercicio oculto sigue en él.',
    failOrder: 'El día se borró, pero el orden que le habías dado sigue guardado.',
    failAddition:
      'El día salió de la semana, pero un ejercicio del catálogo sigue añadido a él.',

    reorder: 'Reordenar día',
    reorderHint:
      'Mantén pulsado un día y arrastra para cambiar la semana. Con el teclado, enfoca el asa y usa las flechas arriba y abajo.',
    position: 'posición',
    positionOf: 'de',

    orderLabel: 'Orden de la semana',
    orderShared: 'Compartido',
    orderOwn: 'El mío',
    orderReset: 'Recuperar el compartido',
    orderResetDefault: 'Restablecer por defecto',
    orderResetDefaultConfirm: '¿Restablecer el orden original de la semana, para todas las cuentas?',
    orderOwnActive: 'Estás viendo tu orden. La semana de las otras cuentas no cambia.',
    orderSharedActive: 'Este es el orden de todo el mundo. Arrastrar lo cambia en todas las cuentas.',
    failWeekOrder: 'El nuevo orden de la semana no quedó guardado.',
  },

  editor: {
    add: 'Añadir ejercicio',
    newTitle: 'Ejercicio nuevo',
    newHint: 'Se queda en este día, para todas las cuentas. Puedes cambiarlo todo más tarde.',
    editOwnTitle: 'Editar ejercicio',
    editBuiltTitle: 'Editar prescripción',
    editBuiltHint:
      'Cambia lo que pide este ejercicio, para todas las cuentas. El plan original queda intacto y lo recuperas cuando quieras.',

    name: 'Nombre',
    namePlaceholder: 'ej: Remo bajo en máquina',
    equipment: 'Equipamiento',
    equipmentPlaceholder: 'ej: Máquina de remo',

    kind: 'Tipo de movimiento',
    kindComp: 'Compuesto',
    kindAcc: 'Accesorio',
    kindIso: 'Aislamiento',
    kindCore: 'Core',
    kindHint: 'Decide cómo cambian las series y las reps de Principiante a Recuperar.',

    sets: 'Series',
    setsPlaceholder: 'ej: 3',
    reps: 'Reps',
    repsPlaceholder: 'ej: 10-12',
    load: 'Carga',
    loadPlaceholder: 'ej: 20 kg/mano',
    rest: 'Descanso',
    restPlaceholder: 'ej: 90 s',

    video: 'Vídeo de demostración',
    videoPlaceholder: 'Pega el enlace de YouTube',
    videoHint: 'Opcional. El vídeo se reproduce dentro de la tarjeta, sin mandarte a otro sitio.',
    videoNone: 'Todavía sin demostración.',

    photo: 'Foto',
    photoAdd: 'Elegir foto',
    photoChange: 'Cambiar foto',
    photoRemove: 'Quitar foto',
    photoHint: 'Opcional. Sin foto la tarjeta queda neutra, y nunca toma prestada la foto de otro ejercicio.',
    photoSending: 'Enviando la foto',
    photoOffline: 'Sin conexión. Guarda ahora y añade la foto cuando vuelvas a tener internet.',
    photoFailed: 'La foto no subió. Inténtalo otra vez, o guarda sin ella.',
    photoBadFile: 'No pude leer ese archivo como imagen.',

    failSave: 'Este ejercicio no quedó guardado.',
    failDelete: 'El ejercicio no se borró y sigue en el día.',
    failOverride: 'El cambio en la prescripción no quedó guardado.',
    failRestore: 'La prescripción original no se restableció.',
    failHide: 'El ejercicio no salió del día.',
    failUnhide: 'Los ejercicios ocultos no volvieron al día.',
    failOrder: 'El nuevo orden no quedó guardado.',
    failPublish: 'La publicación en el catálogo no pasó, y no se publicó nada.',

    errName: 'Escribe el nombre del ejercicio.',
    errVideo: 'Ese enlace no es un vídeo de YouTube.',

    preview: 'Cómo queda en las cuatro fases',

    create: 'Crear ejercicio',
    remove: 'Borrar ejercicio',
    removeConfirm:
      '¿Borrar este ejercicio? Sale del día en todas las cuentas. Los registros de carga quedan guardados.',
    restoreOriginal: 'Restablecer el original',
    restoreOriginalConfirm: '¿Restablecer la prescripción original de este ejercicio, para todas las cuentas?',

    hide: 'Quitar del día',
    hiddenOne: 'ejercicio fuera del día',
    hiddenMany: 'ejercicios fuera del día',
    restore: 'Restablecer',

    reorder: 'Reordenar',
    reorderHint:
      'Mantén pulsado y arrastra para cambiar el orden. Con el teclado, enfoca aquí y usa las flechas arriba y abajo.',
    position: 'posición',
    positionOf: 'de',
    resetOrderDefault: 'Restablecer por defecto',
    resetOrderDefaultConfirm: '¿Restablecer el orden original de los ejercicios de este día, para todas las cuentas?',

    visibility: 'Dónde se queda este ejercicio',
    visPrivate: 'Solo en este día',
    visShared: 'También en el catálogo',
    visHintPrivate: 'Se queda en este día, y todo el mundo lo ve aquí.',
    visHintShared:
      'Se queda en este día y entra en el Catálogo, para que cualquiera lo ponga en otro día. Cualquiera lo puede cambiar o borrar.',
    publishConfirm:
      '¿Poner este ejercicio en el Catálogo? Pasa a poder usarse en otros días, y cualquiera lo puede cambiar o borrar. Los registros de carga se quedan.',

    sharedTitle: 'Editar para todos',
    sharedHint: 'Este ejercicio está en el Catálogo. Lo que cambies aquí cambia en todos los días donde está.',
    removeShared: 'Borrar para todos',
    removeSharedConfirm:
      '¿Borrar este ejercicio del Catálogo? Sale de todos los días donde está, en todas las cuentas. Los registros de carga que hizo cada uno quedan guardados.',
    hideShared: 'Quitar de este día',
    hideSharedHint: 'Sale de este día para todas las cuentas. Sigue en el Catálogo, listo para volver a ponerlo.',

    badgeChanged: 'Cambiado',
    badgeOwn: 'De este día',
    badgeShared: 'Del catálogo',

    emptyTitle: 'Este día todavía no tiene ejercicios',
    emptyBody: 'Añade el primero y se queda aquí, con las series, el vídeo y el registro de carga.',
  },
} satisfies Copy;
