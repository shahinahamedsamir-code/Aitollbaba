/**
 * A read-only metadata reader.
 *
 * `scan.ts` answers "what blocks are in here" for the cleaner, which only needs
 * enough detail to justify removing something. This answers the other question
 * — "show me everything" — with a full walk of every TIFF/EXIF directory, the
 * complete GPS block, and the raw text payloads verbatim.
 *
 * Nothing here writes. The file arrives as an ArrayBuffer and is read in place;
 * no canvas, no re-encode, no output file. The bytes you dropped in are the
 * bytes you still have.
 */

import { sha256 } from './clean';
import { detectFormat, scan, type Finding, type ImageFormat } from './scan';

export interface TagEntry {
  id: number;
  idHex: string;
  name: string;
  type: string;
  count: number;
  value: string;
  /** Set when the formatted value hides something worth seeing raw. */
  note?: string;
}

export interface IfdBlock {
  name: string;
  entries: TagEntry[];
}

export interface GpsInfo {
  lat: number;
  lon: number;
  latDms: string;
  lonDms: string;
  altitude?: string;
  direction?: string;
  timestamp?: string;
  speed?: string;
}

export interface TextBlock {
  label: string;
  bytes: number;
  text: string;
}

export interface ExifReport {
  name: string;
  format: ImageFormat;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
  lastModified: number;
  ifds: IfdBlock[];
  gps: GpsInfo | null;
  texts: TextBlock[];
  findings: Finding[];
  metadataBytes: number;
  /** True when the file carried no metadata at all. */
  empty: boolean;
}

/* ------------------------------------------------------------- tag names */

const TIFF_TAGS: Record<number, string> = {
  0x00fe: 'SubfileType',
  0x0100: 'ImageWidth',
  0x0101: 'ImageHeight',
  0x0102: 'BitsPerSample',
  0x0103: 'Compression',
  0x0106: 'PhotometricInterpretation',
  0x010e: 'ImageDescription',
  0x010f: 'Make',
  0x0110: 'Model',
  0x0111: 'StripOffsets',
  0x0112: 'Orientation',
  0x0115: 'SamplesPerPixel',
  0x0116: 'RowsPerStrip',
  0x0117: 'StripByteCounts',
  0x011a: 'XResolution',
  0x011b: 'YResolution',
  0x011c: 'PlanarConfiguration',
  0x0128: 'ResolutionUnit',
  0x0131: 'Software',
  0x0132: 'ModifyDate',
  0x013b: 'Artist',
  0x013e: 'WhitePoint',
  0x013f: 'PrimaryChromaticities',
  0x0201: 'ThumbnailOffset',
  0x0202: 'ThumbnailLength',
  0x0211: 'YCbCrCoefficients',
  0x0213: 'YCbCrPositioning',
  0x0214: 'ReferenceBlackWhite',
  0x8298: 'Copyright',
  0x8769: 'ExifIFDPointer',
  0x8825: 'GPSInfoIFDPointer',
  0x9c9b: 'XPTitle',
  0x9c9c: 'XPComment',
  0x9c9d: 'XPAuthor',
  0x9c9e: 'XPKeywords',
  0x9c9f: 'XPSubject',
  0xc4a5: 'PrintIM',
  0xc614: 'UniqueCameraModel',
  0xc62f: 'CameraSerialNumber',
};

