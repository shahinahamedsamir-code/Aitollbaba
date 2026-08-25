/**
 * The resizer. Decode in the tab, redraw at the size you asked for, re-encode.
 *
 * The whole difficulty is what to do when the target shape is not the source
 * shape, which is almost always — a 3:2 photograph does not go into a 1:1 post
 * without something giving. There are only three honest answers, and the tool
 * makes you pick one rather than choosing silently:
 *
 *  - `cover`   — fill the frame and crop what hangs over the edges.
 *  - `contain` — fit the whole picture in and pad the gap.
 *  - `stretch` — squash it to fit, distorting the image.
 */

import { decodeImage, toBlob } from './clean';

export type FitMode = 'cover' | 'contain' | 'stretch';
export type ResizeFormat = 'auto' | 'image/jpeg' | 'image/png' | 'image/webp';

export interface ResizeOptions {
  /** `preset` uses a named platform size; `custom` uses width/height below. */
  mode: 'preset' | 'custom';
  presetId: string;
  /** Custom target. 0 means "work it out from the other one". */
  width: number;
  height: number;
  /** Keep each file's own proportions — only one dimension is then binding. */
  lockAspect: boolean;
  fit: FitMode;
  /** Padding colour for `contain`, and the backing for alpha in JPEG. */
  matte: string;
  format: ResizeFormat;
  quality: number;
}

export const TRANSPARENT = 'transparent';

export const MATTES: { value: string; label: string }[] = [
  { value: TRANSPARENT, label: 'transparent' },
  { value: '#ffffff', label: 'white' },
  { value: '#000000', label: 'black' },
  { value: '#07090c', label: 'page dark' },
];

export interface Preset {
  id: string;
  group: string;
  label: string;
  width: number;
  height: number;
}

/**
 * The sizes people are actually asked for. Platforms move these around, so
 * they are current-common rather than eternal — the custom tab is there for
 * when a form demands something else.
 */
export const PRESETS: Preset[] = [
  { id: 'ig-square', group: 'Instagram', label: 'post · square', width: 1080, height: 1080 },
  { id: 'ig-portrait', group: 'Instagram', label: 'post · portrait', width: 1080, height: 1350 },
  { id: 'ig-story', group: 'Instagram', label: 'story · reel', width: 1080, height: 1920 },
  { id: 'fb-post', group: 'Facebook', label: 'shared post', width: 1200, height: 630 },
  { id: 'fb-cover', group: 'Facebook', label: 'page cover', width: 851, height: 315 },
  { id: 'x-post', group: 'X', label: 'post image', width: 1600, height: 900 },
  { id: 'x-header', group: 'X', label: 'header', width: 1500, height: 500 },
  { id: 'li-post', group: 'LinkedIn', label: 'shared post', width: 1200, height: 627 },
  { id: 'li-banner', group: 'LinkedIn', label: 'profile banner', width: 1584, height: 396 },
  { id: 'yt-thumb', group: 'YouTube', label: 'thumbnail', width: 1280, height: 720 },
  { id: 'pin-standard', group: 'Pinterest', label: 'standard pin', width: 1000, height: 1500 },
  { id: 'avatar', group: 'Profile', label: 'avatar · square', width: 400, height: 400 },
];

export const DEFAULT_RESIZE: ResizeOptions = {
  mode: 'preset',
  presetId: 'ig-square',
  width: 1080,
  height: 0,
  lockAspect: true,
  fit: 'cover',
  matte: '#ffffff',
  format: 'auto',
  quality: 0.9,
};

