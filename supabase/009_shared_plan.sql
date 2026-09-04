-- =========================================================================
-- 009_shared_plan.sql — o plano é de todos; o registo é de cada um
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente: podes
-- correr outra vez sem estragar nada. NÃO apaga um dia, um exercício nem um
-- registo de ninguém — o que remove são linhas repetidas, e mesmo essas ficam
-- guardadas em `public.merged_duplicates` antes de saírem.
--
-- A REGRA, EM UMA LINHA:
--   A semana é a mesma para toda a gente. O que cada um levantou é só seu.
--
-- PORQUÊ:
--   O 003 fez treze tabelas privadas, cada linha fechada ao seu dono por RLS.
--   Isso está certo para `exercise_logs` — a carga de segunda-feira é de quem a
--   levantou — e está errado para o plano: acrescentar um exercício à
--   quarta-feira era um acto privado, e a outra conta continuava a ver a
--   quarta-feira antiga. O 006/007 abriram uma porta lateral, o "publicar", para
--   um exercício chegar às outras contas, e o 008 teve de arranjar a colisão do
--   dia 101 que essa porta destapou.
--
--   A porta lateral era o sintoma. A causa é ter-se guardado o PLANO como se
--   fosse dado privado. Este ficheiro trata a causa: o plano passa a ser uma
--   coisa só, que todas as contas lêem e escrevem, e o realtime que já lá está
--   entrega a alteração às outras contas no mesmo instante.
--
-- O QUE PASSA A SER DE TODOS (cinco tabelas):
--   custom_days           — os dias acrescentados à semana
--   custom_exercises      — os exercícios acrescentados a um dia
--   exercise_overrides    — as alterações a um exercício da base
--   hidden_items          — o que foi tirado de um dia
--   exercise_order        — a sequência dentro do dia
--
-- O QUE CONTINUA PRIVADO, e não é esquecimento:
--   exercise_logs, sessions, session_entries  — o que cada um fez
--   goals, trainers, trainer_sessions         — de cada um
--   user_profiles, user_settings              — de cada um
--   rest_preferences                          — o descanso é de quem descansa
--
-- O QUE ISTO FAZ AO 008:
--   O 008 deu dono às adições dos dias 101+ porque esse número era atribuído por
--   conta e por isso significava um dia diferente em cada uma. Aqui os dias
--   passam a ser de todos e o número passa a ser único na base inteira (§2), por
--   isso a premissa do 008 deixa de existir: `day_additions.user_id` volta a ser
--   nulo em todas as linhas e a leitura volta a `using (true)` (§4). A coluna
--   fica onde está, a dizer "sem dono", em vez de ser removida — apagar uma
--   coluna é irreversível e esta não custa nada.
--
-- ORDEM: §2 antes de §3. Renumerar os dias repetidos tem de acontecer enquanto
-- as tabelas ainda são privadas, que é o que torna cada linha atribuível sem
-- ambiguidade ao dia de quem a escreveu.
-- =========================================================================


-- ---- 1. onde vai parar o que for fundido ---------------------------------
-- Duas contas podem ter escondido o mesmo exercício do mesmo dia. Depois desta
-- migração isso é uma linha só, e a que sai fica aqui inteira, em jsonb. Não é
-- para o cliente ler: é para haver resposta se alguém perguntar o que
-- desapareceu.
create table if not exists public.merged_duplicates (
  id         bigint generated always as identity primary key,
  merged_at  timestamptz not null default now(),
  table_name text not null,
  row        jsonb not null
);

alter table public.merged_duplicates enable row level security;
-- Sem políticas, como `migration_errors` do 003 §10: só o service_role lá chega.


-- ---- 2. o número do dia passa a ser único na base ------------------------
-- Até aqui `custom_days` era (user_id, day_no) e o número saía do `nextDayNo`
-- do cliente, que contava só os dias da própria conta. Duas contas a criarem um
-- dia ficavam ambas com o 101 a significar coisas diferentes.
--
-- Com a semana partilhada, 101 tem de ser UM dia. Onde o número está repetido,
-- quem o criou primeiro fica com ele e o outro dia é RENUMERADO — não apagado.
-- Renumerar arrasta o que só existe dentro desse dia: os seus exercícios, as
-- suas alterações, o que lá está escondido, a sua ordem, e também os registos de
-- carga, que são privados mas estão presos ao número do dia.
--
-- Isto corre enquanto as tabelas ainda são privadas, e é por isso que
-- `user_id = <perdedor> and day_no = <antigo>` identifica exactamente as linhas
-- daquele dia e de mais nenhum.
do $$
declare
  r        record;
  v_next   smallint;
