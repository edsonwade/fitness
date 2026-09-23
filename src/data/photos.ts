import { supabase } from './supabase';

/**
 * The photograph a user attaches to an exercise they made.
 *
 * Two rules from `PRODUCT.md` decide everything here. The first is that photography
 * is the imagery of this product, so a user-made exercise is allowed a real photo
 * rather than an icon. The second is that the app is used on a phone in a gym, so a
 * 6 MB camera capture is not sent over that connection: it is redrawn to at most
 * 1080px on its long edge and re-encoded as JPEG before it leaves the device, the
 * same treatment the old app's `downscaleImage` gave it.
 *
 * There is no upload queue. A write to a table is replayed by the outbox after an
 * hour with no signal; a file is not, and building a second offline machine to hold
 * one image would be more moving parts than the feature is worth. Offline, the
 * exercise saves with all of its text and the screen says the photo has not gone up,
 * which is the honest version of the same moment.
 */

const BUCKET = 'exercise-media';
const MAX_EDGE = 1080;
const QUALITY = 0.82;

/** What the file input accepts, and what `downscale` will re-encode. */
export const PHOTO_ACCEPT = 'image/*';

export class PhotoError extends Error {
  readonly reason: 'decode' | 'upload' | 'offline' | 'size';

  constructor(reason: PhotoError['reason'], message: string) {
    super(message);
    this.name = 'PhotoError';
    this.reason = reason;
  }
}

/**
 * Redraws an image file at most `MAX_EDGE` on its long edge.
 *
 * `createImageBitmap` rather than an `<img>` and a load event: it decodes off the
 * main thread, which matters because this runs while a sheet is open and a thumb is
 * waiting. An image already smaller than the bound is still re-encoded, because a
 * PNG screenshot of a machine's plate is several megabytes at any size.
 */
export async function downscale(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PhotoError('decode', 'photo: the file could not be read as an image');
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new PhotoError('decode', 'photo: no 2d context to redraw into');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', QUALITY);
  });
  if (!blob) throw new PhotoError('decode', 'photo: the canvas produced nothing');
  return blob;
}

/**
 * Uploads one photo and returns the public URL to store on the row.
 *
 * The path carries the user id, so a bucket listing says who put what there, and a
 * timestamp, so replacing a photo never depends on a cache being polite about a
 * reused name.
 */
export async function uploadExercisePhoto(
  file: File,
  userId: string,
  key: string,
): Promise<string> {
  return uploadPhoto(file, userId, key, 'ex');
}

/**
 * Uploads the photo of a logged food — the data URL the Nutrição camera holds, or the
 * file picked when the food is edited (B7) — and returns the public URL stored on the row's `photo_url`.
 *
 * Same bucket and the same `user/<uid>/` prefix as an exercise photo, with `food-` in
 * front of the name so a listing tells the two apart.
 */
export async function uploadFoodPhoto(source: string | Blob, userId: string, key: string): Promise<string> {
  let blob: Blob;
  if (typeof source !== 'string') {
    blob = source;
  } else {
    try {
      blob = await (await fetch(source)).blob();
    } catch {
      throw new PhotoError('decode', 'photo: the data URL could not be read');
    }
  }
  return uploadPhoto(blob, userId, `food-${key}`, 'food');
}

async function uploadPhoto(file: Blob, userId: string, key: string, fallback: string): Promise<string> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new PhotoError('offline', 'photo: no connection');
  }

  const blob = await downscale(file);
  const safeKey = key.replace(/[^a-z0-9_-]+/gi, '').slice(0, 32) || fallback;
  const path = `user/${userId}/${safeKey}-${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new PhotoError('upload', error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';

/**
 * The biggest clip that goes up. It is the storage's own per-file ceiling, and a clip of
 * a few repetitions filmed on a phone sits well under it; saying so before the upload is
 * kinder than a failure half a minute into it on gym wifi.
 */
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

/**
 * Uploads one demonstration clip and returns the public URL, which is stored in the
 * row's `video_id` and becomes the clip the Executar screen plays.
 *
 * Unlike a photo it is sent as it is: re-encoding video in the browser is a lot of
 * machinery for a file the phone already compressed.
 */
export async function uploadExerciseVideo(
  file: File,
  userId: string,
  key: string,
): Promise<string> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new PhotoError('offline', 'video: no connection');
  }
  if (!file.type.startsWith('video/')) {
    throw new PhotoError('decode', 'video: the file is not a video');
  }
  if (file.size > VIDEO_MAX_BYTES) {
    throw new PhotoError('size', 'video: the file is over the limit');
  }

  const ext = (file.name.split('.').pop() ?? 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const safeKey = key.replace(/[^a-z0-9_-]+/gi, '').slice(0, 32) || 'ex';
  const path = `user/${userId}/${safeKey}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new PhotoError('upload', error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
