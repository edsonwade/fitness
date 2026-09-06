-- =========================================================================
-- 012_session_finish.sql — o treino passa a ter FIM, e o fim é uma decisão
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- onze anteriores: podes correr outra vez sem estragar nada.
--
-- Corre DEPOIS do 011. Este ficheiro recria a função que o 011 criou.
--
-- Aditivo. Uma coluna nova, ANULÁVEL, e a função do 011 com um parâmetro a
-- mais. Não escreve uma linha de dados, não apaga nada, não muda nenhuma
-- coluna que já existe e não mexe nas políticas do 003.
--
-- SEM PRÉ-VOO, E ESTA É A RAZÃO:
--   O 011 trazia um índice ÚNICO, e um índice único sobre dados que já lá
--   estão pode rebentar a meio — por isso levava verificação. Aqui não há
--   nenhuma restrição nova: nem CHECK, nem unique, nem not-null. Uma coluna
--   anulável acrescentada a uma tabela aceita todas as linhas que lá estão,
--   sejam elas quais forem. Não há nada para verificar, e inventar uma query
--   de pré-voo era teatro.
--
-- PORQUÊ ESTE FICHEIRO (palavras dele, 2026-09-06):
--   > "Não uses 'todas as séries completas' como definição de treino
--   >  concluído."
--
--   O ecrã dizia "Dia concluído" logo que a última série do dia ficava
--   marcada. Isso confunde dois níveis diferentes:
--
--     Série    — feita / não feita
--     Exercício — não iniciado / em curso / completo   (vem das séries)
--     Treino   — em curso / concluído                  (vem de TERMINAR)
--
--   O exercício fica completo pelas séries. O TREINO não: acaba quando a
--   pessoa diz que acabou, como na Strong e na Hevy, que deixam terminar com
--   exercícios ainda por fazer. Um treino não é a soma das suas séries; é uma
--   coisa que a pessoa decide fechar.
--
--   Sem uma coluna que guarde essa decisão, o ecrã não tinha por onde a
--   dizer. performed_at não serve: é o instante da última série marcada, e
--   existe mesmo em treinos que ninguém terminou.
--
-- UMA VEZ CONCLUÍDO, FICA CONCLUÍDO (decisão dele, 2026-09-06):
--   Marcar ou corrigir uma série depois de terminar ATUALIZA o treino
--   concluído — não o reabre. É por isso que o §2 põe `coalesce` com o valor
--   que já lá está: uma gravação normal (p_finished => false) nunca apaga um
--   fim que já foi decidido. Sem esse coalesce, a série que se corrige a
--   seguir ao treino desmarcava-o em silêncio.
--
-- O QUE ESTA FASE NÃO TRAZ:
--   O COMEÇO. A fase 011 (executar treino) é que traz o início a sério, com o
--   percurso conduzido. Aqui só nasce o fim, porque é o fim que o ecrã de hoje
--   precisa de saber para não mentir.
--
-- Rollback:
--   -- volta à função de sete parâmetros do 011 §4 (corre o 011 outra vez),
--   -- depois de tirar esta:
--   drop function if exists public.record_session(
--     smallint, text, text, date, timestamptz, jsonb, text, boolean);
--   -- a coluna pode ficar: é anulável e não custa nada. Se a quiseres fora:
--   --   alter table public.sessions drop column finished_at;
-- =========================================================================


-- ---- 1. a coluna --------------------------------------------------------
-- timestamptz e não boolean: "acabou" e "acabou às 19h42" custam o mesmo a
-- guardar, e o segundo responde a perguntas que o primeiro não responde — a
-- duração do treino na fase 013, a hora habitual na 018. Um boolean deitava
-- fora uma informação que só existe neste instante e que não se reconstrói
-- depois.
--
-- Anulável, e o NULL quer dizer alguma coisa: treino em curso. Toda a
-- história que já lá está fica NULL, o que é a verdade — ninguém carregou em
-- TERMINAR num treino gravado antes de o botão existir, e pôr uma data
-- inventada nessas linhas era escrever ficção na base de dados.
alter table public.sessions
  add column if not exists finished_at timestamptz;


