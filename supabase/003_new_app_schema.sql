-- =========================================================================
-- 003_new_app_schema.sql — o estado privado, normalizado
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como o
-- 001 e o 002: podes correr outra vez sem estragar nada.
--
-- O que faz:
--   * Treze tabelas privadas que substituem o blob jsonb do user_state
--   * catalog_exercises + day_additions — a camada aditiva do catálogo
--   * migration_errors — isolamento de erros por utilizador durante o backfill
--   * updated_by_client em tudo, para o realtime não repetir a escrita local
--   * merge_exercise_log — merge campo a campo na única tabela onde as escritas
--     de dois aparelhos se cruzam a sério (ponto 15)
--   * Realtime ligado, replica identity full, RLS auth.uid() em todas
--
-- O QUE NÃO TOCA, DE PROPÓSITO:
--   * user_state. Não é lido, escrito, alterado nem apagado aqui. Continua a
--     ser a fonte de verdade até ao cutover
--   * shared_exercises, shared_days e as políticas do 001 e do 002. Apertar
--     essas políticas parte a aplicação antiga, que ainda está no ar e ainda
--     deixa toda a gente editar. Esse aperto é do cutover, e vive no 004
--
-- Por isto ser só aditivo, é seguro correr em produção ANTES de qualquer
-- alteração ao cliente (plano, M1). Não escreve uma única linha de dados.
--
-- Rollback: apagar as tabelas criadas aqui. Nada mais foi tocado.
-- =========================================================================


-- ---- 0. updated_at automático -------------------------------------------
-- Uma só função para as treze tabelas. Sem isto o updated_at fica ao critério
-- do cliente, e é ele que decide o vencedor num last-write-wins.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;


-- ---- 1. registo de cargas ------------------------------------------------
-- STATE.ex['<dia>:<bloco>:<exercicio>'] → três colunas.
--
-- weight e reps são TEXT e continuam a ser. A app antiga aceita '60', '12,5' e
-- '10/lado', e isso é verdade do produto, não uma falha de validação. Converter
-- para numeric aqui perdia dados reais de pessoas reais.
create table if not exists public.exercise_logs (
  user_id           uuid not null references auth.users on delete cascade,
  day_no            smallint not null,
  block             text not null,
  ex_key            text not null,
  weight            text,
  reps              text,
  sets_done         boolean[] not null default '{}',
  note              text,
  -- Um carimbo por campo, para o merge do ponto 15. Fica aqui e não numa tabela
  -- à parte porque é lido e escrito sempre com a linha, nunca sozinho.
  field_updated_at  jsonb not null default '{}'::jsonb,
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  primary key (user_id, day_no, block, ex_key)
);

-- Para quem já correu este ficheiro antes de a coluna existir: create table if
-- not exists não acrescenta colunas a uma tabela que já lá está.
alter table public.exercise_logs
  add column if not exists field_updated_at jsonb not null default '{}'::jsonb;

create index if not exists exercise_logs_user_day on public.exercise_logs (user_id, day_no);


-- ---- 2. sessões concluídas ----------------------------------------------
create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  performed_at      timestamptz not null default now(),
  day_name          text,
  block             text,
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists sessions_user_performed on public.sessions (user_id, performed_at desc);

-- idx preserva a ordem dentro da sessão. A app antiga guarda um array, e um
-- array tem ordem; sem esta coluna a sessão voltava baralhada.
--
-- COLUNAS A SÉRIO, não as strings de ecrã da app antiga. O js/ui.js:2008 guardava
-- alvo como '4×10' e done como '3/4', que são formatação, não dados: assim não se
-- consegue somar séries feitas, filtrar por repetições nem mudar de idioma sem
-- reescrever histórico. Isto é aplicação nova, e o formato de apresentação da
-- antiga não entra no modelo de dados.
--
-- target_reps continua TEXT porque as repetições reais incluem '10/lado' e '8-10'.
-- target_raw só é escrito quando a string antiga não se deixou separar, para o
-- backfill nunca deitar fora o que não soube ler.
create table if not exists public.session_entries (
  session_id        uuid not null references public.sessions on delete cascade,
  idx               smallint not null,
  user_id           uuid not null references auth.users on delete cascade,
  name              text,
  target_sets       text,
  target_reps       text,
  target_raw        text,
  sets_done         smallint,
  sets_total        smallint,
  weight            text,
  reps              text,
  note              text,
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  primary key (session_id, idx)
);

create index if not exists session_entries_user on public.session_entries (user_id);


