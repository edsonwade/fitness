-- =========================================================================
-- 007_publish_shared_exercise.sql — publicar é UMA escrita, não duas
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- anteriores: `create or replace` e nada mais. Não cria tabelas, não cria
-- colunas, não escreve uma linha de dados, não mexe em políticas.
--
-- PORQUÊ:
--   Publicar um exercício escreve em duas tabelas: `catalog_exercises` diz o que
--   o exercício é, `day_additions` diz que ele está naquele dia. Até aqui o
--   cliente mandava as duas separadamente, e observámos o que isso custa
--   (registado em .claude/plans/phase-c-gate-findings.md §3):
--
--     POST catalog_exercises -> 400   (recusado)
--     POST day_additions     -> 201   (gravou)
--
--   Ficou uma adição a apontar para um exercício que não existe, numa tabela que
--   todas as contas lêem. E como `resolveDayEntries` se recusa a desenhar uma
--   adição sem exercício por trás, esse lixo é invisível na app: acumula sem
--   nada dizer. Estão 4 linhas assim no dia 1 neste momento.
--
-- POR QUE É QUE A CORRECÇÃO NÃO PODIA SER SÓ NO CLIENTE:
--   A correcção óbvia — esperar pela primeira escrita e só depois mandar a
--   segunda — parte o offline, que é o caso para que esta app inteira foi
--   escrita. Sem rede, uma mutação fica PAUSADA (`networkMode: 'online'`, ver
--   providers.tsx), por isso a segunda escrita nunca chegava a entrar na cache e
--   o cartão não aparecia no ginásio. Pior: se a app recarregasse offline, o
--   outbox replicava a escrita do catálogo, que está persistida em IndexedDB,
--   mas a continuação do `await` era só memória e desaparecia — um exercício
--   publicado que não está em dia nenhum. Trocava-se um órfão por outro.
--
--   Uma transação no servidor não tem esse problema: as duas linhas entram ou
--   não entra nenhuma, e o outbox replica uma chamada só.
--
--   É o mesmo raciocínio do `merge_exercise_log` do 003 §15, e por isso esta
--   função tem a mesma forma: `security invoker`, para o RLS continuar a mandar
--   exactamente como manda num update normal.
--
-- Rollback:
--   drop function if exists public.publish_shared_exercise(
--     text, smallint, text, text, text, text, text, text, text, text, text,
--     boolean, text);
--   E reverter `writeShared`/`removeShared` em src/features/train/use-day-editing.ts
--   para os dois upserts separados. A app volta a funcionar, com o defeito acima.
-- =========================================================================


-- ---- 1. a função --------------------------------------------------------
-- Devolve as duas linhas guardadas, {"catalog": {...}, "addition": {...}}, porque
-- o cliente tem de pôr na cache o que o servidor guardou e não o que mandou: os
-- defaults, o `touch_updated_at` e o relógio do servidor fazem-nas diferentes.
--
-- `p_deleted` é o que faz esta função servir também para despublicar. Remover é
-- `deleted = true` nas duas linhas, e essas duas escritas têm exactamente o mesmo
-- problema de atomicidade que publicar: se o catálogo desaparecesse e a adição
-- ficasse, o dia de toda a gente ficava a apontar para nada.
create or replace function public.publish_shared_exercise(
  p_ex_key    text,
  p_day_no    smallint,
  p_name_pt   text,
  p_kind      text,
  p_equipment text,
  p_sets      text,
  p_reps      text,
  p_load      text,
  p_rest      text,
  p_video_id  text,
  p_photo_url text,
  p_deleted   boolean,
  p_client    text
) returns jsonb
language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := auth.uid();
  v_deleted boolean := coalesce(p_deleted, false);
  v_cat     public.catalog_exercises;
  v_add     public.day_additions;