const EXIF_TAGS: Record<number, string> = {
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8822: 'ExposureProgram',
  0x8824: 'SpectralSensitivity',
  0x8827: 'ISO',
  0x8830: 'SensitivityType',
  0x8832: 'RecommendedExposureIndex',
  0x9000: 'ExifVersion',
  0x9003: 'DateTimeOriginal',
  0x9004: 'CreateDate',
  0x9010: 'OffsetTime',
  0x9011: 'OffsetTimeOriginal',
  0x9012: 'OffsetTimeDigitized',
  0x9101: 'ComponentsConfiguration',
  0x9102: 'CompressedBitsPerPixel',
  0x9201: 'ShutterSpeedValue',
  0x9202: 'ApertureValue',
  0x9203: 'BrightnessValue',
  0x9204: 'ExposureCompensation',
  0x9205: 'MaxApertureValue',
  0x9206: 'SubjectDistance',
  0x9207: 'MeteringMode',
  0x9208: 'LightSource',
  0x9209: 'Flash',
  0x920a: 'FocalLength',
  0x9214: 'SubjectArea',
  0x927c: 'MakerNote',
  0x9286: 'UserComment',
  0x9290: 'SubSecTime',
  0x9291: 'SubSecTimeOriginal',
  0x9292: 'SubSecTimeDigitized',
  0xa000: 'FlashpixVersion',
  0xa001: 'ColorSpace',
  0xa002: 'PixelXDimension',
  0xa003: 'PixelYDimension',
  0xa004: 'RelatedSoundFile',
  0xa005: 'InteropIFDPointer',
  0xa20e: 'FocalPlaneXResolution',
  0xa20f: 'FocalPlaneYResolution',
  0xa210: 'FocalPlaneResolutionUnit',
  0xa214: 'SubjectLocation',
  0xa215: 'ExposureIndex',
  0xa217: 'SensingMethod',
  0xa300: 'FileSource',
  0xa301: 'SceneType',
  0xa302: 'CFAPattern',
  0xa401: 'CustomRendered',
  0xa402: 'ExposureMode',
  0xa403: 'WhiteBalance',
  0xa404: 'DigitalZoomRatio',
  0xa405: 'FocalLengthIn35mmFormat',
  0xa406: 'SceneCaptureType',
  0xa407: 'GainControl',
  0xa408: 'Contrast',
  0xa409: 'Saturation',
  0xa40a: 'Sharpness',
  0xa40c: 'SubjectDistanceRange',
  0xa420: 'ImageUniqueID',
  0xa430: 'OwnerName',
  0xa431: 'BodySerialNumber',
  0xa432: 'LensInfo',
  0xa433: 'LensMake',
  0xa434: 'LensModel',
  0xa435: 'LensSerialNumber',
  0xa460: 'CompositeImage',
};

const GPS_TAGS: Record<number, string> = {
  0x0000: 'GPSVersionID',
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
  0x0005: 'GPSAltitudeRef',
  0x0006: 'GPSAltitude',
  0x0007: 'GPSTimeStamp',
  0x0008: 'GPSSatellites',
  0x0009: 'GPSStatus',
  0x000a: 'GPSMeasureMode',
  0x000b: 'GPSDOP',
  0x000c: 'GPSSpeedRef',
  0x000d: 'GPSSpeed',
  0x000e: 'GPSTrackRef',
  0x000f: 'GPSTrack',
  0x0010: 'GPSImgDirectionRef',
  0x0011: 'GPSImgDirection',
  0x0012: 'GPSMapDatum',
  0x0013: 'GPSDestLatitudeRef',
  0x0014: 'GPSDestLatitude',
  0x0015: 'GPSDestLongitudeRef',
  0x0016: 'GPSDestLongitude',
  0x001d: 'GPSDateStamp',
  0x001f: 'GPSHPositioningError',
};

