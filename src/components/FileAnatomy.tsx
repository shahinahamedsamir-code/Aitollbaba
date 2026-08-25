/**
 * The page's signature diagram: a JPEG drawn as the stack of segments it
 * actually is, before and after a pass. It replaces the usual grid of feature
 * cards because it shows the mechanism — metadata is a set of discrete blocks
 * sitting in front of the pixel data, and cleaning is cutting them out.
 */

interface Segment {
  marker: string;
  name: string;
  note: string;
  /** Relative height of the bar — pixel data dwarfs everything else. */
  weight: number;
  cut: boolean;
}

const SEGMENTS: Segment[] = [
  { marker: 'SOI', name: 'Start of image', note: 'two bytes that say “this is a JPEG”', weight: 1, cut: false },
  { marker: 'APP1', name: 'EXIF', note: 'camera body, lens, serial, exposure, timestamps', weight: 5, cut: true },
  { marker: 'APP1', name: 'EXIF · GPS IFD', note: 'latitude, longitude, altitude', weight: 3, cut: true },
  { marker: 'APP1', name: 'XMP packet', note: 'creator, rights, edit history, CreatorTool', weight: 4, cut: true },
  { marker: 'APP2', name: 'ICC profile', note: 'colour rendering — rebuilt, carries no identity', weight: 3, cut: false },
  { marker: 'APP11', name: 'C2PA manifest', note: 'signed provenance from Firefly / Photoshop', weight: 6, cut: true },
  { marker: 'APP13', name: 'IPTC block', note: 'captions, keywords, digitalSourceType', weight: 3, cut: true },
  { marker: 'COM', name: 'Comment', note: 'generator strings, prompt fragments', weight: 2, cut: true },
  { marker: 'SOS', name: 'Pixel data', note: 'the actual picture — untouched', weight: 26, cut: false },
];

const KEPT = SEGMENTS.filter((s) => !s.cut);

function Bar({ segment, muted }: { segment: Segment; muted?: boolean }) {
  const tone = segment.cut
    ? 'border-flag/50 bg-flag-wash'
    : segment.name === 'Pixel data'
      ? 'border-acid/45 bg-acid-wash'
      : 'border-line-2 bg-raised';

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-3 ${tone} ${muted ? 'opacity-35' : ''}`}
      style={{ minHeight: `${Math.max(34, segment.weight * 5.2)}px` }}
    >
      <span
        className={`w-14 shrink-0 font-mono text-[10px] tracking-wider ${
          segment.cut ? 'text-flag' : segment.name === 'Pixel data' ? 'text-acid' : 'text-fg-3'
        }`}
      >
        {segment.marker}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-fg">{segment.name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-fg-3">{segment.note}</span>
      </span>
      {segment.cut && (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-flag">cut</span>
      )}
    </div>
  );
}

export default function FileAnatomy() {
  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
      {/* before */}
      <div className="flex min-w-0 flex-col">
        <div className="mb-3 flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-2">
            photo.jpg — as it arrives
          </span>
          <span className="font-mono text-[11px] text-flag">6 blocks carry data about you</span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 rounded-xl border border-line bg-surface p-2.5">
          {SEGMENTS.map((segment, i) => (
            <Bar key={i} segment={segment} />
          ))}
        </div>
      </div>

      {/* the pass */}
      <div className="flex items-center justify-center gap-3 lg:w-28 lg:flex-col lg:pt-8">
        <div className="hidden w-px flex-1 bg-line-2 lg:block" />
        <span className="rounded-full border border-acid/40 bg-acid-wash px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-acid">
          canvas pass
        </span>
        <div className="hidden w-px flex-1 bg-line-2 lg:block" />
      </div>

      {/* after */}
      <div className="flex min-w-0 flex-col">
        <div className="mb-3 flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-2">
            2026-08-24_14-30-02.jpg
          </span>
          <span className="font-mono text-[11px] text-acid">picture only</span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 rounded-xl border border-line bg-surface p-2.5">
          {KEPT.map((segment, i) => (
            <Bar key={i} segment={segment} />
          ))}
          {/* The ghost fills exactly the height the removed segments occupied,
              so the two stacks end level and the gap reads as the point. */}
          <div className="flex min-h-24 flex-1 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-line-2 px-3 py-4 text-center">
            <span className="font-mono text-[11px] text-fg-3">6 segments removed</span>
            <span className="font-mono text-[10px] text-fg-3/70">
              fingerprint reset · nothing left that names you
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
