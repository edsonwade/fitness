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
  readonly reason: 'decode' | 'upload' | 'offline';

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
export async function downscale(file: File): Promise<Blob> {
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
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new PhotoError('offline', 'photo: no connection');
  }

  const blob = await downscale(file);
  const safeKey = key.replace(/[^a-z0-9_-]+/gi, '').slice(0, 32) || 'ex';
  const path = `user/${userId}/${safeKey}-${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new PhotoError('upload', error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
