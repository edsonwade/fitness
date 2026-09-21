/**
 * A NOTA SEM TECLAR.
 *
 * Portado de `.quicktags` em `proto/v2/system.css`. Quatro etiquetas — Fácil,
 * Pesado, Dor, Falhei — que dizem, num toque, o que uma nota escrita diria em três
 * linhas que ninguém escreve a meio de uma série.
 *
 * **Alternam soltas, não são um grupo exclusivo.** Uma série pode ter sido pesada
 * *e* ter doído; obrigar a escolher uma perderia metade do que aconteceu. Por isso
 * `aria-pressed` em cada uma, e não `aria-checked` com um grupo por cima.
 *
 * Isto não fecha a porta ao teclado: a nota escrita continua a existir para o que
 * estas quatro não dizem. O que sai é a obrigação de teclar para dizer o comum.
 */

export type QuickTag = { id: string; label: string };

export function QuickTags({
  tags,
  selected,
  onToggle,
  label,
}: {
  tags: QuickTag[];
  /** Os `id` escolhidos. Várias ao mesmo tempo é o caso normal, não a exceção. */
  selected: readonly string[];
  onToggle: (id: string) => void;
  label: string;
}) {
  return (
    <div className="quicktags" role="group" aria-label={label}>
      {tags.map((t) => (
        <button
          key={t.id}
          type="button"
          className="quicktag"
          aria-pressed={selected.includes(t.id)}
          onClick={() => onToggle(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
