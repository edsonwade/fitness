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
  },

  /**
   * O ecrã HOJE, tal como o porte o deixa: a prontidão, que já existe desde a fase
   * 007 e que no §11 pertence a este ecrã, e o que ainda não está construído dito
   * pelo nome em vez de escondido. As fases 008 a 019 enchem-no.
   */
  today: {
    greeting: 'Olá',
    pendingTitle: 'O resto do teu dia chega a seguir',
    pendingBody:
      'O objetivo de hoje, o coach e o plano da semana entram nas próximas fases. A prontidão acima já lê o teu registo.',
    toTrain: 'Ver o treino',
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
      minutes: 'min',
    },
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
    errVideo: 'Esse link não é um vídeo do YouTube.',

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
    emptyBody: 'Acrescenta o primeiro e ele fica aqui, com as séries, o vídeo e o registo de carga.',
  },
} as const;

export type Copy = typeof pt;
