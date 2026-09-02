import { useState } from 'react';
import clsx from 'clsx';

import { pt } from '../../i18n/pt';
import { Icon } from '../../ui/Icon';

const t = pt.train;

/**
 * A video that costs nothing until it is wanted.
 *
 * The card shows a local poster and a play button, and that is all that loads: no
 * YouTube iframe, no third-party script, no cookie, on a screen that lists a dozen
 * exercises. The iframe is created only when the user taps play, which is the one
 * moment the network cost is worth paying.
 *
 * `enablejsapi` is deliberately omitted and the embed is the no-cookie host, so the
 * player cannot be driven by script and does not write a tracking cookie before the
 * user has chosen to watch. There is no outbound link to YouTube either; the point is
 * to watch the form here, not to be handed off to a feed of suggestions.
 */
export function VideoFacade({
  videoId,
  poster,
  fallbackPoster,
  name,
}: {
  videoId: string | null;
  /** Null when there is no photo to show. Never another exercise's. */
  poster: string | null;
  fallbackPoster: string | null;
  name: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing && videoId) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-media bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={`${t.videoOf} ${name}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
        <button
          type="button"
          onClick={() => setPlaying(false)}
          aria-label={t.closeVideo}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-transform duration-[160ms] active:scale-[0.94] motion-reduce:active:scale-100"
        >
          <Icon name="x" size={17} strokeWidth={2.2} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => videoId && setPlaying(true)}
      disabled={!videoId}
      aria-label={videoId ? `${t.watchVideo}: ${name}` : undefined}
      className="group relative block aspect-video w-full overflow-hidden rounded-media bg-surface-sunken disabled:cursor-default"
    >
      {poster ? (
        <>
          <img
            src={poster}
            alt=""
            loading="lazy"
            onError={(e) => {
              if (!fallbackPoster || e.currentTarget.src.endsWith(fallbackPoster)) return;
              e.currentTarget.src = fallbackPoster;
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-black/5" />
        </>
      ) : (
        /*
         * No photo, and deliberately nothing borrowed. An exercise a user added is
         * never given a baseline photograph by name matching: the card would then be
         * claiming an image the user never chose, of a movement that may not be theirs.
         */
        <span className="absolute inset-0 grid place-items-center text-text-muted">
          <Icon name="dumbbell" size={34} strokeWidth={1.5} />
        </span>
      )}
      {videoId ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-black shadow-[var(--shadow-float)] transition-transform duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] pointer-hover:group-hover:scale-105">
            <Icon name="play" size={24} strokeWidth={1.6} className="translate-x-[1px]" />
          </span>
        </span>
      ) : null}
      <span
        className={clsx(
          'absolute bottom-2.5 left-3 font-ui text-[12px] font-600',
          poster ? 'text-white/90' : 'text-text-muted',
        )}
      >
        {videoId ? t.watchVideo : pt.editor.videoNone}
      </span>
    </button>
  );
}