begin
  -- O número novo tem de estar livre em TODAS as tabelas que guardam um dia, e
  -- não só em `custom_days`: apagar um dia deixa os `exercise_logs` para trás de
  -- propósito (são o registo do que foi feito), e reaproveitar o número deles
  -- colava registos antigos a um dia que não é o deles.
  select greatest(
    coalesce((select max(day_no) from public.custom_days), 100),
    coalesce((select max(day_no) from public.custom_exercises), 100),
    coalesce((select max(day_no) from public.exercise_overrides), 100),
    coalesce((select max(day_no) from public.hidden_items), 100),
    coalesce((select max(day_no) from public.exercise_order), 100),
    coalesce((select max(day_no) from public.exercise_logs), 100),
    coalesce((select max(day_no) from public.day_additions), 100)
  ) into v_next;

  for r in
    select user_id, day_no
      from (
        select user_id, day_no,
               row_number() over (partition by day_no
                                  order by created_at, user_id) as rn
          from public.custom_days
      ) ranked
     where rn > 1
     order by day_no, user_id
  loop
    v_next := v_next + 1;

    update public.custom_exercises   set day_no = v_next where user_id = r.user_id and day_no = r.day_no;
    update public.exercise_overrides set day_no = v_next where user_id = r.user_id and day_no = r.day_no;
    update public.hidden_items       set day_no = v_next where user_id = r.user_id and day_no = r.day_no;
    update public.exercise_order     set day_no = v_next where user_id = r.user_id and day_no = r.day_no;
    update public.exercise_logs      set day_no = v_next where user_id = r.user_id and day_no = r.day_no;
    update public.day_additions      set day_no = v_next where user_id = r.user_id and day_no = r.day_no;
    update public.custom_days        set day_no = v_next where user_id = r.user_id and day_no = r.day_no;

    raise notice 'dia % de % renumerado para %', r.day_no, r.user_id, v_next;
  end loop;
end $$;


-- ---- 3. a identidade de uma linha do plano deixa de incluir quem a escreveu
-- Esta é a parte que faz a diferença entre "toda a gente vê" e "toda a gente
-- pode mexer". Com a chave antiga, esconder um exercício escrevia UMA linha POR
-- CONTA: a segunda conta a carregar em "repor" apagava a sua e o exercício
-- continuava escondido pela linha da primeira, sem nada no ecrã que explicasse
-- porquê. Com a chave nova há uma linha só, e repor é repor.
--
-- `user_id` fica na tabela e passa a significar QUEM ESCREVEU POR ÚLTIMO. Não é
-- decoração: é o que o RLS exige no `with check` (§4), para uma linha não poder
-- ser escrita em nome de outra pessoa.
--
-- O `replica identity full` do 003 §11 é o que torna isto seguro para o
-- realtime: a réplica não depende da chave primária, por isso trocá-la não
-- interrompe a entrega de alterações.
do $$
declare
  t    text;
  cols text;
  spec text[] := array[
    'custom_days',        'day_no',
    'exercise_order',     'day_no',
    'hidden_items',       'day_no, ex_key',
    'exercise_overrides', 'day_no, ex_key'
  ];
  i int;
begin
  for i in 1 .. array_length(spec, 1) by 2 loop
    t    := spec[i];
    cols := spec[i + 1];

    -- Guardar as repetidas antes de as tirar. A que fica é a mais recentemente
    -- escrita: entre duas afirmações sobre o mesmo dia, a última é a que alguém
    -- ainda esperava ver.
    execute format($f$
      insert into public.merged_duplicates (table_name, row)
      select %L, to_jsonb(x)
        from (
          select *, row_number() over (partition by %s order by updated_at desc) as rn
            from public.%I
        ) x
       where x.rn > 1
    $f$, t, cols, t);

    execute format($f$
      delete from public.%I a
       where exists (
         select 1 from public.%I b
          where (%s) is not distinct from (%s)
            and (b.updated_at, b.ctid) > (a.updated_at, a.ctid)
       )
    $f$, t, t,
      -- (a.day_no, a.ex_key) is not distinct from (b.day_no, b.ex_key)
      'a.' || replace(cols, ', ', ', a.'),
      'b.' || replace(cols, ', ', ', b.'));

    execute format('alter table public.%I drop constraint if exists %I', t, t || '_pkey');
    execute format('alter table public.%I add constraint %I primary key (%s)', t, t || '_pkey', cols);
  end loop;
end $$;


