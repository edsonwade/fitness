-- =========================================================================
-- 010_day_order.sql — a ordem da semana, partilhada e de cada conta
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- nove anteriores: podes correr outra vez sem estragar nada.
--
-- Uma tabela nova. Aditiva. Não escreve uma linha de dados, não muda nenhuma
-- tabela que já existe e não toca em política nenhuma das outras, por isso é
-- seguro correr em produção antes de o cliente novo subir: quem ainda estiver
-- na versão anterior nunca a lê.
--
-- PORQUÊ:
--   A fase 004 deixa a semana reordenar-se com arrasto directo. O que se guarda
--   NÃO é uma tabela nova de dias — os dias já existem (o programa 1..7 no
--   bundle, os teus 101+ em custom_days). O que se guarda é só a SEQUÊNCIA em
--   que eles aparecem: uma lista de day_no, por ordem.
--
--   O day_no continua a identificar o TREINO, não o dia da semana. Por isso
--   exercise_logs, exercise_order, custom_exercises, exercise_overrides e
--   hidden_items continuam a apontar para o mesmo sítio depois de a semana ser
--   reordenada. O dia da semana (Seg..Dom) passa a vir da POSIÇÃO na lista, no
--   cliente (custom-days.ts). A carga do Leg Press é da Perna, não da Segunda.
--
-- DUAS ORDENS, AS DUAS (decisão do utilizador, 2026-09-05):
--     user_id is null   → a ordem PARTILHADA. A semana do plano, de toda a
--                         gente, como o 009 fez ao resto do plano. Qualquer
--                         conta a pode mudar e ela chega à outra por realtime.
--     user_id = a conta → a ordem PRÓPRIA. O arranjo de quem quer a semana de
--                         outra maneira, e que só essa conta vê e muda.
--
--   Precedência, resolvida no cliente: se as duas existirem, ganha a da conta.
--   Sem linha própria, vê-se a partilhada. É a mesma forma que o 008 deu ao
--   day_additions — o dono na própria coluna — e não um booleano is_shared, que
--   deixava representável o estado ambíguo (uma ordem "partilhada" presa a uma
--   conta) em vez de impossível.
--
-- POR QUE UMA LINHA POR ÂMBITO, E O ID:
--   Há no máximo uma ordem partilhada e uma ordem por conta. O id da linha
--   partilhada é o uuid zero (um sentinela fixo); o id da linha própria é o
--   próprio user_id. Assim o upsert do cliente (on conflict pelo id, a chave
--   primária) é determinístico sem ter de ler a linha primeiro, e o índice
--   único do §3 garante que nunca há duas do mesmo âmbito mesmo numa corrida.
--
-- Rollback:
--   drop table public.day_order;
-- =========================================================================


-- ---- 1. a tabela --------------------------------------------------------
-- ordered_day_nos é a semana inteira, por ordem. smallint[] porque day_no é
-- smallint em todas as outras tabelas; guardar a mesma coisa com outro tipo era
-- convidar uma comparação a falhar em silêncio.
--
-- `on delete cascade` como em todas as outras: uma conta apagada leva consigo a
-- sua ordem própria. A partilhada tem user_id nulo e não é de ninguém em
-- particular, por isso nenhuma conta apagada a leva.
create table if not exists public.day_order (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users on delete cascade,
  ordered_day_nos   smallint[] not null,
  updated_at        timestamptz not null default now(),
  updated_by_client text
);


-- ---- 2. RLS -------------------------------------------------------------
-- A leitura devolve a partilhada (null) e a tua (auth.uid()), e nada mais: a
-- ordem própria de outra conta não chega ao teu browser, tal como o 008 fechou
-- para as adições. O cliente cruza as duas e escolhe a tua se existir.
--
-- A escrita é uma só política `for all`, porque esta tabela não tem autor
-- (created_by) que o insert tenha de defender — só dono. A condição repete-se em
-- `with check` para que ninguém escreva uma linha no âmbito de outra conta:
--   - a linha partilhada (user_id null) pode ser escrita por qualquer conta
--     autenticada, porque o plano é de todos (mesma decisão do 009/008: entre
--     duas pessoas qualquer uma pode reordenar a semana partilhada);
--   - a linha própria só pela conta dona.
-- Apagar segue a mesma using: uma conta só apaga a partilhada ou a sua própria
-- (é assim que o "repor ordem da semana" funciona — apaga só a própria), nunca
-- a de outra conta.
alter table public.day_order enable row level security;

drop policy if exists day_order_access on public.day_order;
create policy day_order_access on public.day_order
  for all to authenticated
  using (user_id is null or user_id = auth.uid())
  with check (user_id is null or user_id = auth.uid());


-- ---- 3. unicidade por âmbito --------------------------------------------
-- Uma partilhada e uma por conta, no máximo. `coalesce` com o uuid zero em vez
-- de deixar o nulo: num índice único dois nulos são distintos entre si, por isso
-- sem o coalesce a linha partilhada deixaria de ser única — que é exactamente a
-- garantia que queremos. É o mesmo padrão do day_additions_unique_live (008 §4).
create unique index if not exists day_order_unique_scope
  on public.day_order (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid));


-- ---- 4. trigger e replica identity --------------------------------------
-- touch_updated_at (do 003 §11) carimba o updated_at do lado do servidor em cada
-- update. O cliente manda a época de propósito — o palpite optimista tem de
-- perder para a resposta do servidor quando ela chega —, e é este trigger que dá
-- a resposta. Mesma forma que o custom_days (005 §2).
drop trigger if exists day_order_touch on public.day_order;
create trigger day_order_touch
  before update on public.day_order
  for each row execute function public.touch_updated_at();

-- Realtime precisa da linha inteira para saber qual foi alterada.
alter table public.day_order replica identity full;


-- ---- 5. realtime --------------------------------------------------------
-- add table rebenta se a tabela já lá estiver, e este ficheiro tem de poder
-- correr outra vez. Mesma forma do 003 §14 / 005 §3.
do $$
begin
  alter publication supabase_realtime add table public.day_order;
exception when duplicate_object then null;
end $$;
