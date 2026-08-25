/**
 * A minimal PDF writer, written out rather than pulled in — the same call the
 * ZIP writer and the QR encoder made.
 *
 * The reason it is worth writing: PDF can carry a JPEG *as a JPEG*. The
 * `/DCTDecode` filter means the compressed bytes go into the file untouched,
 * so a photo that is already a JPEG is copied in byte for byte — no decode, no
 * re-encode, no second generation of loss, and no waiting.
 *
 * Anything that is not a baseline RGB or greyscale JPEG (a PNG, a progressive
 * JPEG, a CMYK scan) cannot be embedded that way and is re-encoded through a
 * canvas first. The UI says which happened to each file.
 *
 * No /Info dictionary is written: no producer string, no creation date. A
 * privacy tool has no business stamping the time you made a document into it.
 */

import { decodeImage, toBlob } from './clean';

export type PageSize = 'match' | 'a4' | 'letter' | 'legal' | 'a5';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface PdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  /** Margin in millimetres; ignored when the page matches the image. */
  marginMm: number;
  /** Quality used only for images that have to be re-encoded. */
  quality: number;
}

export const DEFAULT_PDF: PdfOptions = {
  pageSize: 'a4',
  orientation: 'auto',
  marginMm: 10,
  quality: 0.92,
};

/** Page sizes in PDF points (1 pt = 1/72 inch), portrait. */
const SIZES: Record<Exclude<PageSize, 'match'>, [number, number]> = {
  a4: [595.28, 841.89],
  a5: [419.53, 595.28],
  letter: [612, 792],
  legal: [612, 1008],
};

export const PAGE_SIZES: { value: PageSize; label: string; note: string }[] = [
  { value: 'a4', label: 'A4', note: '210 × 297 mm — the default nearly everywhere' },
  { value: 'letter', label: 'Letter', note: '8.5 × 11 in — US paper' },
  { value: 'legal', label: 'Legal', note: '8.5 × 14 in' },
  { value: 'a5', label: 'A5', note: 'half of A4' },
  { value: 'match', label: 'Match image', note: 'each page takes the shape of its picture, no borders' },
];

const MM_TO_PT = 72 / 25.4;

export interface PreparedImage {
  /** The bytes that go into the PDF — JPEG, always. */
  bytes: Uint8Array;
  width: number;
  height: number;
  gray: boolean;
  /** False when the original had to be re-encoded to get here. */
  embeddedAsIs: boolean;
  /** Why it was re-encoded, for the UI to show. */
  reason?: string;
  sourceName: string;
  sourceBytes: number;
}

/* --------------------------------------------------------- JPEG inspection */

interface JpegInfo {
  width: number;
  height: number;
  components: number;
  /** SOF0/SOF1 are baseline; DCTDecode is only reliable for those. */
  baseline: boolean;
}

/** Walks the JPEG marker chain to the frame header. Returns null if it is not one. */
export function inspectJpeg(b: Uint8Array): JpegInfo | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let p = 2;
  while (p + 4 <= b.length) {
    if (b[p] !== 0xff) return null;
    let marker = b[p + 1];
    // Skip fill bytes.
    while (marker === 0xff && p + 2 < b.length) {
      p++;
      marker = b[p + 1];
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      p += 2;
      continue;
    }
    const len = (b[p + 2] << 8) | b[p + 3];
    if (len < 2) return null;

    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof) {
      if (p + 9 > b.length) return null;
      return {
        height: (b[p + 5] << 8) | b[p + 6],
        width: (b[p + 7] << 8) | b[p + 8],
        components: b[p + 9],
        baseline: marker === 0xc0 || marker === 0xc1,
      };
    }
    if (marker === 0xda) return null; // scan data before a frame header
    p += 2 + len;
  }
  return null;
}

/**
 * Gets a file into a shape the PDF can hold. A baseline RGB or greyscale JPEG
 * is passed straight through; everything else goes through a canvas.
 */
