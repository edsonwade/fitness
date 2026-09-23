-- =========================================================================
-- 016_conta_e_marcacoes.sql — apagar a conta (fase 023) e a hora das
-- marcações com treinador (fase 022)
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente: podes
-- correr outra vez sem estragar nada.
--
-- Corre DEPOIS do 003 (é lá que trainer_sessions nasce).
--
-- Aditivo. Duas colunas novas em trainer_sessions, que nascem vazias, e uma
-- função. Não escreve uma linha de dados, não apaga nada, não muda nenhuma
-- coluna que já existe e não mexe nas políticas.
--
-- SEM PRÉ-VOO, E ESTA É A RAZÃO:
--   As duas colunas são nullable e o CHECK só olha para valores novos; as
--   linhas que já existem ficam com null e passam sem tocar em nada.
-- =========================================================================


-- ---- 1. a hora e a duração de uma marcação -----------------------------
-- `session_date` (date) fica, porque a app antiga só guardava o dia. As
-- marcações novas guardam o instante inteiro em timestamptz — uma sessão às
-- 18:00 é às 18:00 para os dois lados — e quanto tempo dura.
alter table public.trainer_sessions add column if not exists starts_at timestamptz;
alter table public.trainer_sessions add column if not exists duration_min smallint;

do $$
begin
  alter table public.trainer_sessions
    add constraint trainer_sessions_duration_ok
    check (duration_min is null or duration_min between 15 and 240);
exception when duplicate_object then null;
end $$;


-- ---- 2. apagar a conta ---------------------------------------------------
-- "Apagar a conta" (proto/v2/08-perfil.html, frame 3). Apagar um utilizador
-- de auth.users só se faz do lado do servidor; o cliente só pode apagar-se a
-- si próprio, porque a função lê auth.uid() e não recebe argumento nenhum.
-- Todas as tabelas privadas têm `on delete cascade` para auth.users, por isso
-- as sessões, as séries, os objetivos e o resto vão com ela. O plano
-- partilhado (dias, exercícios, ordem) fica, porque é de toda a gente.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare me uuid := auth.uid();
begin
  if me is null then
    raise exception 'sem sessão';
  end if;
  delete from auth.users where id = me;
end $$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;


-- ---- 3. verificação: 2 colunas e 1 função -------------------------------
select 'coluna' as o_que, column_name as nome
from information_schema.columns
where table_schema = 'public' and table_name = 'trainer_sessions'
  and column_name in ('starts_at', 'duration_min')
union all
select 'função', proname from pg_proc where proname = 'delete_my_account'
order by 1, 2;
