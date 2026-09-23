-- =========================================================================
-- 014_series_por_serie.sql — cada série guarda os seus próprios números
--
-- Corre isto inteiro no SQL Editor do Supabase (Run). É idempotente, como os
-- treze anteriores: podes correr outra vez sem estragar nada.
--
-- Corre DEPOIS do 003 (é a tabela e a função de lá que isto alarga). Não
-- depende de nada do 011, 012 ou 013.
--
-- Aditivo. Uma coluna nova, com valor por omissão, e a mesma função do 003 §15
-- reescrita para saber da coluna. Não escreve uma linha de dados, não apaga
-- nada, não muda nenhuma coluna que já existe e não mexe nas políticas.
--
-- SEM PRÉ-VOO, E ESTA É A RAZÃO:
--   A coluna nasce com `default '[]'` e sem CHECK nenhum. Não há dados que
--   possam falhar ao nascer dela, e uma query de pré-voo aqui era teatro.
--
-- PORQUÊ ESTE FICHEIRO (Passo C, tarefa 3, da skill executar-substitui-o-cartao):
--   exercise_logs guarda UM weight, UMAS reps e UMA note para o exercício
--   inteiro, mais `sets_done boolean[]`. A folha das séries do ecrã Executar tem
--   uma linha por série, cada uma com o seu descanso, esforço, reps e carga — a
--   série 1 a 60 kg e a série 3 a 62,5 kg são duas coisas, e hoje só cabe uma.
--
-- A FORMA:
--   `sets jsonb` — um array, uma posição por série, cada posição um objeto com
--   quatro campos facultativos:
--
--     [ { "rest": 150, "rpe": 8, "reps": 12, "weight": 60 },
--       { "weight": 62.5 },
--       {} ]
--
--   Números e não texto, ao contrário do weight/reps do 003: estes valores só
--   nascem da roda, que só dá números. O texto livre ("10/lado") continua a
--   viver nas colunas antigas, onde sempre viveu.
--
-- AS COLUNAS ANTIGAS FICAM, e é de propósito:
--   `weight`, `reps`, `note` e `sets_done` continuam a ser lidas e escritas.
--   `sets_done` continua a ser a verdade de "esta série está feita" — é o que o
--   progresso do dia, o anel da semana e o record_session do 011 contam, e
--   mudá-lo de sítio partia os três. O histórico já gravado não evapora.
--
-- O MERGE, POR SÉRIE E POR CAMPO:
--   O 003 §15 compara cada campo com o seu carimbo, para o telemóvel sem rede
--   e o PC em casa não se apagarem um ao outro. Aqui a mesma regra desce um
--   nível: cada campo de cada série tem o seu carimbo em field_updated_at, com a
--   chave "sets.<posição>.<campo>" — "sets.2.weight". O cliente manda só o que
--   mexeu, como objeto e não como array, para dizer a posição sem mandar as
--   outras:
--
--     p_fields = { "sets": { "2": { "weight": 62.5 } } }
--
--   Mudar o peso da série 3 no telemóvel e o esforço da série 1 no PC, ao mesmo
--   tempo, guarda os dois.
--
-- Rollback: `alter table public.exercise_logs drop column sets;` e correr outra
-- vez o §15 do 003. Nada mais foi tocado.
-- =========================================================================


-- ---- 1. a coluna ---------------------------------------------------------
alter table public.exercise_logs
  add column if not exists sets jsonb not null default '[]'::jsonb;


-- ---- 2. merge_exercise_log, a saber de `sets` -----------------------------
-- A mesma assinatura do 003, por isso `create or replace` substitui a função no
-- sítio e as permissões do 003 continuam a valer. Os quatro campos antigos
-- fazem exatamente o que faziam; o que é novo é o bloco de `sets`.
create or replace function public.merge_exercise_log(
  p_day_no  smallint,
  p_block   text,
  p_ex_key  text,
  p_fields  jsonb,        -- só os campos alterados: weight, reps, sets_done, note, sets
  p_at      timestamptz,  -- quando o CLIENTE alterou, não quando isto chegou
  p_client  text
) returns public.exercise_logs
language plpgsql security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_at     timestamptz := least(p_at, now());
  v_row    public.exercise_logs;
  v_stamps jsonb;
  v_sets   boolean[];
  v_exists boolean;
  v_values jsonb;
  v_pos    text;
  v_patch  jsonb;
  v_field  text;
  v_idx    int;
  v_key    text;
