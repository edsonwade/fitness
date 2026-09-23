-- =========================================================================
-- 018 · os eventos do calendário
--
-- B7 de .claude/skills/executar-demo-equipamento-ordem/PLANO.md, trabalho da skill
-- calendario-aberto-e-eventos (.claude/skills/calendario-aberto-e-eventos/SKILL.md).
--
-- Pedido dele, 2026-09-23: "isso é um calendário normal anual, as pessoas podem criar
-- eventos em qualquer dia e fica como notificação quando chega o dia".
--
--   calendar_events — um evento num dia: título, hora opcional, nota, e se avisa.
--
-- É da conta que o cria, como o peso e o diário: RLS user_id = auth.uid().
-- Correr uma vez no SQL editor do Supabase. É idempotente.
-- =========================================================================

create table if not exists public.calendar_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  local_date        text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  local_time        text check (local_time is null or local_time ~ '^\d{2}:\d{2}$'),
  title             text not null check (length(trim(title)) > 0),
  note              text,
  notify            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text
);

create index if not exists calendar_events_user_date on public.calendar_events (user_id, local_date);


-- ---- RLS, updated_at e realtime ------------------------------------------
alter table public.calendar_events enable row level security;

drop policy if exists calendar_events_own on public.calendar_events;
create policy calendar_events_own on public.calendar_events for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists calendar_events_touch on public.calendar_events;
create trigger calendar_events_touch before update on public.calendar_events
  for each row execute function public.touch_updated_at();

alter table public.calendar_events replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.calendar_events;
exception when duplicate_object then null;
end $$;


-- ---- verificação: tem de devolver 1 linha, com rls = true ----------------
select c.relname as tabela, c.relrowsecurity as rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'calendar_events';
