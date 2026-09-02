-- =========================================================================
-- M0_inventory.sql — a linha de base da reconciliação
--
-- SÓ LEITURA. Não cria, não altera, não apaga nada. Podes correr em produção
-- a qualquer momento, incluindo agora, antes de correr o 003.
--
-- Corre cada bloco no SQL Editor e guarda o resultado. É contra estes números
-- que o M3 vai reconciliar depois do backfill; sem eles não há como provar que
-- nada se perdeu, só como afirmar.
-- =========================================================================

-- A. Exercícios partilhados, para separar as chaves da base das que foram
--    publicadas por utilizadores. As da base são descartadas no backfill (D5) e
--    cada divergência tem de aparecer no relatório para revisão humana.
select ex_key, name_pt, name_en, video_id, status, deleted, version,
       created_by, updated_by, created_at, updated_at
from public.shared_exercises
order by created_at;

-- B. Dias e os ex_keys que cada um prescreve neste momento.
select day_no, version, updated_by, updated_at,
       (select array_agg(item->>'ex' order by ord)
          from jsonb_array_elements(items) with ordinality as t(item, ord)) as ex_keys
from public.shared_days
order by day_no;

-- C. Volume de edições, para dimensionar a questão da divergência.
select tbl, action, count(*), min(at) as first_edit, max(at) as last_edit
from public.catalog_edits
group by tbl, action
order by tbl, action;

-- D. Contagens de linhas, para dimensionar a migração e reconciliar depois.
select 'user_state' as t, count(*) from public.user_state
union all select 'profiles',        count(*) from public.profiles
union all select 'community_posts', count(*) from public.community_posts
union all select 'post_comments',   count(*) from public.post_comments
union all select 'post_likes',      count(*) from public.post_likes
union all select 'post_reactions',  count(*) from public.post_reactions
union all select 'exercise_images', count(*) from public.exercise_images;

-- E. Tamanho de cada blob por utilizador, para saber quem tem histórico a sério
--    e quem tem uma conta vazia. O backfill dimensiona-se por isto.
select user_id,
       jsonb_array_length(coalesce(data->'sessions', '[]'::jsonb)) as sessions,
       jsonb_array_length(coalesce(data->'goals',    '[]'::jsonb)) as goals,
       jsonb_array_length(coalesce(data->'trainers', '[]'::jsonb)) as trainers,
       (select count(*) from jsonb_object_keys(coalesce(data->'ex',      '{}'::jsonb))) as ex_keys,
       (select count(*) from jsonb_object_keys(coalesce(data->'ovr',     '{}'::jsonb))) as ovr_keys,
       (select count(*) from jsonb_object_keys(coalesce(data->'hidden',  '{}'::jsonb))) as hidden_keys,
       (select count(*) from jsonb_object_keys(coalesce(data->'custom',  '{}'::jsonb))) as custom_days,
       (select count(*) from jsonb_object_keys(coalesce(data->'restSec', '{}'::jsonb))) as rest_keys,
       (select count(*) from jsonb_object_keys(coalesce(data->'order',   '{}'::jsonb))) as order_days,
       pg_column_size(data) as blob_bytes,
       updated_at
from public.user_state
order by pg_column_size(data) desc;
