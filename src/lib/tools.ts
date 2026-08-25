/**
 * The tool catalogue. Same idea as platforms.ts and guides.ts: the homepage
 * grid, the header count, the footer list and the ItemList structured data all
 * read from here, so a new tool is one entry and nothing else.
 *
 * Everything listed has to hold to the same promise the site is built on — it
 * runs in the tab, with no upload — so `status` is honest about what is
 * actually shipped. Nothing marked 'soon' is linkable.
 */

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
    icon: 'M12 3 4 6.4v5.2c0 4.5 3.2 8.2 8 9.4 4.8-1.2 8-4.9 8-9.4V6.4L12 3zM9 12l2 2 4-4',
  },
  {
    slug: 'exif-viewer',
    name: 'EXIF Viewer',
    tagline:
      'Read every block in a file without changing it — camera, lens, timestamps, GPS, XMP, C2PA, PNG text chunks.',
    category: 'privacy',
    status: 'soon',
    meta: ['read-only', 'full tag dump', 'map for geotags'],
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
    icon: 'M4 8h13l-3-3M20 16H7l3 3',
  },
  {
    slug: 'image-resizer',
    name: 'Image Resizer',
    tagline:
      'Resize and crop to the exact pixel sizes a platform asks for, or to your own, without an upload.',
    category: 'image',
    status: 'live',
    meta: ['presets per platform', 'lock aspect', 'batch'],
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
    icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  },
];

export const LIVE_TOOLS = TOOLS.filter((t) => t.status === 'live');

export function toolHref(tool: Pick<Tool, 'slug' | 'status'>): string | null {
  return tool.status === 'live' ? `/${tool.slug}` : null;
}

export const CATEGORY_LABEL: Record<Tool['category'], string> = {
  privacy: 'privacy',
  image: 'image',
  utility: 'utility',
};
