/**
 * The converter. Same shape as the other tools: decode to pixels in the tab,
 * re-encode into the container you asked for, never send anything anywhere.
 *
 * Two things make conversion different from compression, and both are handled
 * explicitly rather than hoped for:
 *
 *  - **Alpha.** PNG, WebP and AVIF carry transparency; JPEG does not. Painting
 *    a transparent image straight into JPEG turns every clear pixel black, so
 *    a matte colour is composited *behind* the picture first.
 *  - **What the browser can actually write.** `canvas.toBlob` does not fail on
 *    a format it cannot encode — it quietly hands back a PNG. So each target is
 *    probed once and anything unsupported is disabled rather than mislabelled.
 */

import { decodeImage, toBlob } from './clean';

export type ConvertTarget = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif';

export interface ConvertOptions {
  target: ConvertTarget;
  /** 0.4–1; ignored for PNG, which is lossless. */
  quality: number;
  /** Longest edge in pixels; 0 leaves the image at its original size. */
  maxEdge: number;
  /** Painted behind the picture when alpha has to be dropped. */
  matte: string;
}

export const DEFAULT_CONVERT: ConvertOptions = {
  target: 'image/webp',
  quality: 0.9,
  maxEdge: 0,
  matte: '#ffffff',
};

export interface ConvertResult {
  blob: Blob;
  name: string;
  type: string;
  width: number;
  height: number;
  srcWidth: number;
  srcHeight: number;
  bytesBefore: number;
  bytesAfter: number;
  /** MIME type the file arrived as, or '' when the browser did not say. */
  sourceType: string;
  /** The source actually contained non-opaque pixels. */
  hadAlpha: boolean;
  /** Alpha was present and had to be composited onto the matte. */
  alphaFlattened: boolean;
  /** Quality used, or null for a lossless PNG encode. */
  quality: number | null;
}

export const TARGETS: { type: ConvertTarget; label: string; note: string; alpha: boolean }[] = [
  {
    type: 'image/webp',
    label: 'WebP',
    note: 'smallest for the same quality, keeps transparency, supported everywhere current',
    alpha: true,
  },
  {
    type: 'image/jpeg',
    label: 'JPEG',
    note: 'the safest thing to hand to old software — no transparency',
    alpha: false,
  },
  {
    type: 'image/png',
    label: 'PNG',
    note: 'lossless and keeps transparency, but much larger for photographs',
    alpha: true,
  },
  {
    type: 'image/avif',
    label: 'AVIF',
    note: 'smaller again than WebP, though not every browser can write it',
    alpha: true,
  },
];

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const MATTES: { value: string; label: string }[] = [
  { value: '#ffffff', label: 'white' },
  { value: '#000000', label: 'black' },
  { value: '#07090c', label: 'page dark' },
];

/**
 * Probes an encoder once and remembers the answer. `toBlob` returns a PNG when
 * it does not know the type asked for, so the returned blob's own type is the
 * only trustworthy signal.
 */
const probed = new Map<ConvertTarget, boolean>();

export async function canEncode(type: ConvertTarget): Promise<boolean> {
  if (type === 'image/png') return true;
  const cached = probed.get(type);
  if (cached !== undefined) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.8));
  const ok = blob !== null && blob.type === type;
  probed.set(type, ok);
  return ok;
}

/** Every target this browser can actually write, in the order shown in the UI. */
export async function supportedTargets(): Promise<ConvertTarget[]> {
  const checks = await Promise.all(TARGETS.map(async (t) => ((await canEncode(t.type)) ? t.type : null)));
  return checks.filter((t): t is ConvertTarget => t !== null);
}

/** `beach photo.HEIC` → `beach photo.webp`. */
function outputName(original: string, type: string): string {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${EXT[type] ?? 'png'}`;
}

/** True as soon as one non-opaque pixel turns up; a full pass otherwise. */
function detectAlpha(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true;
  }
  return false;
}

export async function convertFile(file: File, options: ConvertOptions): Promise<ConvertResult> {
  const target = options.target;
  if (!(await canEncode(target))) {
    throw new Error('This browser cannot write that format.');
  }

  const source = await decodeImage(file);
  const srcW = 'width' in source ? source.width : 0;
  const srcH = 'height' in source ? source.height : 0;
  if (!srcW || !srcH) throw new Error('This file could not be decoded by your browser.');

  const scale = options.maxEdge > 0 ? Math.min(1, options.maxEdge / Math.max(srcW, srcH)) : 1;
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Your browser blocked canvas access, which this tool needs.');

  ctx.imageSmoothingQuality = 'high';
  // Drawn onto a transparent canvas first, so what alpha the source had is
  // still readable before anything is painted behind it.
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ('close' in source) source.close();

  const hadAlpha = detectAlpha(ctx, width, height);
  const keepsAlpha = TARGETS.find((t) => t.type === target)?.alpha ?? false;
  const alphaFlattened = hadAlpha && !keepsAlpha;

  if (!keepsAlpha) {
    // `destination-over` paints the matte behind what is already drawn, which
    // is the whole trick — filling first would cover the picture.
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = options.matte;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  const blob = await toBlob(canvas, target, options.quality);
  canvas.width = 0;
  canvas.height = 0;

  return {
    blob,
    name: outputName(file.name, target),
    type: target,
    width,
    height,
    srcWidth: srcW,
    srcHeight: srcH,
    bytesBefore: file.size,
    bytesAfter: blob.size,
    sourceType: file.type,
    hadAlpha,
    alphaFlattened,
    quality: target === 'image/png' ? null : options.quality,
  };
}

/**
 * `image/webp` → `WEBP`, for the labels in the result rows. Names the format
 * rather than the extension, so the label matches the pill that was pressed —
 * the file itself still lands as .jpg.
 */
export function shortType(type: string): string {
  if (!type) return '—';
  return (TARGETS.find((t) => t.type === type)?.label ?? type.replace('image/', '')).toUpperCase();
}
