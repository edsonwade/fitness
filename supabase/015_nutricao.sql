-- =========================================================================
-- 015_nutricao.sql — as tabelas da Nutrição (fase 020)
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- anteriores: podes correr outra vez sem estragar nada.
--
-- Corre DEPOIS do 003 (usa public.touch_updated_at e public.user_profiles).
--
-- Aditivo. Três tabelas novas, cada uma só da própria conta (RLS user_id =
-- auth.uid()), e um gatilho. Não escreve uma linha de dados que já exista, não
-- apaga nada, não muda nenhuma coluna de nenhuma tabela anterior.
--
-- SEM PRÉ-VOO, E ESTA É A RAZÃO:
--   As três tabelas nascem vazias. Os CHECK só se aplicam ao que se escrever
--   daqui para a frente, por isso não há dados existentes que possam falhar.
--
-- O QUE CADA TABELA É (proto/v2/06-nutricao.html):
--   nutrition_targets — a meta do dia: calorias e proteína. Uma linha por conta.
--   food_entries      — o diário de macros: uma linha por alimento registado,
--                       com a refeição, a data e de onde veio (texto, voz, IA,
--                       código). `estimate` diz se é uma estimativa: a IA e a
--                       voz são; o código de barras e o texto com números não.
--   weight_logs       — o tracker de peso: um registo por dia.
--
-- O PESO NÃO É UMA SEGUNDA VERDADE:
--   user_profiles.weight_current continua a ser o peso da conta. O gatilho do
--   §4 escreve-o sempre que se regista o peso do dia mais recente, e assim o
--   perfil e o tracker dizem sempre o mesmo número.
-- =========================================================================


-- ---- 1. a meta do dia ---------------------------------------------------
create table if not exists public.nutrition_targets (
  user_id           uuid primary key references auth.users on delete cascade,
  kcal              integer check (kcal is null or kcal between 800 and 6000),
  protein_g         integer check (protein_g is null or protein_g between 20 and 400),
  updated_at        timestamptz not null default now(),
  updated_by_client text
);


-- ---- 2. o diário de macros ----------------------------------------------
create table if not exists public.food_entries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  local_date        text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  meal              text not null check (meal in ('breakfast', 'lunch', 'snack', 'dinner')),
  name              text not null check (length(trim(name)) > 0),
  kcal              integer check (kcal is null or kcal between 0 and 5000),
  protein_g         numeric(6,1) check (protein_g is null or protein_g between 0 and 500),
  carbs_g           numeric(6,1) check (carbs_g is null or carbs_g between 0 and 1000),
  fat_g             numeric(6,1) check (fat_g is null or fat_g between 0 and 500),
  source            text not null default 'text' check (source in ('text', 'voice', 'ai', 'code')),
  estimate          boolean not null default false,
  barcode           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists food_entries_user_date on public.food_entries (user_id, local_date desc);


-- ---- 3. o peso ----------------------------------------------------------
create table if not exists public.weight_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  local_date        text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  kg                numeric(5,1) not null check (kg between 30 and 250),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  unique (user_id, local_date)
);

create index if not exists weight_logs_user_date on public.weight_logs (user_id, local_date desc);


-- ---- 4. o peso do perfil acompanha o registo mais recente ---------------
create or replace function public.weight_logs_to_profile()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Só o dia mais recente manda: corrigir o peso de há uma semana não muda o
  -- peso de hoje.
  if not exists (
    select 1 from public.weight_logs w
    where w.user_id = new.user_id and w.local_date > new.local_date
  ) then
    insert into public.user_profiles (user_id, weight_current)
    values (new.user_id, trim(to_char(new.kg, 'FM990.0')))
    on conflict (user_id) do update set weight_current = excluded.weight_current;
  end if;
  return new;
end $$;

drop trigger if exists weight_logs_profile on public.weight_logs;
create trigger weight_logs_profile
  after insert or update of kg, local_date on public.weight_logs
  for each row execute function public.weight_logs_to_profile();


-- ---- 5. RLS, updated_at e realtime --------------------------------------
do $$
declare t text;
begin
  foreach t in array array['nutrition_targets', 'food_entries', 'weight_logs']
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

    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;


-- ---- 6. verificação: tem de devolver 3 linhas, todas com rls = true ------
select c.relname as tabela, c.relrowsecurity as rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('nutrition_targets', 'food_entries', 'weight_logs')
order by 1;
