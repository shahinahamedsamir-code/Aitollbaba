/**
 * Byte-level metadata scanner. Walks the container structure of the file
 * (JPEG segments, PNG chunks, RIFF chunks, ISOBMFF boxes) and reports every
 * block of embedded metadata it finds, plus a few decoded EXIF tags so people
 * can see what is actually inside an image before cleaning it.
 *
 * Nothing here touches the network: the file arrives as an ArrayBuffer and is
 * parsed in place.
 */

export type MetaKind =
  | 'exif'
  | 'gps'
  | 'xmp'
  | 'iptc'
  | 'c2pa'
  | 'ai'
  | 'sd'
  | 'icc'
  | 'comment'
  | 'thumbnail'
  | 'other';

export interface Finding {
  kind: MetaKind;
  label: string;
  detail?: string;
  bytes: number;
}

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'heic' | 'gif' | 'unknown';

export interface ScanResult {
  format: ImageFormat;
  width: number;
  height: number;
  findings: Finding[];
  tags: Record<string, string>;
  metadataBytes: number;
}

const ascii = (b: Uint8Array, start: number, len: number) => {
  let s = '';
  const end = Math.min(start + len, b.length);
  for (let i = start; i < end; i++) s += String.fromCharCode(b[i]);
  return s;
};

export function detectFormat(b: Uint8Array): ImageFormat {
  if (b.length < 12) return 'unknown';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpeg';
  if (b[0] === 0x89 && ascii(b, 1, 3) === 'PNG') return 'png';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp';
  if (ascii(b, 0, 3) === 'GIF') return 'gif';
  if (ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4);
    if (brand.startsWith('avi')) return 'avif';
    if (['heic', 'heix', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return 'heic';
  }
  return 'unknown';
}

/* ------------------------------------------------------------------ EXIF */

const EXIF_TAGS: Record<number, string> = {
  0x010f: 'Camera make',
  0x0110: 'Camera model',
  0x0131: 'Software',
  0x0132: 'Date modified',
  0x013b: 'Artist',
  0x8298: 'Copyright',
  0x9003: 'Date taken',
  0xa430: 'Camera owner',
  0xa431: 'Body serial number',
  0xa433: 'Lens make',
  0xa434: 'Lens model',
  0xa435: 'Lens serial number',
  0x829a: 'Exposure time',
  0x829d: 'F-number',
  0x8827: 'ISO',
};

const TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];

