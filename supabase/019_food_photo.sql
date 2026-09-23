-- =========================================================================
-- 019 · a foto do alimento
--
-- B6 de .claude/skills/nutricao-sem-erros/PLANO.md, 2026-09-23 (fotos 19:29 e 19:35):
-- "criei o snack com imagens, mas ao clicar não faz nada". A câmara tinha a foto,
-- e o save() deitava-a fora, porque food_entries não tinha onde a guardar.
--
--   food_entries.photo_url — o URL público da foto no bucket exercise-media
--   (user/<uid>/food-…jpg), ou null quando o alimento foi registado sem foto.
--
-- Correr uma vez no SQL editor do Supabase. É idempotente.
-- =========================================================================

alter table public.food_entries add column if not exists photo_url text;

notify pgrst, 'reload schema';