-- ---- 3. metas ------------------------------------------------------------
create table if not exists public.goals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  title             text,
  type              text,
  unit              text,
  start_value       text,
  target_value      text,
  current_value     text,
  deadline          text,
  photo             text,
  notes             text,
  created_at        timestamptz not null default now(),
  hit_at            timestamptz,
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists goals_user on public.goals (user_id, created_at desc);


-- ---- 4. treinadores ------------------------------------------------------
create table if not exists public.trainers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  name              text,
  photo             text,
  specialty         text,
  bio               text,
  phone             text,
  email             text,
  instagram         text,
  availability      text,
  notes             text,
  plans             text[] not null default '{}',
  preferred_days    smallint[] not null default '{}',
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists trainers_user on public.trainers (user_id);

create table if not exists public.trainer_sessions (
  id                uuid primary key default gen_random_uuid(),
  trainer_id        uuid not null references public.trainers on delete cascade,
  user_id           uuid not null references auth.users on delete cascade,
  -- date, não timestamptz: a app antiga guarda 'YYYY-MM-DD' e uma hora inventada
  -- ao converter deslocava a sessão um dia em metade dos fusos.
  session_date      date,
  note              text,
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists trainer_sessions_trainer on public.trainer_sessions (trainer_id, session_date desc);
create index if not exists trainer_sessions_user on public.trainer_sessions (user_id);


-- ---- 5. perfil e definições ---------------------------------------------
-- Medidas ficam TEXT pela mesma razão que as cargas: a app antiga aceita texto
-- livre e há gente com '1,78' e com '78 kg' guardados.
create table if not exists public.user_profiles (
  user_id           uuid primary key references auth.users on delete cascade,
  name              text,
  photo             text,
  height_cm         text,
  weight_start      text,
  weight_current    text,
  weight_target     text,
  training_days     smallint[] not null default '{1,2,3,4,5,6}',
  onboarded_at      timestamptz,
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

-- Três valores pequenos que não merecem tabelas próprias.
create table if not exists public.user_settings (
  user_id           uuid primary key references auth.users on delete cascade,
  theme             text not null default 'light',
  lang              text not null default 'pt',
  rest_note         text not null default '',
  updated_at        timestamptz not null default now(),
  updated_by_client text
);


-- ---- 6. exercícios próprios ---------------------------------------------
-- legacy_key NÃO é decoração. No blob antigo o id é um inteiro e o resto do
-- estado refere-se a este exercício pela string 'c<id>': está no STATE.order,
-- no STATE.ex e no STATE.restSec. Trocar o id por uuid sem guardar a chave
-- antiga partia todas essas referências de uma vez. O backfill escreve-a e o
-- cliente resolve por ela.
create table if not exists public.custom_exercises (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  day_no            smallint not null,
  legacy_key        text,
  name              text,
  equipment         text,
  sets              text,
  reps              text,
  load              text,
  rest              text,
  video_id          text,
  photo_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists custom_exercises_user_day on public.custom_exercises (user_id, day_no);
create unique index if not exists custom_exercises_legacy on public.custom_exercises (user_id, legacy_key)
  where legacy_key is not null;


-- ---- 7. alterações a exercícios da base ---------------------------------
-- Uma coluna anulável por campo, e não um jsonb, porque js/ui.js:2264-2268 poda
-- este registo até só sobrar a foto depois de uma publicação partilhada. Com
-- colunas, podar é pôr a null; com jsonb seria reescrever o objecto todo e
-- perder a distinção entre "não definido" e "definido a vazio".
create table if not exists public.exercise_overrides (
  user_id           uuid not null references auth.users on delete cascade,
  day_no            smallint not null,
  ex_key            text not null,
  name              text,
  equipment         text,
  sets              text,
  reps              text,
  load              text,
  rest              text,
  video_id          text,
  photo_url         text,
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  primary key (user_id, day_no, ex_key)
);


-- ---- 8. exercícios escondidos, descanso e ordem -------------------------
-- A presença da linha é que significa escondido. Sem coluna de booleano: um
-- booleano a false e a ausência da linha diriam a mesma coisa de duas maneiras.
create table if not exists public.hidden_items (
  user_id           uuid not null references auth.users on delete cascade,
  day_no            smallint not null,
  ex_key            text not null,
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  primary key (user_id, day_no, ex_key)
);

-- Ausência da chave significa "usa o descanso do plano". O descanso do plano é
-- uma sugestão e quem decide é quem treina.
create table if not exists public.rest_preferences (
  user_id           uuid not null references auth.users on delete cascade,
  ex_key            text not null,
  seconds           integer not null,
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  primary key (user_id, ex_key)
);

-- Uma chave em falta cai no fim, na ordem natural, para um exercício novo
-- aparecer no fim e nunca desaparecer.
create table if not exists public.exercise_order (
  user_id           uuid not null references auth.users on delete cascade,
  day_no            smallint not null,
  ordered_keys      text[] not null default '{}',
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  primary key (user_id, day_no)
);


-- ---- 9. catálogo aditivo -------------------------------------------------
-- NUNCA os 36 da base. Esses vivem no bundle, em content/, e por isso não há
-- linha nenhuma aqui que os possa editar ou apagar.
--
-- created_by = auth.uid() em vez do using(true) do 001: foi o using(true)
-- combinado com registo aberto que deixou editar os exercícios da base. Repetir
-- isso uma camada abaixo reproduzia a mesma exposição.
create table if not exists public.catalog_exercises (
  id                uuid primary key default gen_random_uuid(),
  ex_key            text unique not null,
  name_pt           text not null,
  name_en           text,
  equipment         text,
  sets              text,
  reps              text,
  load              text,
  rest              text,
  video_id          text,
  photo_url         text,
  deleted           boolean not null default false,
  created_by        uuid not null references auth.users on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists catalog_exercises_creator on public.catalog_exercises (created_by);

create table if not exists public.day_additions (
  id                uuid primary key default gen_random_uuid(),
  day_no            smallint not null,
  ex_key            text not null,
  block_config      jsonb not null default '{}'::jsonb,
  deleted           boolean not null default false,
  created_by        uuid not null references auth.users on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists day_additions_day on public.day_additions (day_no) where deleted = false;


-- ---- 10. erros de migração ----------------------------------------------
-- Um blob malformado de uma pessoa não pode abortar o lote. O erro fica aqui,
-- com o utilizador, e o M3 exige esta tabela vazia antes do cutover.
create table if not exists public.migration_errors (
  id         bigint generated always as identity primary key,
  user_id    uuid,
  step       text not null,
  detail     text,
  occurred_at timestamptz not null default now()
);

alter table public.migration_errors enable row level security;
-- Sem políticas: só o service_role lá chega. Um utilizador não tem nada que ler
-- os erros de migração de outro.


-- ---- 11. RLS em tudo o que é privado ------------------------------------
-- Um ciclo em vez de treze blocos copiados. Copiar treze vezes é como se falha
-- uma: a tabela fica sem política, e sem política com RLS ligado ninguém lê,
-- o que só se descobre em produção.
do $$
declare t text;
begin
  foreach t in array array[
    'exercise_logs','sessions','session_entries','goals','trainers',
    'trainer_sessions','user_profiles','user_settings','custom_exercises',
    'exercise_overrides','hidden_items','rest_preferences','exercise_order'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_own', t);

    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.touch_updated_at()',
      t || '_touch', t);

    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;


-- ---- 12. RLS do catálogo aditivo ----------------------------------------
-- Leitura para todos os autenticados, escrita só de quem criou.
do $$
declare t text;
begin
  foreach t in array array['catalog_exercises','day_additions']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_read', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (created_by = auth.uid())',
      t || '_insert', t);
    -- Sem política de delete: apagar é pôr deleted = true, para uma referência
    -- de outra pessoa nunca ficar pendurada.
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (created_by = auth.uid()) with check (created_by = auth.uid())',
      t || '_update', t);

    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.touch_updated_at()',
      t || '_touch', t);

    execute format('alter table public.%I replica identity full', t);
  end loop;
end $$;


-- ---- 13. supressão de eco no realtime das tabelas do 002 ----------------
-- Aditivo. Não mexe em políticas nem em dados.
alter table public.community_posts add column if not exists updated_by_client text;
alter table public.post_comments   add column if not exists updated_by_client text;
alter table public.post_likes      add column if not exists updated_by_client text;
alter table public.post_reactions  add column if not exists updated_by_client text;


-- ---- 14. realtime --------------------------------------------------------
-- add table rebenta se a tabela já lá estiver, e este ficheiro tem de poder
-- correr outra vez, por isso cada uma vai no seu bloco. Mesma forma do 002.
do $$
declare t text;
begin
  foreach t in array array[
    'exercise_logs','sessions','session_entries','goals','trainers',
    'trainer_sessions','user_profiles','user_settings','custom_exercises',
    'exercise_overrides','hidden_items','rest_preferences','exercise_order',
    'catalog_exercises','day_additions'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;


-- ---- 15. merge por campo em exercise_logs -------------------------------
-- A decisão O2 do plano, e só nesta tabela.
--
-- O caso real: o telemóvel no ginásio sem rede tica uma série; o PC em casa, ao
-- mesmo tempo, escreve uma nota na mesma linha. Quando a rede volta, o outbox do
-- telemóvel envia o que tinha. Com last-write-wins por linha, quem chega depois
-- apaga o campo do outro, e ninguém percebe porquê: a nota simplesmente
-- desapareceu.
--
-- Por isso o cliente não escreve esta tabela directamente. Manda só os campos que
-- mexeu e o instante em que os mexeu, e cada campo é comparado com o seu próprio
-- carimbo. Uma escrita antiga que chega tarde perde nos campos onde o servidor já
-- tem coisa mais recente, e ganha nos outros. As outras doze tabelas ficam em
-- last-write-wins por linha, que chega para elas.
--
-- security invoker, para o RLS continuar a mandar: a função só chega às linhas de
-- quem a chama, tal como um update normal.
create or replace function public.merge_exercise_log(
  p_day_no  smallint,
  p_block   text,
  p_ex_key  text,
  p_fields  jsonb,        -- só os campos alterados: weight, reps, sets_done, note
  p_at      timestamptz,  -- quando o CLIENTE alterou, não quando isto chegou
  p_client  text
) returns public.exercise_logs
language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  -- Um relógio adiantado no cliente carimbava o futuro e ganhava para sempre.
  -- Atrasado não faz mal nenhum: só perde para o que já lá está.
  v_at     timestamptz := least(p_at, now());
  v_row    public.exercise_logs;
  v_stamps jsonb;
  v_sets   boolean[];
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'merge_exercise_log: sem sessão';
  end if;

  select * into v_row
    from public.exercise_logs
   where user_id = v_uid and day_no = p_day_no and block = p_block and ex_key = p_ex_key
     for update;

  -- Guardado já, e não lido de `found` mais abaixo: qualquer select pelo meio
  -- reescreve o `found`, e o próximo é mesmo um select.
  v_exists := found;

  if p_fields ? 'sets_done' then
    select coalesce(array_agg(e::boolean order by ord), '{}')
      into v_sets
      from jsonb_array_elements_text(p_fields->'sets_done') with ordinality as t(e, ord);
  end if;

  if not v_exists then
    insert into public.exercise_logs (
      user_id, day_no, block, ex_key, weight, reps, sets_done, note,
      field_updated_at, updated_by_client
    ) values (
      v_uid, p_day_no, p_block, p_ex_key,
      p_fields->>'weight', p_fields->>'reps',
      coalesce(v_sets, '{}'), p_fields->>'note',
      (select coalesce(jsonb_object_agg(k, v_at), '{}'::jsonb)
         from jsonb_object_keys(p_fields) as k),
      p_client
    )
    returning * into v_row;
    return v_row;
  end if;

  v_stamps := coalesce(v_row.field_updated_at, '{}'::jsonb);

  -- Campo a campo, sempre a mesma pergunta: o que trago é mais recente do que o
  -- que já cá está? Escrito à mão quatro vezes em vez de sql dinâmico, para se
  -- poder ler o que a função faz sem a executar.
  if p_fields ? 'weight'
     and v_at >= coalesce((v_stamps->>'weight')::timestamptz, '-infinity') then
    v_row.weight := p_fields->>'weight';
    v_stamps := jsonb_set(v_stamps, '{weight}', to_jsonb(v_at));
  end if;

  if p_fields ? 'reps'
     and v_at >= coalesce((v_stamps->>'reps')::timestamptz, '-infinity') then
    v_row.reps := p_fields->>'reps';
    v_stamps := jsonb_set(v_stamps, '{reps}', to_jsonb(v_at));
  end if;

  if p_fields ? 'sets_done'
     and v_at >= coalesce((v_stamps->>'sets_done')::timestamptz, '-infinity') then
    v_row.sets_done := coalesce(v_sets, '{}');
    v_stamps := jsonb_set(v_stamps, '{sets_done}', to_jsonb(v_at));
  end if;

  if p_fields ? 'note'
     and v_at >= coalesce((v_stamps->>'note')::timestamptz, '-infinity') then
    v_row.note := p_fields->>'note';
    v_stamps := jsonb_set(v_stamps, '{note}', to_jsonb(v_at));
  end if;

  update public.exercise_logs set
    weight            = v_row.weight,
    reps              = v_row.reps,
    sets_done         = v_row.sets_done,
    note              = v_row.note,
    field_updated_at  = v_stamps,
    updated_by_client = p_client
   where user_id = v_uid and day_no = p_day_no and block = p_block and ex_key = p_ex_key
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.merge_exercise_log(smallint, text, text, jsonb, timestamptz, text) from public;
grant execute on function public.merge_exercise_log(smallint, text, text, jsonb, timestamptz, text) to authenticated;
