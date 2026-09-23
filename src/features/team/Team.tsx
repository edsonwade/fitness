import { useMemo, useState } from 'react';

import type { Trainer } from '../../data/entities';
import { useDeleteRow, useUpsertRow } from '../../data/mutations';
import { useRows, useUserId } from '../../data/queries';
import { INTL_LOCALE } from '../../i18n';
import { useLocale } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { sessionLoad } from '../train/metrics';
import { sessionDate, useSessions } from '../train/sessions';
import { openDays, rank, startsAt, tonnes } from './team';
import { CLAP, useClap, useLeaderboard, useMembers, usePosts, usePublish, useRemovePost, type Member } from './team-data';
import { ThemeToggle } from '../../ui/ThemeToggle';

type Section = 'table' | 'wall' | 'trainers';

/**
 * A Equipa — fases 021 e 022, `proto/v2/07-equipa.html`:
 *
 *  - frame 1, Tabela: o teu cartão, o período (7 dias · 30 dias · sempre) e o ranking por
 *    volume real — a tua linha destacada (`is-you`) e sempre visível;
 *  - frame 2, Mural: escrever (o único teclado aqui), publicar com a última sessão anexada,
 *    aplaudir; frame 4, sem publicações diz-se que está vazio;
 *  - frame 3, Treinadores: a lista partilhada, a disponibilidade lida, e marcar com Dia ·
 *    Hora · Duração por toque; cancelar ao lado de marcar.
 *
 * Decisões dele (2026-09-23): o ranking mostra nome, sessões e volume de todas as contas;
 * os treinadores são uma lista de toda a gente, e as marcações de cada um.
 */