/** Enumerated values, so a viewer shows "Rotate 90 CW" rather than "6". */
const ENUMS: Record<string, Record<number, string>> = {
  Orientation: {
    1: 'Normal',
    2: 'Mirrored horizontally',
    3: 'Rotated 180°',
    4: 'Mirrored vertically',
    5: 'Mirrored and rotated 90° CCW',
    6: 'Rotated 90° CW',
    7: 'Mirrored and rotated 90° CW',
    8: 'Rotated 90° CCW',
  },
  ResolutionUnit: { 1: 'None', 2: 'inches', 3: 'cm' },
  FocalPlaneResolutionUnit: { 1: 'None', 2: 'inches', 3: 'cm' },
  ColorSpace: { 1: 'sRGB', 2: 'Adobe RGB', 0xffff: 'Uncalibrated' },
  ExposureProgram: {
    0: 'Not defined',
    1: 'Manual',
    2: 'Program AE',
    3: 'Aperture priority',
    4: 'Shutter priority',
    5: 'Creative',
    6: 'Action',
    7: 'Portrait',
    8: 'Landscape',
  },
  MeteringMode: {
    0: 'Unknown',
    1: 'Average',
    2: 'Centre-weighted',
    3: 'Spot',
    4: 'Multi-spot',
    5: 'Multi-segment',
    6: 'Partial',
  },
  WhiteBalance: { 0: 'Auto', 1: 'Manual' },
  ExposureMode: { 0: 'Auto', 1: 'Manual', 2: 'Auto bracket' },
  SceneCaptureType: { 0: 'Standard', 1: 'Landscape', 2: 'Portrait', 3: 'Night' },
  Contrast: { 0: 'Normal', 1: 'Low', 2: 'High' },
  Saturation: { 0: 'Normal', 1: 'Low', 2: 'High' },
  Sharpness: { 0: 'Normal', 1: 'Soft', 2: 'Hard' },
  SensingMethod: {
    1: 'Not defined',
    2: 'One-chip colour area',
    3: 'Two-chip colour area',
    4: 'Three-chip colour area',
    5: 'Colour sequential area',
    7: 'Trilinear',
    8: 'Colour sequential linear',
  },
  CustomRendered: { 0: 'Normal', 1: 'Custom' },
  GainControl: { 0: 'None', 1: 'Low gain up', 2: 'High gain up', 3: 'Low gain down', 4: 'High gain down' },
  SubjectDistanceRange: { 0: 'Unknown', 1: 'Macro', 2: 'Close', 3: 'Distant' },
  LightSource: {
    0: 'Unknown',
    1: 'Daylight',
    2: 'Fluorescent',
    3: 'Tungsten',
    4: 'Flash',
    9: 'Fine weather',
    10: 'Cloudy',
    11: 'Shade',
    255: 'Other',
  },
  CompositeImage: { 1: 'Not a composite', 2: 'General composite', 3: 'Composite captured on the spot' },
};

const TYPE_NAMES = [
  '',
  'BYTE',
  'ASCII',
  'SHORT',
  'LONG',
  'RATIONAL',
  'SBYTE',
  'UNDEFINED',
  'SSHORT',
  'SLONG',
  'SRATIONAL',
  'FLOAT',
  'DOUBLE',
];
const TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];

const ascii = (b: Uint8Array, start: number, len: number) => {
  let s = '';
  const end = Math.min(start + len, b.length);
  for (let i = start; i < end; i++) s += String.fromCharCode(b[i]);
  return s;
};

/** Flash is a bitfield, not an enum — the low bit is whether it actually fired. */
function describeFlash(v: number): string {
  if (!(v & 1)) return v === 0 ? 'Did not fire' : `Did not fire (0x${v.toString(16)})`;
  const parts = ['Fired'];
  if ((v >> 3) & 1) parts.push('auto');
  if ((v >> 6) & 1) parts.push('red-eye reduction');
  return parts.join(', ');
}

/* -------------------------------------------------------------- IFD walk */

interface Reader {
  b: Uint8Array;
  view: DataView;
  base: number;
  little: boolean;
}

function makeReader(b: Uint8Array, base: number): Reader | null {
  if (base + 8 > b.length) return null;
  const marker = ascii(b, base, 2);
  if (marker !== 'II' && marker !== 'MM') return null;
  const little = marker === 'II';
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (view.getUint16(base + 2, little) !== 42) return null;
  return { b, view, base, little };
}

