'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACCEPTED, MAX_BYTES, decodeImage, formatBytes, toBlob } from '@/lib/clean';
import {
  PLACEMENTS,
  cropFileName,
  cropReport,
  placementGroups,
  renderCrop,
  type Placement,
} from '@/lib/placements';
import { makeZip } from '@/lib/zip';

type View = 'result' | 'cut';

/** Every preview is drawn to this height, so the rows align. */
const PREVIEW_HEIGHT = 150;

interface Loaded {
  file: File;
  url: string;
  width: number;
  height: number;
}

export default function SocialPreview() {
  const [image, setImage] = useState<Loaded | null>(null);
  const [view, setView] = useState<View>('result');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const load = useCallback(async (file: File) => {
    setError(null);
    try {
      if (file.size > MAX_BYTES) throw new Error(`That file is over ${formatBytes(MAX_BYTES)}.`);
      // Decoded once, only to learn the dimensions — the previews below are
      // plain CSS, so nothing is drawn until you ask for a download.
      const source = await decodeImage(file);
      const width = 'width' in source ? source.width : 0;
      const height = 'height' in source ? source.height : 0;
      if ('close' in source) source.close();
      if (!width || !height) throw new Error('This file could not be decoded by your browser.');
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      setImage({ file, url, width, height });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    }
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files?.[0];
      if (file) void load(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [load]);

  const saveOne = async (placement: Placement) => {
    if (!image) return;
    setBusy(placement.id);
    try {
      const source = await decodeImage(image.file);
      const canvas = renderCrop(source as CanvasImageSource, image.width, image.height, placement);
      if ('close' in source) source.close();
      const blob = await toBlob(canvas, 'image/jpeg', 0.92);
      canvas.width = 0;
      canvas.height = 0;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cropFileName(image.file.name, placement);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not write that crop.');
    } finally {
      setBusy(null);
    }
  };

  const saveAll = async () => {
    if (!image) return;
    setBusy('all');
    try {
      const source = await decodeImage(image.file);
      const files: { name: string; blob: Blob }[] = [];
      for (const placement of PLACEMENTS) {
        const canvas = renderCrop(source as CanvasImageSource, image.width, image.height, placement);
        files.push({
          name: cropFileName(image.file.name, placement),
          blob: await toBlob(canvas, 'image/jpeg', 0.92),
        });
        canvas.width = 0;
        canvas.height = 0;
      }
      if ('close' in source) source.close();
      const zip = await makeZip(files);
      const url = URL.createObjectURL(zip);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.file.name.replace(/\.[^.]+$/, '')}-all-sizes.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not write the ZIP.');
    } finally {
      setBusy(null);
    }
  };

  const worst = useMemo(() => {
    if (!image) return null;
    let lowest = 101;
    let where: Placement | null = null;
    for (const p of PLACEMENTS) {
      const r = cropReport(image.width, image.height, p);
      if (r.keptPercent < lowest) {
        lowest = r.keptPercent;
        where = p;
      }
    }
    return where ? { placement: where, kept: lowest } : null;
  }, [image]);

  const upscaledCount = useMemo(() => {
    if (!image) return 0;
    return PLACEMENTS.filter((p) => cropReport(image.width, image.height, p).upscaled).length;
  }, [image]);

  return (
    <div
      id="tool"
      className="scroll-mt-20 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/40"
    >
      {/* ------------------------------------------------------ window bar */}
      <div className="flex items-center gap-3 border-b border-line bg-raised px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-line-2" />
          <span className="h-2 w-2 rounded-full bg-line-2" />
          <span className="h-2 w-2 rounded-full bg-acid/70" />
        </span>
        <span className="font-mono text-[11px] text-fg-3">
          preview{image ? ` — ${PLACEMENTS.length} placements` : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">
          {image ? `${image.width}×${image.height}` : 'centre-crop'}
        </span>
      </div>

      <div className="p-4">
        {/* ------------------------------------------------------ dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) void load(file);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Choose an image to preview"
          className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-6 text-center transition-colors ${
            image ? 'py-6' : 'py-14 sm:py-16'
          } ${dragging ? 'border-acid bg-acid-wash' : 'border-line-2 bg-bg hover:border-acid/60 hover:bg-raised'}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-2 bg-surface text-acid">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 13h7v7h-7zM4 16h7v4H4z" />
            </svg>
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {image ? 'Try another image' : 'Drop an image to see every crop'}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-fg-3">click · drag · or press ctrl+V</p>
          {!image && (
            <p className="mt-5 font-mono text-[10px] tracking-wider text-fg-3/70">
              JPG · PNG · WEBP · AVIF · HEIC — max {formatBytes(MAX_BYTES)}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={[...ACCEPTED, '.heic', '.heif'].join(',')}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void load(file);
              e.target.value = '';
            }}
          />
        </div>

        {error && (
          <p className="mt-3 rounded border border-flag/40 bg-flag-wash px-3 py-2 font-mono text-[11px] text-flag">
            {error}
          </p>
        )}

        {image && (
          <>
            {/* ------------------------------------------------- controls */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-bg px-3.5 py-3">
              <span className="font-mono text-[11px] text-fg-3">show</span>
              <div className="flex overflow-hidden rounded border border-line">
                {(
                  [
                    ['result', 'what they see'],
                    ['cut', "what's cut off"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setView(value)}
                    aria-pressed={view === value}
                    className={`px-3 py-1 font-mono text-[11px] transition-colors ${
                      view === value ? 'bg-acid text-acid-ink' : 'bg-surface text-fg-3 hover:text-fg'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={saveAll}
                disabled={busy !== null}
                className="ml-auto rounded-md bg-acid px-4 py-1.5 font-mono text-[11px] font-medium text-acid-ink transition-colors hover:bg-fg disabled:opacity-50"
              >
                {busy === 'all' ? 'zipping…' : `download all ${PLACEMENTS.length}`}
              </button>
            </div>

            {worst && worst.kept < 100 && (
              <p className="mt-3 rounded border border-flag/40 bg-flag-wash px-3 py-2 text-[11px] leading-relaxed text-fg-2">
                Worst case is{' '}
                <span className="text-flag">
                  {worst.placement.group} {worst.placement.label}
                </span>
                , which keeps only <span className="text-flag">{worst.kept}%</span> of the picture.
                Nothing here changes that — platforms crop from the centre. If something important sits
                near an edge, crop it yourself first in the{' '}
                <a href="/image-resizer" className="underline underline-offset-2 hover:text-acid">
                  resizer
                </a>{' '}
                and upload that.
              </p>
            )}

            {upscaledCount > 0 && (
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-fg-3">
                {upscaledCount} of {PLACEMENTS.length} placements are larger than your image, so those
                will be enlarged and look soft. Start from something bigger where you can.
              </p>
            )}

            {/* -------------------------------------------------- previews */}
            {placementGroups().map(({ group, items }) => (
              <div key={group} className="mt-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-3">{group}</h3>
                <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((placement) => (
                    <Preview
                      key={placement.id}
                      image={image}
                      placement={placement}
                      view={view}
                      busy={busy === placement.id}
                      onSave={() => void saveOne(placement)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The preview itself is CSS. `object-fit: cover` performs exactly the
 * centre-crop a platform does, so there is no canvas in the render path and
 * nothing can drift between what is shown and what is downloaded.
 */
function Preview({
  image,
  placement,
  view,
  busy,
  onSave,
}: {
  image: Loaded;
  placement: Placement;
  view: View;
  busy: boolean;
  onSave: () => void;
}) {
  const report = cropReport(image.width, image.height, placement);
  const circle = placement.shape === 'circle';
  const ratio = placement.width / placement.height;
  // Every preview is capped to the same height, and the width follows from the
  // ratio — so a banner is wide and short, a story is narrow and tall, rows
  // line up, and no preview is ever the wrong shape.
  const boxStyle = {
    aspectRatio: String(ratio),
    width: `min(100%, ${(PREVIEW_HEIGHT * ratio).toFixed(0)}px)`,
  };
  const srcRatio = image.width / image.height;
  const cutStyle = {
    aspectRatio: String(srcRatio),
    width: `min(100%, ${(PREVIEW_HEIGHT * srcRatio).toFixed(0)}px)`,
  };

  // Fractions of the source that survive, as percentages for the mask.
  const sideCut = ((1 - report.visibleWidth) / 2) * 100;
  const vertCut = ((1 - report.visibleHeight) / 2) * 100;

  return (
    <li className="min-w-0">
      <div className="flex h-[150px] items-center justify-center">
        {view === 'result' ? (
          <div
            className={`relative mx-auto overflow-hidden border border-line bg-raised ${
              circle ? 'rounded-full' : 'rounded-md'
            }`}
            style={boxStyle}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`${placement.group} ${placement.label} preview`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          // The whole picture, with the parts that get thrown away dimmed.
          <div
            className="relative mx-auto overflow-hidden rounded-md border border-line bg-raised"
            style={cutStyle}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`${placement.group} ${placement.label}, showing the crop`}
              className="block h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'rgba(7, 9, 12, 0.72)',
                clipPath: `polygon(
                  0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                  ${sideCut}% ${vertCut}%,
                  ${sideCut}% ${100 - vertCut}%,
                  ${100 - sideCut}% ${100 - vertCut}%,
                  ${100 - sideCut}% ${vertCut}%,
                  ${sideCut}% ${vertCut}%
                )`,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute border border-acid/70"
              style={{
                left: `${sideCut}%`,
                right: `${sideCut}%`,
                top: `${vertCut}%`,
                bottom: `${vertCut}%`,
              }}
              aria-hidden
            />
          </div>
        )}
      </div>

      <p className="mt-2 truncate font-mono text-[10.5px] text-fg-2" title={placement.label}>
        {placement.label}
      </p>
      <p className="font-mono text-[9.5px] text-fg-3">
        {placement.width}×{placement.height}
        {report.keptPercent < 100 && (
          <>
            {' · '}
            <span className={report.keptPercent < 60 ? 'text-flag' : 'text-fg-3'}>
              {report.keptPercent}% kept
            </span>
          </>
        )}
      </p>
      {placement.note && (
        <p className="mt-0.5 text-[9.5px] leading-snug text-fg-3/80">{placement.note}</p>
      )}

      <button
        onClick={onSave}
        disabled={busy}
        className="mt-1.5 font-mono text-[10px] text-fg-3 underline underline-offset-2 transition-colors hover:text-acid disabled:opacity-50"
      >
        {busy ? 'saving…' : 'save this size'}
      </button>
    </li>
  );
}
