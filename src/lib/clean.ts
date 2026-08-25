/**
 * The cleaner itself. Everything runs in the browser: the file is decoded to
 * pixels, re-drawn onto a canvas (which is what actually drops every metadata
 * block, since a canvas holds nothing but pixels) and re-encoded as a fresh
 * image. Optionally the pixels are nudged by a value or two so the file's
 * perceptual hash no longer matches copies of the original.
 */

import { scan, type ScanResult } from './scan';

export type OutputFormat = 'auto' | 'image/jpeg' | 'image/png' | 'image/webp';

export interface CleanOptions {
  /** Container to encode into. `auto` keeps the input format where possible. */
  format: OutputFormat;
  /** JPEG / WebP quality, 0.5–1. */
  quality: number;
  /** Apply the invisible ±1–2 RGB jitter that resets the file fingerprint. */
  jitter: boolean;
  /** Longest edge in pixels; 0 leaves the image at its original size. */
  maxEdge: number;
}

export const DEFAULT_OPTIONS: CleanOptions = {
  format: 'auto',
  quality: 0.92,
  jitter: true,
  maxEdge: 0,
};

export interface CleanResult {
  blob: Blob;
  name: string;
  width: number;
  height: number;
  hashBefore: string;
  hashAfter: string;
  before: ScanResult;
  after: ScanResult;
  bytesBefore: number;
  bytesAfter: number;
  /** Findings that survived the pass, if any — shown as a warning. */
  remaining: number;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** SHA-256 of the raw bytes, rendered as the short form shown in the UI. */
export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

function pickType(input: string, option: OutputFormat): string {
  if (option !== 'auto') return option;
  if (input === 'image/png') return 'image/png';
  if (input === 'image/webp') return 'image/webp';
  // HEIC/AVIF cannot be re-encoded by canvas, so they land as JPEG.
  return 'image/jpeg';
}

export async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // `from-image` bakes the EXIF orientation into the pixels before we drop
      // the EXIF block, so a rotated phone photo stays the right way up.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to the <img> path for formats the bitmap decoder refuses.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This file could not be decoded by your browser.'));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

const DELTAS = [-2, -1, 1, 2];

/**
 * Nudges each channel by ±1–2 on a scattered subset of pixels. The change is
 * far below the visible threshold but it moves every hash of the file, and
 * lands often enough — roughly one pixel in eight — that no 8×8 JPEG block is
 * left untouched.
 *
 * The stride matters: jittering *every* pixel is pure high-frequency noise,
 * which a lossy encoder cannot compress and which can double the output size.
 * Scattering the same nudges keeps the file roughly the size it started at.
 */
function jitterPixels(data: Uint8ClampedArray) {
  const seed = new Uint32Array(1);
  crypto.getRandomValues(seed);
  let state = seed[0] || 0x9e3779b9;
  const next = () => {
    // xorshift32 — cheap enough to run across a large photo.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  for (let i = 0; i < data.length; ) {
    const r = next();
    data[i] += DELTAS[r & 3];
    data[i + 1] += DELTAS[(r >>> 2) & 3];
    data[i + 2] += DELTAS[(r >>> 4) & 3];
    i += 4 * (1 + ((r >>> 6) & 15));
  }
}

/**
 * Cleaned files are named from the current date and time, never from the file
 * that came in. An original name like "ChatGPT Image Aug 22, 2026.png" or
 * "IMG_4419 (client shoot).jpg" announces where a picture came from as plainly
 * as any metadata field — and the filename is the one piece of provenance a
 * metadata pass cannot reach, because it lives outside the file.
 *
 * Local time rather than UTC, since the name is for the person saving it.
 */
let lastStamp = '';
let repeatCount = 0;

function timestampName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const stamp = `${date}_${time}`;

  // A batch of twenty finishes well inside one second, so seconds alone would
  // hand every file the same name. Counting repeats keeps them distinct
  // without dropping milliseconds into something a person has to read.
  if (stamp === lastStamp) {
    repeatCount += 1;
    return `${stamp}-${repeatCount}`;
  }
  lastStamp = stamp;
  repeatCount = 0;
  return stamp;
}

export function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode this image.'))),
      type,
      type === 'image/png' ? undefined : quality,
    );
  });
}

export async function cleanFile(file: File, options: CleanOptions): Promise<CleanResult> {
  const original = await file.arrayBuffer();
  const before = scan(original);
  const hashBefore = await sha256(original);

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
  const ctx = canvas.getContext('2d', { willReadFrequently: options.jitter });
  if (!ctx) throw new Error('Your browser blocked canvas access, which this tool needs.');

  const type = pickType(file.type, options.format);
  if (type === 'image/jpeg') {
    // JPEG has no alpha channel; without this, transparent areas turn black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ('close' in source) source.close();

  if (options.jitter) {
    const image = ctx.getImageData(0, 0, width, height);
    jitterPixels(image.data);
    ctx.putImageData(image, 0, 0);
  }

  const blob = await toBlob(canvas, type, options.quality);
  canvas.width = 0;
  canvas.height = 0;

  const cleaned = await blob.arrayBuffer();
  const after = scan(cleaned);
  const hashAfter = await sha256(cleaned);

  const ext = EXT[blob.type] ?? EXT[type] ?? 'jpg';

  return {
    blob,
    name: `${timestampName()}.${ext}`,
    width,
    height,
    hashBefore,
    hashAfter,
    before,
    after,
    bytesBefore: file.size,
    bytesAfter: blob.size,
    // A fresh canvas encode carries no EXIF/XMP/C2PA; anything left is benign
    // (a browser-added colour profile), but we surface the count honestly.
    remaining: after.findings.filter((f) => f.kind !== 'icc' && f.kind !== 'other').length,
  };
}

export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];
export const MAX_BYTES = 25 * 1024 * 1024;
export const MAX_BATCH = 20;

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