const u16 = (r: Reader, o: number) => (o + 2 <= r.b.length ? r.view.getUint16(o, r.little) : 0);
const u32 = (r: Reader, o: number) => (o + 4 <= r.b.length ? r.view.getUint32(o, r.little) : 0);
const i32 = (r: Reader, o: number) => (o + 4 <= r.b.length ? r.view.getInt32(o, r.little) : 0);

function rational(r: Reader, at: number, signed: boolean): number {
  const num = signed ? i32(r, at) : u32(r, at);
  const den = signed ? i32(r, at + 4) : u32(r, at + 4);
  return den === 0 ? 0 : num / den;
}

/** Formats a tag's value for display, applying the enum and unit conventions. */
function formatValue(r: Reader, name: string, type: number, count: number, at: number): string {
  const nums: number[] = [];
  const take = Math.min(count, 16);

  if (type === 2) {
    return ascii(r.b, at, Math.max(0, count - 1)).replace(/\0[\s\S]*$/, '').trim();
  }

  // A single BYTE is a number with a meaning (GPSAltitudeRef and friends), not
  // a byte string — only arrays and UNDEFINED blobs get the hex treatment.
  if ((type === 7 || type === 1 || type === 6) && count > 1) {
    // UNDEFINED / BYTE array: printable if it looks like text, hex otherwise.
    const raw = ascii(r.b, at, Math.min(count, 64));
    if (/^[\x20-\x7e]+$/.test(raw.replace(/\0+$/, '')) && raw.replace(/\0+$/, '').length > 1) {
      return raw.replace(/\0+$/, '');
    }
    const hex: string[] = [];
    for (let i = 0; i < Math.min(count, 16); i++) hex.push(r.b[at + i]?.toString(16).padStart(2, '0') ?? '');
    return hex.join(' ') + (count > 16 ? ` … (${count} bytes)` : '');
  }

  for (let i = 0; i < take; i++) {
    if (type === 1 || type === 6 || type === 7) nums.push(r.b[at + i]);
    else if (type === 3) nums.push(u16(r, at + i * 2));
    else if (type === 8) nums.push(r.view.getInt16(at + i * 2, r.little));
    else if (type === 4) nums.push(u32(r, at + i * 4));
    else if (type === 9) nums.push(i32(r, at + i * 4));
    else if (type === 5) nums.push(rational(r, at + i * 8, false));
    else if (type === 10) nums.push(rational(r, at + i * 8, true));
    else if (type === 11) nums.push(r.view.getFloat32(at + i * 4, r.little));
    else if (type === 12) nums.push(r.view.getFloat64(at + i * 8, r.little));
  }
  if (!nums.length) return '—';

  const first = nums[0];

  if (ENUMS[name] && ENUMS[name][first] !== undefined) return ENUMS[name][first];
  if (name === 'Flash') return describeFlash(first);
  if (name === 'ExposureTime') return first >= 1 ? `${first} s` : `1/${Math.round(1 / first)} s`;
  if (name === 'FNumber' || name === 'MaxApertureValue') return `f/${first.toFixed(1)}`;
  if (name === 'FocalLength') return `${first} mm`;
  if (name === 'FocalLengthIn35mmFormat') return `${first} mm equivalent`;
  if (name === 'ExposureCompensation') return `${first > 0 ? '+' : ''}${first} EV`;
  if (name === 'ISO') return String(first);
  if (name === 'GPSAltitudeRef') return first === 1 ? 'Below sea level' : 'Above sea level';

  const shown = nums.map((n) => (Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/\.?0+$/, '')));
  return shown.join(', ') + (count > take ? ` … (${count} values)` : '');
}

interface WalkResult {
  ifds: IfdBlock[];
  gpsRaw: Record<string, string>;
  gpsNumbers: Record<number, number[]>;
  gpsRefs: Record<number, string>;
}

