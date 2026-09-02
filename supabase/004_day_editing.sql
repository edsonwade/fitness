-- =========================================================================
-- 004_day_editing.sql — o tipo de um exercício próprio
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como o
-- 001, o 002 e o 003: podes correr outra vez sem estragar nada.
--
-- Uma coluna. Aditiva. Não escreve uma linha de dados e não toca em política
-- nenhuma, por isso é seguro correr em produção antes de o cliente novo subir:
-- o cliente antigo não a lê e o default trata dos que já lá estão.
--
-- PORQUÊ:
--   Um exercício próprio guarda séries, reps, carga e descanso uma vez, e os
--   quatro blocos saem daí por prog() (content/blocks.ts), o mesmo gerador que
--   escreve o plano da base. prog() precisa de saber que tipo de movimento é:
--   um composto sobe uma série no bloco 3 e desce para 6-8 reps, um isolamento
--   fica nas 15. Sem esta coluna todos os exercícios próprios seriam
--   acessórios, e um agachamento teu periodizava como uma elevação lateral.
--
--   'acc' é o default porque é o que a app antiga assumia ao publicar
--   (js/shared.js:485, kind:'acc'), por isso as linhas que já existem ficam
--   exatamente com o comportamento que tinham.
--
-- Rollback: alter table public.custom_exercises drop column kind;
-- =========================================================================

alter table public.custom_exercises
  add column if not exists kind text not null default 'acc';

-- Separado do add column, e com o drop à frente, para o ficheiro poder correr
-- outra vez: add constraint não tem forma de "if not exists".
alter table public.custom_exercises
  drop constraint if exists custom_exercises_kind_check;

alter table public.custom_exercises
  add constraint custom_exercises_kind_check
  check (kind in ('comp', 'acc', 'iso', 'core'));
