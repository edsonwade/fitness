-- =========================================================================
-- 011_sessions_live.sql — a app passa a gravar a sessão, com data
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- dez anteriores: podes correr outra vez sem estragar nada.
--
-- Aditivo. Três colunas novas, todas ANULÁVEIS, dois índices e uma função.
-- Não escreve uma linha de dados, não apaga nada, não muda nenhuma coluna que
-- já existe e não mexe nas políticas do 003. Quem ainda estiver na versão
-- anterior do cliente continua a funcionar exactamente como antes.
--
-- ---- PRÉ-VOO: ESTÁ DENTRO DO FICHEIRO, NÃO CORRES NADA À MÃO ------------
--
-- O §3 cria um índice ÚNICO. Um índice único sobre dados que já lá estão pode
-- rebentar a meio, e foi assim que a 008 partiu. Por isso há uma verificação
-- antes dele — mas ela vive AQUI DENTRO, no §2, e não numa query solta a
-- correr primeiro.
--
-- Porquê aqui dentro: a verificação agrupa por day_no e local_date, e essas
-- duas colunas SÃO CRIADAS por este ficheiro, no §1. Correr a query antes do
-- ficheiro dá `ERROR: 42703: column "day_no" does not exist`, porque nessa
-- altura a coluna ainda não nasceu. A ordem certa é: criar as colunas,
-- verificar, e só então criar o índice. É o que o ficheiro faz sozinho.
--
-- O que a verificação vai encontrar: nada. day_no e local_date nascem agora e
-- ficam NULL em todas as linhas antigas (as que o mapper da v1 escreveu), e
-- num índice único do Postgres dois NULL são distintos um do outro, por isso
-- nenhuma linha antiga colide com outra. O §2 prova-o em vez de o supor.
--
-- Se houver duplicados, o §2 pára a migração inteira com uma mensagem em
-- português e NADA é gravado — a transação do Run desfaz-se toda. Nesse caso
-- não inventes uma reparação: diz o que a mensagem disse.
--
-- Só corres UMA coisa: este ficheiro inteiro, no SQL Editor, Run.
--
-- PORQUÊ ESTE FICHEIRO:
--   exercise_logs tem uma linha por (day_no, block, ex_key) e sobrescreve-se.
--   Guarda o que está levantado AGORA e não guarda data nenhuma. Por isso a app
--   não sabe o que aconteceu na semana passada: não há tendência, não há
--   consistência, não há gráfico ao longo do tempo, não há calendário.
--
--   As tabelas certas já existem desde o 003 §2 — sessions e session_entries —
--   e nunca ninguém lá escreveu a partir da app viva. Só o mapper da migração
--   v1, ao trazer o histórico da app antiga. Isto abre-as à app.
--
--   exercise_logs NÃO é substituído nem apagado. Continua a ser o estado de
--   hoje; sessions passa a ser a história. Duas coisas diferentes, as duas
--   precisas.
--
-- AS DUAS TABELAS CONTINUAM PRIVADAS:
--   O 009 foi explícito — "o plano é de todos; o registo é de cada um". A
--   política sessions_own / session_entries_own do 003 §11 (user_id =
--   auth.uid(), for all) é a autoridade, e este ficheiro não lhe toca. A função
--   é `security invoker` pela mesma razão que o merge_exercise_log e o
--   publish_shared_exercise: o RLS continua a mandar como manda num update
--   normal.
--
-- Rollback:
--   drop function if exists public.record_session(
--     smallint, text, text, date, timestamptz, jsonb, text);
--   drop index if exists public.sessions_user_day_date;
--   drop index if exists public.sessions_user_local_date;
--   -- as colunas podem ficar: são anuláveis e não custam nada. Se as quiseres
--   -- mesmo fora:
--   --   alter table public.sessions        drop column day_no, drop column local_date;
--   --   alter table public.session_entries drop column ex_key;
-- =========================================================================