/** Parses a TIFF header (the payload of an APP1 / eXIf block) for headline tags. */
function parseTiff(b: Uint8Array, base: number, out: Record<string, string>) {
  const result = { gps: false, thumbBytes: 0 };
  if (base + 8 > b.length) return result;
  const little = ascii(b, base, 2) === 'II';
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const u16 = (o: number) => (o + 2 <= b.length ? view.getUint16(o, little) : 0);
  const u32 = (o: number) => (o + 4 <= b.length ? view.getUint32(o, little) : 0);
  if (u16(base + 2) !== 42) return result;

  const readGps = (offset: number) => {
    const count = u16(offset);
    if (!count || count > 64) return;
    const vals: Record<number, number[]> = {};
    const refs: Record<number, string> = {};
    for (let i = 0; i < count; i++) {
      const entry = offset + 2 + i * 12;
      if (entry + 12 > b.length) break;
      const tag = u16(entry);
      const type = u16(entry + 2);
      const n = u32(entry + 4);
      const at = base + u32(entry + 8);
      if (type === 5 && n === 3 && at + 24 <= b.length) {
        const parts: number[] = [];
        for (let k = 0; k < 3; k++) {
          const num = u32(at + k * 8);
          const den = u32(at + k * 8 + 4);
          parts.push(den ? num / den : 0);
        }
        vals[tag] = parts;
      } else if (type === 2) {
        refs[tag] = ascii(b, entry + 8, 1);
      }
    }
    const dms = (p: number[]) => p[0] + p[1] / 60 + p[2] / 3600;
    if (vals[2] && vals[4]) {
      const lat = dms(vals[2]) * (refs[1] === 'S' ? -1 : 1);
      const lon = dms(vals[4]) * (refs[3] === 'W' ? -1 : 1);
      out['GPS coordinates'] = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  const readIfd = (offset: number, depth: number): number => {
    if (depth > 3 || offset + 2 > b.length) return 0;
    const count = u16(offset);
    if (!count || count > 512) return 0;
    for (let i = 0; i < count; i++) {
      const entry = offset + 2 + i * 12;
      if (entry + 12 > b.length) break;
      const tag = u16(entry);
      const type = u16(entry + 2);
      const n = u32(entry + 4);
      const size = (TYPE_SIZE[type] ?? 0) * n;
      const valueAt = size > 4 ? base + u32(entry + 8) : entry + 8;

      if (tag === 0x8769 || tag === 0xa005) {
        readIfd(base + u32(entry + 8), depth + 1);
      } else if (tag === 0x8825) {
        result.gps = true;
        readGps(base + u32(entry + 8));
      } else if (tag === 0x0201) {
        result.thumbBytes = u32(valueAt);
      } else if (EXIF_TAGS[tag] && valueAt + size <= b.length) {
        const label = EXIF_TAGS[tag];
        if (type === 2) {
          const s = ascii(b, valueAt, Math.max(0, size - 1)).replace(/\0[\s\S]*$/, '').trim();
          if (s) out[label] = s;
        } else if (type === 3) {
          out[label] = String(u16(valueAt));
        } else if (type === 4) {
          out[label] = String(u32(valueAt));
        } else if (type === 5) {
          const num = u32(valueAt);
          const den = u32(valueAt + 4);
          if (den && num) out[label] = num >= den ? String(num / den) : `1/${Math.round(den / num)}`;
        }
      }
    }
    const nextAt = offset + 2 + count * 12;
    return u32(nextAt);
  };

  let ifd = u32(base + 4);
  let guard = 0;
  while (ifd && guard++ < 4) ifd = readIfd(base + ifd, 0);
  return result;
}

/* --------------------------------------------------------- text sniffing */

const AI_PROBES: [RegExp, string][] = [
  [/midjourney/i, 'Midjourney'],
  [/dall-?e|openai/i, 'DALL·E / OpenAI'],
  [/stable[\s-]?diffusion|automatic1111|comfyui|invokeai|sd-?webui|forge/i, 'Stable Diffusion'],
  [/firefly|adobe\s*generative/i, 'Adobe Firefly'],
  [/gemini|imagen|synthid|nano[\s-]?banana/i, 'Google AI'],
  [/grok|x\.?ai\b/i, 'Grok / xAI'],
  [/leonardo|ideogram|flux|black\s*forest|runway|krea|recraft/i, 'Other generator'],
  [/trainedAlgorithmicMedia|digitalSourceType/i, 'IPTC AI source tag'],
  [/c2pa|contentauth|content[\s_-]?credential/i, 'C2PA content credentials'],
];

/** Looks for AI-generator fingerprints inside an XMP or text payload. */
function sniffAi(text: string): string | null {
  const hits: string[] = [];
  for (const [re, name] of AI_PROBES) {
    if (re.test(text) && !hits.includes(name)) hits.push(name);
  }
  return hits.length ? hits.join(', ') : null;
}

/** Pulls the recognisable Automatic1111 / ComfyUI generation parameters out. */
function sniffSd(text: string): string | null {
  const m = text.match(/(Steps|Seed|CFG scale|Sampler|Model hash|Model|Denoising strength):\s*[^,\n]{1,40}/gi);
  return m ? m.slice(0, 4).join(' · ') : null;
}

/* ------------------------------------------------------------ containers */

function scanJpeg(b: Uint8Array, r: ScanResult) {
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    // Start of scan / end of image: everything after this is entropy-coded pixels.
    if (marker === 0xda || marker === 0xd9) break;

    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2) break;
    const at = i + 4;
    const size = len - 2;
    const head = ascii(b, at, Math.min(48, size));

    // SOFn frame headers carry the real pixel dimensions.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isSof) {
      r.height = (b[at + 1] << 8) | b[at + 2];
      r.width = (b[at + 3] << 8) | b[at + 4];
    } else if (marker === 0xe1 && head.startsWith('Exif')) {
      const { gps, thumbBytes } = parseTiff(b, at + 6, r.tags);
      r.findings.push({
        kind: 'exif',
        label: 'EXIF block (APP1)',
        detail: 'Camera body, lens, software and timestamps',
        bytes: size,
      });
      if (gps) {
        r.findings.push({
          kind: 'gps',
          label: 'GPS location tags',
          detail: r.tags['GPS coordinates'] ?? 'Coordinates embedded in EXIF',
          bytes: 0,
        });
      }
      if (thumbBytes) {
        r.findings.push({
          kind: 'thumbnail',
          label: 'Embedded EXIF thumbnail',
          detail: 'A second, uncleaned copy of the picture',
          bytes: thumbBytes,
        });
      }
    } else if (marker === 0xe1 && head.includes('ns.adobe.com/xap')) {
      const text = ascii(b, at, size);
      r.findings.push({
        kind: 'xmp',
        label: 'XMP packet (APP1)',
        detail: 'Creator, rights and editing history',
        bytes: size,
      });
      const ai = sniffAi(text);
      if (ai) r.findings.push({ kind: 'ai', label: 'AI generator signature', detail: ai, bytes: 0 });
      const sd = sniffSd(text);
      if (sd) r.findings.push({ kind: 'sd', label: 'Generation parameters', detail: sd, bytes: 0 });
    } else if (marker === 0xe2 && head.startsWith('ICC_PROFILE')) {
      r.findings.push({
        kind: 'icc',
        label: 'ICC colour profile (APP2)',
        detail: 'Can name the capturing or editing device',
        bytes: size,
      });
    } else if (marker === 0xeb || (marker === 0xe2 && head.includes('jumb'))) {
      r.findings.push({
        kind: 'c2pa',
        label: 'C2PA manifest (JUMBF)',
        detail: 'Signed provenance: which tool made and edited this file',
        bytes: size,
      });
    } else if (marker === 0xed) {
      r.findings.push({
        kind: 'iptc',
        label: 'IPTC / Photoshop resources (APP13)',
        detail: 'Captions, keywords, credit lines, edit state',
        bytes: size,
      });
    } else if (marker === 0xfe) {
      const text = ascii(b, at, Math.min(80, size)).trim();
      r.findings.push({ kind: 'comment', label: 'JPEG comment', detail: text || undefined, bytes: size });
      const ai = sniffAi(text);
      if (ai) r.findings.push({ kind: 'ai', label: 'AI generator signature', detail: ai, bytes: 0 });
    } else if (marker >= 0xe0 && marker <= 0xef && marker !== 0xe0) {
      r.findings.push({
        kind: 'other',
        label: `Application segment APP${marker - 0xe0}`,
        detail: head.replace(/[^\x20-\x7e]/g, '').slice(0, 32) || undefined,
        bytes: size,
      });
    }
    i = at + size;
  }
}

