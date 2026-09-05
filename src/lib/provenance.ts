/**
 * What a file says about its own origin.
 *
 * This is emphatically **not** an AI detector. Nothing here looks at the
 * picture. It reads the paperwork — C2PA manifests, the IPTC digitalSourceType
 * field, XMP generator names, Stable Diffusion prompt chunks — and the marks a
 * camera leaves, and reports what was found.
 *
 * The distinction matters because the two questions have very different
 * answers. "Was this declared as AI?" can be answered from the bytes with
 * certainty. "Is this AI?" cannot be answered from the bytes at all, and the
 * pixel-based detectors that try are unreliable enough that a wrong answer
 * does real damage to a real person. So this reports evidence and refuses to
 * pretend the absence of evidence is evidence of absence.
 */

import { readMetadata, type ExifReport } from './exif';

export type Verdict = 'declared-ai' | 'ai-edited' | 'camera' | 'stripped' | 'inconclusive';

export interface Signal {
  /** What this points toward. */
  side: 'ai' | 'camera' | 'edit';
  /** Strong signals are declarations; weak ones are only suggestive. */
  strength: 'strong' | 'weak';
  label: string;
  detail: string;
}

export interface ProvenanceReport {
  file: ExifReport;
  verdict: Verdict;
  headline: string;
  /** The one-line honest summary that must always accompany the verdict. */
  caveat: string;
  signals: Signal[];
  /** Named generators found, if any. */
  generators: string[];
}

/** Sizes that generators emit and cameras essentially never do. */
const GENERATOR_SIZES = new Set([
  '512x512', '768x768', '1024x1024', '1536x1536', '2048x2048',
  '1024x1536', '1536x1024', '1024x1792', '1792x1024',
  '832x1216', '1216x832', '896x1152', '1152x896',
]);

const EDITORS = /photoshop|lightroom|gimp|affinity|capture one|luminar|canva|figma|snapseed|picsart/i;

function tagValue(report: ExifReport, name: string): string | null {
  for (const ifd of report.ifds) {
    for (const entry of ifd.entries) {
      if (entry.name === name && entry.value && entry.value !== '—') return entry.value;
    }
  }
  return null;
}