export async function prepareImage(file: File, quality: number): Promise<PreparedImage> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const jpeg = inspectJpeg(buffer);

  if (jpeg && jpeg.baseline && (jpeg.components === 1 || jpeg.components === 3)) {
    return {
      bytes: buffer,
      width: jpeg.width,
      height: jpeg.height,
      gray: jpeg.components === 1,
      embeddedAsIs: true,
      sourceName: file.name,
      sourceBytes: file.size,
    };
  }

  const reason = !jpeg
    ? 'not a JPEG'
    : !jpeg.baseline
      ? 'progressive JPEG'
      : `${jpeg.components}-channel JPEG`;

  const source = await decodeImage(file);
  const w = 'width' in source ? source.width : 0;
  const h = 'height' in source ? source.height : 0;
  if (!w || !h) throw new Error('This file could not be decoded by your browser.');

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser blocked canvas access, which this tool needs.');
  // A PDF page is opaque, so transparency is flattened onto white rather than
  // coming out black the way an unpainted JPEG would.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  if ('close' in source) source.close();

  const blob = await toBlob(canvas, 'image/jpeg', quality);
  canvas.width = 0;
  canvas.height = 0;

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: w,
    height: h,
    gray: false,
    embeddedAsIs: false,
    reason,
    sourceName: file.name,
    sourceBytes: file.size,
  };
}

/* ------------------------------------------------------------ PDF assembly */

const latin1 = (s: string) => {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
};

/** Trims a number to something short but exact enough for page geometry. */
const pt = (n: number) => (Math.round(n * 100) / 100).toString();

function pageBox(img: PreparedImage, options: PdfOptions): [number, number] {
  if (options.pageSize === 'match') {
    // The page takes the picture's shape, scaled so its longest side is A4's
    // longest side — otherwise a 6000px photo would ask for a metre of paper.
    const longest = SIZES.a4[1];
    return img.width >= img.height
      ? [longest, (longest * img.height) / img.width]
      : [(longest * img.width) / img.height, longest];
  }
  const [w, h] = SIZES[options.pageSize];
  const landscape =
    options.orientation === 'landscape' ||
    (options.orientation === 'auto' && img.width > img.height);
  return landscape ? [h, w] : [w, h];
}

/**
 * Builds the file. One page per image, each holding the image scaled to fit
 * inside the margins and centred.
 */
export function buildPdf(images: PreparedImage[], options: PdfOptions): Blob {
  if (!images.length) throw new Error('No pages to write.');

  const chunks: Uint8Array[] = [];
  let offset = 0;
  const offsets: number[] = [];

  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === 'string' ? latin1(data) : data;
    chunks.push(bytes);
    offset += bytes.length;
  };

  // Object n is recorded at the byte it starts on, for the xref table.
  const startObject = (n: number) => {
    offsets[n] = offset;
    push(`${n} 0 obj\n`);
  };

  push('%PDF-1.7\n');
  // A comment of high bytes marks the file as binary for anything transferring it.
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const pageIds = images.map((_, i) => 3 + i * 3);
  const totalObjects = 2 + images.length * 3;

  startObject(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  startObject(2);
  push(
    `<< /Type /Pages /Count ${images.length} /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(' ')}] >>\nendobj\n`,
  );

  images.forEach((img, i) => {
    const pageId = pageIds[i];
    const contentId = pageId + 1;
    const imageId = pageId + 2;

    const [pw, ph] = pageBox(img, options);
    const margin = options.pageSize === 'match' ? 0 : options.marginMm * MM_TO_PT;
    const availW = Math.max(1, pw - margin * 2);
    const availH = Math.max(1, ph - margin * 2);

    // Contain: the whole picture is always on the page, never cropped.
    const scale = Math.min(availW / img.width, availH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const x = (pw - drawW) / 2;
    const y = (ph - drawH) / 2;

    startObject(pageId);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt(pw)} ${pt(ph)}] ` +
        `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );

    // The image XObject is a unit square, so the matrix carries both the size
    // and the position.
    const content = `q\n${pt(drawW)} 0 0 ${pt(drawH)} ${pt(x)} ${pt(y)} cm\n/Im0 Do\nQ\n`;
    startObject(contentId);
    push(`<< /Length ${content.length} >>\nstream\n`);
    push(content);
    push('endstream\nendobj\n');

    startObject(imageId);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} ` +
        `/ColorSpace /Device${img.gray ? 'Gray' : 'RGB'} /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`,
    );
    push(img.bytes);
    push('\nendstream\nendobj\n');
  });

  const xrefAt = offset;
  push(`xref\n0 ${totalObjects + 1}\n`);
  push('0000000000 65535 f \n');
  for (let n = 1; n <= totalObjects; n++) {
    push(`${String(offsets[n] ?? 0).padStart(10, '0')} 00000 n \n`);
  }
  // No /Info: nothing here records who made this or when.
  push(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

export function pdfFileName(images: PreparedImage[]): string {
  if (images.length === 1) {
    const base = images[0].sourceName.replace(/\.[^.]+$/, '') || 'document';
    return `${base}.pdf`;
  }
  return `${images.length}-images.pdf`;
}