function walk(r: Reader): WalkResult {
  const out: WalkResult = { ifds: [], gpsRaw: {}, gpsNumbers: {}, gpsRefs: {} };
  const seen = new Set<number>();

  const readIfd = (offset: number, label: string, dict: Record<number, string>, isGps: boolean) => {
    if (seen.has(offset) || offset + 2 > r.b.length) return 0;
    seen.add(offset);
    const count = u16(r, offset);
    if (!count || count > 1024) return 0;

    const entries: TagEntry[] = [];
    for (let i = 0; i < count; i++) {
      const entry = offset + 2 + i * 12;
      if (entry + 12 > r.b.length) break;
      const id = u16(r, entry);
      const type = u16(r, entry + 2);
      const n = u32(r, entry + 4);
      const size = (TYPE_SIZE[type] ?? 0) * n;
      if (!size) continue;
      const at = size > 4 ? r.base + u32(r, entry + 8) : entry + 8;
      if (at + Math.min(size, 4) > r.b.length) continue;

      const name = dict[id] ?? `Unknown 0x${id.toString(16).padStart(4, '0')}`;

      // Sub-directories are followed rather than printed as a number.
      if (!isGps && (id === 0x8769 || id === 0xa005 || id === 0x8825)) {
        const sub = r.base + u32(r, entry + 8);
        if (id === 0x8769) readIfd(sub, 'Exif IFD', EXIF_TAGS, false);
        else if (id === 0xa005) readIfd(sub, 'Interoperability IFD', TIFF_TAGS, false);
        else readIfd(sub, 'GPS IFD', GPS_TAGS, true);
        continue;
      }

      const value = formatValue(r, name, type, n, at);
      const tag: TagEntry = {
        id,
        idHex: `0x${id.toString(16).padStart(4, '0')}`,
        name,
        type: TYPE_NAMES[type] ?? String(type),
        count: n,
        value,
      };
      if (name === 'MakerNote') tag.note = 'Vendor-specific; not decoded here';
      entries.push(tag);

      if (isGps) {
        out.gpsRaw[name] = value;
        if ((type === 5 || type === 10) && n >= 1) {
          const parts: number[] = [];
          for (let k = 0; k < Math.min(n, 3); k++) parts.push(rational(r, at + k * 8, type === 10));
          out.gpsNumbers[id] = parts;
        } else if (type === 2) {
          out.gpsRefs[id] = value;
        } else if (type === 1 || type === 3) {
          out.gpsNumbers[id] = [type === 1 ? r.b[at] : u16(r, at)];
        }
      }
    }

    if (entries.length) out.ifds.push({ name: label, entries });
    const nextAt = offset + 2 + count * 12;
    return u32(r, nextAt);
  };

  let ifd = u32(r, r.base + 4);
  let guard = 0;
  const labels = ['IFD0 (main image)', 'IFD1 (thumbnail)', 'IFD2', 'IFD3'];
  while (ifd && guard < 4) {
    ifd = readIfd(r.base + ifd, labels[guard] ?? `IFD${guard}`, TIFF_TAGS, false);
    guard++;
  }
  return out;
}

function toDms(value: number, positive: string, negative: string): string {
  const hemisphere = value >= 0 ? positive : negative;
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  return `${d}° ${m}′ ${s.toFixed(2)}″ ${hemisphere}`;
}

