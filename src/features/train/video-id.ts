/**
 * Reads a YouTube video id out of whatever the user pasted.
 *
 * Nobody types an eleven-character id on a phone. They paste the address bar, or the
 * share sheet's short link, or a Shorts URL, and every one of those has to work.
 * Ported from `old/js/ui.js:158`, with `music.youtube.com` added because the share
 * sheet on Android produces it.
 *
 * An empty string means "no video". A non-empty input that yields an empty string
 * means the input was wrong, and those two have to be told apart by the caller: the
 * first is a card with no demonstration, the second is a typo worth reporting.
 */
export function youtubeId(input: string): string {
  const value = input.trim();
  if (!value) return '';
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  const match = value.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? match[1] : '';
}
