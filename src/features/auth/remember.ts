/**
 * "Lembrar-me" do Entrar (`proto/v2/01-entrada.html` frame 2, B1 da skill
 * lingua-na-entrada-e-definicoes).
 *
 * Ligado, que é o normal, a sessão fica como sempre ficou. Desligado, a sessão só vive
 * enquanto a aba vive: a marca em sessionStorage morre com ela, e no arranque seguinte
 * `useSession` vê que não há marca e sai. Um redirect de OAuth fica na mesma aba, por
 * isso a marca sobrevive-lhe.
 */
const KEY = 'vw.remember.v1';
const ALIVE = 'vw.session.alive';

export function rememberChoice(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
    sessionStorage.setItem(ALIVE, '1');
  } catch {
    // Sem storage não há como esquecer; fica lembrado, que é o normal.
  }
}

export function remembered(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

/** True quando ele pediu para não ser lembrado e esta aba é nova. */
export function shouldForget(): boolean {
  try {
    return localStorage.getItem(KEY) === '0' && !sessionStorage.getItem(ALIVE);
  } catch {
    return false;
  }
}