begin
  if v_uid is null then
    raise exception 'merge_exercise_log: sem sessão';
  end if;

  if p_fields ? 'sets' and jsonb_typeof(p_fields->'sets') <> 'object' then
    raise exception 'merge_exercise_log: sets tem de ser um objeto {posição: campos}';
  end if;

  select * into v_row
    from public.exercise_logs
   where user_id = v_uid and day_no = p_day_no and block = p_block and ex_key = p_ex_key
     for update;

  v_exists := found;

  if p_fields ? 'sets_done' then
    select coalesce(array_agg(e::boolean order by ord), '{}')
      into v_sets
      from jsonb_array_elements_text(p_fields->'sets_done') with ordinality as t(e, ord);
  end if;

  if not v_exists then
    insert into public.exercise_logs (
      user_id, day_no, block, ex_key, weight, reps, sets_done, note,
      field_updated_at, updated_by_client
    ) values (
      v_uid, p_day_no, p_block, p_ex_key,
      p_fields->>'weight', p_fields->>'reps',
      coalesce(v_sets, '{}'), p_fields->>'note',
      (select coalesce(jsonb_object_agg(k, v_at), '{}'::jsonb)
         from jsonb_object_keys(p_fields - 'sets') as k),
      p_client
    )
    returning * into v_row;
    -- A linha acabou de nascer sem séries; o bloco de baixo escreve-as com os
    -- carimbos certos, pelo mesmo caminho que uma linha antiga.
  end if;

  v_stamps := coalesce(v_row.field_updated_at, '{}'::jsonb);

  if v_exists then
    if p_fields ? 'weight'
       and v_at >= coalesce((v_stamps->>'weight')::timestamptz, '-infinity') then
      v_row.weight := p_fields->>'weight';
      v_stamps := jsonb_set(v_stamps, '{weight}', to_jsonb(v_at));
    end if;

    if p_fields ? 'reps'
       and v_at >= coalesce((v_stamps->>'reps')::timestamptz, '-infinity') then
      v_row.reps := p_fields->>'reps';
      v_stamps := jsonb_set(v_stamps, '{reps}', to_jsonb(v_at));
    end if;

    if p_fields ? 'sets_done'
       and v_at >= coalesce((v_stamps->>'sets_done')::timestamptz, '-infinity') then
      v_row.sets_done := coalesce(v_sets, '{}');
      v_stamps := jsonb_set(v_stamps, '{sets_done}', to_jsonb(v_at));
    end if;

    if p_fields ? 'note'
       and v_at >= coalesce((v_stamps->>'note')::timestamptz, '-infinity') then
      v_row.note := p_fields->>'note';
      v_stamps := jsonb_set(v_stamps, '{note}', to_jsonb(v_at));
    end if;
  end if;

  -- Série a série, campo a campo, a mesma pergunta do 003: o que trago é mais
  -- recente do que o que já cá está?
  if p_fields ? 'sets' then
    v_values := coalesce(v_row.sets, '[]'::jsonb);

    for v_pos, v_patch in select * from jsonb_each(p_fields->'sets') loop
      -- Vinte séries chegam para qualquer programa; um índice fora disto é um
      -- cliente avariado, e não se estica um array por causa dele.
      if v_pos !~ '^\d{1,2}$' or v_pos::int > 19 or jsonb_typeof(v_patch) <> 'object' then
        raise exception 'merge_exercise_log: posição de série inválida: %', v_pos;
      end if;
      v_idx := v_pos::int;

      -- jsonb_set num índice depois do fim acrescenta no fim, não na posição.
      -- Por isso enche-se primeiro até lá com séries vazias.
      while jsonb_array_length(v_values) <= v_idx loop
        v_values := v_values || '[{}]'::jsonb;
      end loop;

      for v_field in select * from jsonb_object_keys(v_patch) loop
        if v_field not in ('rest', 'rpe', 'reps', 'weight') then
          raise exception 'merge_exercise_log: campo de série desconhecido: %', v_field;
        end if;
        v_key := 'sets.' || v_idx || '.' || v_field;
        if v_at >= coalesce((v_stamps->>v_key)::timestamptz, '-infinity') then
          v_values := jsonb_set(v_values, array[v_idx::text, v_field], v_patch->v_field);
          v_stamps := jsonb_set(v_stamps, array[v_key], to_jsonb(v_at));
        end if;
      end loop;
    end loop;

    v_row.sets := v_values;
  end if;

  update public.exercise_logs set
    weight            = v_row.weight,
    reps              = v_row.reps,
    sets_done         = v_row.sets_done,
    note              = v_row.note,
    sets              = v_row.sets,
    field_updated_at  = v_stamps,
    updated_by_client = p_client
   where user_id = v_uid and day_no = p_day_no and block = p_block and ex_key = p_ex_key
  returning * into v_row;

  return v_row;
end $$;

revoke all on function public.merge_exercise_log(smallint, text, text, jsonb, timestamptz, text) from public;
grant execute on function public.merge_exercise_log(smallint, text, text, jsonb, timestamptz, text) to authenticated;
