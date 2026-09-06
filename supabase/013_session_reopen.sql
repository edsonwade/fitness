-- =========================================================================
-- 013_session_reopen.sql — o fim do treino passa a poder ser desfeito
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- doze anteriores: podes correr outra vez sem estragar nada.
--
-- Corre DEPOIS do 012. Depende da coluna `finished_at` que o 012 criou.
--
-- Aditivo. Uma função nova, mais nada. Não cria coluna, não escreve uma linha
-- de dados, não apaga nada, não muda nenhuma coluna que já existe e não mexe
-- nas políticas do 003.
--
-- SEM PRÉ-VOO, E ESTA É A RAZÃO:
--   Não há restrição nova — nem CHECK, nem unique, nem not-null, nem sequer
--   uma coluna. Uma função que faz um UPDATE não tem dados para validar antes
--   de nascer. Inventar uma query de pré-voo aqui era teatro.
--
-- PORQUÊ ESTE FICHEIRO (palavras dele, 2026-09-06):
--   O 012 fez o fim do treino PERMANENTE — "uma vez concluído, fica concluído".
--   No teste, isso virou uma prisão: um treino terminado sem querer não tinha
--   saída, o botão TERMINAR desaparecia para sempre nesse dia, e o reload
--   trazia sempre o "concluído" de volta (vinha da base de dados, não do ecrã).
--
--   O padrão que ele quer:
--
--     TREINO CONCLUÍDO → abrir sessão → REABRIR / EDITAR
--     → volta ao contexto editável → TERMINAR / GUARDAR
--     → a sessão continua no histórico
--
--   Ou seja: terminar passa a ser REVERSÍVEL, mas só por uma AÇÃO EXPLÍCITA.
--   Corrigir uma série a seguir continua a NÃO reabrir (o 012 §2 `coalesce`
--   fica exactamente como está). Só esta função reabre, e só quando o botão
--   "Reabrir treino" a chama.
--
-- O QUE REABRIR NÃO FAZ:
--   Não apaga a sessão nem as suas entradas. O registo — a data, os números,
--   cada exercício com os seus sets_done/sets_total — FICA no histórico. Só o
--   `finished_at` volta a NULL, o que quer dizer "treino em curso" outra vez.
--   O dia fica editável e pode ser terminado de novo.
--
-- Rollback:
--   drop function if exists public.reopen_session(smallint, date, text);
-- =========================================================================


-- ---- 1. a função --------------------------------------------------------
-- Limpa o fim da sessão deste dia, nesta data, deste utilizador. A identidade
-- é o mesmo par (day_no, local_date) em que o 011 §3 assenta o índice único e
-- o 012 assenta o `on conflict` — reabrir acerta na mesma linha, não procura.
--
-- `security invoker`, como o record_session e o merge_exercise_log: o RLS do
-- 003 §11 (user_id = auth.uid(), for all) continua a ser a autoridade. O filtro
-- por user_id aqui é cinto e suspensórios, não a segurança — a segurança é o
-- RLS, que já não deixaria tocar numa linha de outra conta.
--
-- Sem linha para reabrir NÃO é erro: a sessão pode já ter sido reaberta noutro
-- dispositivo, ou ainda não existir. Devolve o que houver (nada), e o cliente
-- relê. Levantar excepção aqui punia uma corrida normal entre dois ecrãs.
create or replace function public.reopen_session(
  p_day_no       smallint,
  p_local_date   date,
  p_client       text
) returns public.sessions
language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_ses public.sessions;
begin
  if v_uid is null then
    raise exception 'reopen_session: sem sessão';
  end if;
  if p_day_no is null or p_local_date is null then
    -- Os dois juntos são a identidade da sessão. Sem um deles o UPDATE não
    -- sabe que linha reabrir. Recusar aqui diz porquê.
    raise exception 'reopen_session: day_no e local_date são a identidade da sessão';
  end if;

  update public.sessions
     set finished_at       = null,
         updated_by_client = p_client
   where user_id    = v_uid
     and day_no     = p_day_no
     and local_date = p_local_date
   returning * into v_ses;

  return v_ses;
end $$;


-- ---- 2. quem a pode chamar ----------------------------------------------
-- Mesma forma do 003 §15, do 007 §2 e do 011 §5: fechada a `public`, aberta a
-- quem tem sessão. Sendo `security invoker`, o RLS manda como manda num update
-- normal — isto decide só quem pode bater à porta.
revoke all on function public.reopen_session(smallint, date, text) from public;

grant execute on function public.reopen_session(smallint, date, text) to authenticated;