function scanPng(b: Uint8Array, r: ScanResult) {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 8;
  while (i + 8 <= b.length) {
    const size = view.getUint32(i);
    const type = ascii(b, i + 4, 4);
    const at = i + 8;
    if (size > b.length) break;

    if (type === 'IHDR') {
      r.width = view.getUint32(at);
      r.height = view.getUint32(at + 4);
    } else if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
      const raw = ascii(b, at, Math.min(size, 4096));
      const key = raw.split('\0')[0];
      const body = raw.replace(/\0/g, ' ');
      r.findings.push({
        kind: 'other',
        label: `PNG text chunk (${type}: ${key || 'untitled'})`,
        detail: body.slice(key.length, key.length + 70).trim() || undefined,
        bytes: size,
      });
      const sd = sniffSd(body);
      if (sd) {
        r.findings.push({
          kind: 'sd',
          label: 'Stable Diffusion parameters',
          detail: sd,
          bytes: 0,
        });
        r.tags['Generation parameters'] = sd;
      }
      const ai = sniffAi(body);
      if (ai) r.findings.push({ kind: 'ai', label: 'AI generator signature', detail: ai, bytes: 0 });
      if (/^(prompt|parameters|workflow|Description|Comment)$/i.test(key)) {
        const value = body.slice(key.length).trim();
        if (value) r.tags[key] = value.slice(0, 240);
      }
    } else if (type === 'eXIf') {
      const { gps } = parseTiff(b, at, r.tags);
      r.findings.push({ kind: 'exif', label: 'EXIF chunk (eXIf)', detail: 'Camera and timestamp data', bytes: size });
      if (gps) {
        r.findings.push({
          kind: 'gps',
          label: 'GPS location tags',
          detail: r.tags['GPS coordinates'] ?? 'Coordinates embedded in EXIF',
          bytes: 0,
        });
      }
    } else if (type === 'caBX') {
      r.findings.push({
        kind: 'c2pa',
        label: 'C2PA manifest (caBX chunk)',
        detail: 'Signed provenance: which tool made and edited this file',
        bytes: size,
      });
    } else if (type === 'iCCP') {
      r.findings.push({ kind: 'icc', label: 'ICC colour profile (iCCP)', detail: 'Can name the editing device', bytes: size });
    } else if (type === 'tIME') {
      r.findings.push({ kind: 'other', label: 'Last-modified timestamp (tIME)', bytes: size });
    } else if (type === 'IEND') {
      break;
    }
    i = at + size + 4;
  }
}

