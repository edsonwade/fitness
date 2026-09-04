-- =========================================================================
-- 008_scoped_day_additions.sql — uma adição sabe de quem é o dia
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- anteriores: podes correr outra vez sem estragar nada. Acrescenta uma coluna,
-- repara as linhas que já lá estão, aperta duas políticas e substitui a função
-- do 007. Não apaga uma linha de ninguém.
--
-- PORQUÊ:
--   Publicar um exercício dentro de um dia próprio não chegava à outra conta, e
--   a razão não era a publicação: o 007 escreve as duas linhas e escreve-as bem.
--   A razão é o número do dia.
--
--     day_no 1..7    → o programa. É o MESMO dia em todas as contas.
--     day_no >= 101  → um dia teu. É numerado POR CONTA (nextDayNo, no cliente).
--
--   `day_additions.day_no` é global e não distingue os dois. Publicar no dia 101
--   escrevia numa tabela que todas as contas lêem uma linha que só faz sentido
--   numa. Observado em 2026-09-04, com as duas contas lado a lado: o exercício
--   ficou no catálogo (bem) e a adição ficou no dia 101 (sem sentido para quem
--   não tem dia 101).
--
--   O reverso é pior e ainda não se via: a segunda conta a criar um dia qualquer
--   recebe o número 101 — o primeiro livre na SUA conta — e herdava as adições
--   da primeira. Um exercício partilhado a aparecer dentro de um dia que nada
--   tem a ver com ele. É colisão de identificadores, não é uma questão de ecrã.
--
-- A REGRA QUE ISTO FIXA:
--   O exercício publicado é de toda a gente, sempre — `catalog_exercises` não
--   muda uma linha aqui. O que passa a ter dono é a PRESCRIÇÃO: dizer que este
--   exercício está no dia 101 é uma afirmação sobre o dia de alguém, e um dia
--   próprio é de quem o criou.
--
-- POR QUE É QUE A SEPARAÇÃO É `user_id is null` E NÃO UMA COLUNA `is_shared`:
--   Um booleano deixava representável o estado que causou este bug — uma adição
--   marcada partilhada num dia que é de uma conta só. Com o dono na própria
--   coluna, a constraint do §3 torna esse estado impossível de escrever, em vez
--   de improvável.
--
-- Rollback:
--   alter table public.day_additions drop constraint day_additions_scope_check;
--   alter table public.day_additions drop column user_id;
--   drop index if exists day_additions_unique_live;
--   create unique index day_additions_unique_live
--     on public.day_additions (day_no, ex_key) where deleted = false;
--   e voltar a correr o 006 §1 e o 007 inteiros.
-- =========================================================================


-- ---- 1. o dono do dia ---------------------------------------------------
-- Nulo é o dia do programa: a adição é de toda a gente, exactamente como era
-- antes deste ficheiro, e é por isso que a coluna nasce nula em vez de not null
-- com default — as linhas dos dias 1..7 já estão certas e não são tocadas.
--
-- `on delete cascade` como em todas as outras: uma conta apagada leva consigo o
-- que só fazia sentido dentro dela. Não leva o exercício publicado, que está na
-- outra tabela e é de todos.
alter table public.day_additions
  add column if not exists user_id uuid references auth.users on delete cascade;


-- ---- 2. reparar o que já lá está ----------------------------------------
-- Antes da constraint, senão ela recusa-se a entrar por causa das linhas que
-- este ficheiro existe para corrigir.

-- 2a. As adições em dias próprios passam a ser de quem as criou. `created_by` é
-- a melhor verdade disponível: quem publicou um exercício dentro do seu dia 101
-- é o dono desse dia, porque nenhuma outra conta conseguia abri-lo para lá
-- escrever.
update public.day_additions
   set user_id = created_by
 where day_no >= 101
   and user_id is null;

-- 2b. Os órfãos. Uma adição sem linha de catálogo por trás não desenha nada — o
-- `resolveDayEntries` do cliente recusa-se a desenhá-la de propósito, para não
-- inventar um cartão a partir de uma referência partida. O efeito é que estas
-- linhas se acumulam invisíveis. São as 4 do dia 1 que ficaram das duas escritas
-- independentes de antes do 007 (registado em .claude/plans/phase-c-gate-findings.md §3).
--
-- `deleted = true` e não um delete a sério, pela mesma razão de sempre nesta
-- tabela: um delete deixava a cache de quem estivesse com a app aberta a apontar
-- para uma linha que desapareceu sem aviso.
update public.day_additions a
   set deleted = true
 where a.deleted = false
   and not exists (
     select 1 from public.catalog_exercises c
      where c.ex_key = a.ex_key
        and c.deleted = false
   );


-- ---- 3. a invariante ----------------------------------------------------
-- Um dia do programa nunca leva dono; um dia próprio leva sempre. Escrito como
-- igualdade entre os dois booleanos e não como dois `or`, porque é isso que a
-- regra é: as duas metades andam juntas nos dois sentidos.
--
-- 8..100 conta como programa aqui, e isso é de propósito: é o intervalo que o
-- 005 deixou livre para o plano da base crescer, e um dia da base é de todos.
alter table public.day_additions
  drop constraint if exists day_additions_scope_check;

alter table public.day_additions
  add constraint day_additions_scope_check
  check ((day_no <= 100) = (user_id is null));


