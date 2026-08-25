/**
 * A QR encoder, written out rather than pulled in.
 *
 * The rest of the site ships as static files with no runtime dependencies, and
 * a QR generator is not a good reason to break that — the format is fully
 * specified (ISO/IEC 18004) and the whole encoder is a few hundred lines.
 *
 * The pipeline is the one in the spec: pick the cheapest mode for the text,
 * find the smallest version it fits in, build the bit stream, add Reed–Solomon
 * error correction over GF(256), interleave the blocks, lay the bits out in the
 * zigzag, then try all eight masks and keep whichever scores least badly.
 */

export type Ecl = 'L' | 'M' | 'Q' | 'H';
export type Mode = 'numeric' | 'alphanumeric' | 'byte';

export interface QrResult {
  /** `size × size` grid; true is a dark module. */
  modules: boolean[][];
  size: number;
  version: number;
  ecl: Ecl;
  mode: Mode;
  mask: number;
  /** How many of this version's data codewords the payload used. */
  usedCodewords: number;
  capacityCodewords: number;
}

export const ECLS: { value: Ecl; label: string; note: string; recovery: string }[] = [
  { value: 'L', label: 'L', note: 'smallest code, least tolerant of damage', recovery: '~7%' },
  { value: 'M', label: 'M', note: 'the usual choice for a screen or a clean print', recovery: '~15%' },
  { value: 'Q', label: 'Q', note: 'survives a scuffed sticker or a logo overlay', recovery: '~25%' },
  { value: 'H', label: 'H', note: 'most robust, largest code for the same text', recovery: '~30%' },
];

/* ------------------------------------------------------------ spec tables */

const ECL_FORMAT_BITS: Record<Ecl, number> = { L: 1, M: 0, Q: 3, H: 2 };
const ECL_INDEX: Record<Ecl, number> = { L: 0, M: 1, Q: 2, H: 3 };

// [ecl][version] — version 0 is unused padding so the tables index directly.
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  // L
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // M
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  // Q
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  // H
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  // L
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  // M
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  // Q
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  // H
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

const ALPHANUMERIC_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

const MIN_VERSION = 1;
const MAX_VERSION = 40;

const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

/* ----------------------------------------------------------- GF(256) maths */

/** Multiply in GF(256) modulo x^8 + x^4 + x^3 + x^2 + 1, without lookup tables. */
function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

/** The generator polynomial's coefficients, minus the leading 1. */
function rsDivisor(degree: number): Uint8Array {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let i = 0; i < result.length; i++) result[i] ^= gfMultiply(divisor[i], factor);
  }
  return result;
}

/* ------------------------------------------------------- capacity helpers */

function numRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function numDataCodewords(version: number, ecl: Ecl): number {
  const e = ECL_INDEX[ecl];
  return (
    Math.floor(numRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[e][version] * NUM_ERROR_CORRECTION_BLOCKS[e][version]
  );
}

function charCountBits(mode: Mode, version: number): number {
  const tier = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  if (mode === 'numeric') return [10, 12, 14][tier];
  if (mode === 'alphanumeric') return [9, 11, 13][tier];
  return [8, 16, 16][tier];
}

const MODE_INDICATOR: Record<Mode, number> = { numeric: 1, alphanumeric: 2, byte: 4 };

function utf8Bytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function pickMode(text: string): Mode {
  if (text.length > 0 && /^[0-9]*$/.test(text)) return 'numeric';
  if (text.length > 0 && [...text].every((c) => ALPHANUMERIC_CHARSET.includes(c))) return 'alphanumeric';
  return 'byte';
}

/** Payload bits excluding the mode indicator and character count. */
function dataBitCount(text: string, mode: Mode): number {
  if (mode === 'numeric') {
    const n = text.length;
    return 10 * Math.floor(n / 3) + (n % 3 === 1 ? 4 : n % 3 === 2 ? 7 : 0);
  }
  if (mode === 'alphanumeric') {
    const n = text.length;
    return 11 * Math.floor(n / 2) + (n % 2 === 1 ? 6 : 0);
  }
  return 8 * utf8Bytes(text).length;
}

function segmentLength(text: string, mode: Mode): number {
  return mode === 'byte' ? utf8Bytes(text).length : text.length;
}

/* ------------------------------------------------------------- bit stream */

class BitBuffer {
  readonly bits: number[] = [];

  append(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
}

function encodeSegment(text: string, mode: Mode, bb: BitBuffer) {
  if (mode === 'numeric') {
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.slice(i, i + 3);
      bb.append(Number(chunk), chunk.length * 3 + 1);
    }
  } else if (mode === 'alphanumeric') {
    for (let i = 0; i + 1 < text.length; i += 2) {
      const value =
        ALPHANUMERIC_CHARSET.indexOf(text[i]) * 45 + ALPHANUMERIC_CHARSET.indexOf(text[i + 1]);
      bb.append(value, 11);
    }
    if (text.length % 2 === 1) bb.append(ALPHANUMERIC_CHARSET.indexOf(text[text.length - 1]), 6);
  } else {
    for (const b of utf8Bytes(text)) bb.append(b, 8);
  }
}

/* -------------------------------------------------------- matrix assembly */

class Matrix {
  readonly size: number;
  readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  constructor(readonly version: number) {
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }

  private setFunction(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  }

  private finder(x: number, y: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunction(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private alignment(x: number, y: number) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunction(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  /** Centres of the alignment patterns, per the spec's spacing rule. */
  private alignmentPositions(): number[] {
    if (this.version === 1) return [];
    const numAlign = Math.floor(this.version / 7) + 2;
    const step =
      this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  drawFunctionPatterns(ecl: Ecl) {
    // Timing patterns.
    for (let i = 0; i < this.size; i++) {
      this.setFunction(6, i, i % 2 === 0);
      this.setFunction(i, 6, i % 2 === 0);
    }

    this.finder(3, 3);
    this.finder(this.size - 4, 3);
    this.finder(3, this.size - 4);

    const positions = this.alignmentPositions();
    for (let i = 0; i < positions.length; i++) {
      for (let j = 0; j < positions.length; j++) {
        // The three corners are already occupied by finder patterns.
        const corner =
          (i === 0 && j === 0) ||
          (i === 0 && j === positions.length - 1) ||
          (i === positions.length - 1 && j === 0);
        if (!corner) this.alignment(positions[i], positions[j]);
      }
    }

    // Reserved until the mask is chosen; drawn again in drawFormatBits.
    this.drawFormatBits(ecl, 0);
    this.drawVersion();
  }

  drawFormatBits(ecl: Ecl, mask: number) {
    const data = (ECL_FORMAT_BITS[ecl] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    // Top-left copy, split around the timing pattern.
    for (let i = 0; i <= 5; i++) this.setFunction(8, i, getBit(bits, i));
    this.setFunction(8, 7, getBit(bits, 6));
    this.setFunction(8, 8, getBit(bits, 7));
    this.setFunction(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunction(14 - i, 8, getBit(bits, i));

    // Second copy, along the other two finders.
    for (let i = 0; i < 8; i++) this.setFunction(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunction(8, this.size - 15 + i, getBit(bits, i));
    this.setFunction(8, this.size - 8, true); // the always-dark module
  }

  private drawVersion() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;

    for (let i = 0; i < 18; i++) {
      const dark = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunction(a, b, dark);
      this.setFunction(b, a, dark);
    }
  }

  /** Lays the codewords out in the two-module-wide upward/downward zigzag. */
  drawCodewords(data: Uint8Array) {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // skip the vertical timing column
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.isFunction[y][x]) continue;
        let invert: boolean;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: throw new Error('bad mask');
        }
        if (invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  /** The spec's four penalty rules; lower is better. */
  penaltyScore(): number {
    let result = 0;
    const size = this.size;

    for (let y = 0; y < size; y++) {
      let runColor = false;
      let runX = 0;
      const runHistory = new Array<number>(7).fill(0);
      for (let x = 0; x < size; x++) {
        if (this.modules[y][x] === runColor) {
          runX++;
          if (runX === 5) result += PENALTY_N1;
          else if (runX > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runX = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * PENALTY_N3;
    }

    for (let x = 0; x < size; x++) {
      let runColor = false;
      let runY = 0;
      const runHistory = new Array<number>(7).fill(0);
      for (let y = 0; y < size; y++) {
        if (this.modules[y][x] === runColor) {
          runY++;
          if (runY === 5) result += PENALTY_N1;
          else if (runY > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (!runColor) result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          runColor = this.modules[y][x];
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * PENALTY_N3;
    }

    // 2x2 blocks of one colour.
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c = this.modules[y][x];
        if (c === this.modules[y][x + 1] && c === this.modules[y + 1][x] && c === this.modules[y + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }

    // Balance of dark and light.
    let dark = 0;
    for (const row of this.modules) for (const cell of row) if (cell) dark++;
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;
    return result;
  }

  private finderPenaltyCountPatterns(runHistory: number[]): number {
    const n = runHistory[1];
    const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (
      (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
      (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
    );
  }

  private finderPenaltyTerminateAndCount(currentColor: boolean, currentRun: number, runHistory: number[]): number {
    let run = currentRun;
    if (currentColor) {
      this.finderPenaltyAddHistory(run, runHistory);
      run = 0;
    }
    run += this.size; // treat the quiet zone as an infinite light run
    this.finderPenaltyAddHistory(run, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }

  private finderPenaltyAddHistory(currentRun: number, runHistory: number[]) {
    let run = currentRun;
    if (runHistory[0] === 0) run += this.size; // the quiet zone on the leading edge
    runHistory.pop();
    runHistory.unshift(run);
  }
}

function getBit(value: number, i: number): boolean {
  return ((value >>> i) & 1) !== 0;
}

/* ------------------------------------------------------------ block layout */

function addEccAndInterleave(version: number, ecl: Ecl, data: Uint8Array): Uint8Array {
  const e = ECL_INDEX[ecl];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[e][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[e][version];
  const rawCodewords = Math.floor(numRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);

  const divisor = rsDivisor(blockEccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const dat = Array.from(data.slice(k, k + datLen));
    k += datLen;
    const ecc = Array.from(rsRemainder(Uint8Array.from(dat), divisor));
    // Short blocks carry a placeholder so every block is the same length; the
    // interleave below skips that one position.
    if (i < numShortBlocks) dat.push(0);
    blocks.push(dat.concat(ecc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(blocks[j][i]);
    }
  }
  return Uint8Array.from(result);
}

/* ------------------------------------------------------------------ public */

export class QrTooLongError extends Error {
  constructor(readonly bytes: number) {
    super('That is too much data for a QR code, even at the largest size.');
    this.name = 'QrTooLongError';
  }
}

export function encodeQr(text: string, ecl: Ecl): QrResult {
  const mode = pickMode(text);

  // Smallest version the payload fits in at this error-correction level.
  let version = MIN_VERSION;
  for (; ; version++) {
    if (version > MAX_VERSION) throw new QrTooLongError(utf8Bytes(text).length);
    const capacityBits = numDataCodewords(version, ecl) * 8;
    const usedBits = 4 + charCountBits(mode, version) + dataBitCount(text, mode);
    if (usedBits <= capacityBits) break;
  }

  const dataCapacity = numDataCodewords(version, ecl);

  const bb = new BitBuffer();
  bb.append(MODE_INDICATOR[mode], 4);
  bb.append(segmentLength(text, mode), charCountBits(mode, version));
  encodeSegment(text, mode, bb);

  const capacityBits = dataCapacity * 8;
  bb.append(0, Math.min(4, capacityBits - bb.bits.length)); // terminator
  bb.append(0, (8 - (bb.bits.length % 8)) % 8); // pad to a whole byte
  for (let pad = 0xec; bb.bits.length < capacityBits; pad ^= 0xec ^ 0x11) bb.append(pad, 8);

  const dataCodewords = new Uint8Array(dataCapacity);
  bb.bits.forEach((bit, i) => {
    if (bit) dataCodewords[i >>> 3] |= 1 << (7 - (i & 7));
  });

  const allCodewords = addEccAndInterleave(version, ecl, dataCodewords);

  const matrix = new Matrix(version);
  matrix.drawFunctionPatterns(ecl);
  matrix.drawCodewords(allCodewords);

  // Try every mask and keep the least-penalised, as the spec requires.
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    matrix.applyMask(mask);
    matrix.drawFormatBits(ecl, mask);
    const penalty = matrix.penaltyScore();
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
    matrix.applyMask(mask); // XOR again to undo
  }
  matrix.applyMask(bestMask);
  matrix.drawFormatBits(ecl, bestMask);

  return {
    modules: matrix.modules,
    size: matrix.size,
    version,
    ecl,
    mode,
    mask: bestMask,
    usedCodewords: Math.ceil(
      (4 + charCountBits(mode, version) + dataBitCount(text, mode)) / 8,
    ),
    capacityCodewords: dataCapacity,
  };
}

/* ------------------------------------------------------- payload builders */

export type PayloadKind = 'link' | 'text' | 'wifi' | 'contact' | 'email';

/** Wi-Fi and vCard both treat these as delimiters, so they must be escaped. */
function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

export interface WifiFields {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface ContactFields {
  name: string;
  phone: string;
  email: string;
  org: string;
  url: string;
}

export interface EmailFields {
  to: string;
  subject: string;
  body: string;
}

export function buildWifi(f: WifiFields): string {
  const parts = [`T:${f.security}`, `S:${escapeWifi(f.ssid)}`];
  if (f.security !== 'nopass') parts.push(`P:${escapeWifi(f.password)}`);
  if (f.hidden) parts.push('H:true');
  return `WIFI:${parts.join(';')};;`;
}

export function buildContact(f: ContactFields): string {
  // vCard 3.0 — the version phone cameras handle most consistently.
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (f.name) {
    lines.push(`N:${f.name.split(' ').slice(1).join(' ')};${f.name.split(' ')[0]};;;`);
    lines.push(`FN:${f.name}`);
  }
  if (f.org) lines.push(`ORG:${f.org}`);
  if (f.phone) lines.push(`TEL;TYPE=CELL:${f.phone}`);
  if (f.email) lines.push(`EMAIL:${f.email}`);
  if (f.url) lines.push(`URL:${f.url}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export function buildEmail(f: EmailFields): string {
  const params: string[] = [];
  if (f.subject) params.push(`subject=${encodeURIComponent(f.subject)}`);
  if (f.body) params.push(`body=${encodeURIComponent(f.body)}`);
  return `mailto:${f.to}${params.length ? '?' + params.join('&') : ''}`;
}

/**
 * A bare domain typed into the link box is almost never meant as relative
 * text, so it gets a scheme — without one, most scanners show it rather than
 * offering to open it.
 */
export function normaliseLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/* --------------------------------------------------------------- rendering */

export interface RenderOptions {
  /** Light modules around the code; the spec asks for at least 4. */
  margin: number;
  dark: string;
  light: string;
}

/** One `<path>` for every dark module — small, crisp and printable. */
export function toSvg(qr: QrResult, opts: RenderOptions): string {
  const dim = qr.size + opts.margin * 2;
  const parts: string[] = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) parts.push(`M${x + opts.margin},${y + opts.margin}h1v1h-1z`);
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges">`,
    `<rect width="${dim}" height="${dim}" fill="${opts.light}"/>`,
    `<path fill="${opts.dark}" d="${parts.join('')}"/>`,
    `</svg>`,
  ].join('');
}

/** Draws to a canvas at a whole number of pixels per module, so nothing blurs. */
export function toCanvas(qr: QrResult, pixels: number, opts: RenderOptions): HTMLCanvasElement {
  const dim = qr.size + opts.margin * 2;
  const scale = Math.max(1, Math.floor(pixels / dim));
  const canvas = document.createElement('canvas');
  canvas.width = dim * scale;
  canvas.height = dim * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser blocked canvas access, which this tool needs.');
  ctx.fillStyle = opts.light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = opts.dark;
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) {
        ctx.fillRect((x + opts.margin) * scale, (y + opts.margin) * scale, scale, scale);
      }
    }
  }
  return canvas;
}
