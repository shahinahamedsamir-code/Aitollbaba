/**
 * Where a picture ends up, and the shape each of those places forces on it.
 *
 * Platforms centre-crop: they take the middle of your image and throw the rest
 * away. That is the whole problem this tool exists to show, so the maths here
 * is deliberately the same maths a browser does for `object-fit: cover` — the
 * previews are plain CSS, and only the downloads touch a canvas.
 */

export type Shape = 'rect' | 'circle';

export interface Placement {
  id: string;
  group: string;
  label: string;
  width: number;
  height: number;
  shape: Shape;
  /** Anything worth knowing that the numbers do not say. */
  note?: string;
}

export const PLACEMENTS: Placement[] = [
  /* -------------------------------------------------------- Instagram */
  { id: 'ig-square', group: 'Instagram', label: 'feed · square', width: 1080, height: 1080, shape: 'rect' },
  { id: 'ig-portrait', group: 'Instagram', label: 'feed · portrait', width: 1080, height: 1350, shape: 'rect' },
  { id: 'ig-story', group: 'Instagram', label: 'story · reel', width: 1080, height: 1920, shape: 'rect' },
  {
    id: 'ig-profile',
    group: 'Instagram',
    label: 'profile picture',
    width: 320,
    height: 320,
    shape: 'circle',
    note: 'shown as a circle, so the corners of a square go too',
  },

  /* --------------------------------------------------------- Facebook */
  { id: 'fb-feed', group: 'Facebook', label: 'shared post', width: 1200, height: 630, shape: 'rect' },
  { id: 'fb-story', group: 'Facebook', label: 'story', width: 1080, height: 1920, shape: 'rect' },
  {
    id: 'fb-cover',
    group: 'Facebook',
    label: 'page cover',
    width: 851,
    height: 315,
    shape: 'rect',
    note: 'a very wide strip — most of a normal photo is lost here',
  },
  { id: 'fb-profile', group: 'Facebook', label: 'profile picture', width: 320, height: 320, shape: 'circle' },

  /* ---------------------------------------------------------------- X */
  { id: 'x-post', group: 'X', label: 'post image', width: 1600, height: 900, shape: 'rect' },
  { id: 'x-header', group: 'X', label: 'header', width: 1500, height: 500, shape: 'rect' },
  { id: 'x-profile', group: 'X', label: 'profile picture', width: 400, height: 400, shape: 'circle' },

  /* --------------------------------------------------------- LinkedIn */
  { id: 'li-post', group: 'LinkedIn', label: 'shared post', width: 1200, height: 627, shape: 'rect' },
  { id: 'li-banner', group: 'LinkedIn', label: 'profile banner', width: 1584, height: 396, shape: 'rect' },
  { id: 'li-profile', group: 'LinkedIn', label: 'profile picture', width: 400, height: 400, shape: 'circle' },

  /* ---------------------------------------------------------- YouTube */
  { id: 'yt-thumb', group: 'YouTube', label: 'thumbnail', width: 1280, height: 720, shape: 'rect' },

  /* --------------------------------------------------------- WhatsApp */
  {
    id: 'wa-dp',
    group: 'WhatsApp',
    label: 'profile photo',
    width: 640,
    height: 640,
    shape: 'circle',
  },
  { id: 'wa-status', group: 'WhatsApp', label: 'status', width: 1080, height: 1920, shape: 'rect' },
];

export function placementGroups(): { group: string; items: Placement[] }[] {
  const out: { group: string; items: Placement[] }[] = [];
  for (const p of PLACEMENTS) {
    const last = out[out.length - 1];
    if (last && last.group === p.group) last.items.push(p);
    else out.push({ group: p.group, items: [p] });
  }
  return out;
}

export interface CropReport {
  /** Fraction of the source width visible after the crop, 0–1. */
  visibleWidth: number;
  visibleHeight: number;
  /** Percentage of the picture's area that survives. */
  keptPercent: number;
  /** Which way the crop bites. */
  axis: 'sides' | 'top and bottom' | 'none';
  /** The target is larger than the source, so it will be upscaled and soft. */
  upscaled: boolean;
}

/**
 * What a centre-crop to this placement does to a source of these dimensions.
 * The same rule as `object-fit: cover`, expressed as fractions so the preview
 * and the report cannot disagree.
 */
export function cropReport(srcW: number, srcH: number, placement: Placement): CropReport {
  const srcAspect = srcW / srcH;
  const dstAspect = placement.width / placement.height;

  let visibleWidth = 1;
  let visibleHeight = 1;
  let axis: CropReport['axis'] = 'none';

  if (Math.abs(srcAspect - dstAspect) > 0.001) {
    if (srcAspect > dstAspect) {
      // Source is wider than the frame: the sides are cut.
      visibleWidth = dstAspect / srcAspect;
      axis = 'sides';
    } else {
      visibleHeight = srcAspect / dstAspect;
      axis = 'top and bottom';
    }
  }

  const scale = Math.max(placement.width / srcW, placement.height / srcH);

  return {
    visibleWidth,
    visibleHeight,
    keptPercent: Math.round(visibleWidth * visibleHeight * 100),
    axis,
    upscaled: scale > 1,
  };
}

/** `instagram-feed-square-1080x1080.jpg` */
export function cropFileName(base: string, placement: Placement): string {
  const clean = base.replace(/\.[^.]+$/, '') || 'image';
  const slug = `${placement.group}-${placement.label}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${clean}-${slug}-${placement.width}x${placement.height}.jpg`;
}

/**
 * Renders one placement at full size. A circular placement is still written as
 * a square image — the circle is a mask the platform applies, not something
 * that belongs in the file you upload.
 */
export function renderCrop(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  placement: Placement,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = placement.width;
  canvas.height = placement.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser blocked canvas access, which this tool needs.');
  ctx.imageSmoothingQuality = 'high';

  const srcAspect = srcW / srcH;
  const dstAspect = placement.width / placement.height;

  let sw = srcW;
  let sh = srcH;
  if (srcAspect > dstAspect) sw = Math.round(srcH * dstAspect);
  else sh = Math.round(srcW / dstAspect);
  const sx = Math.round((srcW - sw) / 2);
  const sy = Math.round((srcH - sh) / 2);

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, placement.width, placement.height);
  return canvas;
}
