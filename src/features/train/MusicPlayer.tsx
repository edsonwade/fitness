import type { CSSProperties } from 'react';

import { useT } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { fmtTime, seek, skipBy, toggle, useMusic } from './music';

const NOTE = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

function PlayIcon({ playing, size = 22 }: { playing: boolean; size?: number }) {
  return playing ? (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M7 5v14l11-7z" />
    </svg>
  );
}

/**
 * A `.musicbar` de `proto/v2/04-executar.html`: 52px, progresso no topo, faixa e
 * tocar/pausar. Sem faixas não existe — nem ocupa espaço.
 */
export function MusicBar({ onOpen }: { onOpen: () => void }) {
  const t = useT().music;
  const m = useMusic();
  if (!m.tracks.length) return null;
  const track = m.tracks[m.index];
  const pct = m.duration ? m.time / m.duration : 0;

  return (
    <div className="musicbar-wrap">
      <div className="musicbar" role="group" aria-label={t.open}>
        <span className="musicbar-prog" style={{ transform: `scaleX(${pct})` } as CSSProperties} />
        <button type="button" className="contents" onClick={onOpen} aria-label={t.open}>
          <span className="musicbar-art">{NOTE}</span>
          <span className="musicbar-text">
            <span className="musicbar-title block">{track.title}</span>
            <span className="musicbar-artist block">{track.artist}</span>
          </span>
        </button>
        <button
          type="button"
          className="btn btn-icon"
          aria-pressed={m.playing}
          aria-label={m.playing ? t.pause : t.play}
          onClick={toggle}
        >
          <PlayIcon playing={m.playing} />
        </button>
      </div>
    </div>
  );
}

/** A folha "Música": com faixas, o leitor; sem faixas, onde pô-las e porque não há Spotify. */
export function MusicSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT().music;
  const m = useMusic();
  const track = m.tracks[m.index];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t.title}>
      {track ? (
        <div>
          <div className="nowplaying">
            <span className="nowplaying-art">{NOTE}</span>
            <div className="nowplaying-text">
              <p className="nowplaying-title">{track.title}</p>
              <p className="nowplaying-artist">{track.artist}</p>
            </div>
          </div>

          <div className="scrub">
            <label className="sr-only" htmlFor="music-scrub">
              {t.position}
            </label>
            <input
              id="music-scrub"
              type="range"
              min={0}
              max={Math.floor(m.duration) || 0}
              step={1}
              value={Math.floor(m.time)}
              disabled={!m.duration}
              onChange={(e) => seek(Number(e.currentTarget.value))}
            />
            <div className="scrub-time">
              <span>{fmtTime(m.time)}</span>
              <span>{fmtTime(m.duration)}</span>
            </div>
          </div>

          <div className="player-controls">
            <button type="button" className="btn btn-icon" aria-label={t.back15} onClick={() => skipBy(-15)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                <path d="M19 19V5l-9 7z" />
                <rect x="5" y="5" width="2.5" height="14" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              className="btn btn-primary player-play"
              aria-pressed={m.playing}
              aria-label={m.playing ? t.pause : t.play}
              onClick={toggle}
            >
              <PlayIcon playing={m.playing} size={26} />
            </button>
            <button type="button" className="btn btn-icon" aria-label={t.fwd15} onClick={() => skipBy(15)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                <path d="M5 5v14l9-7z" />
                <rect x="16" y="5" width="2.5" height="14" rx="1" />
              </svg>
            </button>
          </div>

          <div className="notice mt-6">
            <Icon name="info" size={20} strokeWidth={2} />
            <div>
              <p className="notice-title">{t.lockedTitle}</p>
              <p className="notice-body">{t.lockedBody}</p>
            </div>
          </div>
          {m.ducked ? <p className="body-2 mt-3" style={{ color: 'var(--ui-accent)' }}>{t.ducking}</p> : null}
        </div>
      ) : (
        <div>
          <div className="empty" style={{ paddingBlock: 'var(--sp-6)' }}>
            <span style={{ width: 34, height: 34, display: 'inline-grid' }}>{NOTE}</span>
            <p className="title-2">{t.emptyTitle}</p>
            <p>{t.emptyBody}</p>
          </div>
          <div className="notice">
            <Icon name="info" size={20} strokeWidth={2} />
            <div>
              <p className="notice-title">{t.spotifyTitle}</p>
              <p className="notice-body">{t.spotifyBody}</p>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