-- ---- 4. unicidade, agora por dono ---------------------------------------
-- O índice do 006 §3 é (day_no, ex_key) where deleted = false. Sem o dono lá
-- dentro, duas contas com o mesmo exercício no seu próprio dia 101 colidiam: a
-- segunda a publicar levava com uma violação de unicidade por causa de uma linha
-- que nem sequer consegue ler.
--
-- `coalesce` com o uuid zero em vez de deixar o nulo: num índice único, dois
-- nulos são distintos entre si, por isso a linha do programa deixaria de ser
-- única — que é exactamente a garantia que o 006 foi buscar.
drop index if exists public.day_additions_unique_live;

create unique index if not exists day_additions_unique_live
  on public.day_additions
     (day_no, ex_key, coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where deleted = false;


-- ---- 5. quem lê e quem escreve ------------------------------------------
-- A leitura era `using (true)`, do 003 §12. Fechar aqui, e não no cliente, é o
-- que faz a colisão do dia 101 desaparecer de verdade: a adição pessoal de outra
-- conta deixa de chegar ao browser, por isso nenhum ecrã tem de se lembrar de a
-- filtrar. O `fetchRows` do cliente continua a filtrar só `deleted = false`.
drop policy if exists day_additions_read on public.day_additions;
create policy day_additions_read on public.day_additions
  for select to authenticated
  using (user_id is null or user_id = auth.uid());

-- A escrita aberta do 006 §1 fica de pé para o que é do programa — a decisão de
-- 2026-09-02 é que entre duas pessoas qualquer uma pode publicar e remover — mas
-- passa a parar à porta do dia próprio de outra conta.
--
-- O `with check` repete a condição em vez de ser `true`: sem ele, uma linha do
-- programa podia ser reescrita com o user_id de outra pessoa, que é a mesma
-- injecção pelo outro lado.
drop policy if exists day_additions_update on public.day_additions;
create policy day_additions_update on public.day_additions
  for update to authenticated
  using (user_id is null or user_id = auth.uid())
  with check (user_id is null or user_id = auth.uid());

-- O insert continua a exigir autoria verdadeira, e agora também que ninguém
-- escreva uma adição no dia de outra conta.
drop policy if exists day_additions_insert on public.day_additions;
create policy day_additions_insert on public.day_additions
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (user_id is null or user_id = auth.uid())
  );


-- ---- 6. publicar, a saber de quem é o dia -------------------------------
-- Substitui a função do 007. A assinatura é a mesma de propósito: o âmbito NÃO é
-- um parâmetro, é derivado aqui do número do dia e da sessão. Um parâmetro seria
-- uma coisa que o cliente afirma; derivado, é uma coisa que o servidor sabe, e a
-- diferença é que a primeira se pode forjar.
--
-- Tudo o resto — a atomicidade das duas linhas, o `on conflict` pela ex_key, o
-- `created_by` deixado de fora do update — fica como o 007 o escreveu, e pelas
-- razões que estão lá.
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
  -- Nulo num dia do programa, a própria conta num dia próprio. É a única linha
  -- nova nesta função, e é ela que resolve o bug inteiro.
  v_scope   uuid := case when p_day_no >= 101 then auth.uid() else null end;
  v_cat     public.catalog_exercises;
  v_add     public.day_additions;
begin
  if v_uid is null then
    raise exception 'publish_shared_exercise: sem sessão';
  end if;

  -- ---- o exercício ----
  -- Não leva âmbito nenhum, e é esse o ponto: publicado é publicado. O exercício
  -- fica no catálogo de toda a gente mesmo quando o dia onde foi criado é
  -- privado, e é assim que a outra conta lhe chega para o pôr num dia seu.
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
  -- Escrita à mão em vez de `on conflict`, pela razão do 007: o índice é parcial
  -- em deleted = false, por isso despublicar passava ao lado dele e inseria uma
  -- segunda linha apagada em vez de apagar a que lá está.
  --
  -- `is not distinct from` e não `=`: o âmbito é nulo nos dias do programa, e
  -- `user_id = null` não é verdade para linha nenhuma, por isso um `=` fazia
  -- todas as republicações num dia da base inserirem uma linha nova.
  select * into v_add
    from public.day_additions
   where day_no = p_day_no
     and ex_key = p_ex_key
     and user_id is not distinct from v_scope
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
      day_no, ex_key, user_id, block_config, deleted, created_by, updated_by_client
    ) values (
      p_day_no, p_ex_key, v_scope, '{}'::jsonb, v_deleted, v_uid, p_client
    )
    returning * into v_add;
  end if;

  return jsonb_build_object('catalog', to_jsonb(v_cat), 'addition', to_jsonb(v_add));
end $$;


-- ---- 7. quem a pode chamar ----------------------------------------------
-- `create or replace` mantém os grants, mas isto corre outra vez para o ficheiro
-- ser completo por si: quem o ler não tem de ir ao 007 saber quem pode entrar.
revoke all on function public.publish_shared_exercise(
  text, smallint, text, text, text, text, text, text, text, text, text,
  boolean, text) from public;

grant execute on function public.publish_shared_exercise(
  text, smallint, text, text, text, text, text, text, text, text, text,
  boolean, text) to authenticated;