-- ---- 4. quem lê e quem escreve o plano -----------------------------------
-- Cinco tabelas deixam de ter a política do 003 §11 (`user_id = auth.uid()` nos
-- dois lados) e passam a ter esta forma:
--
--   select  using (true)                    — a semana é a mesma para todos
--   insert  with check (user_id = auth.uid())  — a linha diz quem a escreveu
--   update  using (true) with check (user_id = auth.uid())
--   delete  using (true)                    — tirar do plano é tirar para todos
--
-- O `with check` no update é o que impede escrever uma linha em nome de outra
-- pessoa: quem edita fica registado como quem editou. Não é uma restrição de
-- permissão — qualquer conta pode mudar qualquer linha, e é isso que se pede —
-- é a garantia de que a coluna não mente.
--
-- Há política de delete e não há `deleted` nestas cinco, ao contrário do
-- catálogo. A diferença é real: uma linha do catálogo é referida pela adição de
-- um dia e apagá-la a sério deixava essa referência pendurada; um exercício de
-- um dia não é referido por nada, e apagá-lo é apagá-lo.
do $$
declare t text;
begin
  foreach t in array array[
    'custom_days','custom_exercises','exercise_overrides','hidden_items','exercise_order'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    -- A política do 003 §11 (e a do 005 §2, com o mesmo nome).
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_read', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (user_id = auth.uid())',
      t || '_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (true) with check (user_id = auth.uid())',
      t || '_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true)',
      t || '_delete', t);

    -- O trigger e o replica identity já vêm do 003 §11 / 005 §2. Repetidos aqui
    -- para o ficheiro se bastar a si próprio se alguém correr só este.
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.touch_updated_at()',
      t || '_touch', t);
    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;


-- ---- 5. as adições de dia voltam a ser de todos --------------------------
-- O 008 §3 obrigava a `(day_no <= 100) = (user_id is null)`. Isso era verdade
-- enquanto o 101 era um número por conta. Depois do §2 o 101 é um dia só, de
-- toda a gente, por isso a adição também é.
alter table public.day_additions
  drop constraint if exists day_additions_scope_check;

update public.day_additions set user_id = null where user_id is not null;

alter table public.day_additions
  add constraint day_additions_scope_check
  check (user_id is null);

-- O índice único volta à forma do 006 §3: sem dono lá dentro, porque não há
-- dono. Duas adições vivas do mesmo exercício no mesmo dia continuam proibidas.
drop index if exists public.day_additions_unique_live;

create unique index if not exists day_additions_unique_live
  on public.day_additions (day_no, ex_key)
  where deleted = false;

-- Leitura e escrita abertas outra vez, como o 003 §12 e o 006 §1 as tinham.
drop policy if exists day_additions_read on public.day_additions;
create policy day_additions_read on public.day_additions
  for select to authenticated using (true);

drop policy if exists day_additions_update on public.day_additions;
create policy day_additions_update on public.day_additions
  for update to authenticated using (true) with check (true);

drop policy if exists day_additions_insert on public.day_additions;
create policy day_additions_insert on public.day_additions
  for insert to authenticated with check (created_by = auth.uid());


-- ---- 6. publicar, sem âmbito --------------------------------------------
-- Substitui a função do 008 §6, que é a do 007 com o âmbito lá dentro. A
-- assinatura é a mesma; o que muda é uma linha: `v_scope` deixa de existir e a
-- adição escreve-se sempre sem dono, porque não há dia que seja de uma conta só.
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

  -- Escrita à mão em vez de `on conflict`, pela razão do 007: o índice é parcial
  -- em `deleted = false`, por isso despublicar passava ao lado dele e inseria uma
  -- segunda linha apagada em vez de apagar a que lá está.
  select * into v_add
    from public.day_additions
   where day_no = p_day_no
     and ex_key = p_ex_key
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
      p_day_no, p_ex_key, null, '{}'::jsonb, v_deleted, v_uid, p_client
    )
    returning * into v_add;
  end if;

  return jsonb_build_object('catalog', to_jsonb(v_cat), 'addition', to_jsonb(v_add));
end $$;

revoke all on function public.publish_shared_exercise(
  text, smallint, text, text, text, text, text, text, text, text, text,
  boolean, text) from public;

grant execute on function public.publish_shared_exercise(
  text, smallint, text, text, text, text, text, text, text, text, text,
  boolean, text) to authenticated;


-- ---- 7. realtime ---------------------------------------------------------
-- As cinco já estão na publicação desde o 003 §14 e o 005 §3. Repetido aqui
-- porque é este ficheiro que promete "aparece nas outras contas já", e essa
-- promessa é falsa sem isto. `add table` rebenta se já lá estiver, por isso cada
-- uma vai no seu bloco.
do $$
declare t text;
begin
  foreach t in array array[
    'custom_days','custom_exercises','exercise_overrides','hidden_items',
    'exercise_order','catalog_exercises','day_additions'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