export interface ResizeResult {
  blob: Blob;
  name: string;
  type: string;
  width: number;
  height: number;
  srcWidth: number;
  srcHeight: number;
  bytesBefore: number;
  bytesAfter: number;
  /** How the shape mismatch was resolved — 'none' when the aspects matched. */
  handling: 'none' | 'cropped' | 'padded' | 'stretched';
  /** The target was larger than the source, so pixels were invented. */
  upscaled: boolean;
  quality: number | null;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Targets that can hold an alpha channel. */
const KEEPS_ALPHA = new Set(['image/png', 'image/webp']);

function pickType(input: string, option: ResizeFormat): string {
  if (option !== 'auto') return option;
  if (input === 'image/png') return 'image/png';
  if (input === 'image/webp') return 'image/webp';
  // HEIC/AVIF cannot be re-encoded by canvas, so they land as JPEG.
  return 'image/jpeg';
}

function outputName(original: string, type: string, w: number, h: number): string {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  return `${base}-${w}x${h}.${EXT[type] ?? 'jpg'}`;
}

/**
 * Works out the pixel target for one file. With the aspect locked, whichever
 * dimension you filled in is binding and the other follows the source — which
 * is what makes a mixed batch come out right rather than all one shape.
 */
export function resolveTarget(
  srcW: number,
  srcH: number,
  options: ResizeOptions,
): { width: number; height: number; fit: FitMode } {
  if (options.mode === 'preset') {
    const preset = PRESETS.find((p) => p.id === options.presetId) ?? PRESETS[0];
    return { width: preset.width, height: preset.height, fit: options.fit };
  }

  const w = Math.max(0, Math.round(options.width));
  const h = Math.max(0, Math.round(options.height));

  if (options.lockAspect) {
    // One dimension drives; the other keeps this file's own proportions, so
    // no crop or pad is ever needed.
    if (w > 0) return { width: w, height: Math.max(1, Math.round((w * srcH) / srcW)), fit: 'stretch' };
    if (h > 0) return { width: Math.max(1, Math.round((h * srcW) / srcH)), height: h, fit: 'stretch' };
    return { width: srcW, height: srcH, fit: 'stretch' };
  }

  return {
    width: w > 0 ? w : srcW,
    height: h > 0 ? h : srcH,
    fit: options.fit,
  };
}

export async function resizeFile(file: File, options: ResizeOptions): Promise<ResizeResult> {
  const source = await decodeImage(file);
  const srcW = 'width' in source ? source.width : 0;
  const srcH = 'height' in source ? source.height : 0;
  if (!srcW || !srcH) throw new Error('This file could not be decoded by your browser.');

  const { width, height, fit } = resolveTarget(srcW, srcH, options);
  const type = pickType(file.type, options.format);
  const keepsAlpha = KEEPS_ALPHA.has(type);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser blocked canvas access, which this tool needs.');
  ctx.imageSmoothingQuality = 'high';

  const srcAspect = srcW / srcH;
  const dstAspect = width / height;
  // Within a rounding error the shapes match, so nothing is lost either way.
  const sameShape = Math.abs(srcAspect - dstAspect) < 0.001;

  let handling: ResizeResult['handling'] = 'none';

  if (fit === 'cover' && !sameShape) {
    // Take the largest centred rectangle of the source with the target shape,
    // and draw only that — everything outside it is the crop.
    let sw = srcW;
    let sh = srcH;
    if (srcAspect > dstAspect) sw = Math.round(srcH * dstAspect);
    else sh = Math.round(srcW / dstAspect);
    const sx = Math.round((srcW - sw) / 2);
    const sy = Math.round((srcH - sh) / 2);
    ctx.drawImage(source as CanvasImageSource, sx, sy, sw, sh, 0, 0, width, height);
    handling = 'cropped';
  } else if (fit === 'contain' && !sameShape) {
    const scale = Math.min(width / srcW, height / srcH);
    const dw = Math.max(1, Math.round(srcW * scale));
    const dh = Math.max(1, Math.round(srcH * scale));
    ctx.drawImage(source as CanvasImageSource, Math.round((width - dw) / 2), Math.round((height - dh) / 2), dw, dh);
    handling = 'padded';
  } else {
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    if (!sameShape && fit === 'stretch') handling = 'stretched';
  }

  if ('close' in source) source.close();

  // Painted behind everything already drawn, so it fills the padding and backs
  // any transparency the source had — never over the picture.
  const wantsTransparent = options.matte === TRANSPARENT && keepsAlpha;
  if (!wantsTransparent) {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = options.matte === TRANSPARENT ? '#ffffff' : options.matte;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  const blob = await toBlob(canvas, type, options.quality);
  canvas.width = 0;
  canvas.height = 0;

  return {
    blob,
    name: outputName(file.name, type, width, height),
    type,
    width,
    height,
    srcWidth: srcW,
    srcHeight: srcH,
    bytesBefore: file.size,
    bytesAfter: blob.size,
    handling,
    upscaled: width > srcW || height > srcH,
    quality: type === 'image/png' ? null : options.quality,
  };
}

export const FITS: { value: FitMode; label: string; note: string }[] = [
  {
    value: 'cover',
    label: 'crop to fill',
    note: 'fills the frame exactly and cuts off whatever hangs over the edges',
  },
  {
    value: 'contain',
    label: 'fit inside',
    note: 'keeps the whole picture and pads the leftover space with the colour below',
  },
  {
    value: 'stretch',
    label: 'stretch',
    note: 'forces the picture into the frame, distorting it — rarely what you want',
  },
];

/** Groups the presets for rendering, preserving the order above. */
export function presetGroups(): { group: string; items: Preset[] }[] {
  const out: { group: string; items: Preset[] }[] = [];
  for (const preset of PRESETS) {
    const last = out[out.length - 1];
    if (last && last.group === preset.group) last.items.push(preset);
    else out.push({ group: preset.group, items: [preset] });
  }
  return out;
}
