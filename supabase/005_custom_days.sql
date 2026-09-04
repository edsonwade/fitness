-- =========================================================================
-- 005_custom_days.sql — dias de treino próprios
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como o
-- 001, o 002, o 003 e o 004: podes correr outra vez sem estragar nada.
--
-- Uma tabela nova. Aditiva. Não escreve uma linha de dados, não muda nenhuma
-- tabela que já existe e não toca em política nenhuma das outras, por isso é
-- seguro correr em produção antes de o cliente novo subir: quem ainda estiver
-- na versão anterior nunca a lê.
--
-- PORQUÊ:
--   O plano da base tem sete dias e é isso que ele é. Quem treina um oitavo
--   dia, ou quem quer um dia de braço que o plano não tem, não tinha onde o
--   pôr: a app só sabia abrir 1 a 7.
--
--   day_no >= 101 é a decisão D4 do plano de edição do dia, e é ela que faz
--   isto caber sem mexer em nada. day_no já é smallint em exercise_logs,
--   custom_exercises, hidden_items, exercise_order e exercise_overrides.
--   1 a 7 é o plano base; 101 para cima é teu. Um exercício, um registo de
--   carga ou uma ordem num dia próprio viajam pelo caminho que já está
--   construído e testado, sem uma coluna nova em lado nenhum.
--
--   O intervalo 8..100 fica de fora de propósito. É a margem para o plano da
--   base crescer sem colidir com dias que já estão criados em contas reais.
--
-- O QUE ESTA TABELA NÃO TEM, E PORQUÊ:
--   Não tem dia da semana. Os sete da base têm um (Seg..Dom) porque o plano
--   os prende a um dia; um dia teu é teu e treina-lo quando quiseres. Inventar
--   aqui uma coluna de dia da semana era inventar uma regra que ninguém pediu.
--
--   Não tem items. Os exercícios de um dia próprio são linhas de
--   custom_exercises com este day_no, exactamente como os que acrescentas a um
--   dia da base. Uma segunda forma de guardar exercícios seria uma segunda
--   forma de os ler, de os ordenar e de os esconder.
--
-- Rollback: drop table public.custom_days;
-- =========================================================================


-- ---- 1. a tabela --------------------------------------------------------
-- A chave é (user_id, day_no), a mesma forma de exercise_order: o número do
-- dia é único dentro da conta e é por ele que tudo o resto se refere a este
-- dia. Um uuid como chave obrigaria cada linha das outras cinco tabelas a
-- guardar duas referências em vez de uma.
create table if not exists public.custom_days (
  user_id           uuid not null references auth.users on delete cascade,
  day_no            smallint not null,
  name              text,
  goal              text,
  warm              text,
  type              text not null default 'strength',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by_client text,
  primary key (user_id, day_no)
);

-- Separados do create table, e com o drop à frente, para o ficheiro poder
-- correr outra vez: add constraint não tem forma de "if not exists".
alter table public.custom_days
  drop constraint if exists custom_days_day_no_check;

alter table public.custom_days
  add constraint custom_days_day_no_check
  check (day_no >= 101);

-- O mesmo vocabulário do conteúdo empacotado (content/schema.ts, daySchema).
-- 'cardio' entra aqui apesar de o formulário ainda não o oferecer: um dia de
-- cardio precisa de prescrições de cardio, que só existem no bundle, e um
-- botão que não muda nada não é um botão. A palavra fica aceite para o ecrã
-- poder passar a oferecê-la sem uma migração nova.
alter table public.custom_days
  drop constraint if exists custom_days_type_check;

alter table public.custom_days
  add constraint custom_days_type_check
  check (type in ('strength', 'cardio', 'rest'));


-- ---- 2. RLS, trigger e replica identity ---------------------------------
-- Uma tabela privada, com a mesma forma que o 003 §11 dá às outras treze.
alter table public.custom_days enable row level security;

drop policy if exists custom_days_own on public.custom_days;
create policy custom_days_own on public.custom_days
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists custom_days_touch on public.custom_days;
create trigger custom_days_touch
  before update on public.custom_days
  for each row execute function public.touch_updated_at();

-- Realtime precisa da linha inteira para saber qual foi alterada.
alter table public.custom_days replica identity full;


-- ---- 3. realtime --------------------------------------------------------
-- add table rebenta se a tabela já lá estiver, e este ficheiro tem de poder
-- correr outra vez. Mesma forma do 003 §14.
do $$
begin
  alter publication supabase_realtime add table public.custom_days;
exception when duplicate_object then null;
end $$;
