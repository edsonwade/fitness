import { useEffect, useState } from 'react';

/**
 * O chão fotográfico do escuro (B8 de `.claude/skills/folha-series-e-seletor/PLANO.md`).
 *
 * O vidro dos cartões, das folhas e das barras (`backdrop-filter`) só se vê quando há
 * alguma coisa por trás. Com um gradiente liso por trás, o desfoque devolve o mesmo
 * gradiente liso, e tudo se lia como preto. A folha das séries parecia bem porque
 * tinha o vídeo por trás. Esta camada dá a todos os ecrãs essa fotografia: desfocada,
 * escurecida, e com o tom ardósia→malva por cima.
 *
 * Vive DENTRO do painel do telefone, com `z-index: -1`. O painel tem de ter `isolate`
 * para a camada não descer abaixo do fundo dele. O interior é `sticky` com a altura do
 * ecrã, e por isso a foto fica parada quando a página rola. Trocar de foto faz um
 * crossfade: a anterior fica por baixo até a nova carregar. No claro, o CSS esconde a
 * camada.
 */
export function AppBackdrop({ src }: { src: string }) {
  const [shown, setShown] = useState(src);
  const [prev, setPrev] = useState<string | null>(null);

  useEffect(() => {
    if (src === shown) return;
    const img = new Image();
    img.src = src;
    let live = true;
    const swap = () => {
      if (!live) return;
      setPrev(shown);
      setShown(src);
    };
    if (img.complete) swap();
    else img.onload = img.onerror = swap;
    return () => {
      live = false;
    };
  }, [src, shown]);

  return (
    <div className="app-backdrop" aria-hidden="true">
      <div className="app-backdrop-stick">
        {prev ? <img key={prev} src={prev} alt="" /> : null}
        <img key={shown} src={shown} alt="" className="is-in" onAnimationEnd={() => setPrev(null)} />
        <div className="app-backdrop-veil" />
      </div>
    </div>
  );
}