-- ---- 1. as três colunas -------------------------------------------------
--
-- day_no: sessions só tinha day_name, que é TEXTO. Um nome muda no dia em que
--   o utilizador edita o dia, e aí a história deixa de se conseguir ligar ao
--   treino. day_no identifica o TREINO (é a decisão D4, a mesma de todas as
--   outras tabelas), e é smallint como em todas elas — guardar a mesma coisa
--   com outro tipo era convidar uma comparação a falhar em silêncio.
--
-- local_date: a identidade de "uma sessão por treino feito, não uma por
--   gravação de carga". performed_at é um INSTANTE e o instante não serve para
--   decidir se duas gravações são o mesmo treino: às 23h30 e às 00h10 são dois
--   dias no relógio do utilizador. O dia de calendário DELE é que decide, e é
--   o cliente que o manda, porque só ele sabe o fuso em que a pessoa está.
--
-- ex_key: session_entries só tinha `name`. A fase 014 quer carga por
--   exercício ao longo do tempo, e juntar por nome parte no dia em que o nome
--   muda. ex_key é a chave que os exercise_logs, o hidden_items e o
--   exercise_order já usam.
alter table public.sessions
  add column if not exists day_no smallint;

alter table public.sessions
  add column if not exists local_date date;

alter table public.session_entries
  add column if not exists ex_key text;


-- ---- 2. o pré-voo, agora que as colunas existem -------------------------
-- Esta é a query do cabeçalho, no único sítio onde ela pode correr: depois do
-- §1 e antes do §3. Se encontrar duplicados, levanta uma excepção, e como o
-- Run do SQL Editor é uma transação só, a migração inteira desfaz-se — as
-- colunas do §1 incluídas. Falhar aqui não deixa a base a meio.
--
-- Sem isto, um duplicado dava o erro cru do Postgres a apontar para um índice,
-- que não diz a ninguém o que fazer a seguir. Esta mensagem diz.
do $$
declare
  v_dups bigint;
begin
  select count(*) into v_dups
    from (
      select 1
        from public.sessions
       group by user_id, day_no, local_date
      having count(*) > 1
    ) d;

  if v_dups > 0 then
    raise exception
      'PRÉ-VOO FALHOU: % combinações (user_id, day_no, local_date) repetidas em public.sessions. O índice único do §3 não pode ser criado. Nada foi gravado. Diz este número a quem te pediu a migração.',
      v_dups;
  end if;
end $$;


-- ---- 3. um treino por dia de calendário ---------------------------------
-- O índice único é a regra "uma sessão por treino feito" escrita onde não se
-- pode contornar. Sem ele, duas gravações ao mesmo tempo (o telemóvel e o
-- portátil) faziam duas sessões do mesmo treino, e a consistência da fase 006
-- passava a contar treinos a dobrar.
--
-- Não é parcial de propósito: um índice parcial não serve de alvo a um
-- `on conflict` e a função do §4 depende exactamente disso.
create unique index if not exists sessions_user_day_date
  on public.sessions (user_id, day_no, local_date);

-- Para a leitura por intervalo de datas, que é o que as fases 006, 014 e 015
-- fazem o tempo todo. O 003 §2 já tinha um por performed_at; este é pela data
-- local, que é a coluna por que se filtra agora.
create index if not exists sessions_user_local_date
  on public.sessions (user_id, local_date desc);


