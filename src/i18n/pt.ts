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
} as const;

export type Copy = typeof pt;