export async function checkProvenance(file: File): Promise<ProvenanceReport> {
  const report = await readMetadata(file);
  const signals: Signal[] = [];
  const generators: string[] = [];

  /* ------------------------------------------------- declarations of AI */

  for (const finding of report.findings) {
    if (finding.kind === 'c2pa') {
      signals.push({
        side: 'ai',
        strength: 'strong',
        label: 'C2PA content credentials',
        detail:
          finding.detail ??
          'A signed provenance manifest is attached. It records which tool made or edited the file — this is the field platforms read when they apply an AI label.',
      });
    }
    if (finding.kind === 'ai') {
      signals.push({
        side: 'ai',
        strength: 'strong',
        label: 'AI generator tag',
        detail: finding.detail ?? finding.label,
      });
      if (finding.detail) {
        for (const name of finding.detail.split(',').map((s) => s.trim())) {
          if (name && !generators.includes(name)) generators.push(name);
        }
      }
    }
    if (finding.kind === 'sd') {
      signals.push({
        side: 'ai',
        strength: 'strong',
        label: 'Generation parameters',
        detail:
          finding.detail ??
          'PNG text chunks carry the prompt, seed and model — written by Automatic1111, ComfyUI or Forge.',
      });
    }
  }

  /* ------------------------------------------------- marks left by a camera */

  const make = tagValue(report, 'Make');
  const model = tagValue(report, 'Model');
  const exposure = tagValue(report, 'ExposureTime');
  const fnumber = tagValue(report, 'FNumber');
  const iso = tagValue(report, 'ISO');
  const lens = tagValue(report, 'LensModel');
  const serial = tagValue(report, 'BodySerialNumber') ?? tagValue(report, 'CameraSerialNumber');
  const software = tagValue(report, 'Software');

  if (make || model) {
    signals.push({
      side: 'camera',
      strength: exposure || fnumber || iso ? 'strong' : 'weak',
      label: 'Camera named in EXIF',
      detail: [make, model].filter(Boolean).join(' ') || 'A camera make or model is recorded.',
    });
  }

  if (exposure || fnumber || iso) {
    signals.push({
      side: 'camera',
      strength: 'strong',
      label: 'Exposure settings',
      detail: [
        exposure && `shutter ${exposure}`,
        fnumber && `aperture ${fnumber}`,
        iso && `ISO ${iso}`,
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }

  if (lens) {
    signals.push({ side: 'camera', strength: 'strong', label: 'Lens recorded', detail: lens });
  }

  if (serial) {
    signals.push({
      side: 'camera',
      strength: 'strong',
      label: 'Body serial number',
      detail: `${serial} — generators do not write these, and it ties every photo from this body together.`,
    });
  }

  if (report.gps) {
    signals.push({
      side: 'camera',
      strength: 'strong',
      label: 'GPS coordinates',
      detail: `${report.gps.lat.toFixed(5)}, ${report.gps.lon.toFixed(5)} — a position fix, which a generator has no way to invent.`,
    });
  }

  /* --------------------------------------------------------------- editing */

  if (software) {
    signals.push({
      side: EDITORS.test(software) ? 'edit' : 'camera',
      strength: 'weak',
      label: 'Software field',
      detail: software,
    });
  }

  /* ---------------------------------------------------------- weak hints */

  const dims = `${report.width}x${report.height}`;
  const cameraish = signals.some((s) => s.side === 'camera' && s.strength === 'strong');
  if (!cameraish && GENERATOR_SIZES.has(dims)) {
    signals.push({
      side: 'ai',
      strength: 'weak',
      label: 'A size generators use',
      detail: `${report.width}×${report.height} with no camera data. Suggestive only — a crop or a screenshot can land on the same numbers.`,
    });
  }

  /* --------------------------------------------------------------- verdict */

  const strongAi = signals.some((s) => s.side === 'ai' && s.strength === 'strong');
  const strongCamera = signals.some((s) => s.side === 'camera' && s.strength === 'strong');
  const edited = signals.some((s) => s.side === 'edit');

  let verdict: Verdict;
  let headline: string;
  let caveat: string;

  if (strongAi && strongCamera) {
    verdict = 'ai-edited';
    headline = 'Camera data and an AI declaration, together';
    caveat =
      'A photograph that has been through a generative edit looks like this — generative fill, an AI denoise, or almost any recent Photoshop or Lightroom feature. The picture may be almost entirely real.';
  } else if (strongAi) {
    verdict = 'declared-ai';
    headline = 'This file declares that AI was involved';
    caveat =
      'That is what the file says about itself, and it is the same thing platforms read. It does not prove how much of the picture was generated — the same tag is written for a fully generated image and for a small AI touch-up on a real photograph.';
  } else if (edited && strongCamera) {
    verdict = 'camera';
    headline = 'Camera original, edited afterwards';
    caveat =
      'Camera settings are recorded and an editor is named. Nothing declares AI — but metadata can be edited, and a file that has been through a social platform has usually had all of it stripped anyway.';
  } else if (strongCamera) {
    verdict = 'camera';
    headline = 'Carries the marks a camera leaves';
    caveat =
      'Exposure settings, a lens, a serial number or a GPS fix — the things generators do not write. This is good evidence, not proof: every one of these fields can be edited by someone who wants to.';
  } else if (report.empty || report.findings.length === 0) {
    verdict = 'stripped';
    headline = 'Nothing to go on — the file has been stripped';
    caveat =
      'No EXIF, no C2PA, no generator tag. This is the normal state of anything that has been through WhatsApp, Instagram or Facebook, and it is also what a metadata cleaner leaves behind. It says nothing either way about how the picture was made.';
  } else {
    verdict = 'inconclusive';
    headline = 'No declaration either way';
    caveat =
      'There is some metadata, but nothing that names a generator and nothing that proves a camera. Treat this as unknown rather than as evidence.';
  }

  return { file: report, verdict, headline, caveat, signals, generators };
}

export const VERDICT_TONE: Record<Verdict, 'ai' | 'camera' | 'neutral'> = {
  'declared-ai': 'ai',
  'ai-edited': 'ai',
  camera: 'camera',
  stripped: 'neutral',
  inconclusive: 'neutral',
};

/** The sentence that must never be dropped, wherever a verdict is shown. */
export const ALWAYS_TRUE =
  'This reads what the file says about itself. It does not look at the picture, and no honest tool can tell you from the pixels alone whether an image was generated.';
