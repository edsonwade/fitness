/**
 * Portuguese copy. Portuguese is the source language of this product, not a
 * translation target, so this file is where the wording is decided.
 *
 * House rule, from the taste skill: zero em-dashes in anything authored here. The
 * preserved training content keeps its own, because that is the user's authored
 * plan and is ported verbatim. This file is authored copy, so the ban applies.
 */
export const pt = {
  gate: {
    tabSignIn: 'Entrar',
    tabSignUp: 'Criar conta',
    /* O rótulo do par de separadores, que estava preso em código. */
    tablist: 'Entrar ou criar conta',

    welcomeBack: 'Bem-vindo de volta',
    createAccount: 'Cria a tua conta',
    subtitleSignIn: 'Continua de onde paraste.',
    subtitleSignUp: 'Leva o teu plano contigo para o ginásio.',

    name: 'Nome',
    namePlaceholder: 'Como queres ser tratado',
    email: 'Email',
    password: 'Palavra-passe',
    confirmPassword: 'Confirmar palavra-passe',

    show: 'Mostrar palavra-passe',
    hide: 'Esconder palavra-passe',

    signIn: 'Entrar',
    signUp: 'Criar conta',
    signingIn: 'A entrar',
    creating: 'A criar conta',
    forgot: 'Esqueci-me da palavra-passe',
    noAccount: 'Ainda não tens conta?',
    haveAccount: 'Já tens conta?',
    emailPlaceholder: 'Endereço de email',
    passwordPlaceholder: 'Palavra-passe',
    sendingReset: 'A enviar',

    pwRuleShort: 'Pelo menos 8 caracteres',
    pwRuleLetter: 'Uma letra',
    pwRuleDigit: 'Um número',
    pwRuleSymbol: 'Um símbolo',

    errNameRequired: 'Escreve o teu nome.',
    errEmailRequired: 'Escreve o teu email.',
    errEmailFormat: 'Este email não parece válido.',
    errEmailDomain: 'Usa um email de um fornecedor conhecido, por exemplo gmail.com.',
    errPasswordRequired: 'Escreve a tua palavra-passe.',
    errPasswordShort: 'A palavra-passe precisa de pelo menos 8 caracteres.',
    errPasswordLetter: 'Falta uma letra.',
    errPasswordDigit: 'Falta um número.',
    errPasswordSymbol: 'Falta um símbolo.',
    errConfirmMismatch: 'As palavras-passe não coincidem.',

    unconfirmedTitle: "Confirma o email primeiro",
    unconfirmedPre: "Enviámos uma ligação para",
    unconfirmedPost: "Sem ela a conta não abre.",
    resend: "Enviar outra vez",
    resent: "Enviada outra vez",
    offlineTitle: "Não foi possível ligar",
    offlineBody: "Entrar precisa de rede. O treino de hoje já descarregado continua a abrir sem ela.",
    errNoAccount: 'Email ou palavra-passe não batem certo.',
    errExists: 'Já existe uma conta com este email. Entra em vez de criar.',
    errUnconfirmed: 'Confirma o email antes de entrares. Vê a tua caixa de entrada.',
    errRateLimit: 'Demasiadas tentativas. Espera um pouco e tenta outra vez.',
    errOffline: 'Sem ligação. Verifica a internet e tenta outra vez.',
    errUnknown: 'Algo correu mal. Tenta outra vez.',

    createdTitle: 'Conta criada',
    createdBody: 'Confirma o email e depois entra aqui.',
    resetSent: 'Enviámos um link de recuperação para o teu email.',
    resetNeedEmail: 'Escreve o teu email primeiro.',
  },

  /*
   * Os cinco separadores do protótipo v2, por esta ordem. O Catálogo deixou de ser
   * separador e passou a pendurar-se do Treino, que é onde `proto/v2` o põe.
   */
  nav: {
    today: 'Hoje',
    train: 'Treino',
    nutrition: 'Nutrição',
    team: 'Equipa',
    profile: 'Perfil',
    catalog: 'Catálogo',
    /* O rótulo da barra para quem navega por marcos, não a olho. */
    landmark: 'Principal',
  },

  /*
   * O tema, que estava escrito dentro do `ThemeToggle` em português. É o vizinho da
   * língua nas Definições e, como ela, tem de se dizer na língua de quem lê.
   */
  theme: {
    label: 'Tema',
    hint: 'Tocar para mudar.',
    system: 'Sistema',
    light: 'Claro',
    dark: 'Escuro',
    toLight: 'Mudar para tema claro',
    toDark: 'Mudar para tema escuro',
  },

  /*
   * As Definições, que ainda não têm ecrã próprio — a fase 023 escreve-o. Até lá o
   * seletor de língua vive no Perfil pendente: alcançável, e não escondido atrás de
   * uma fase que ainda não chegou.
   */
  settings: {
    title: 'Definições',
    language: 'Idioma',
    languageHint: 'Muda a app inteira, e fica guardado neste aparelho.',
  },

  /**
   * O ecrã HOJE. Só a saudação vive aqui: a prontidão (007) e o objetivo de hoje
   * (008) trazem o seu próprio texto. O que o protótipo não desenha não tem copy —
   * os avisos de "isto chega numa próxima fase" saíram a 2026-09-21, com a regra de
   * que a app é o protótipo.
   */
  journey: {
    title: "A tua jornada",
    open: "Ver as fases",
    intro: "Doze semanas, quatro fases. Cada fase pede uma coisa diferente ao corpo — e prescreve dentro da faixa que está escrita aqui.",
    now: "Agora",
    next: "A seguir",
    later: "Depois",
    last: "Para fechar",
    weeks: "semanas",
    week: "semana",
    weeksLabel: "Semanas",
    weekLabel: "Semana",
    screenTitle: "Treino",
    yourDays: "Os teus dias",
    newDay: "+ Novo dia",
    catalog: "Abrir o catálogo",
    calendar: "Calendário",
    progress: "Progresso",
    today: "Hoje",
    names: {
      b1: "Bloco 1 · Acumulação",
      b2: "Bloco 2 · Intensificação",
      b3: "Bloco 3 · Realização",
      dl: "Descarga",
    },
    bodies: {
      b1: "Volume, capacidade de trabalho, técnica sob fadiga.",
      b2: "Eficiência neural, cargas mais pesadas.",
      b3: "Exprimir força, testar.",
      dl: "Recuperar. Aliviar a carga para o corpo assentar o que ganhou.",
    },
    facts: {
      b1: ["60-75% 1RM · 6-12 reps", "12-20 séries por semana nos grupos grandes, 8-14 nos pequenos", "Descanso 1-3 min"],
      b2: ["75-90% 1RM · 3-6 reps", "Levantamento principal 2-4×/semana, 3-8 séries", "Descanso 3-5 min · RPE 8-8,5"],
      b3: ["85-100% 1RM · 1-3 reps", "Volume −40-60% à entrada do bloco", "Descanso 5+ min"],
      dl: ["Volume −40-50% ou intensidade −20%", "O modelo pede uma descarga a cada 4-6 semanas. Este programa tem uma, na 12."],
    },
  },

  music: {
    title: "Música",
    open: "Abrir o leitor de música",
    play: "Tocar",
    pause: "Pausar",
    position: "Posição na faixa",
    back15: "Recuar 15 segundos",
    fwd15: "Avançar 15 segundos",
    lockedTitle: "Continua com o ecrã bloqueado",
    lockedBody: "A faixa aparece nos controlos do sistema. Nos últimos 3 segundos do descanso o volume desce para 30%, para o aviso não ter de lutar com a música.",
    ducking: "A baixar o volume · o descanso está a acabar",
    emptyTitle: "Escolhe a tua música",
    emptyBody: "Põe os ficheiros em public/audio/ e escreve-os em public/audio/tracks.json. Enquanto não houver nenhum, a barra de música não ocupa espaço no ecrã de treino.",
    spotifyTitle: "Spotify não entra aqui, e a razão diz-se",
    spotifyBody: "Na web não se controla o Spotify a partir de fora. Um botão de \"tocar\" que na verdade abre outra app não é o que a app promete.",
  },

  progress: {
    title: "Progresso",
    back: "Voltar",
    calendar: "Calendário",
    period: "Período",
    p7: "7 dias",
    p30: "30 dias",
    pAll: "Tudo",
    volumeTitle: "Volume por sessão",
    volumeAria: "Volume por sessão, em quilos",
    sinceLast: "desde a sessão anterior",
    sessions: "Sessões",
    inLast: "nos últimos",
    days: "dias",
    allTime: "desde o início",
    setsDone: "Séries feitas",
    ofPlanned: "de",
    planned: "planeadas",
    volumeTotal: "Volume total",
    time: "Tempo",
    noData: "sem dados",
    byExercise: "Por exercício",
    sessionsWord: "sessões",
    sessionWord: "sessão",
    noLoad: "Carga por preencher",
    latestLoad: "Carga de trabalho mais recente",
    loadAria: "Carga por sessão, em quilos",
    history: "Histórico",
    all: "Todos",
    seeCalendar: "Ver o calendário",
    records: "Recordes",
    recent: "Mais recente",
    recordBody: "Carga mais alta registada neste exercício.",
    missingTitle: "não aparece",
    missingBody: "A carga nunca foi registada. Sem número não há recorde, e não se estima um.",
    noChartTitle: "Ainda não há gráfico",
    noChartPre: "Tens",
    noChartPost: "registadas. A partir da terceira aparece a evolução. Duas não fazem uma tendência, e desenhar uma seria mentir.",
    whatExists: "O que já existe",
    startToday: "Começar a sessão de hoje",
    close: "Fechar",
  },

  calendar: {
    title: "Calendário",
    back: "Voltar",
    today: "Ir para hoje",
    prev: "Mês anterior",
    next: "Mês seguinte",
    month: "Mês",
    year: "Ano",
    done: "Feita",
    planned: "Planeada",
    missed: "Falhada",
    rest: "Descanso",
    noHistory: "sem registo",
    sofar: "até agora",
    sessionsDone: "sessões feitas",
    missedWord: "falhadas",
    missedOn: "Falhadas",
    written: "Fica escrito.",
    perDay: "Sessões por dia",
    yearAria: "Mapa de constância",
    yearNoticeTitle: "O ano inteiro precisa de um ano de dados",
    yearNoticeBody: "Enquanto não houver, mostra-se só o que existe. Um mapa cheio de células cinzentas seria mentira com ar de gráfico.",
    yearEmpty: "Ainda não há sessões gravadas.",
    emptyMonth: "O plano continua a ver-se; só o histórico é que está vazio.",
    volume: "Volume",
    duration: "Duração",
    noData: "sem dados",
    seeSession: "Ver a sessão",
    openDay: "Abrir o treino",
    todayBtn: "Hoje",
    planBody: "O treino que o plano tem para este dia.",
    restBody: "Dia de descanso no plano. Não há treino marcado.",
    complete: "Completa",
    open: "Em curso",
    of: "de",
    events: "Eventos",
    addEvent: "+ Evento",
    newEvent: "Novo evento",
    editEvent: "Editar evento",
    eventTitle: "Título",
    eventTime: "Hora (opcional)",
    eventNote: "Nota (opcional)",
    notifyMe: "Avisar-me quando chegar o dia",
    saveEvent: "Guardar",
    deleteEvent: "Apagar evento",
    noEvents: "Sem eventos neste dia.",
    allDay: "Dia inteiro",
    training: "Treino",
    noSession: "Sem treino registado neste dia.",
    prevWeek: "Semana anterior",
    nextWeek: "Semana seguinte",
    todayEvents: "Hoje no calendário",
    titleRequired: "Escreve um título.",
    notifyBlocked: "Os avisos do sistema estão bloqueados neste browser. O aviso aparece na app, no Hoje.",
  },

  coach: {
    title: "Coach",
    factPre: "Fizeste",
    factMid: "das últimas",
    factPost: "sessões planeadas.",
    full: "Hoje podes subir a carga onde fizeste as séries todas: a sugestão está em cada exercício.",
    most: "Hoje mantém-se a intensidade em vez de subir a carga.",
    low: "Hoje o objetivo é voltar ao ritmo: faz a sessão, mesmo que mais leve.",
    rule: "Um facto do teu registo e a decisão que dele decorre.",
    see: "Ver recomendação",
  },

  evolution: {
    title: "Evolução",
    back: "Voltar",
    countingPre: "A contar desde",
    countingPost: ", a primeira sessão com data registada.",
    nothing: "Ainda não há sessões gravadas. A evolução começa a contar na primeira.",
    overMonths: "carga ao longo dos meses",
    sinceFirst: "desde a primeira sessão",
    aria: "Carga por mês, em quilos",
    oneSeries: "Uma série por gráfico. A comparação entra como barra fantasma neutra, nunca como segunda cor.",
    milestones: "Marcos",
    firstSession: "Primeira sessão registada",
    highest: "Carga mais alta,",
    streak: "Semanas seguidas com treino",
    milestoneRule: "Um marco é um facto do registo, com data. Nunca uma medalha inventada para encher o ecrã.",
    othersTitle: "Os outros exercícios ainda não têm meses que cheguem",
    othersBody: "Aparecem aqui assim que tiverem registo em dois meses, e até lá não se desenha uma linha por eles.",
    noneTitle: "Ainda não há meses que cheguem",
    noneBody: "Um exercício aparece aqui quando tiver carga registada em dois meses diferentes.",
    seeCalendar: "Ver o calendário",
  },

  offline: {
    title: "Sem ligação",
    body: "O que registares fica guardado no telemóvel e sobe sozinho quando a rede voltar.",
    pendingOne: "escrita à espera",
    pendingMany: "escritas à espera",
    pendingBody: "Treinar offline funciona. O registo espera.",
    loading: "A carregar a prontidão",
  },

  nutrition: {
    title: "Nutrição",
    history: "Histórico",
    tabToday: "Hoje",
    tabHistory: "Histórico",
    tabQuick: "Calorias rápidas",
    tabRecipes: "Receitas",
    tabMacros: "Macros",
    kcalEaten: "Calorias consumidas",
    proteinEaten: "Proteína consumida",
    ofGoal: "da meta",
    goalLine: "Meta",
    proteinWord: "proteína",
    setGoal: "Definir a meta",
    goalTitle: "A meta do dia",
    save: "Guardar",
    weight: "Peso",
    log: "Registar",
    weightToday: "Peso de hoje",
    weightStep: "100 g de cada vez. As setas do teclado também mexem.",
    ofWeightGoal: "da meta",
    records: "registos",
    noWeight: "Ainda sem peso registado.",
    diary: "Diário de macros",
    toLog: "Por registar",
    logMeal: "Registar refeição",
    emptyTitle: "Nada registado hoje",
    emptyBody: "Regista a primeira refeição e os anéis começam a encher. Antes disso não há nada para mostrar, e não se inventa.",
    meals: {
      breakfast: "Pequeno-almoço",
      lunch: "Almoço",
      snack: "Snack",
      dinner: "Jantar",
    },
    p: "P",
    c: "HC",
    f: "G",
    kcal: "kcal",
    grams: "gramas",
    calories: "Calorias",
    protein: "Proteína",
    carbs: "Hidratos",
    fat: "Gordura",
    close: "Fechar",
    flash: "Flash",
    brand: "Nutrição",
    gallery: "Escolher da galeria",
    shutter: "Tirar fotografia",
    search: "Procurar",
    modes: "Modo de registo",
    voice: "Voz",
    text: "Texto",
    ai: "IA",
    code: "Código",
    precisionEstimate: "Precisão estimada",
    precisionMeasured: "Medido",
    listening: "A ouvir",
    voiceBody: "Diz o que comeste. A transcrição é estimativa e confirma-se antes de guardar — nunca entra no diário sem passares os olhos.",
    voiceUnsupported: "Este browser não transcreve voz. Usa o modo Texto.",
    voiceStart: "Começar a ouvir",
    textLabel: "Escreve a refeição",
    textPlaceholder: "Frango, arroz e feijão",
    textNote: "Aqui o teclado é permitido: isto é texto livre, não é métrica de treino.",
    next: "Seguinte",
    aiBody: "Tira a fotografia do prato. A estimativa automática por fotografia ainda não está ligada: no passo seguinte dizes o que é e acertas os números.",
    codeBody: "Aponta ao código de barras.",
    codeUnsupported: "Este browser não lê códigos de barras. Usa o modo Texto.",
    codeLooking: "A procurar o produto…",
    codeNotFound: "Produto não encontrado. Escreve-o no modo Texto.",
    cameraOff: "Sem acesso à câmara.",
    estimateTitle: "Isto é uma estimativa",
    estimateBody: "Não saiu de uma balança. Corrige o que estiver longe antes de guardar.",
    measuredTitle: "Valores do rótulo",
    measuredBody: "Vieram da base de dados do produto, por 100 g. Ajusta à porção que comeste.",
    meal: "Refeição",
    saveDiary: "Guardar no diário",
    name: "O que comeste",
    remove: "Tirar do diário",
    quickTitle: "Calorias rápidas",
    quickBody: "Só o número, sem nome nem macros.",
    recipesEmpty: "Ainda não há receitas guardadas.",
    macrosTitle: "Macros do dia",
    macrosOfKcal: "das kcal",
    historyEmpty: "Ainda não há dias com registos.",
    days: "dias",
  },

  profile: {
    title: "Perfil",
    settings: "Definições",
    you: "Tu",
    blockWeek: "semana",
    body: "Corpo",
    height: "Altura",
    now: "Agora",
    goal: "Meta",
    startedAt: "Começaste em",
    leftPre: "Faltam",
    update: "Atualizar",
    noBody: "Ainda sem medidas. Põe a altura e o peso para aparecer aqui.",
    weightToday: "Peso de hoje",
    goals: "Objetivos",
    newGoal: "+ Novo",
    noGoals: "Ainda sem objetivos. Põe o primeiro, com uma foto que te lembre porquê.",
    hitOn: "Atingido a",
    left: "faltam",
    goalTitle: "Objetivo",
    titleLabel: "O que queres alcançar",
    titlePlaceholder: "Chegar aos 66 kg",
    unit: "Unidade",
    unitKg: "kg",
    unitCount: "vezes",
    startLabel: "Onde estás",
    targetLabel: "Onde queres chegar",
    currentLabel: "Agora",
    photo: "Foto",
    save: "Guardar",
    markHit: "Marcar como atingido",
    deleteGoal: "Apagar objetivo",
    hitChip: "Atingido",
    hitBodyPre: "Atingido a",
    hitBodyMid: ". Puseste-o a",
    hitBodyPost: ", quando estavas em",
    whenSet: "Quando puseste",
    nextGoal: "Pôr o próximo objetivo",
    sync: "Sincronização",
    synced: "Tudo sincronizado",
    syncedBody: "Nenhuma escrita à espera",
    offline: "Sem ligação",
    waiting: "escritas à espera",
    waitingOne: "escrita à espera",
    waitingBody: "Sobem sozinhas quando a rede voltar",
    theme: "Tema",
    dark: "Escuro",
    light: "Claro",
    system: "Sistema",
    themeHint: "Escuro é a omissão. Fica guardado neste aparelho.",
    language: "Idioma",
    restDefault: "Descanso por omissão",
    restHint: "O descanso escrito no plano de cada exercício ganha a este.",
    exportLabel: "Exportar os meus dados (JSON)",
    importLabel: "Importar",
    signOut: "Terminar sessão",
    deleteAccount: "Apagar a conta",
    importTitle: "Importar dados",
    importBodyPre: "Este ficheiro vai escrever",
    importRows: "linhas",
    importIn: "em",
    importTables: "tabelas",
    importWarn: "As linhas com o mesmo identificador são substituídas. Não há como desfazer.",
    importBad: "Este ficheiro não é uma exportação desta app.",
    importGo: "Importar e substituir",
    cancel: "Cancelar",
    deleteTitle: "Apagar a conta?",
    deleteBodyPre: "Apaga",
    deleteSessions: "sessões",
    deleteSets: "séries registadas e",
    deleteGoals: "objetivos. Não há como voltar atrás e não ficamos com cópia.",
    deleteGo: "Apagar tudo",
    deleteFail: "Não foi possível apagar a conta. A base de dados ainda não tem a função que o faz.",
    goalNear: "Objetivo perto",
  },

  onboarding: {
    skip: "Saltar",
    step: "Passo",
    of: "de",
    next: "Continuar",
    notSay: "Prefiro não dizer",
    welcomeTitle: "O plano já está pronto",
    welcomeBody: "Quatro perguntas, todas por toque. Podes saltar qualquer uma — a app funciona na mesma.",
    daysTitle: "Quantos dias por semana?",
    daysBody: "O plano tem 6 dias de treino e 1 de descanso. Podes seguir menos — o programa não muda, só se espalha por mais semanas.",
    daysNote: "o plano",
    goalTitle: "O que procuras?",
    goalBody: "Fica como o teu primeiro objetivo, no Perfil. Mudas quando quiseres.",
    goals: {
      strength: "Ganhar força",
      muscle: "Ganhar massa",
      fat: "Perder gordura",
      fit: "Manter a forma",
    },
    bodyTitle: "O teu corpo hoje",
    height: "Altura",
    weight: "Peso",
    readyTitle: "Tudo pronto",
    readyBody: "O treino de hoje está à tua espera. O que respondeste está no Perfil, e não te voltamos a perguntar.",
    start: "Começar",
  },

  team: {
    title: "Equipa",
    members: "Membros",
    sections: "Secção",
    table: "Tabela",
    wall: "Mural",
    trainers: "Treinadores",
    period: "Período",
    p7: "7 dias",
    p30: "30 dias",
    pAll: "Sempre",
    member: "Membro",
    volumeCol: "Volume",
    place: "lugar",
    ofVolume: "de volume",
    sessionsWord: "sessões",
    sessionWord: "sessão",
    you: "Tu",
    realKg: "Volume real em quilos, não pontos.",
    boardEmpty: "Ainda ninguém registou sessões. O ranking aparece com a primeira.",
    boardError: "O ranking precisa da migração 017 na base de dados.",
    writePlaceholder: "Escreve alguma coisa",
    newPost: "Nova publicação",
    attach: "Anexar a última sessão",
    attached: "Sessão anexada",
    publish: "Publicar",
    comments: "comentários",
    comment: "comentário",
    removePost: "Apagar publicação",
    wallEmptyTitle: "Ainda não há publicações",
    wallEmptyBody: "Sem publicações não se enchem os espaços com sugestões falsas. A primeira pode ser tua.",
    justNow: "agora",
    minAgo: "há {n} min",
    hAgo: "há {n} h",
    yesterday: "ontem",
    trainersEmpty: "Ainda não há treinadores. Acrescenta o teu e fica na lista de toda a gente.",
    addTrainer: "+ Treinador",
    trainerName: "Nome",
    specialty: "Especialidade",
    specialtyPlaceholder: "Força e hipertrofia",
    availability: "Dias em que pode",
    modes: "Onde",
    inPerson: "Presencial",
    online: "Online",
    freeDays: "Livre:",
    noSlots: "Sem disponibilidade registada.",
    noSlotsBtn: "Sem vagas",
    book: "Marcar sessão",
    bookWith: "Marcar com",
    day: "Dia",
    hour: "Hora",
    duration: "Duração",
    minutes: "min",
    confirm: "Marcar",
    myBookings: "As tuas marcações",
    cancelBooking: "Cancelar marcação",
    cancelNote: "O treinador não é avisado pela app: diz-lhe tu que cancelaste.",
    bookNote: "A app guarda a marcação; combinar com o treinador é contigo.",
    save: "Guardar",
    removeTrainer: "Tirar da lista",
  },

  today: {
    streakDays: 'dias',
    greeting: 'Olá',
    dayTitle: 'O treino de hoje',
    seeDay: 'Ver dia →',
    start: 'Começar treino',
    seeWeekAll: 'Ver a semana inteira',
    seeWeek: 'Ver a semana',
    trainAnyway: 'Treinar na mesma',
    progressTitle: 'O teu progresso',
    strength: 'Força',
    consistency: 'Consistência',
    weeklyVolume: 'Volume semanal',
    seeEvolution: 'Ver evolução →',
    weekPlan: 'Plano da semana',
    todayChip: 'hoje',
    rest: 'Descanso / Recuperação',
    noFigure: 'sem dados',
  },

  pending: {
    title: 'Ainda não construído',
    body: 'Este ecrã chega numa próxima fase. O treino da semana já está a funcionar.',
    action: 'Voltar ao treino',
  },

  /*
   * Os três ecrãs que um router entrega em branco: a página que não existe e o erro
   * de render. Estavam escritos dentro de `route-elements.tsx`, em português, e
   * diziam "voltar aos programas" — um ecrã que já não existe, porque o Programas
   * passou a ser o Treino. Traduzir obrigou a lê-los, e ler mostrou que estavam
   * desatualizados.
   */
  errors: {
    notFoundTitle: 'Página não encontrada',
    notFoundBody: 'O endereço não corresponde a nenhum ecrã da aplicação.',
    notFoundAction: 'Ir para o treino',
    crashTitle: 'Alguma coisa correu mal',
    crashBody: 'O ecrã não conseguiu abrir. Voltar ao treino costuma resolver.',
    crashAction: 'Voltar ao treino',
  },

  common: {
    back: 'Voltar',
    save: 'Guardar',
    saving: 'A guardar',
    saved: 'Guardado',
    cancel: 'Cancelar',
    add: 'Adicionar',
    create: 'Criar',
    edit: 'Editar',
    remove: 'Remover',
    close: 'Fechar',
    retry: 'Tentar outra vez',
    loading: 'A carregar',
    loadError: 'Não foi possível carregar. Tenta outra vez.',
    offlineNote: 'Sem ligação. As alterações ficam guardadas e sobem quando voltares a ter internet.',
    required: 'Este campo é obrigatório.',
    optional: 'opcional',

    /*
     * Duas palavras que estavam presas em código, e não aqui: o rótulo que o leitor
     * de ecrã ouve enquanto a sessão é lida (`SessionSplash`) e o rótulo por defeito
     * da fila do esforço (`EffortPicker`). Uma frase portuguesa escrita dentro de um
     * componente é uma frase que nenhuma tradução alcança.
     */
    opening: 'A abrir a aplicação',
    effort: 'Esforço',

    /*
     * A roda de valores, que estava inteira em português dentro da `ValuePill` — o
     * mesmo mal que os nomes dos dias tinham, uma coluna mais à direita. É a peça que
     * substitui o teclado em todo o registo, por isso estas cinco frases aparecem em
     * cada peso, cada rep e cada descanso da app.
     */
    confirm: 'Confirmar',
    pickHint: 'Roda até ao valor que fizeste.',
    pickHintPresets: 'Toca num valor sugerido, ou roda até ao que fizeste.',
    pickEmpty: 'por preencher',
    /* Junta-se ao nome do que se está a escolher: "Valores sugeridos para Peso". */
    pickSuggested: 'Valores sugeridos para',
    /** A nota por baixo do valor que o programa manda, nas sugestões da roda. */
    pickPrescribed: 'prescrito',
    pickFromHistory: 'sugerido',

    /*
     * O aviso de uma escrita recusada. O título muda conforme o que falhou — cada
     * `fail…` mais abaixo é uma frase inteira — e estas quatro linhas são as que não
     * mudam: o que se pode fazer, e como ver o que o servidor respondeu.
     *
     * "O resto do que fizeste ficou guardado" é literal e não consolo: cada escrita
     * sobe por si, por isso quando uma é recusada as outras já lá estão.
     */
    writeBody: 'O resto do que fizeste ficou guardado. Isto pode ser tentado outra vez.',
    writeRetry: 'Tentar outra vez',
    writeDismiss: 'Ignorar',
    writeDetails: 'Ver o que o servidor respondeu',
    writeDetailsHide: 'Esconder a resposta do servidor',
  },

  train: {
    suggestion: 'Sugestão',
    lastTimePre: 'Da última vez fizeste',
    lastTimeIn: 'nas',
    log: 'Registar',
    notStarted: 'Ainda não começaste',
    of: 'de',
    title: 'Treino',
    subtitle: 'O teu plano da semana.',
    blocksLabel: 'Fase do programa',
    exercises: 'exercícios',
    exercise: 'exercício',
    series: 'séries',
    serie: 'série',
    open: 'Abrir dia',
    restDay: 'Dia de descanso',
    restDayBody: 'Sem exercícios hoje. Recupera, dorme e come bem para a próxima fase.',

    /*
     * As quatro fases do programa, com os nomes que o dono do produto escolheu.
     *
     * Não são os do plano. O §8.3 de `.claude/plans/nova-idea-da-app.md` propõe
     * "Preparar, Construir, Intensificar, Recuperar"; foi implementado assim e foi
     * recusado. Ele tinha dito "iniciante, intermédio, avançado" e essa palavra é a
     * que manda: o plano é a fonte onde ele não falou, não por cima do que ele disse.
     * O quarto chip é uma semana do ciclo e não um nível, por isso não tinha nome no
     * vocabulário dele — foi-lhe perguntado, e "Recuperar" é a resposta dele.
     *
     * A ordem não tem folga: as duas listas estão ordenadas e a descarga é a última
     * semana. "Evoluir" não é uma fase, é o que vem depois do ciclo, e não tem chip.
     *
     * O que o bloco significa continua a ser o texto autorado em `BLOCKS[].s.pt`
     * ("Volume · Sem 1-4"), que é conteúdo portado e não se reescreve. Isto é só o
     * nome pelo qual a fase se apresenta a quem não sabe o que é um deload.
     */
    phase: {
      b1: 'Iniciante',
      b2: 'Intermédio',
      b3: 'Avançado',
      dl: 'Recuperar',
    },

    /*
     * O que cada fase é, por baixo dos chips (§8.1, §8.3 e §10.5).
     *
     * Quatro chips em fila são um filtro. Uma linha que diga o que a fase escolhida
     * treina é o que a torna um percurso e não uma coleção de blocos administrativos
     * (§10.5). A versão anterior narrava a posição — "segunda fase, depois de
     * Iniciante" —, que é só a ordem que os separadores já mostram: enchimento. Isto
     * di-lo com substância, com as palavras do dono do produto para cada nível.
     *
     * Cada fase tem um `title` curto e um `body`: o painel mostra os dois com o título
     * a entrar antes da descrição, e essa é a razão de o título existir. Os títulos
     * são condensações directas do `body`, não copy nova — "Fundamentos" sai de
     * "movimentos fundamentais", e por aí. O `dl` mantém o que a 001/002 lhe deram: a
     * descarga é a fase cujo nome não carrega a finalidade (§8.1), por isso o `body`
     * explica que a exigência baixa de propósito. "Pede-te menos" é o que o conteúdo
     * faz mesmo (`RANGES`: RPE 5-6 na descarga contra 7-9 nas outras); não diz "menos
     * séries" porque `dl` é `max(2, séries - 1)` e nos slots de duas séries fica igual.
     *
     * Nenhum `body` diz em que semana do ciclo a pessoa está: a app não sabe (não há
     * registo com data até à fase 005) e o §14 proíbe pôr no ecrã um número que
     * ninguém mediu. `phase-journey.test.ts` guarda estas invariantes — sem "Bloco"
     * nem "Deload", sem número de semana, e cada fase com título e descrição.
     */
    phaseInfo: {
      b1: {
        title: 'Fundamentos',
        body: 'Movimentos fundamentais e exercícios mais simples.',
      },
      b2: {
        title: 'Mais variedade',
        body: 'Mais experiência, maior variedade e exercícios um pouco mais complexos.',
      },
      b3: {
        title: 'Movimentos avançados',
        body: 'Para praticantes experientes, com movimentos avançados.',
      },
      dl: {
        title: 'Semana de descarga',
        body: 'Redução planeada da carga. Esta semana o programa pede-te menos, de propósito, para o corpo recuperar antes do próximo ciclo.',
      },
    },

    /* Para a estimativa de duração, que é sempre aproximada e diz que é. */
    about: 'cerca de',
    minutes: 'min',
    minutesLong: 'minutos',
    logsError: 'Não foi possível carregar o teu registo de cargas. O plano continua visível.',

    // Day view
    dayOf: 'Dia',
    dayNotFoundTitle: 'Dia não encontrado',
    dayNotFoundBody: 'Este dia de treino não existe.',
    sets: 'Séries',
    setLabel: 'Série',
    weight: 'Carga',
    weightPlaceholder: 'ex: 60',
    reps: 'Reps',
    repsPlaceholder: 'ex: 10',
    note: 'Nota',
    notePlaceholder: 'Como correu',
    target: 'Alvo',
    rpe: 'RPE',
    rest: 'Descanso',
    goal: 'Objetivo do dia',
    warmup: 'Aquecimento',
    muscles: 'Músculos',

    /*
     * O registo do treino falhou — a carga ficou guardada, o treino de hoje não.
     *
     * Duas escritas diferentes, por isso duas frases diferentes: a série marcada vai
     * para `exercise_logs` (o estado de hoje) e o treino vai para `sessions` (a
     * história). Dizer só "não foi possível guardar" juntava as duas e mentia sobre
     * metade, porque a série no ecrã ficou mesmo guardada.
     */
    failRecordSession: 'A série ficou marcada, mas o treino de hoje não entrou no teu histórico.',

    technique: 'Execução',
    commonErrors: 'Erros comuns',
    fix: 'Corrige',
    safety: 'Segurança',
    breathing: 'Respiração',
    details: 'Ver técnica',
    hideDetails: 'Esconder técnica',

    watchVideo: 'Ver demonstração',
    videoOf: 'Demonstração de',
    closeVideo: 'Fechar vídeo',

    startRest: 'Iniciar descanso',
    restRunning: 'Descanso a contar',
    skipRest: 'Saltar',
    addSeconds: 'Mais 15s',
    restDone: 'Descanso terminado',

    /*
     * Os três níveis, em palavras (regra dele, 2026-09-06).
     *
     *   Série     — feita / não feita
     *   Exercício — não iniciado / em curso / completo
     *   Treino    — em curso / concluído
     *
     * O ecrã dizia "Dia concluído" logo que a última série ficava marcada, e isso
     * juntava o segundo nível com o terceiro. Um exercício fica completo pelas
     * séries; um treino acaba quando a pessoa carrega em TERMINAR TREINO. Por isso
     * o `allDone` que aqui estava desapareceu: a frase não tinha como ser verdade.
     */
    exIdle: 'Não iniciado',
    exDoing: 'Em curso',
    exDone: 'Completo',

    exerciseOne: 'exercício',
    exerciseMany: 'exercícios',
    completeOne: 'completo',
    completeMany: 'completos',

    workoutOpen: 'Treino em curso',
    workoutDone: 'Treino concluído',
    /*
     * Um treino terminado cedo é honesto sobre o que ficou por fazer. "Concluído" diz
     * que a SESSÃO acabou (o botão), não que está a 100%. Sem estas linhas, "Treino
     * concluído" ao lado do visto lê-se como 19/19 mesmo num dia parado a 15/19 — regra
     * dele, 2026-09-06: não transformar 15/19 em 19/19 nem esconder as séries por fazer.
     */
    setsPendingOne: 'série não concluída',
    setsPendingMany: 'séries não concluídas',
    allSetsDone: 'Nenhuma série pendente',
    finish: 'Terminar treino',
    finishing: 'A terminar…',
    /* Um botão desligado tem de dizer o que falta, senão é um beco. */
    finishHint: 'Marca pelo menos uma série para poderes terminar o treino.',
    /*
     * Terminar é reversível por decisão explícita. Reabrir só limpa o fim — a sessão e
     * os números ficam no histórico —, o treino volta a ficar editável e o botão
     * TERMINAR reaparece (regra dele, 2026-09-06). Corrigir uma série não reabre; só
     * este botão reabre.
     */
    reopen: 'Reabrir treino',
    reopening: 'A reabrir…',
    failReopenSession: 'Não foi possível reabrir o treino.',

    progressLabel: 'Progresso do dia',

    /*
     * A prontidão de hoje (fase 007), lida do registo e nunca inventada.
     *
     * A palavra que a app escolhe não pode fazer crer que mede o que não mede: não há sono,
     * nem HRV, nem peso corporal aqui. Por isso "Recuperação: Boa" é uma leitura do intervalo
     * entre treinos, e a frase final di-lo em voz alta — uma leitura do registo, não uma
     * medição médica. O número (0–100) tem sempre a explicação à vista, sem ser preciso tocar
     * em nada (§10.2): sem essa explicação seria o "dashboard administrativo" que o §0 recusa.
     *
     * O "Por quê?" monta-se no componente a partir destes pedaços, com os números reais da
     * pessoa. A carga é a da última sessão — o esforço de que o corpo recupera —, mostrada
     * como facto; não vira percentagem, porque sem um peso de referência dela dizer "muito" ou
     * "pouco" seria inventar (§14).
     */
    readiness: {
      title: 'Prontidão de hoje',
      label: 'Prontidão',
      outOf: '/ 100',
      recoveryLabel: 'Recuperação',
      loadLabel: 'Carga',
      lastSession: 'última sessão',
      recovery: {
        'treino-hoje': 'Treino hoje',
        recente: 'Recente',
        boa: 'Boa',
        completa: 'Completa',
        'pausa-longa': 'Pausa longa',
      },
      whyLabel: 'Por quê?',
      trainedToday: 'Treinaste hoje.',
      trainedYesterday: 'Treinaste ontem.',
      /* "Treinaste há N dias." — o número entra no meio, no componente. */
      trainedAgoPre: 'Treinaste há',
      trainedAgoPost: 'dias.',
      window: 'O intervalo de 2 a 3 dias é o de melhor recuperação.',
      dense: 'Muitas sessões seguidas — a prontidão baixa para dar margem à recuperação.',
      /* "N sessão/sessões nos últimos 7 dias." */
      sessionsWeekOne: 'sessão nos últimos 7 dias.',
      sessionsWeekMany: 'sessões nos últimos 7 dias.',
      lastLoadPre: 'Última sessão:',
      kg: 'kg',
      noLoad: 'sem carga registada',
      disclaimer: 'Uma leitura do teu registo, não uma medição médica.',
      /* Conta sem histórico: nada de número, nada de anel — diz-se o que falta. */
      emptyTitle: 'Ainda sem prontidão',
      emptyBody:
        'Regista uma sessão de treino e a app passa a ler a tua prontidão a partir dela. Sem treinos com data, não há nada para ler — e não inventamos um número.',
    },

    /*
     * O objetivo de hoje com contexto (fase 008): o quê, porquê e quanto custa.
     *
     * O objetivo do dia deixa de ser uma frase parada e passa a ser uma recomendação — mas só
     * quando há uma razão que se possa mostrar. A postura (`stance`) sai da prontidão (fase 007) e
     * da forma do dia; a razão é montada no componente a partir dos mesmos pedaços do "Por quê?" da
     * prontidão, com os números reais da pessoa. Sem prontidão (conta sem histórico) não há
     * moldura: mostra-se o objetivo autorado cru, e nunca um motivo inventado (§4).
     *
     * O custo — "~45 min · Volume" — deriva do plano do dia: os minutos de `blockSummary` (fase
     * 001) e o foco do bloco (autorado). Os exemplos do plano ("45 min", "7/10") não entram como
     * valores (§4.3, §14); o "~" diz que é uma estimativa, não uma medição. O dia de descanso
     * também tem objetivo: descansar, lido como decisão do plano e não como ausência de conteúdo.
     */
    recommend: {
      title: 'Objetivo de hoje',
      stanceTrain: 'Bom dia para treinar',
      stanceModerate: 'Treina com margem para recuperar',
      stanceRest: 'Dia de descanso',
      restWhy: 'O teu plano marca hoje como descanso.',
      restBody: 'Descansar faz parte do plano: recupera, dorme e come bem para a próxima sessão.',
      whyLabel: 'Por quê?',
      /* "~45 min": o til diz que é estimativa, e os minutos saem de `blockSummary`. */
      minutes: 'min',
      /* "A prontidão está em 74." — o número entra no meio, no componente. */
      scorePre: 'A prontidão está em',
      /*
       * Conta sem histórico: o objetivo autorado do dia, cru, e uma linha que diz porque é que
       * não há razão nenhuma por baixo dele. Não repete o convite da prontidão vazia, que está
       * no cartão logo acima — diz só o que falta para haver moldura.
       */
      noReason: 'Sem treinos com data ainda não há razão para mostrar — e não inventamos uma.',
    },
  },

  /**
   * O ecrã Executar — a sessão conduzida.
   *
   * Poucas palavras de propósito. A gravação dele tem SEIS coisas por cima do vídeo e
   * mais nenhuma (proto/v2/video/TRANSCRICAO.md), e quase todas são números que vêm da
   * prescrição, não texto. O que aqui está é só o que é mesmo palavra: os dois rótulos
   * por baixo dos números, o botão do estado preparar, os nomes dos dois ícones do
   * topo, e o "de" que junta "Série 1 __ 4".
   *
   * `train.setLabel`, `train.exercise` e `train.exercises` continuam a ser os mesmos e
   * não se duplicam aqui: "Série 1 de 4" compõe-se no ecrã.
   */
  run: {
    start: 'COMEÇAR TREINO',
    of: 'de',
    reps: 'reps',
    weight: 'peso',
    // A contagem 3 · 2 · 1 que substituiu "Somar tempo para preparar" (tarefa 5).
    countdown: 'Contagem para começar a série',
    countSkip: 'Toca no ecrã para começar já.',
    // Os cabeçalhos da grelha das séries: curtos, para caberem a 360 px (tarefa 5).
    colLog: 'Registar',
    colRest: 'Descanso',
    colEffort: 'Esforço',
    colReps: 'Reps',
    colWeight: 'Peso',
    music: 'Música',
    sessionSettings: 'Definições da sessão',
    leaveHint: 'Carrega em Esc para terminar o treino.',
    // "Terminar treino?" — o ✕ e o Esc (bug B4). Aberto, a sessão fica em pausa.
    quit: 'Terminar treino',
    quitTitle: 'Terminar treino?',
    quitBody: 'O que já marcaste fica guardado. O que falta fica por fazer no resumo.',
    quitContinue: 'Continuar a treinar',
    quitFinish: 'Terminar e guardar',
    queueDone: 'Já feitos',

    /*
     * A folha das séries. O cartão do nome é a pega que a abre, e lá dentro está a
     * tabela de cinco colunas: a primeira é esta, e as outras quatro já tinham nome em
     * `train` — Descanso, Esforço, Reps e Carga — porque são as mesmas quatro coisas
     * que o dia diz.
     */
    openSets: 'Abrir as séries deste exercício',
    logCol: 'Registar',
    setDone: 'feita',
    setPending: 'por fazer',
    prescribedLoad: 'Carga prescrita',
    sessionVolume: 'Volume da sessão',

    /* O visto da primeira coluna, para o leitor de ecrã. O número da série vem a seguir. */
    markSet: 'Marcar como feita a série',

    /* Tarefa 7: as peças do protótipo e da Ladder que faltavam na app. */
    notes: 'Notas',
    history: 'Histórico',
    skip: 'Saltar',
    skipExercise: 'Saltar',
    noNote: 'Este exercício não tem nota do programa.',
    noHistory: 'Ainda sem histórico deste exercício.',
    perHand: 'por mão',
    equipment: 'Equipamento',
    equipmentHint: 'Trocar de equipamento não reescreve a prescrição.',
    equipBarbell: 'Barra',
    equipDumbbells: 'Halteres',
    equipMachine: 'Máquina',
    equipCable: 'Cabo',
    equipBodyweight: 'Peso corporal',
    demoSkip: 'Saltar a demonstração e ir às séries',
    replayDemo: 'Ver demonstração',
    noDemo: 'Ainda sem demonstração em vídeo para esta variante.',
    coach: 'Treinadora da sessão',
    pickWeight: 'Escolher o peso desta série',
    goTo: 'Passar para',
    sheetOf: 'Séries de',
    historySets: 'séries',
  },

  /**
   * O catálogo partilhado.
   *
   * Uma lista do que as contas publicaram. Não é uma loja nem um feed: é o sítio
   * onde se vê o que existe para todos e se corrige ou tira o que não presta.
   */
  catalog: {
    title: 'Catálogo',
    subtitle: 'O que as contas publicaram, visível a toda a gente.',

    emptyTitle: 'Ainda não há nada no catálogo',
    emptyBody: 'Num dia, cria um exercício e escolhe "Também no catálogo". Aparece aqui, pronto a pôr noutro dia.',

    loadError: 'Não foi possível carregar o catálogo. Tenta outra vez.',

    /* Uma frase por escrita, como no dia. Ver `days.failCreate`. */
    failSave: 'As alterações a este exercício não ficaram guardadas.',
    failRemove: 'O exercício não foi apagado do catálogo.',
    failAddition: 'O exercício foi apagado, mas continua acrescentado a um dia.',
    failPlace: 'O exercício não foi posto no dia.',
    failUnplace: 'O exercício não saiu do dia.',

    onDay: 'No dia',
    onDays: 'Nos dias',
    onNoDay: 'Ainda em nenhum dia',
    dayGone: 'um dia apagado',
    countOne: 'exercício publicado',
    countMany: 'exercícios publicados',

    /*
     * Pôr num dia.
     *
     * Sem isto, publicar não tinha continuação: o exercício chegava ao catálogo e
     * ficava ali, sem forma de entrar num treino. É esta acção que fecha o percurso.
     *
     * A confirmação é a mesma em todos os dias, e isso mudou com o 009. Antes só
     * aparecia nos sete do plano, porque só esses eram comuns às contas; agora a
     * semana inteira é comum, por isso pôr um exercício em qualquer dia mexe no
     * treino da outra pessoa e o aviso não pode depender de qual é o dia.
     */
    addToDay: 'Pôr num dia',
    addToDayTitle: 'Em que dia?',
    addToDayHint: 'O exercício já é de toda a gente. O que escolhes aqui é em que dia ele entra.',
    addToDayEvery: 'Entra no dia de todas as contas',
    addToDayConfirm:
      'Pôr este exercício neste dia? A semana é a mesma para todas as contas, por isso o cartão aparece a toda a gente. Podes tirá-lo depois.',
    addToDayAlready: 'Já está neste dia',
    addToDayNone: 'Ainda não há dias onde o pôr.',
  },

  /**
   * Dias acrescentados à semana, fora dos sete do plano.
   *
   * A copy dizia "teu" em todo o lado e deixou de ser verdade no 009: a semana é uma
   * só, e um dia acrescentado entra na semana de todas as contas como os sete do
   * plano. O que muda entre uns e outros não é de quem são — é que os sete vêm
   * escritos no plano e não se apagam, e este apaga-se.
   */
  days: {
    create: 'Criar dia',
    newTitle: 'Dia novo',
    newHint: 'Entra na semana a seguir aos sete do plano, em todas as contas.',
    editTitle: 'Editar dia',
    edit: 'Editar este dia',

    name: 'Nome do dia',
    namePlaceholder: 'ex: Braço e ombro',
    type: 'Tipo de dia',
    typeStrength: 'Treino',
    typeRest: 'Descanso',
    typeHint: 'Um dia de descanso abre na mesma e aceita exercícios, se mudares de ideias.',
    goal: 'Objetivo do dia',
    goalPlaceholder: 'O que este dia trabalha',
    warm: 'Aquecimento',
    warmPlaceholder: 'Como começas',

    errName: 'Escreve o nome do dia.',

    own: 'Acrescentado',
    untitled: 'Dia sem nome',

    remove: 'Apagar dia',
    removeConfirm:
      'Apagar este dia e os exercícios que lhe foram acrescentados? Sai da semana de todas as contas. Os exercícios que também estão no catálogo continuam lá, e as cargas já registadas ficam guardadas.',

    /*
     * Uma frase por escrita, e não uma para todas.
     *
     * A que existia — "Não foi possível guardar este dia" — apareceu debaixo de um dia
     * que tinha acabado de ser apagado com sucesso, porque era um OU de seis mutações
     * e não sabia qual delas tinha sido recusada. Apagar um dia toca em cinco tabelas:
     * quatro delas podem falhar sozinhas, e cada uma deixa a semana num estado
     * diferente. Dizer qual é a diferença entre "tenta outra vez" e "o que é que isto
     * me fez?".
     */
    failCreate: 'O dia novo não ficou guardado.',
    failSave: 'As alterações a este dia não ficaram guardadas.',
    failDelete: 'O dia não foi apagado e continua na semana.',
    failExercises: 'O dia foi apagado, mas um exercício próprio continua agarrado a ele.',
    failHidden: 'O dia foi apagado, mas uma marca de exercício escondido continua nele.',
    failOrder: 'O dia foi apagado, mas a ordem que lhe tinhas dado continua guardada.',
    failAddition:
      'O dia saiu da semana, mas um exercício do catálogo continua acrescentado a ele.',

    /*
     * Reordenar os dias da semana. As setas saíram, como nos exercícios: a ordem muda
     * com press-and-hold e arrasto directo no cartão do dia. O dia da semana é a
     * ranhura e o treino é o conteúdo, por isso arrastar um dia troca o que a Segunda
     * treina, não o nome do dia.
     */
    reorder: 'Reordenar dia',
    reorderHint:
      'Mantém premido um dia e arrasta para mudar a semana. Com o teclado, foca a pega e usa as setas para cima e para baixo.',
    position: 'posição',
    positionOf: 'de',

    /*
     * As duas ordens da semana. A partilhada é de toda a gente, como o resto do plano;
     * a tua é só tua e não mexe na semana das outras contas. Sem ordem própria, vê-se a
     * partilhada. "Repor" tira a tua e deixa a partilhada aparecer outra vez — o caminho
     * de volta, sem o qual a partilhada ficava invisível para sempre a quem arrastou.
     */
    orderLabel: 'Ordem da semana',
    orderShared: 'Partilhada',
    orderOwn: 'A minha',
    orderReset: 'Repor a partilhada',
    /*
     * A volta à ordem original do plano, a partir da semana partilhada. "Repor a
     * partilhada" tira só a tua e deixa aparecer a de todos; esta apaga a de todos e
     * deixa aparecer a que o programa traz de raiz — o estado inicial. Escreve a semana
     * de toda a gente, por isso pergunta antes.
     */
    orderResetDefault: 'Repor por defeito',
    orderResetDefaultConfirm: 'Repor a ordem original da semana, para todas as contas?',
    orderOwnActive: 'Estás a ver a tua ordem. A semana das outras contas não muda.',
    orderSharedActive: 'Esta é a ordem de toda a gente. Arrastar muda-a em todas as contas.',
    failWeekOrder: 'A nova ordem da semana não ficou guardada.',
  },

  /**
   * Compor o dia: acrescentar, alterar, esconder e reordenar.
   *
   * Voz de treinador, segunda pessoa, sem hedging, como o resto do produto. As dicas
   * dizem o que acontece a seguir, não o que o campo é: quem está a ler isto tem o
   * telemóvel numa mão e está a contar o descanso na cabeça.
   */
  editor: {
    add: 'Adicionar exercício',
    newTitle: 'Exercício novo',
    newHint: 'Fica neste dia, para todas as contas. Podes mudar tudo mais tarde.',
    editOwnTitle: 'Editar exercício',
    editBuiltTitle: 'Editar prescrição',
    editBuiltHint:
      'Muda o que este exercício pede, para todas as contas. O plano original fica intacto e repões quando quiseres.',

    name: 'Nome',
    namePlaceholder: 'ex: Remada baixa na máquina',
    equipment: 'Equipamento',
    equipmentPlaceholder: 'ex: Máquina de remada',

    kind: 'Tipo de movimento',
    kindComp: 'Composto',
    kindAcc: 'Acessório',
    kindIso: 'Isolamento',
    kindCore: 'Core',
    kindHint: 'Decide como as séries e as reps mudam de Iniciante a Recuperar.',

    sets: 'Séries',
    setsPlaceholder: 'ex: 3',
    reps: 'Reps',
    repsPlaceholder: 'ex: 10-12',
    load: 'Carga',
    loadPlaceholder: 'ex: 20 kg/mão',
    rest: 'Descanso',
    restPlaceholder: 'ex: 90 s',

    videoNone: 'Sem demonstração ainda.',

    photo: 'Foto',
    photoAdd: 'Escolher foto',
    photoChange: 'Trocar foto',
    photoRemove: 'Remover foto',
    photoHint: 'Opcional. Sem foto o cartão fica neutro, e nunca vai buscar a foto de outro exercício.',
    photoSending: 'A enviar a foto',
    photoOffline: 'Sem ligação. Guarda agora e acrescenta a foto quando voltares a ter internet.',
    photoFailed: 'A foto não subiu. Tenta outra vez, ou guarda sem ela.',
    photoBadFile: 'Não consegui ler esse ficheiro como imagem.',

    /*
     * O mesmo princípio das frases do dia: uma por escrita. Compor um dia são oito
     * escritas em cinco tabelas, e "não foi possível guardar esta alteração" não
     * distingue um exercício que não foi criado de uma ordem que não ficou guardada —
     * e uma delas dá para ignorar, a outra não.
     */
    failSave: 'Este exercício não ficou guardado.',
    failDelete: 'O exercício não foi apagado e continua no dia.',
    failOverride: 'A alteração à prescrição não ficou guardada.',
    failRestore: 'A prescrição original não foi reposta.',
    failHide: 'O exercício não saiu do dia.',
    failUnhide: 'Os exercícios escondidos não voltaram ao dia.',
    failOrder: 'A nova ordem não ficou guardada.',
    failPublish: 'A publicação no catálogo não passou, e nada foi publicado.',

    errName: 'Escreve o nome do exercício.',

    preview: 'Como fica nas quatro fases',

    create: 'Criar exercício',
    remove: 'Apagar exercício',
    removeConfirm:
      'Apagar este exercício? Sai do dia em todas as contas. Os registos de carga ficam guardados.',
    restoreOriginal: 'Repor o original',
    restoreOriginalConfirm: 'Repor a prescrição original deste exercício, para todas as contas?',

    hide: 'Tirar do dia',
    hiddenOne: 'exercício fora do dia',
    hiddenMany: 'exercícios fora do dia',
    restore: 'Repor',

    /*
     * Reordenar exercícios. As setas saíram (o requisito de interação proíbe-as): a
     * ordem muda com press-and-hold e arrasto directo no cartão. Estas palavras servem
     * a pega discreta que o cartão ganhou — o mesmo controlo que o teclado usa, com as
     * setas, para quem não consegue arrastar. Não são dois botões de seta a mais.
     */
    reorder: 'Reordenar',
    reorderHint:
      'Mantém premido e arrasta para mudar a ordem. Com o teclado, foca aqui e usa as setas para cima e para baixo.',
    position: 'posição',
    positionOf: 'de',
    /*
     * A volta à ordem original dos exercícios do dia. A ordem é partilhada, como o
     * resto do plano, por isso repor apaga a de todos e deixa aparecer a que o programa
     * traz de raiz. Escreve o dia de toda a gente — pergunta antes.
     */
    resetOrderDefault: 'Repor por defeito',
    resetOrderDefaultConfirm: 'Repor a ordem original dos exercícios deste dia, para todas as contas?',

    /*
     * Onde o exercício fica. Duas opções, e a pergunta que fazem mudou no 009.
     *
     * Era "quem vê isto": um exercício privado ficava no dia de quem o criou e a
     * publicação era a única forma de chegar à outra conta. Com a semana partilhada
     * já não há nada só de um, por isso perguntar quem vê seria oferecer uma escolha
     * que não existe. O que sobra é uma escolha real: fica só neste dia, ou fica
     * também no Catálogo, de onde qualquer pessoa o põe noutro dia sem o escrever
     * outra vez.
     */
    visibility: 'Onde este exercício fica',
    visPrivate: 'Só neste dia',
    visShared: 'Também no catálogo',
    visHintPrivate: 'Fica neste dia, e toda a gente o vê aqui.',
    visHintShared:
      'Fica neste dia e entra no Catálogo, para qualquer pessoa o pôr noutro dia. Qualquer pessoa o pode mudar ou apagar.',
    publishConfirm:
      'Pôr este exercício no Catálogo? Passa a poder ser usado noutros dias, e qualquer pessoa o pode mudar ou apagar. Os registos de carga ficam.',

    sharedTitle: 'Editar para todos',
    sharedHint: 'Este exercício está no Catálogo. O que mudares aqui muda em todos os dias onde está.',
    removeShared: 'Apagar para todos',
    removeSharedConfirm:
      'Apagar este exercício do Catálogo? Sai de todos os dias onde está, em todas as contas. Os registos de carga que cada um fez ficam guardados.',
    hideShared: 'Tirar deste dia',
    hideSharedHint: 'Sai deste dia para todas as contas. Continua no Catálogo, para voltar a pôr.',

    badgeChanged: 'Alterado',
    badgeOwn: 'Deste dia',
    badgeShared: 'Do catálogo',

    emptyTitle: 'Este dia ainda não tem exercícios',
    emptyBody: 'Acrescenta o primeiro, ou põe um do catálogo. Enquanto estiver vazio, não conta para a semana.',
  },
} as const;

/**
 * The contract the other three dictionaries have to meet.
 *
 * `typeof pt` under `as const` is made of LITERAL types: `tabSignIn` is not `string`,
 * it is `'Entrar'`. No `en.ts` could ever satisfy that, because `'Sign in'` is not
 * `'Entrar'`. `Widen` replaces every literal with `string` and leaves the SHAPE
 * untouched.
 *
 * That shape is the whole point. It is the only thing standing between four
 * dictionaries and silent drift: with `satisfies Copy`, a missing key fails the
 * build, and so does a key that exists in one language and nowhere else. Nobody has
 * to remember to check.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Copy = Widen<typeof pt>;
