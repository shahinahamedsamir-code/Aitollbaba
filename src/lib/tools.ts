/**
 * The tool catalogue. Same idea as platforms.ts and guides.ts: the homepage
 * grid, the header count, the footer list and the ItemList structured data all
 * read from here, so a new tool is one entry and nothing else.
 *
 * Everything listed has to hold to the same promise the site is built on — it
 * runs in the tab, with no upload — so `status` is honest about what is
 * actually shipped. Nothing marked 'soon' is linkable.
 */

import { PLACEMENTS } from './placements';

export type ToolStatus = 'live' | 'soon';

export interface Tool {
  slug: string;
  name: string;
  /** One line for the card. Keep it under ~90 characters. */
  tagline: string;
  category: 'privacy' | 'image' | 'utility';
  status: ToolStatus;
  /** Short labels under the card — formats, limits, whatever is concrete. */
  meta: string[];
  /** Takes an image file. Drives the "Image tools" menu in the header. */
  handlesImages: boolean;
  /** A few words for the header menu, where the tagline is far too long. */
  short: string;
  /** 24×24 stroke path, drawn with currentColor. */
  icon: string;
}

export const TOOLS: Tool[] = [
  {
    slug: 'remove-ai-label',
    name: 'AI Label Remover',
    tagline:
      'Strips the C2PA credentials, IPTC and generator tags platforms read to add an AI label — plus EXIF and GPS.',
    category: 'privacy',
    status: 'live',
    meta: ['JPG · PNG · WEBP · AVIF · HEIC', '20 at once', 'reports before it cleans'],
    handlesImages: true,
    short: 'strip AI labels, EXIF and GPS',
    icon: 'M12 3 4 6.4v5.2c0 4.5 3.2 8.2 8 9.4 4.8-1.2 8-4.9 8-9.4V6.4L12 3zM9 12l2 2 4-4',
  },
  {
    slug: 'ai-image-checker',
    name: 'AI Image Checker',
    tagline:
      'Read what a file declares about its own origin — C2PA, generator tags, prompt data — weighed against the marks a camera leaves.',
    category: 'privacy',
    status: 'live',
    meta: ['reads the file, not the pixels', 'C2PA + generator tags', 'says what it cannot know'],
    handlesImages: true,
    short: 'what the file admits about itself',
    icon: 'M12 3 4 6.4v5.2c0 4.5 3.2 8.2 8 9.4 4.8-1.2 8-4.9 8-9.4V6.4L12 3zM12 8v4M12 15.5v.5',
  },
  {
    slug: 'exif-viewer',
    name: 'EXIF Viewer',
    tagline:
      'Read every block in a file without changing it — camera, lens, timestamps, GPS, XMP, C2PA, PNG text chunks.',
    category: 'privacy',
    status: 'live',
    meta: ['read-only', 'full tag dump', 'GPS decoded'],
    handlesImages: true,
    short: 'read every tag, change nothing',
    icon: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 9.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 1 0 12 9.2z',
  },
  {
    slug: 'image-compressor',
    name: 'Image Compressor',
    tagline:
      'Bring a file under a size budget you set, with the quality picked for you and the original kept side by side.',
    category: 'image',
    status: 'live',
    meta: ['target a KB budget', 'before / after view', 'batch'],
    handlesImages: true,
    short: 'hit an exact size budget',
    icon: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5M9.5 9.5h5v5h-5z',
  },
  {
    slug: 'image-converter',
    name: 'Image Converter',
    tagline:
      'Move between JPG, PNG and WebP in the tab — reading HEIC and AVIF too — with transparency kept or matted, never blacked out.',
    category: 'image',
    status: 'live',
    meta: ['reads HEIC + AVIF', 'keeps alpha', 'batch to ZIP'],
    handlesImages: true,
    short: 'JPG, PNG, WebP and HEIC',
    icon: 'M4 8h13l-3-3M20 16H7l3 3',
  },
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    tagline:
      'Put images into one PDF. A JPEG is embedded exactly as it is — no re-encoding, so nothing is lost.',
    category: 'image',
    status: 'live',
    meta: ['no quality loss', 'up to 20 pages', 'no date stamped in'],
    handlesImages: true,
    short: 'images into one document',
    icon: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
  },
  {
    slug: 'social-preview',
    name: 'Social Crop Preview',
    tagline:
      'One image, every platform crop side by side — feed, story, banner and the profile circle — so you see what gets cut before you post.',
    category: 'image',
    status: 'live',
    meta: [`${PLACEMENTS.length} placements`, 'shows what is cut', 'download all as ZIP'],
    handlesImages: true,
    short: 'see every crop before posting',
    icon: 'M4 4h7v7H4zM13 4h7v4h-7zM13 13h7v7h-7zM4 16h7v4H4z',
  },
  {
    slug: 'image-resizer',
    name: 'Image Resizer',
    tagline:
      'Resize and crop to the exact pixel sizes a platform asks for, or to your own, without an upload.',
    category: 'image',
    status: 'live',
    meta: ['presets per platform', 'lock aspect', 'batch'],
    handlesImages: true,
    short: 'platform presets or exact pixels',
    icon: 'M4 4h9v9H4zM11 11h9v9h-9zM13 4h7v7',
  },
  {
    slug: 'qr-generator',
    name: 'QR Generator',
    tagline:
      'Make a QR code for a link, text, Wi-Fi or contact card and export it as SVG or PNG at any size.',
    category: 'utility',
    status: 'live',
    meta: ['SVG + PNG', 'error-correction levels', 'no tracking redirect'],
    handlesImages: false,
    short: 'links, Wi-Fi, contact cards',
    icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  },
];

export const LIVE_TOOLS = TOOLS.filter((t) => t.status === 'live');

/** Everything that takes an image file, in registry order. */
export const IMAGE_TOOLS = TOOLS.filter((t) => t.status === 'live' && t.handlesImages);

export function toolHref(tool: Pick<Tool, 'slug' | 'status'>): string | null {
  return tool.status === 'live' ? `/${tool.slug}` : null;
}

export const CATEGORY_LABEL: Record<Tool['category'], string> = {
  privacy: 'privacy',
  image: 'image',
  utility: 'utility',
};
