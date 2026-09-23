import { TABLES, isShared, type TableName } from '../../data/entities';
import { fetchRows, upsertRow } from '../../data/db';

/**
 * Exportar e importar os dados da conta — fase 023, "Dados" de `proto/v2/08-perfil.html`.
 *
 * Só as tabelas que são da própria conta: o plano partilhado é de toda a gente e não se
 * exporta como se fosse teu, nem se importa por cima do de outros.
 *
 * O importar é a operação mais perigosa do Perfil. Por isso tem duas metades: `importPlan`
 * lê o ficheiro e diz **exatamente** o que vai escrever — sem escrever nada —, e só depois
 * de a pessoa aceitar é que `applyImport` escreve.
 */
export const FORMAT = 'fitness-export';
export const VERSION = 1;

export const PRIVATE_TABLES = (Object.keys(TABLES) as TableName[]).filter((t) => !isShared(t));

export type ExportFile = {
  format: typeof FORMAT;
  version: number;
  exported_at: string;
  tables: Partial<Record<TableName, Record<string, unknown>[]>>;
};

export async function buildExport(userId: string): Promise<ExportFile> {
  const tables: ExportFile['tables'] = {};
  for (const table of PRIVATE_TABLES) {
    if (table === 'session_entries') continue;
    try {
      tables[table] = (await fetchRows(table, userId)) as Record<string, unknown>[];
    } catch {
      /* uma tabela que ainda não existe na base (migração por correr) fica de fora */
    }
  }
  const entries: Record<string, unknown>[] = [];
  for (const s of tables.sessions ?? []) {
    try {
      entries.push(...((await fetchRows('session_entries', userId, [String(s.id)])) as Record<string, unknown>[]));
    } catch {
      /* idem */
    }
  }
  tables.session_entries = entries;
  return { format: FORMAT, version: VERSION, exported_at: new Date().toISOString(), tables };
}

export type ImportPlan =
  | { ok: true; file: ExportFile; tables: { table: TableName; rows: number }[]; total: number }
  | { ok: false };

export function importPlan(raw: unknown): ImportPlan {
  if (!raw || typeof raw !== 'object') return { ok: false };
  const file = raw as Partial<ExportFile>;
  if (file.format !== FORMAT || typeof file.tables !== 'object' || file.tables === null) return { ok: false };
  const tables: { table: TableName; rows: number }[] = [];
  for (const [name, rows] of Object.entries(file.tables)) {
    if (!PRIVATE_TABLES.includes(name as TableName) || !Array.isArray(rows)) continue;
    if (rows.length) tables.push({ table: name as TableName, rows: rows.length });
  }
  const total = tables.reduce((n, t) => n + t.rows, 0);
  if (total === 0) return { ok: false };
  return { ok: true, file: file as ExportFile, tables, total };
}

/**
 * Escreve o que o plano disse, linha a linha, sempre como a conta de quem importa: o dono
 * que vem no ficheiro é substituído, e o RLS recusaria o contrário de qualquer forma.
 * `sessions` antes de `session_entries`, pela chave estrangeira.
 */
export async function applyImport(plan: Extract<ImportPlan, { ok: true }>, userId: string): Promise<number> {
  const order = [...plan.tables].sort(
    (a, b) => Number(a.table === 'session_entries') - Number(b.table === 'session_entries'),
  );
  let written = 0;
  for (const { table } of order) {
    for (const row of plan.file.tables[table] ?? []) {
      const payload = { ...row, user_id: userId };
      delete (payload as Record<string, unknown>).updated_at;
      await upsertRow(table, payload);
      written += 1;
    }
  }
  return written;
}
