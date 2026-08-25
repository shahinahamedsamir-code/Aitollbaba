/*
 * Aitoollbaba's mark: an arch — the cave doorway that opens on the word — with
 * a spark standing in the opening. Two shapes only, so it survives being drawn
 * at 16px in a browser tab, and it is stroked in `currentColor` so the same
 * file works as dark-on-acid inside the tile and acid-on-dark on its own.
 */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 21.2V11.5a7 7 0 0 1 14 0v9.7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M12 9.4c.54 2.05 1.35 2.86 3.4 3.4-2.05.54-2.86 1.35-3.4 3.4-.54-2.05-1.35-2.86-3.4-3.4 2.05-.54 2.86-1.35 3.4-3.4z"
        fill="currentColor"
      />
    </svg>
  );
}

/** The glyph in its acid tile — the lockup used in the header and anywhere small. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-[28%] bg-acid text-acid-ink"
      style={{ width: size, height: size }}
    >
      <LogoGlyph className="h-[62%] w-[62%]" />
    </span>
  );
}

/**
 * Full lockup: mark plus wordmark. `ai` carries the accent so the name reads
 * as ai · toollbaba at a glance, the way the nav and the footer both set it.
 */
export default function Logo({
  size = 28,
  wordClassName = 'font-display text-[15px] font-semibold tracking-tight',
}: {
  size?: number;
  wordClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className={wordClassName}>
        <span className="text-acid">ai</span>toollbaba
      </span>
    </span>
  );
}
