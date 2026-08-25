/**
 * The compressor. Like the cleaner it never leaves the tab: the file is decoded
 * once, drawn to a canvas and re-encoded — the difference is that here the
 * encoder is driven in a loop until the output lands where you asked for it.
 *
 * Two modes, because there are only two questions people actually have:
 *
 *  - `size`    — "get it under 500 KB". Quality is searched for, not guessed.
 *  - `quality` — "encode at 80 and tell me what that costs".
 */

import { decodeImage, toBlob } from './clean';

export type CompressMode = 'size' | 'quality';
export type CompressFormat = 'auto' | 'image/jpeg' | 'image/png' | 'image/webp';

export interface CompressOptions {
  mode: CompressMode;
  /** Size budget in kilobytes; only read in `size` mode. */
  targetKB: number;
  /** 0.4–1; only read in `quality` mode, and ignored for PNG. */
  quality: number;
  format: CompressFormat;
  /** Longest edge in pixels; 0 leaves the image at its original size. */
  maxEdge: number;
}

export const DEFAULT_COMPRESS: CompressOptions = {
  mode: 'size',
  targetKB: 500,
  quality: 0.8,
  format: 'auto',
  maxEdge: 0,
};

export interface CompressResult {
  blob: Blob;
  name: string;
  type: string;
  width: number;
  height: number;
  srcWidth: number;
  srcHeight: number;
  bytesBefore: number;
  bytesAfter: number;
  /** Quality the search settled on, or null for a lossless PNG encode. */
  quality: number | null;
  /** How many encodes it took — shown so the search is not a black box. */
  attempts: number;
  /** False when even the smallest usable encode stayed over the budget. */
  hitTarget: boolean;
  targetBytes: number | null;
  /** True when the search had to shrink the image to reach the budget. */
  downscaled: boolean;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Quality bounds for the search. The floor is 0.35 rather than 0 because
 * everything below it is visibly destroyed — past that point the honest answer
 * is to shrink the image instead, which is what the outer loop does.
 */
const Q_MIN = 0.35;
const Q_MAX = 0.95;
const SEARCH_STEPS = 6;

/** Shrink factor per round, and the smallest longest-edge worth producing. */
const SHRINK = 0.8;
const MIN_EDGE = 320;
const MAX_ROUNDS = 7;

function pickType(input: string, option: CompressFormat, mode: CompressMode): string {
  if (option !== 'auto') return option;
  // A size budget cannot be met in PNG — there is no quality dial to turn — so
  // `auto` resolves a PNG input to WebP, which keeps the alpha channel PNG
  // users are usually there for.
  if (input === 'image/png') return mode === 'size' ? 'image/webp' : 'image/png';
  if (input === 'image/webp') return 'image/webp';
  // HEIC/AVIF cannot be re-encoded by canvas, so they land as JPEG.
  return 'image/jpeg';
}

/** `beach photo.HEIC` → `beach photo-min.jpg`. */
function outputName(original: string, type: string): string {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  return `${base}-min.${EXT[type] ?? 'jpg'}`;
}

interface Frame {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

function draw(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  scale: number,
  type: string,
): Frame {
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser blocked canvas access, which this tool needs.');

  if (type === 'image/jpeg') {
    // JPEG has no alpha channel; without this, transparent areas turn black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  return { canvas, width, height };
}

function release(frame: Frame) {
  frame.canvas.width = 0;
  frame.canvas.height = 0;
}

export async function compressFile(file: File, options: CompressOptions): Promise<CompressResult> {
  const source = await decodeImage(file);
  const srcW = 'width' in source ? source.width : 0;
  const srcH = 'height' in source ? source.height : 0;
  if (!srcW || !srcH) throw new Error('This file could not be decoded by your browser.');

  const type = pickType(file.type, options.format, options.mode);
  const fitScale = options.maxEdge > 0 ? Math.min(1, options.maxEdge / Math.max(srcW, srcH)) : 1;

  try {
    if (options.mode === 'quality' || type === 'image/png') {
      const frame = draw(source, srcW, srcH, fitScale, type);
      const blob = await toBlob(frame.canvas, type, options.quality);
      release(frame);
      return {
        blob,
        name: outputName(file.name, type),
        type,
        width: frame.width,
        height: frame.height,
        srcWidth: srcW,
        srcHeight: srcH,
        bytesBefore: file.size,
        bytesAfter: blob.size,
        quality: type === 'image/png' ? null : options.quality,
        attempts: 1,
        hitTarget: true,
        targetBytes: null,
        downscaled: fitScale < 1,
      };
    }

    /* ------------------------------------------------------- size mode ---
     * Round by round: probe the floor first, and only run the full search
     * once the floor actually fits. A search that was always going to fail
     * costs one encode instead of six.
     */
    const target = Math.max(1, Math.round(options.targetKB * 1024));
    let scale = fitScale;
    let attempts = 0;
    let fallback: { blob: Blob; frame: Frame; quality: number } | null = null;

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const frame = draw(source, srcW, srcH, scale, type);

      const floor = await toBlob(frame.canvas, type, Q_MIN);
      attempts++;

      if (floor.size > target) {
        const nextEdge = Math.max(frame.width, frame.height) * SHRINK;
        const canShrink = round < MAX_ROUNDS - 1 && nextEdge >= MIN_EDGE;
        if (canShrink) {
          // Keep the smallest thing produced so far, in case every round
          // overshoots and we have to hand back a best effort.
          if (fallback) release(fallback.frame);
          fallback = { blob: floor, frame, quality: Q_MIN };
          scale *= SHRINK;
          continue;
        }
        // Nothing more to give — return the floor and say so.
        if (fallback) release(fallback.frame);
        release(frame);
        return {
          blob: floor,
          name: outputName(file.name, type),
          type,
          width: frame.width,
          height: frame.height,
          srcWidth: srcW,
          srcHeight: srcH,
          bytesBefore: file.size,
          bytesAfter: floor.size,
          quality: Q_MIN,
          attempts,
          hitTarget: false,
          targetBytes: target,
          downscaled: scale < 1,
        };
      }

      // The floor fits, so somewhere between it and Q_MAX is the best quality
      // that still fits. Binary search for it.
      let lo = Q_MIN;
      let hi = Q_MAX;
      let best = floor;
      let bestQ = Q_MIN;

      for (let i = 0; i < SEARCH_STEPS; i++) {
        const q = (lo + hi) / 2;
        const candidate = await toBlob(frame.canvas, type, q);
        attempts++;
        if (candidate.size <= target) {
          best = candidate;
          bestQ = q;
          lo = q;
        } else {
          hi = q;
        }
      }

      if (fallback) release(fallback.frame);
      release(frame);
      return {
        blob: best,
        name: outputName(file.name, type),
        type,
        width: frame.width,
        height: frame.height,
        srcWidth: srcW,
        srcHeight: srcH,
        bytesBefore: file.size,
        bytesAfter: best.size,
        quality: bestQ,
        attempts,
        hitTarget: true,
        targetBytes: target,
        downscaled: scale < 1,
      };
    }

    /* Unreachable in practice — the loop returns on every path — but a
       best-effort result beats throwing if the bounds are ever changed. */
    if (fallback) {
      const { blob, frame, quality } = fallback;
      release(frame);
      return {
        blob,
        name: outputName(file.name, type),
        type,
        width: frame.width,
        height: frame.height,
        srcWidth: srcW,
        srcHeight: srcH,
        bytesBefore: file.size,
        bytesAfter: blob.size,
        quality,
        attempts,
        hitTarget: false,
        targetBytes: target,
        downscaled: true,
      };
    }
    throw new Error('The browser could not encode this image.');
  } finally {
    if ('close' in source) source.close();
  }
}

/** Presets for the budget control — the sizes people are actually handed. */
export const SIZE_PRESETS: { kb: number; label: string; note: string }[] = [
  { kb: 100, label: '100 KB', note: 'email attachments, forum avatars' },
  { kb: 200, label: '200 KB', note: 'fast-loading web images' },
  { kb: 500, label: '500 KB', note: 'general web use, blog posts' },
  { kb: 1024, label: '1 MB', note: 'most upload forms' },
  { kb: 2048, label: '2 MB', note: 'job portals, government forms' },
  { kb: 5120, label: '5 MB', note: 'print-ish, high detail kept' },
];

export function percentSaved(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round(((before - after) / before) * 100);
}