begin
  if v_uid is null then
    raise exception 'publish_shared_exercise: sem sessão';
  end if;

  -- ---- o exercício ----
  -- `on conflict (ex_key)`: a chave partilhada é o que os exercise_logs, o
  -- hidden_items e o exercise_order usam para se referirem a ele, e o 003 já a
  -- tem unique. É por ela que se decide se isto é publicar ou editar.
  --
  -- `created_by` e `created_at` NÃO estão no update de propósito. Qualquer pessoa
  -- pode mudar um exercício publicado — decisão de 2026-09-02 — mas ninguém pode
  -- passar a constar como autor de uma coisa que não escreveu. `name_en` também
  -- fica de fora: pertence às linhas herdadas da app antiga e o formulário não o
  -- edita, por isso deixá-lo no update era apagá-lo com um null vindo do ecrã.
  insert into public.catalog_exercises (
    ex_key, name_pt, kind, equipment, sets, reps, load, rest,
    video_id, photo_url, deleted, created_by, updated_by_client
  ) values (
    p_ex_key, p_name_pt, p_kind, p_equipment, p_sets, p_reps, p_load, p_rest,
    p_video_id, p_photo_url, v_deleted, v_uid, p_client
  )
  on conflict (ex_key) do update set
    name_pt           = excluded.name_pt,
    kind              = excluded.kind,
    equipment         = excluded.equipment,
    sets              = excluded.sets,
    reps              = excluded.reps,
    load              = excluded.load,
    rest              = excluded.rest,
    video_id          = excluded.video_id,
    photo_url         = excluded.photo_url,
    deleted           = excluded.deleted,
    updated_by_client = excluded.updated_by_client
  returning * into v_cat;

  -- ---- a adição ao dia ----
  -- Escrito à mão em vez de `on conflict`, e a razão é o índice do 006:
  -- `day_additions_unique_live` é PARCIAL, `where deleted = false`. Um
  -- `on conflict (day_no, ex_key) where deleted = false` só apanha o conflito
  -- quando a linha nova também é viva, por isso despublicar passava ao lado do
  -- índice e inseria uma segunda linha apagada em vez de apagar a que lá está.
  --
  -- O `order by deleted` prefere a linha viva quando há histórico apagado do
  -- mesmo exercício no mesmo dia, que é o estado que fica depois de publicar,
  -- remover e voltar a publicar. Reaproveitar a linha antiga mantém o `id`
  -- estável, e um id estável é o que impede a cache do cliente de acabar com o
  -- mesmo exercício duas vezes no mesmo dia.
  select * into v_add
    from public.day_additions
   where day_no = p_day_no and ex_key = p_ex_key
   order by deleted, created_at desc
   limit 1
     for update;

  if found then
    update public.day_additions set
      deleted           = v_deleted,
      updated_by_client = p_client
     where id = v_add.id
    returning * into v_add;
  else
    insert into public.day_additions (
      day_no, ex_key, block_config, deleted, created_by, updated_by_client
    ) values (
      /*
       * Vazio, e de propósito. Tudo sobre o exercício, os números e o tipo de
       * movimento incluídos, está na linha do catálogo, por isso uma adição diz
       * uma coisa só: este exercício pertence a este dia. Dividir a prescrição
       * pelas duas dava ao mesmo exercício alvos diferentes em dias diferentes,
       * que é o contrário da regra que esta funcionalidade existe para manter.
       */
      p_day_no, p_ex_key, '{}'::jsonb, v_deleted, v_uid, p_client
    )
    returning * into v_add;
  end if;

  return jsonb_build_object('catalog', to_jsonb(v_cat), 'addition', to_jsonb(v_add));
end $$;


-- ---- 2. quem a pode chamar ----------------------------------------------
-- Mesma forma do 003 §15: fechada a `public`, aberta a quem tem sessão. Sendo
-- `security invoker`, o RLS das duas tabelas continua a ser a autoridade — isto
-- decide só quem pode bater à porta.
revoke all on function public.publish_shared_exercise(
  text, smallint, text, text, text, text, text, text, text, text, text,
  boolean, text) from public;

grant execute on function public.publish_shared_exercise(
  text, smallint, text, text, text, text, text, text, text, text, text,
  boolean, text) to authenticated;