function scanWebp(b: Uint8Array, r: ScanResult) {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 12;
  while (i + 8 <= b.length) {
    const type = ascii(b, i, 4);
    const size = view.getUint32(i + 4, true);
    const at = i + 8;
    if (size > b.length) break;

    if (type === 'VP8X') {
      r.width = (b[at + 4] | (b[at + 5] << 8) | (b[at + 6] << 16)) + 1;
      r.height = (b[at + 7] | (b[at + 8] << 8) | (b[at + 9] << 16)) + 1;
    } else if (type === 'EXIF') {
      const base = ascii(b, at, 4) === 'Exif' ? at + 6 : at;
      const { gps } = parseTiff(b, base, r.tags);
      r.findings.push({ kind: 'exif', label: 'EXIF chunk', detail: 'Camera and timestamp data', bytes: size });
      if (gps) {
        r.findings.push({
          kind: 'gps',
          label: 'GPS location tags',
          detail: r.tags['GPS coordinates'] ?? 'Coordinates embedded in EXIF',
          bytes: 0,
        });
      }
    } else if (type === 'XMP ') {
      const text = ascii(b, at, Math.min(size, 8192));
      r.findings.push({ kind: 'xmp', label: 'XMP chunk', detail: 'Creator, rights and editing history', bytes: size });
      const ai = sniffAi(text);
      if (ai) r.findings.push({ kind: 'ai', label: 'AI generator signature', detail: ai, bytes: 0 });
    } else if (type === 'ICCP') {
      r.findings.push({ kind: 'icc', label: 'ICC colour profile', bytes: size });
    }
    i = at + size + (size % 2);
  }
}

/**
 * AVIF / HEIC. Rather than walking the full ISOBMFF box tree we read the
 * `meta` box as text and look for the item-type markers, which is enough to
 * tell someone what is embedded.
 */
function scanIsobmff(b: Uint8Array, r: ScanResult) {
  const window = ascii(b, 0, Math.min(b.length, 262144));
  const push = (kind: MetaKind, label: string, detail?: string) => {
    if (!r.findings.some((f) => f.label === label)) r.findings.push({ kind, label, detail, bytes: 0 });
  };
  if (window.includes('Exif')) push('exif', 'EXIF item', 'Camera and timestamp data');
  if (window.includes('ns.adobe.com/xap')) push('xmp', 'XMP item', 'Creator, rights and editing history');
  if (/c2pa|jumb/i.test(window)) {
    push('c2pa', 'C2PA manifest', 'Signed provenance: which tool made and edited this file');
  }
  if (window.includes('colr')) push('icc', 'Colour profile box', undefined);
  const ai = sniffAi(window);
  if (ai) push('ai', 'AI generator signature', ai);

  // ispe (image spatial extents) holds the pixel dimensions.
  const idx = window.indexOf('ispe');
  if (idx > 0 && idx + 16 <= b.length) {
    const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
    r.width = view.getUint32(idx + 8);
    r.height = view.getUint32(idx + 12);
  }
}

/* -------------------------------------------------------------- entrypoint */

export function scan(buffer: ArrayBuffer): ScanResult {
  const b = new Uint8Array(buffer);
  const result: ScanResult = {
    format: detectFormat(b),
    width: 0,
    height: 0,
    findings: [],
    tags: {},
    metadataBytes: 0,
  };

  try {
    if (result.format === 'jpeg') scanJpeg(b, result);
    else if (result.format === 'png') scanPng(b, result);
    else if (result.format === 'webp') scanWebp(b, result);
    else if (result.format === 'avif' || result.format === 'heic') scanIsobmff(b, result);
  } catch {
    // A malformed file should never break the UI — report what was found so far.
  }

  result.metadataBytes = result.findings.reduce((sum, f) => sum + f.bytes, 0);
  return result;
}

export const KIND_LABEL: Record<MetaKind, string> = {
  exif: 'EXIF',
  gps: 'Location',
  xmp: 'XMP',
  iptc: 'IPTC',
  c2pa: 'C2PA',
  ai: 'AI tag',
  sd: 'Prompt data',
  icc: 'ICC',
  comment: 'Comment',
  thumbnail: 'Thumbnail',
  other: 'Other',
};
