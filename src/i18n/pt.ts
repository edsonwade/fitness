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

    errNoAccount: 'Email ou palavra-passe errados.',
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

  nav: {
    train: 'Treino',
    catalog: 'Catálogo',
    goals: 'Objetivos',
    trainers: 'Treinadores',
    profile: 'Perfil',
  },

  pending: {
    title: 'Ainda não construído',
    body: 'Este ecrã chega numa próxima fase. O treino da semana já está a funcionar.',
    action: 'Voltar ao treino',
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
  },

  train: {
    title: 'Treino',
    subtitle: 'O teu plano da semana.',
    blocksLabel: 'Bloco de periodização',
    exercises: 'exercícios',
    exercise: 'exercício',
    series: 'séries',
    serie: 'série',
    open: 'Abrir dia',
    restDay: 'Dia de descanso',
    restDayBody: 'Sem exercícios hoje. Recupera, dorme e come bem para o próximo bloco.',
    logsError: 'Não foi possível carregar o teu registo de cargas. O plano continua visível.',

    // Day view
    dayOf: 'Dia',
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

    allDone: 'Dia concluído',
    progressLabel: 'Progresso do dia',
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

    onDay: 'No dia',
    onDays: 'Nos dias',
    onNoDay: 'Ainda em nenhum dia',
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
      'Apagar este dia e os exercícios que lhe foram acrescentados? Sai da semana de todas as contas. As cargas já registadas ficam guardadas.',
    saveFailed: 'Não foi possível guardar este dia. Verifica a ligação e tenta outra vez.',
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
    kindHint: 'Decide como as séries e as reps mudam do bloco 1 ao deload.',

    sets: 'Séries',
    setsPlaceholder: 'ex: 3',
    reps: 'Reps',
    repsPlaceholder: 'ex: 10-12',
    load: 'Carga',
    loadPlaceholder: 'ex: 20 kg/mão',
    rest: 'Descanso',
    restPlaceholder: 'ex: 90 s',

    video: 'Vídeo de demonstração',
    videoPlaceholder: 'Cola o link do YouTube',
    videoHint: 'Opcional. O vídeo joga dentro do cartão, sem te mandar para outro sítio.',
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

    saveFailed: 'Não foi possível guardar esta alteração. Verifica a ligação e tenta outra vez.',

    errName: 'Escreve o nome do exercício.',
    errVideo: 'Esse link não é um vídeo do YouTube.',

    preview: 'Como fica nos quatro blocos',

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

    moveUp: 'Subir na ordem',
    moveDown: 'Descer na ordem',

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
    emptyBody: 'Acrescenta o primeiro e ele fica aqui, com as séries, o vídeo e o registo de carga.',
  },
} as const;

export type Copy = typeof pt;
