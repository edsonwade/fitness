-- =========================================================================
-- 017_equipa.sql — o separador Equipa (fases 021 e 022)
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente: podes
-- correr outra vez sem estragar nada.
--
-- Corre DEPOIS do 002 (o mural), do 003 (sessões, perfis, treinadores) e do
-- 016 (a hora das marcações).
--
-- AS DUAS DECISÕES DELE, 2026-09-23:
--   1. O ranking mostra de cada conta o NOME, o NÚMERO DE SESSÕES e o VOLUME
--      em quilos, nos 7 dias, 30 dias e sempre. Nada mais: nem exercícios, nem
--      cargas, nem datas de outras pessoas.
--   2. Os treinadores são uma LISTA PARTILHADA: todas as contas a veem, e
--      qualquer uma acrescenta. As marcações continuam privadas de quem marca.
--
-- O QUE MUDA:
--   §1 team_members()      — nome e foto de cada conta, e só isso.
--   §2 team_leaderboard()  — sessões e volume por conta, calculados no
--                            servidor: as sessões dos outros continuam
--                            ilegíveis pelo RLS, só o total sai.
--   §3 community_posts     — duas colunas para a sessão anexada.
--   §4 trainers            — leitura para todos; escrita só de quem criou.
--
-- SEM PRÉ-VOO, E ESTA É A RAZÃO:
--   Nenhum CHECK novo sobre dados existentes. As colunas de §3 nascem vazias;
--   §4 troca políticas, não linhas.
-- =========================================================================


-- ---- 1. os membros: nome e foto, e mais nada -----------------------------
create or replace function public.team_members()
returns table (user_id uuid, name text, photo text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id, p.name, p.photo
  from auth.users u
  left join public.user_profiles p on p.user_id = u.id
  where auth.uid() is not null;
$$;

revoke all on function public.team_members() from public;
grant execute on function public.team_members() to authenticated;


-- ---- 2. o ranking: sessões e volume real, por período ------------------
-- `p_days` null = sempre. `prev_volume_kg` é o período anterior do mesmo
-- tamanho, para o "+ 4,2 t" do protótipo; null quando `p_days` é null.
-- O volume é o mesmo que a app calcula (metrics.ts, sessionLoad): carga ×
-- repetições × séries feitas, só das entradas com carga e repetições
-- legíveis; "10/mão" e "2x20" ficam de fora, como lá.
create or replace function public.team_leaderboard(p_days integer)
returns table (
  user_id uuid,
  name text,
  photo text,
  sessions integer,
  volume_kg numeric,
  prev_volume_kg numeric
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with b as (
    select
      case when p_days is null then date '0001-01-01' else current_date - (p_days - 1) end as from_d,
      case when p_days is null then null else current_date - (2 * p_days - 1) end as prev_from,
      case when p_days is null then null else current_date - p_days end as prev_to
  ),
  s as (
    select s.id, s.user_id, coalesce(s.local_date::date, s.performed_at::date) as d
    from public.sessions s
  ),
  e as (
    select
      se.session_id,
      case
        when se.weight ~ '[/×xX]' then null
        else nullif(substring(replace(se.weight, ',', '.') from '(\d+(?:\.\d+)?)'), '')::numeric
      end as w,
      nullif(substring(se.reps from '(\d+)'), '')::numeric as r,
      coalesce(se.sets_done, 0) as n
    from public.session_entries se
  ),
  l as (
    select session_id, sum(w * r * n) as kg
    from e
    where w is not null and r is not null and n > 0
    group by session_id
  )
  select
    u.id,
    p.name,
    p.photo,
    (count(distinct s.id) filter (where s.d >= b.from_d))::integer,
    coalesce(sum(l.kg) filter (where s.d >= b.from_d), 0),
    sum(l.kg) filter (where b.prev_from is not null and s.d between b.prev_from and b.prev_to)
  from auth.users u
  cross join b
  left join public.user_profiles p on p.user_id = u.id
  left join s on s.user_id = u.id
  left join l on l.session_id = s.id
  where auth.uid() is not null
  group by u.id, p.name, p.photo
  having count(s.id) > 0 or u.id = auth.uid();
$$;

revoke all on function public.team_leaderboard(integer) from public;
grant execute on function public.team_leaderboard(integer) to authenticated;


-- ---- 3. a sessão anexada a uma publicação --------------------------------
-- As sessões são privadas, por isso a publicação leva uma cópia do que se
-- mostra — o nome do treino e o volume — e não uma chave para uma linha que
-- os outros não conseguem ler.
alter table public.community_posts add column if not exists session_name text;
alter table public.community_posts add column if not exists session_volume_kg numeric;


-- ---- 4. treinadores: lista partilhada ------------------------------------
alter table public.trainers enable row level security;
drop policy if exists trainers_own on public.trainers;
drop policy if exists trainers_read on public.trainers;
drop policy if exists trainers_insert on public.trainers;
drop policy if exists trainers_update on public.trainers;
drop policy if exists trainers_delete on public.trainers;

create policy trainers_read on public.trainers for select to authenticated using (true);
create policy trainers_insert on public.trainers for insert to authenticated
  with check (user_id = auth.uid());
create policy trainers_update on public.trainers for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy trainers_delete on public.trainers for delete to authenticated
  using (user_id = auth.uid());

do $$
begin
  execute 'alter publication supabase_realtime add table public.trainers';
exception when duplicate_object then null;
end $$;


-- ---- 5. verificação: 2 funções, 2 colunas, 4 políticas ------------------
select 'função' as o_que, proname as nome from pg_proc
where proname in ('team_members', 'team_leaderboard')
union all
select 'coluna', column_name from information_schema.columns
where table_schema = 'public' and table_name = 'community_posts'
  and column_name in ('session_name', 'session_volume_kg')
union all
select 'política', policyname from pg_policies
where schemaname = 'public' and tablename = 'trainers'
order by 1, 2;