-- ---- 4. a função --------------------------------------------------------
-- Grava o retrato do dia inteiro numa transação só.
--
-- POR QUE UMA FUNÇÃO E NÃO ESCRITAS DO CLIENTE:
--   Uma sessão são N+1 linhas: a sessão e uma entrada por exercício. Mandadas
--   separadamente pelo cliente, uma pode ser recusada e as outras não, e fica
--   uma sessão sem entradas ou entradas sem sessão. É exactamente o defeito
--   que o 007 documenta e corrige, e está lá o que ele custou: 4 linhas órfãs
--   no dia 1, invisíveis na app. Aqui é pior, porque a chave primária de
--   session_entries é (session_id, idx) e a ordem dos exercícios muda: sem
--   transação, reordenar o dia a meio do treino baralhava a sessão.
--
--   E offline: uma mutação parada é replicada pelo outbox depois de um
--   reload, e nessa altura já não há componente vivo que se lembre da segunda
--   metade da escrita. Uma chamada só é uma chamada só.
--
-- O RETRATO É COMPLETO, NÃO INCREMENTAL:
--   p_entries traz o dia inteiro de cada vez, e as entradas são apagadas e
--   reescritas. Assim um exercício tirado do dia sai da sessão, um acrescentado
--   entra, e uma reordenação não deixa duas entradas no mesmo idx. O custo é
--   escrever meia dúzia de linhas por gravação, numa tabela privada e pequena.
--
-- performed_at ANDA PARA A FRENTE dentro do mesmo dia, de propósito: é o
--   momento da última série marcada, que é o mais perto do fim do treino que
--   esta fase consegue saber. A fase 011 (executar treino) é que traz o começo
--   e o fim a sério.
--
-- QUEM CHAMA ISTO, E QUANDO (decisão do utilizador, 2026-09-06):
--   Só quando há pelo menos UMA SÉRIE MARCADA no dia. Abrir o treino, mudar o
--   exercício, escrever a carga, mudar as reps ou escrever uma nota não criam
--   sessão nenhuma — isso é planear, não treinar. Quem faz esse portão é o
--   cliente (src/features/train/sessions.ts, totalSetsDone), porque é ele que
--   sabe o dia resolvido; esta função grava o que lhe derem.
create or replace function public.record_session(
  p_day_no       smallint,
  p_block        text,
  p_day_name     text,
  p_local_date   date,
  p_performed_at timestamptz,
  p_entries      jsonb,
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
    raise exception 'record_session: sem sessão';
  end if;
  if p_day_no is null or p_local_date is null then
    -- Os dois juntos são a identidade da linha. Sem um deles o índice único do
    -- §3 não a distingue de nenhuma outra, e cada gravação faria uma sessão
    -- nova. Recusar aqui diz porquê; o índice só diria que não.
    raise exception 'record_session: day_no e local_date são a identidade da sessão';
  end if;

  insert into public.sessions (
    user_id, day_no, local_date, block, day_name, performed_at, updated_by_client
  ) values (
    v_uid, p_day_no, p_local_date, p_block, p_day_name,
    coalesce(p_performed_at, now()), p_client
  )
  on conflict (user_id, day_no, local_date) do update set
    block             = excluded.block,
    day_name          = excluded.day_name,
    performed_at      = excluded.performed_at,
    updated_by_client = excluded.updated_by_client
  returning * into v_ses;

  -- Apagar e reescrever, dentro da mesma transação. Ver "o retrato é completo"
  -- acima. O delete só alcança as entradas desta sessão, que é uma linha cujo
  -- dono acabou de ser confirmado pelo RLS no insert acima.
  delete from public.session_entries where session_id = v_ses.id;

  insert into public.session_entries (
    session_id, idx, user_id, ex_key, name,
    target_sets, target_reps, target_raw,
    sets_done, sets_total, weight, reps, note, updated_by_client
  )
  select
    v_ses.id,
    -- `with ordinality` dá 1, 2, 3...; idx é 0-based como o índice do array no
    -- cliente, e a ordem do jsonb é a ordem em que os exercícios aparecem no
    -- ecrã. É essa ordem que a sessão tem de conservar.
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


-- ---- 5. quem a pode chamar ----------------------------------------------
-- Mesma forma do 003 §15 e do 007 §2: fechada a `public`, aberta a quem tem
-- sessão. Sendo `security invoker`, o RLS das duas tabelas continua a ser a
-- autoridade — isto decide só quem pode bater à porta.
revoke all on function public.record_session(
  smallint, text, text, date, timestamptz, jsonb, text) from public;

grant execute on function public.record_session(
  smallint, text, text, date, timestamptz, jsonb, text) to authenticated;