export function Team() {
  const t = useLocale().t.team;
  const [section, setSection] = useState<Section>('table');
  const [membersOpen, setMembersOpen] = useState(false);
  const members = useMembers();

  return (
    <div className="min-h-full pb-8">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="display display-4">{t.title}</h1>
        <span className="spacer" />
        <button type="button" className="btn btn-icon" aria-label={t.members} onClick={() => setMembersOpen(true)}>
          <Icon name="users" size={20} strokeWidth={2} />
        </button>
        <ThemeToggle />
      </div>

      <div className="screen-pad stack-lg">
        <div className="segmented" role="tablist" aria-label={t.sections}>
          {(['table', 'wall', 'trainers'] as const).map((s) => (
            <button key={s} type="button" role="tab" aria-selected={section === s} onClick={() => setSection(s)}>
              {t[s]}
            </button>
          ))}
        </div>

        {section === 'table' ? <Board /> : section === 'wall' ? <Wall members={members.data ?? []} /> : <Trainers />}
      </div>

      <Sheet open={membersOpen} onOpenChange={setMembersOpen} title={t.members}>
        <div>
          {(members.data ?? []).map((m) => (
            <div key={m.user_id} className="list-row">
              <Avatar member={m} />
              <span className="body-1 body-med">{m.name ?? t.member}</span>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function Avatar({ member, large = false }: { member: Pick<Member, 'name' | 'photo'> | null; large?: boolean }) {
  const cls = large ? 'avatar avatar-lg' : 'avatar';
  if (member?.photo) return <img className={cls} src={member.photo} alt="" />;
  return (
    <span className={`${cls} grid place-items-center body-2 body-med`} aria-hidden="true">
      {(member?.name ?? '·').slice(0, 1).toUpperCase()}
    </span>
  );
}

function Board() {
  const { locale, t: copy } = useLocale();
  const t = copy.team;
  const me = useUserId();
  const [days, setDays] = useState<number | null>(30);
  const board = useLeaderboard(days);
  const rows = useMemo(() => rank(board.data ?? [], me), [board.data, me]);
  const mine = rows.find((r) => r.isYou) ?? null;
  const dec = new Intl.NumberFormat(INTL_LOCALE[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const periodLabel = days === 7 ? t.p7 : days === 30 ? t.p30 : t.pAll;

  return (
    <>
      {mine ? (
        <div className="card">
          <div className="row">
            <Avatar member={mine} large />
            <div style={{ flex: '1 1 auto' }}>
              <p className="title-2">{mine.name ?? t.you}</p>
              <p className="body-2 muted tabular">
                {mine.rank}.º {t.place} · {dec.format(tonnes(mine.volume_kg))} t {t.ofVolume}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="segmented" role="tablist" aria-label={t.period}>
        {([7, 30, null] as const).map((d) => (
          <button key={String(d)} type="button" role="tab" aria-selected={days === d} onClick={() => setDays(d)}>
            {d === 7 ? t.p7 : d === 30 ? t.p30 : t.pAll}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="row-between" style={{ paddingBottom: 'var(--sp-2)', borderBottom: '1px solid var(--ui-rule)' }}>
          <p className="label">{t.member}</p>
          <p className="label">
            {t.volumeCol} · {periodLabel}
          </p>
        </div>
        {board.isError ? (
          <p className="body-2 muted mt-4">{t.boardError}</p>
        ) : board.isPending ? (
          <div className="skeleton mt-4" style={{ height: 160 }} />
        ) : rows.every((r) => r.volume_kg === 0 && r.sessions === 0) ? (
          <p className="body-2 muted mt-4">{t.boardEmpty}</p>
        ) : (
          rows.map((r) => (
            <div key={r.user_id} className={['rank-row', r.isTop ? 'is-top' : '', r.isYou ? 'is-you' : ''].join(' ').trim()}>
              <span className="rank-num">{r.rank}</span>
              <Avatar member={r} />
              <div className="min-w-0 flex-1">
                <p className="body-1 body-med">{r.isYou ? t.you : (r.name ?? t.member)}</p>
                <p className="body-2 muted tabular">
                  {r.sessions} {r.sessions === 1 ? t.sessionWord : t.sessionsWord}
                </p>
              </div>
              <div className="text-right">
                <p className="body-1 body-med tabular">{dec.format(tonnes(r.volume_kg))} t</p>
                {r.delta !== null && r.delta !== 0 ? (
                  <p
                    className={r.isYou ? 'body-2 tabular' : 'body-2 muted tabular'}
                    style={r.isYou ? { color: 'var(--ui-accent)', fontWeight: 600 } : undefined}
                  >
                    {r.delta > 0 ? '+' : '−'} {dec.format(Math.abs(tonnes(r.delta)))} t
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}
        <p className="body-2 muted mt-4 text-center">{t.realKg}</p>
      </section>
    </>
  );
}

function ago(iso: string, t: { justNow: string; minAgo: string; hAgo: string; yesterday: string }, locale: keyof typeof INTL_LOCALE) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return t.justNow;
  if (diff < 60) return t.minAgo.replace('{n}', String(Math.floor(diff)));
  if (diff < 24 * 60) return t.hAgo.replace('{n}', String(Math.floor(diff / 60)));
  if (diff < 48 * 60) return t.yesterday;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'long' }).format(new Date(iso));
}

function Wall({ members }: { members: Member[] }) {
  const { locale, t: copy } = useLocale();
  const t = copy.team;
  const me = useUserId();
  const posts = usePosts();
  const publish = usePublish();
  const remove = useRemovePost();
  const clap = useClap();
  const sessions = useSessions();
  const [body, setBody] = useState('');
  const [attach, setAttach] = useState(false);
  const last = useMemo(
    () => [...(sessions.data ?? [])].sort((a, b) => sessionDate(b).localeCompare(sessionDate(a)))[0] ?? null,
    [sessions.data],
  );
  const lastEntries = useRows('session_entries', last ? [last.id] : []);
  const lastLoad = sessionLoad(lastEntries.data ?? []);
  const byId = new Map(members.map((m) => [m.user_id, m]));
  const kg = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });
  const mineMember = me ? (byId.get(me) ?? null) : null;

  return (
    <>
      <div className="card">
        <div className="row row-top">
          <Avatar member={mineMember} />
          <textarea
            className="textarea w-full"
            style={{ minHeight: 64 }}
            placeholder={t.writePlaceholder}
            aria-label={t.newPost}
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
          />
        </div>
        {attach && last ? (
          <div className="card card-sunken mt-3">
            <p className="label">{t.attached}</p>
            <p className="title-3 mt-1">{last.day_name ?? ''}</p>
            {lastLoad.ok ? <p className="body-2 muted tabular">{kg.format(lastLoad.value)} kg</p> : null}
          </div>
        ) : null}
        <div className="row-between mt-3">
          <button
            type="button"
            className="btn btn-icon"
            aria-label={t.attach}
            aria-pressed={attach}
            disabled={!last}
            onClick={() => setAttach((v) => !v)}
          >
            <Icon name="dumbbell" size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-compact"
            disabled={!body.trim() || publish.isPending}
            onClick={() => {
              publish.mutate({
                body: body.trim(),
                ...(attach && last
                  ? { session_name: last.day_name ?? null, session_volume_kg: lastLoad.ok ? Math.round(lastLoad.value) : null }
                  : {}),
              });
              setBody('');
              setAttach(false);
            }}
          >
            {t.publish}
          </button>
        </div>
      </div>

      {posts.isPending ? (
        <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-card)' }} />
      ) : !posts.data?.posts.length ? (
        <div className="empty">
          <p className="title-2">{t.wallEmptyTitle}</p>
          <p>{t.wallEmptyBody}</p>
        </div>
      ) : (
        posts.data.posts.map((p) => {
          const author = byId.get(p.author) ?? null;
          const claps = posts.data.reactions.filter((r) => r.post_id === p.id && r.emoji === CLAP);
          const mineClap = claps.some((r) => r.author === me);
          const nComments = posts.data.comments.filter((c) => c.post_id === p.id).length;
          return (
            <article key={p.id} className="card">
              <div className="row">
                <Avatar member={author} />
                <div style={{ flex: '1 1 auto' }}>
                  <p className="body-1 body-med">{p.author === me ? t.you : (author?.name ?? t.member)}</p>
                  <p className="body-2 muted">{ago(p.created_at, t, locale)}</p>
                </div>
                {p.author === me ? (
                  <button type="button" className="btn btn-icon" aria-label={t.removePost} onClick={() => remove.mutate(p.id)}>
                    <Icon name="trash" size={16} strokeWidth={2} />
                  </button>
                ) : null}
              </div>
              <p className="body-1 mt-3 whitespace-pre-wrap">{p.body}</p>
              {p.session_name ? (
                <div className="card card-sunken mt-3">
                  <p className="label">{t.attached}</p>
                  <p className="title-3 mt-1">{p.session_name}</p>
                  {p.session_volume_kg !== null ? (
                    <p className="body-2 muted tabular">{kg.format(Number(p.session_volume_kg))} kg</p>
                  ) : null}
                </div>
              ) : null}
              <div className="row mt-3" style={{ gap: 'var(--sp-3)' }}>
                <button
                  type="button"
                  className="chip chip-sm"
                  aria-pressed={mineClap}
                  onClick={() => clap.mutate({ postId: p.id, on: !mineClap })}
                >
                  {CLAP} {claps.length}
                </button>
                {nComments ? (
                  <span className="chip chip-sm">
                    {nComments} {nComments === 1 ? t.comment : t.comments}
                  </span>
                ) : null}
              </div>
            </article>
          );
        })
      )}
    </>
  );
}

function Trainers() {
  const { locale, t: copy } = useLocale();
  const t = copy.team;
  const me = useUserId();
  const trainers = useRows('trainers');
  const bookings = useRows('trainer_sessions');
  const cancel = useDeleteRow('trainer_sessions');
  const removeTrainer = useDeleteRow('trainers');
  const [adding, setAdding] = useState(false);
  const [booking, setBooking] = useState<Trainer | null>(null);
  /* O relógio lê-se uma vez ao abrir, não em cada render. */
  const [openedAt] = useState(() => Date.now());
  const wd = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'long' });
  const when = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const upcoming = (bookings.data ?? [])
    .filter((b) => b.starts_at && new Date(b.starts_at).getTime() > openedAt - 3600_000)
    .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  const nameOf = (id: string) => (trainers.data ?? []).find((x) => x.id === id)?.name ?? '';

  return (
    <>
      <div className="row-between">
        <h2 className="title-3">{t.trainers}</h2>
        <button type="button" className="chip chip-sm" onClick={() => setAdding(true)}>
          {t.addTrainer}
        </button>
      </div>

      {upcoming.length ? (
        <section className="card">
          <p className="label">{t.myBookings}</p>
          {upcoming.map((b) => (
            <div key={b.id} className="list-row">
              <div className="min-w-0 flex-1">
                <p className="body-1 body-med">{nameOf(b.trainer_id)}</p>
                <p className="body-2 muted tabular first-letter:uppercase">
                  {when.format(new Date(b.starts_at as string))}
                  {b.duration_min ? ` · ${b.duration_min} ${t.minutes}` : ''}
                </p>
              </div>
              <button type="button" className="btn btn-secondary btn-quiet" onClick={() => cancel.remove({ id: b.id })}>
                {t.cancelBooking}
              </button>
            </div>
          ))}
          <p className="body-2 muted mt-2">{t.cancelNote}</p>
        </section>
      ) : null}

      {!(trainers.data ?? []).filter((x) => x.active).length ? (
        <div className="empty">
          <p>{t.trainersEmpty}</p>
        </div>
      ) : (
        (trainers.data ?? [])
          .filter((x) => x.active)
          .map((tr, i) => {
            const days = [...tr.preferred_days].sort();
            return (
              <article key={tr.id} className="card">
                <div className="row">
                  {tr.photo ? (
                    <img className="avatar avatar-lg" src={tr.photo} alt="" />
                  ) : (
                    <img className="avatar avatar-lg" src={`${import.meta.env.BASE_URL}img/coach-${(i % 6) + 1}.jpg`} alt="" />
                  )}
                  <div style={{ flex: '1 1 auto' }}>
                    <p className="title-2">{tr.name}</p>
                    {tr.specialty ? <p className="body-2 muted">{tr.specialty}</p> : null}
                    {tr.plans.length ? (
                      <div className="row mt-1.5" style={{ gap: 6 }}>
                        {tr.plans.map((p) => (
                          <span key={p} className="chip chip-sm">
                            {p === 'online' ? t.online : t.inPerson}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {tr.user_id === me ? (
                    <button type="button" className="btn btn-icon" aria-label={t.removeTrainer} onClick={() => removeTrainer.remove({ id: tr.id })}>
                      <Icon name="trash" size={16} strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
                <p className="body-2 muted mt-3 first-letter:uppercase">
                  {days.length
                    ? `${t.freeDays} ${days.map((d) => wd.format(new Date(2026, 8, 6 + d))).join(', ')}.`
                    : t.noSlots}
                </p>
                {days.length ? (
                  <button type="button" className="btn btn-primary btn-block mt-4" onClick={() => setBooking(tr)}>
                    {t.book}
                  </button>
                ) : (
                  <button type="button" className="btn btn-secondary btn-block mt-4" disabled>
                    {t.noSlotsBtn}
                  </button>
                )}
              </article>
            );
          })
      )}

      {adding ? <AddTrainer onClose={() => setAdding(false)} /> : null}
      {booking ? <Book trainer={booking} onClose={() => setBooking(null)} /> : null}
    </>
  );
}

function AddTrainer({ onClose }: { onClose: () => void }) {
  const { locale, t: copy } = useLocale();
  const t = copy.team;
  const upsert = useUpsertRow('trainers');
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [days, setDays] = useState<number[]>([]);
  const [modes, setModes] = useState<string[]>(['presencial']);
  const wd = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'short' });
  const close = () => {
    setOpen(false);
    window.setTimeout(onClose, 300);
  };
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} title={t.addTrainer.replace('+ ', '')}>
      <div className="stack">
        <div>
          <label className="label" htmlFor="tr-name">
            {t.trainerName}
          </label>
          <input id="tr-name" className="input mt-2 w-full" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        </div>
        <div>
          <label className="label" htmlFor="tr-spec">
            {t.specialty}
          </label>
          <input
            id="tr-spec"
            className="input mt-2 w-full"
            placeholder={t.specialtyPlaceholder}
            value={specialty}
            onChange={(e) => setSpecialty(e.currentTarget.value)}
          />
        </div>
        <div>
          <p className="label mb-2">{t.availability}</p>
          <div className="row flex-wrap" style={{ gap: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button key={d} type="button" className="chip chip-sm" aria-pressed={days.includes(d)} onClick={() => setDays(toggle(days, d))}>
                {wd.format(new Date(2026, 8, 6 + d)).replace('.', '')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-2">{t.modes}</p>
          <div className="row" style={{ gap: 6 }}>
            {(['presencial', 'online'] as const).map((m) => (
              <button key={m} type="button" className="chip chip-sm" aria-pressed={modes.includes(m)} onClick={() => setModes(toggle(modes, m))}>
                {m === 'online' ? t.online : t.inPerson}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!name.trim()}
          onClick={() => {
            upsert.save({
              id: crypto.randomUUID(),
              name: name.trim(),
              specialty: specialty.trim() || null,
              preferred_days: days,
              plans: modes,
              active: true,
            });
            close();
          }}
        >
          {t.save}
        </button>
      </div>
    </Sheet>
  );
}

function Book({ trainer, onClose }: { trainer: Trainer; onClose: () => void }) {
  const { locale, t: copy } = useLocale();
  const t = copy.team;
  const upsert = useUpsertRow('trainer_sessions');
  const [open, setOpen] = useState(true);
  const days = useMemo(() => openDays(trainer.preferred_days, new Date()).slice(0, 6), [trainer.preferred_days]);
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(18);
  const [minutes, setMinutes] = useState(60);
  const dayFmt = new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: 'short', day: 'numeric' });
  const close = () => {
    setOpen(false);
    window.setTimeout(onClose, 300);
  };
  const HOURS = [7, 8, 9, 10, 12, 14, 16, 17, 18, 19, 20];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()} title={`${t.bookWith} ${trainer.name ?? ''}`}>
      <div className="stack">
        <div>
          <p className="label mb-2">{t.day}</p>
          <div className="presetrow" role="radiogroup" aria-label={t.day}>
            {days.map((d, i) => (
              <button key={d.toISOString()} type="button" className="preset" role="radio" aria-checked={day === i} aria-pressed={day === i} onClick={() => setDay(i)}>
                {dayFmt.format(d).replace('.', '')}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-2">{t.hour}</p>
          <div className="presetrow flex-wrap" role="radiogroup" aria-label={t.hour}>
            {HOURS.map((h) => (
              <button key={h} type="button" className="preset tabular" role="radio" aria-checked={hour === h} aria-pressed={hour === h} onClick={() => setHour(h)}>
                {String(h).padStart(2, '0')}:00
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-2">{t.duration}</p>
          <div className="presetrow" role="radiogroup" aria-label={t.duration}>
            {[30, 45, 60, 90].map((m) => (
              <button key={m} type="button" className="preset tabular" role="radio" aria-checked={minutes === m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                {m} {t.minutes}
              </button>
            ))}
          </div>
        </div>
        <p className="body-2 muted">{t.bookNote}</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!days.length}
          onClick={() => {
            const d = days[day];
            upsert.save({
              id: crypto.randomUUID(),
              trainer_id: trainer.id,
              session_date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
              starts_at: startsAt(d, hour),
              duration_min: minutes,
            });
            close();
          }}
        >
          {t.confirm}
        </button>
      </div>
    </Sheet>
  );
}