-- ---- 2. a função, com o fim ---------------------------------------------
-- É a função do 011 §4 inteira, com p_finished no fim da lista e uma linha
-- nova no `on conflict`. Tudo o resto — a identidade (user_id, day_no,
-- local_date), o retrato completo, o apagar e reescrever das entradas, o
-- security invoker — fica exactamente como estava e pelas mesmas razões, que
-- estão escritas no 011.
--
-- O DROP É OBRIGATÓRIO, não é limpeza:
--   `create or replace` com uma lista de parâmetros diferente não substitui
--   nada — cria uma SEGUNDA função com o mesmo nome. Ficavam as duas, e o
--   PostgREST, ao receber uma chamada, não saberia qual escolher: responde
--   `300 Multiple Choices` e a app deixa de gravar sessões. Por isso a antiga
--   sai primeiro, pela assinatura exacta com que o 011 a criou.
drop function if exists public.record_session(
  smallint, text, text, date, timestamptz, jsonb, text);

create or replace function public.record_session(
  p_day_no       smallint,
  p_block        text,
  p_day_name     text,
  p_local_date   date,
  p_performed_at timestamptz,
  p_entries      jsonb,
  p_client       text,
  p_finished     boolean
) returns public.sessions
language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_ses public.sessions;
  -- O instante do fim, calculado uma vez: é o mesmo que a sessão regista como
  -- performed_at, para que a última série marcada e o fim do treino não
  -- fiquem a discordar por causa de duas leituras do relógio.
  v_end timestamptz := case
    when coalesce(p_finished, false) then coalesce(p_performed_at, now())
  end;
begin
  if v_uid is null then
    raise exception 'record_session: sem sessão';
  end if;
  if p_day_no is null or p_local_date is null then
    -- Os dois juntos são a identidade da linha. Sem um deles o índice único do
    -- 011 §3 não a distingue de nenhuma outra, e cada gravação faria uma
    -- sessão nova. Recusar aqui diz porquê; o índice só diria que não.
    raise exception 'record_session: day_no e local_date são a identidade da sessão';
  end if;

  insert into public.sessions (
    user_id, day_no, local_date, block, day_name, performed_at, finished_at,
    updated_by_client
  ) values (
    v_uid, p_day_no, p_local_date, p_block, p_day_name,
    coalesce(p_performed_at, now()), v_end, p_client
  )
  on conflict (user_id, day_no, local_date) do update set
    block             = excluded.block,
    day_name          = excluded.day_name,
    performed_at      = excluded.performed_at,
    -- A regra "uma vez concluído, fica concluído", escrita onde não se pode
    -- contornar: o que já lá está ganha sempre, e só um treino ainda em curso
    -- pode receber um fim.
    finished_at       = coalesce(public.sessions.finished_at, v_end),
    updated_by_client = excluded.updated_by_client
  returning * into v_ses;

  -- Apagar e reescrever, dentro da mesma transação. Ver "o retrato é completo"
  -- no 011. O delete só alcança as entradas desta sessão, que é uma linha cujo
  -- dono acabou de ser confirmado pelo RLS no insert acima.
  delete from public.session_entries where session_id = v_ses.id;

  insert into public.session_entries (
    session_id, idx, user_id, ex_key, name,
    target_sets, target_reps, target_raw,
    sets_done, sets_total, weight, reps, note, updated_by_client
  )
  select
    v_ses.id,
    (ord - 1)::smallint,
    v_uid,
    nullif(e->>'ex_key', ''),
    nullif(e->>'name', ''),
    nullif(e->>'target_sets', ''),
    nullif(e->>'target_reps', ''),
    nullif(e->>'target_raw', ''),
    (e->>'sets_done')::smallint,
    (e->>'sets_total')::smallint,
    nullif(e->>'weight', ''),
    nullif(e->>'reps', ''),
    nullif(e->>'note', ''),
    p_client
  from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb)) with ordinality as t(e, ord);

  return v_ses;
end $$;


-- ---- 3. quem a pode chamar ----------------------------------------------
-- A assinatura mudou, por isso as permissões têm de ser dadas outra vez: um
-- grant vive numa função concreta, e a antiga já não existe.
revoke all on function public.record_session(
  smallint, text, text, date, timestamptz, jsonb, text, boolean) from public;

grant execute on function public.record_session(
  smallint, text, text, date, timestamptz, jsonb, text, boolean) to authenticated;
