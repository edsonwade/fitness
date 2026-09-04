-- =========================================================================
-- 006_shared_catalog.sql — o catálogo partilhado, escrita aberta
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- anteriores: podes correr outra vez sem estragar nada.
--
-- Não cria tabelas. Não cria colunas. Não escreve uma linha de dados. Troca
-- políticas de escrita em duas tabelas que o 003 já criou.
--
-- PORQUÊ:
--   Decisão do utilizador em 2026-09-02, registada em
--   .claude/plans/day-editing.md §3: são duas pessoas a usar a app, as duas
--   podem publicar e as duas podem remover, e a questão reabre aos 10
--   utilizadores. Não há aprovação, não há revisor e não há estado, porque
--   entre duas pessoas que se conhecem uma fila de revisão não tem quem a
--   reveja. É por isso que este ficheiro não acrescenta uma coluna 'status':
--   uma coluna que ninguém lê é uma promessa de funcionalidade que não existe.
--
-- POR QUE É QUE using (true) É SEGURO AQUI, E SÓ AQUI:
--   O 003 escreveu escrita só do autor, e escreveu a razão: foi o using(true)
--   do 001 com registo aberto que deixou editar os exercícios da base.
--
--   Essa combinação já não existe. Sob a decisão D4 do plano, os 36 exercícios,
--   os 38 vídeos, os 7 dias e as técnicas escritas não são linhas de base de
--   dados: vivem no bundle, em src/content/. Nenhuma política sobre
--   catalog_exercises ou day_additions consegue chegar a uma linha do plano,
--   porque não há lá nenhuma. O que uma escrita aberta arrisca hoje é conteúdo
--   publicado pelos utilizadores, e é esse o risco que foi aceite por escrito.
--
--   O custo, dito e não escondido: o registo é aberto, por isso a conta que um
--   estranho criar pode apagar o que as duas pessoas publicaram. Aceite de
--   propósito enquanto forem duas. É o que o gatilho dos 10 reabre.
--
-- Rollback (volta ao modelo do 003, escrita só do autor):
--   drop policy catalog_exercises_update on public.catalog_exercises;
--   create policy catalog_exercises_update on public.catalog_exercises
--     for update to authenticated
--     using (created_by = auth.uid()) with check (created_by = auth.uid());
--   e o mesmo para day_additions.
-- =========================================================================


-- ---- 0. o tipo de movimento de um exercício publicado -------------------
-- A mesma coluna que o 004 deu ao custom_exercises, e pela mesma razão: prog()
-- precisa de saber que tipo de movimento é para periodizar. Sem ela, um
-- agachamento publicado periodizava como uma elevação lateral.
--
-- Fica na linha do catálogo e não no block_config da adição ao dia, porque é
-- uma propriedade do exercício e não do dia: um agachamento é composto na
-- segunda e na quinta. Guardá-la por dia dava dois sítios para a mesma verdade
-- e obrigava o ecrã do catálogo a escolher um dia para poder editá-la.
--
-- 'acc' é o default pela mesma razão do 004: é o que a app antiga assumia ao
-- publicar (js/shared.js:485), por isso as linhas que já existem ficam com o
-- comportamento que tinham.
alter table public.catalog_exercises
  add column if not exists kind text not null default 'acc';

alter table public.catalog_exercises
  drop constraint if exists catalog_exercises_kind_check;

alter table public.catalog_exercises
  add constraint catalog_exercises_kind_check
  check (kind in ('comp', 'acc', 'iso', 'core'));


-- ---- 1. escrita aberta nas duas tabelas do catálogo ---------------------
-- A leitura fica como está, using (true): sem estados, o que lá está está
-- publicado, e é isso que faz um exercício aparecer igual em todas as contas.
--
-- O insert continua a exigir created_by = auth.uid(). Isso não é uma restrição
-- de quem manda, é a autoria: uma linha tem de dizer a verdade sobre quem a
-- criou, mesmo quando qualquer pessoa a pode mudar depois.
do $$
declare t text;
begin
  foreach t in array array['catalog_exercises', 'day_additions']
  loop
    -- update: qualquer autenticado, e o with check é (true) também, senão
    -- quem edita a linha de outra pessoa era barrado ao gravar em vez de ao ler.
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (true) with check (true)',
      t || '_update', t);

    -- Continua sem política de delete, e isso é de propósito. Apagar é pôr
    -- deleted = true, que passa pelo update acima. Um delete a sério deixava o
    -- dia de outra pessoa a apontar para uma linha que desapareceu, e o
    -- fetchRows do cliente já filtra deleted = false para toda a gente.
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
  end loop;
end $$;


-- ---- 2. a chave partilhada é única, e tem de continuar a ser -------------
-- catalog_exercises.ex_key já é unique pelo 003. Fica aqui escrito porque é a
-- garantia de que dois exercícios publicados nunca colidem na mesma chave, e é
-- essa chave que os exercise_logs, o hidden_items e o exercise_order usam.
-- Se esta linha falhar, há chaves repetidas e o cliente mostraria dois cartões
-- com o mesmo nome: é melhor saber aqui.
do $$
begin
  if exists (
    select ex_key from public.catalog_exercises
    where deleted = false group by ex_key having count(*) > 1
  ) then
    raise exception 'catalog_exercises tem ex_key repetidos; resolve isso antes de continuar';
  end if;
end $$;


-- ---- 3. day_additions não repete o mesmo exercício no mesmo dia ---------
-- Sem isto, dois toques no botão publicar desenhavam dois cartões iguais no dia
-- de toda a gente. O índice é parcial em deleted = false para uma adição
-- removida não impedir que a mesma volte a ser acrescentada mais tarde.
create unique index if not exists day_additions_unique_live
  on public.day_additions (day_no, ex_key)
  where deleted = false;