function buildGps(w: WalkResult): GpsInfo | null {
  const lat = w.gpsNumbers[2];
  const lon = w.gpsNumbers[4];
  if (!lat || !lon || lat.length < 3 || lon.length < 3) return null;

  const dec = (p: number[]) => p[0] + p[1] / 60 + p[2] / 3600;
  const latSign = (w.gpsRefs[1] ?? '').toUpperCase().startsWith('S') ? -1 : 1;
  const lonSign = (w.gpsRefs[3] ?? '').toUpperCase().startsWith('W') ? -1 : 1;
  const latitude = dec(lat) * latSign;
  const longitude = dec(lon) * lonSign;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const info: GpsInfo = {
    lat: latitude,
    lon: longitude,
    latDms: toDms(latitude, 'N', 'S'),
    lonDms: toDms(longitude, 'E', 'W'),
  };

  const alt = w.gpsNumbers[6]?.[0];
  if (alt !== undefined) {
    const below = w.gpsNumbers[5]?.[0] === 1;
    info.altitude = `${below ? '-' : ''}${alt.toFixed(1)} m ${below ? 'below' : 'above'} sea level`;
  }
  const dir = w.gpsNumbers[17]?.[0];
  if (dir !== undefined) {
    info.direction = `${dir.toFixed(1)}° ${(w.gpsRefs[16] ?? 'T') === 'M' ? 'magnetic' : 'true'}`;
  }
  const time = w.gpsNumbers[7];
  const date = w.gpsRaw['GPSDateStamp'];
  if (time && time.length === 3) {
    const hh = String(Math.floor(time[0])).padStart(2, '0');
    const mm = String(Math.floor(time[1])).padStart(2, '0');
    const ss = String(Math.floor(time[2])).padStart(2, '0');
    info.timestamp = `${date ? date.replace(/:/g, '-') + ' ' : ''}${hh}:${mm}:${ss} UTC`;
  }
  const speed = w.gpsNumbers[13]?.[0];
  if (speed !== undefined) {
    const unit = { K: 'km/h', M: 'mph', N: 'knots' }[w.gpsRefs[12] ?? 'K'] ?? 'km/h';
    info.speed = `${speed.toFixed(1)} ${unit}`;
  }
  return info;
}

/* ------------------------------------------------------- locating blocks */

/** Finds a byte pattern; used to locate EXIF and XMP across any container. */
function indexOfBytes(b: Uint8Array, pattern: string, from = 0): number {
  const first = pattern.charCodeAt(0);
  const limit = b.length - pattern.length;
  for (let i = from; i <= limit; i++) {
    if (b[i] !== first) continue;
    let ok = true;
    for (let j = 1; j < pattern.length; j++) {
      if (b[i + j] !== pattern.charCodeAt(j)) { ok = false; break; }
    }
    if (ok) return i;
  }
  return -1;
}

/**
 * The TIFF header can sit behind an "Exif\0\0" marker (JPEG APP1, PNG eXIf,
 * WebP EXIF, HEIC item) or start the block directly. Searching for the marker
 * covers every container without re-implementing four parsers.
 */
function findTiffBase(b: Uint8Array): number {
  const marker = indexOfBytes(b, 'Exif\0\0');
  if (marker >= 0 && marker + 6 + 8 <= b.length) return marker + 6;

  // PNG eXIf chunks hold a bare TIFF header.
  const exif = indexOfBytes(b, 'eXIf');
  if (exif >= 0 && exif + 4 + 8 <= b.length) {
    const m = ascii(b, exif + 4, 2);
    if (m === 'II' || m === 'MM') return exif + 4;
  }
  return -1;
}

/** XMP, PNG text chunks and JPEG comments, pulled out whole. */
function collectTexts(b: Uint8Array, format: ImageFormat): TextBlock[] {
  const texts: TextBlock[] = [];
  const decoder = new TextDecoder('utf-8', { fatal: false });

  // XMP is XML with a stable envelope in every container.
  let from = 0;
  for (let guard = 0; guard < 4; guard++) {
    const start = indexOfBytes(b, '<x:xmpmeta', from);
    if (start < 0) break;
    const endTag = indexOfBytes(b, '</x:xmpmeta>', start);
    const end = endTag < 0 ? Math.min(start + 65536, b.length) : endTag + 12;
    texts.push({
      label: 'XMP packet',
      bytes: end - start,
      text: decoder.decode(b.subarray(start, end)),
    });
    from = end;
  }

  if (format === 'png') {
    // tEXt and iTXt are plain; zTXt is deflate-compressed and left alone.
    let p = 8;
    while (p + 8 <= b.length) {
      const len = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(p);
      const type = ascii(b, p + 4, 4);
      if (!/^[a-zA-Z]{4}$/.test(type) || len > b.length) break;
      const dataAt = p + 8;
      if (type === 'tEXt' || type === 'iTXt') {
        const raw = b.subarray(dataAt, Math.min(dataAt + len, b.length));
        const nul = raw.indexOf(0);
        const key = nul > 0 ? decoder.decode(raw.subarray(0, nul)) : type;
        let body = decoder.decode(raw.subarray(nul + 1));
        if (type === 'iTXt') body = body.replace(/^[\s\S]{0,4}?\0[\s\S]*?\0/, '');
        texts.push({ label: `PNG ${type}: ${key}`, bytes: len, text: body.replace(/\0/g, ' ') });
      } else if (type === 'zTXt') {
        const raw = b.subarray(dataAt, Math.min(dataAt + len, b.length));
        const nul = raw.indexOf(0);
        const key = nul > 0 ? decoder.decode(raw.subarray(0, nul)) : type;
        texts.push({
          label: `PNG zTXt: ${key}`,
          bytes: len,
          text: '(deflate-compressed; this viewer does not decompress it)',
        });
      }
      if (type === 'IEND') break;
      p = dataAt + len + 4;
    }
  }

  if (format === 'jpeg') {
    let p = 2;
    while (p + 4 <= b.length) {
      if (b[p] !== 0xff) break;
      const marker = b[p + 1];
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) { p += 2; continue; }
      if (marker === 0xda) break; // start of scan; pixel data from here
      const len = (b[p + 2] << 8) | b[p + 3];
      if (len < 2) break;
      if (marker === 0xfe) {
        texts.push({
          label: 'JPEG comment (COM)',
          bytes: len - 2,
          text: decoder.decode(b.subarray(p + 4, p + 2 + len)),
        });
      }
      p += 2 + len;
    }
  }

  return texts;
}

/* ------------------------------------------------------------------ read */

export async function readMetadata(file: File): Promise<ExifReport> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const base = scan(buffer);
  const format = detectFormat(bytes);

  let ifds: IfdBlock[] = [];
  let gps: GpsInfo | null = null;

  const tiffBase = findTiffBase(bytes);
  if (tiffBase >= 0) {
    const reader = makeReader(bytes, tiffBase);
    if (reader) {
      const walked = walk(reader);
      ifds = walked.ifds;
      gps = buildGps(walked);
    }
  }

  const texts = collectTexts(bytes, format);

  return {
    name: file.name,
    format,
    width: base.width,
    height: base.height,
    bytes: file.size,
    sha256: await sha256(buffer),
    lastModified: file.lastModified,
    ifds,
    gps,
    texts,
    findings: base.findings,
    metadataBytes: base.metadataBytes,
    empty: base.findings.length === 0 && ifds.length === 0 && texts.length === 0,
  };
}

/** The whole report as JSON, for saving or pasting into a bug report. */
export function reportToJson(r: ExifReport): string {
  return JSON.stringify(
    {
      file: { name: r.name, bytes: r.bytes, sha256: r.sha256 },
      image: { format: r.format, width: r.width, height: r.height },
      blocks: r.findings.map((f) => ({ kind: f.kind, label: f.label, bytes: f.bytes, detail: f.detail })),
      metadataBytes: r.metadataBytes,
      gps: r.gps,
      ifds: r.ifds.map((ifd) => ({
        name: ifd.name,
        tags: ifd.entries.map((e) => ({ id: e.idHex, name: e.name, type: e.type, count: e.count, value: e.value })),
      })),
      text: r.texts.map((t) => ({ label: t.label, bytes: t.bytes, text: t.text })),
    },
    null,
    2,
  );
}

/** Counts every tag across every directory, for the summary line. */
export function countTags(r: ExifReport): number {
  return r.ifds.reduce((sum, ifd) => sum + ifd.entries.length, 0);
}
