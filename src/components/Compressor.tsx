'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACCEPTED, MAX_BATCH, MAX_BYTES, formatBytes } from '@/lib/clean';
import {
  DEFAULT_COMPRESS,
  SIZE_PRESETS,
  compressFile,
  percentSaved,
  type CompressOptions,
  type CompressResult,
} from '@/lib/compress';
import { makeZip } from '@/lib/zip';

type Status = 'ready' | 'working' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  status: Status;
  error?: string;
  result?: CompressResult;
  /** Object URLs for the compare panel — original on the left, output on the right. */
  sourceUrl?: string;
  outputUrl?: string;
}

export default function Compressor() {
  const [items, setItems] = useState<Item[]>([]);
  const [options, setOptions] = useState<CompressOptions>(DEFAULT_COMPRESS);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  // Set whenever a setting moves after something has already been compressed,
  // so the button can say the results are behind the controls.
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  // Mirrors `items` so callbacks can read the current list without a state
  // updater — updaters must stay pure, and starting work inside one makes
  // React run it twice under StrictMode.
  const itemsRef = useRef<Item[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const track = (url: string) => {
    urls.current.push(url);
    return url;
  };

  const run = useCallback(async (item: Item, opts: CompressOptions) => {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'working' } : x)));
    try {
      const result = await compressFile(item.file, opts);
      const outputUrl = URL.createObjectURL(result.blob);
      urls.current.push(outputUrl);
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: 'done', result, outputUrl } : x)),
      );
    } catch (error) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? { ...x, status: 'error', error: error instanceof Error ? error.message : 'Failed' }
            : x,
        ),
      );
    }
  }, []);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const problems: string[] = [];
      const accepted: Item[] = [];

      for (const file of Array.from(list)) {
        const looksLikeImage =
          file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name);
        if (!looksLikeImage) {
          problems.push(`${file.name} is not an image`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          problems.push(`${file.name} exceeds ${formatBytes(MAX_BYTES)}`);
          continue;
        }
        accepted.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          status: 'ready',
          sourceUrl: track(URL.createObjectURL(file)),
        });
      }

      const room = MAX_BATCH - itemsRef.current.length;
      if (accepted.length > room) problems.push(`${MAX_BATCH} at a time — the rest were skipped`);
      const batch = accepted.slice(0, Math.max(0, room));

      setItems((prev) => [...prev, ...batch]);
      setNotice(problems.length ? problems.join(' · ') : null);
    },
    [],
  );

  // Paste is the fastest path for a screenshot, so it is wired up globally
  // rather than only on the drop zone.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  /**
   * Changing a setting changes the setting and nothing else. Files are only
   * touched when the run button is pressed, so a budget, a format and a size
   * can be chosen in one go instead of re-running the whole batch per click.
   */
  const update = (next: CompressOptions) => {
    setOptions(next);
    setDirty(true);
  };

  /**
   * Compresses everything not already done under the current settings — new
   * files, previous failures, and every result if a setting has moved.
   * `force` re-runs even an up-to-date batch, for the "run again" case.
   */
  const runAll = (force = false) => {
    const opts = options;
    const reset = itemsRef.current.map((x) =>
      x.status === 'done' && !dirty && !force
        ? x
        : {
            ...x,
            status: 'ready' as Status,
            result: undefined,
            error: undefined,
            outputUrl: undefined,
          },
    );
    setItems(reset);
    setDirty(false);
    setExpanded(null);
    reset.filter((x) => x.status === 'ready').forEach((item) => void run(item, opts));
  };

  const saveBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const downloadAll = async () => {
    const done = items.filter((x) => x.result);
    if (!done.length) return;
    setZipping(true);
    try {
      const zip = await makeZip(done.map((x) => ({ name: x.result!.name, blob: x.result!.blob })));
      saveBlob(zip, 'compressed-images.zip');
    } finally {
      setZipping(false);
    }
  };

  const stats = useMemo(() => {
    const done = items.filter((x) => x.result);
    const before = done.reduce((sum, x) => sum + x.result!.bytesBefore, 0);
    const after = done.reduce((sum, x) => sum + x.result!.bytesAfter, 0);
    return {
      done: done.length,
      working: items.some((x) => x.status === 'working'),
      // Anything the current settings have not been applied to yet.
      pending: items.filter(
        (x) => x.status === 'ready' || x.status === 'error' || (dirty && x.status === 'done'),
      ).length,
      before,
      after,
      saved: before - after,
      missed: done.filter((x) => !x.result!.hitTarget).length,
    };
  }, [items, dirty]);

  const sizeMode = options.mode === 'size';

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
          compressor
          {stats.working
            ? ' — working…'
            : stats.done
              ? ` — ${formatBytes(stats.saved)} saved`
              : items.length
                ? ` — ${items.length} ready`
                : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">
          {sizeMode ? `target ${labelFor(options.targetKB)}` : `q${Math.round(options.quality * 100)}`}
          {options.format !== 'auto' && ` · ${options.format.replace('image/', '')}`}
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
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
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
          aria-label="Choose images to compress"
          className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-6 text-center transition-colors ${
            items.length ? 'py-8' : 'py-14 sm:py-16'
          } ${dragging ? 'border-acid bg-acid-wash' : 'border-line-2 bg-bg hover:border-acid/60 hover:bg-raised'} ${
            stats.working ? 'scanline' : ''
          }`}
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
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              <path d="M9.5 9.5h5v5h-5z" />
            </svg>
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {items.length ? 'Add more images' : 'Drop an image to compress it'}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-fg-3">click · drag · or press ctrl+V</p>
          {!items.length && (
            <p className="mt-5 font-mono text-[10px] tracking-wider text-fg-3/70">
              JPG · PNG · WEBP · AVIF · HEIC — max {formatBytes(MAX_BYTES)}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={[...ACCEPTED, '.heic', '.heif'].join(',')}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* ------------------------------------------------------ settings */}
        <div className="mt-3 rounded-lg border border-line bg-bg">
          {/* Mode first, because it decides which of the two controls below
              is the one that matters. */}
          <div className="flex items-center gap-3 border-b border-line px-3.5 py-2.5">
            <span className="font-mono text-[11px] text-fg-3">aim for</span>
            <div className="flex overflow-hidden rounded border border-line">
              {(
                [
                  ['size', 'a file size'],
                  ['quality', 'a quality'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => update({ ...options, mode })}
                  aria-pressed={options.mode === mode}
                  className={`px-3 py-1 font-mono text-[11px] transition-colors ${
                    options.mode === mode
                      ? 'bg-acid text-acid-ink'
                      : 'bg-surface text-fg-3 hover:text-fg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-x-5 gap-y-3 px-3.5 py-3 sm:grid-cols-2">
            {sizeMode ? (
              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">size budget</span>
                <select
                  value={options.targetKB}
                  onChange={(e) => update({ ...options, targetKB: Number(e.target.value) })}
                  className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
                >
                  {SIZE_PRESETS.map((p) => (
                    <option key={p.kb} value={p.kb}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">quality</span>
                <span className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.4}
                    max={1}
                    step={0.02}
                    value={options.quality}
                    disabled={options.format === 'image/png'}
                    onChange={(e) => update({ ...options, quality: Number(e.target.value) })}
                    className="w-24 disabled:opacity-40"
                  />
                  <span className="w-9 font-mono text-[11px] text-fg-2">
                    {options.format === 'image/png' ? '—' : `${Math.round(options.quality * 100)}%`}
                  </span>
                </span>
              </label>
            )}

            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">output format</span>
              <select
                value={options.format}
                onChange={(e) =>
                  update({ ...options, format: e.target.value as CompressOptions['format'] })
                }
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
              >
                <option value="auto">keep original</option>
                <option value="image/jpeg">jpeg</option>
                <option value="image/webp">webp · smallest</option>
                {/* PNG has no quality dial, so a size budget cannot be met in it. */}
                <option value="image/png" disabled={sizeMode}>
                  png · lossless
                </option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">resize first</span>
              <select
                value={options.maxEdge}
                onChange={(e) => update({ ...options, maxEdge: Number(e.target.value) })}
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
              >
                <option value={0}>original size</option>
                <option value={2560}>2560 px</option>
                <option value={1920}>1920 px</option>
                <option value={1280}>1280 px</option>
                <option value={800}>800 px</option>
              </select>
            </label>
          </div>

          <p className="border-t border-line px-3.5 py-2 font-mono text-[10px] leading-relaxed text-fg-3">
            {sizeMode
              ? `Quality is searched for, not guessed: the encoder is run repeatedly until the file lands under ${labelFor(options.targetKB)} at the highest quality that still fits. If no quality reaches the budget, the image is scaled down and the search runs again. PNG is greyed out here — a lossless format has no quality dial to meet a budget with.`
              : options.format === 'image/png'
                ? 'PNG is lossless — the pixels come back exactly as they went in, so the only saving comes from resizing.'
                : `Encoded once at ${Math.round(options.quality * 100)}% — ${
                    options.quality >= 0.9
                      ? 'no visible difference at normal viewing sizes'
                      : options.quality >= 0.7
                        ? 'slightly softer, much smaller file'
                        : 'visibly compressed; use it only to save space'
                  }.`}
          </p>
        </div>

        {/* Nothing runs until this is pressed. It is the only thing that
            touches a file, so it states exactly what it is about to do. */}
        {items.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              onClick={() => runAll(stats.pending === 0)}
              disabled={stats.working}
              className={`rounded-md px-5 py-2.5 font-mono text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                stats.pending > 0
                  ? 'bg-acid text-acid-ink hover:bg-fg'
                  : 'border border-line-2 text-fg-2 hover:border-acid/40 hover:text-fg'
              }`}
            >
              {stats.working
                ? `working… ${stats.done}/${items.length}`
                : stats.pending > 0
                  ? `compress ${stats.pending} image${stats.pending === 1 ? '' : 's'}`
                  : 'run again'}
            </button>

            {!stats.working &&
              (dirty && stats.done > 0 ? (
                <span className="font-mono text-[11px] text-flag">
                  settings changed — press compress to apply them
                </span>
              ) : stats.pending > 0 ? (
                <span className="font-mono text-[11px] text-fg-3">
                  nothing has been touched yet
                </span>
              ) : (
                <span className="font-mono text-[11px] text-fg-3">
                  save each file below, or download them all at once
                </span>
              ))}
          </div>
        )}

        {notice && (
          <p className="mt-3 rounded border border-flag/40 bg-flag-wash px-3 py-2 font-mono text-[11px] text-flag">
            {notice}
          </p>
        )}

        {/* ------------------------------------------------------- results */}
        {items.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
              <span className="font-mono text-[11px] text-fg-3">
                {stats.done}/{items.length} done
                {stats.done > 0 && (
                  <>
                    {' · '}
                    <span className="text-acid">
                      {formatBytes(stats.before)} → {formatBytes(stats.after)}
                    </span>
                    {` (${percentSaved(stats.before, stats.after)}% smaller)`}
                  </>
                )}
              </span>
              <span className="flex gap-2">
                {stats.done > 1 && (
                  <button
                    onClick={downloadAll}
                    disabled={zipping}
                    className="rounded bg-acid px-3 py-1.5 font-mono text-[11px] font-medium text-acid-ink transition-colors hover:bg-fg disabled:opacity-50"
                  >
                    {zipping ? 'zipping…' : `download all (${stats.done})`}
                  </button>
                )}
                <button
                  onClick={() => {
                    setItems([]);
                    setExpanded(null);
                    setNotice(null);
                  }}
                  className="rounded border border-line px-3 py-1.5 font-mono text-[11px] text-fg-3 transition-colors hover:border-flag hover:text-flag"
                >
                  clear
                </button>
              </span>
            </div>

            {stats.missed > 0 && (
              <p className="mt-3 rounded border border-flag/40 bg-flag-wash px-3 py-2 text-[11px] leading-relaxed text-fg-2">
                {stats.missed === 1 ? 'One file' : `${stats.missed} files`} could not reach{' '}
                {labelFor(options.targetKB)} without being scaled below a usable size. The smallest
                honest encode is what you have — raise the budget, or set a smaller “resize first”.
              </p>
            )}

            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rise overflow-hidden rounded-lg border border-line bg-bg">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded border border-line bg-raised">
                      {item.outputUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.outputUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-fg-3">
                          {item.status === 'error' ? '!' : '···'}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[12px] text-fg">{item.file.name}</p>
                      {item.status === 'error' ? (
                        <p className="mt-1 text-[11px] text-flag">{item.error}</p>
                      ) : item.result ? (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px]">
                          <span className="text-fg-3 line-through">
                            {formatBytes(item.result.bytesBefore)}
                          </span>
                          <span className="text-fg-3">→</span>
                          <span className="text-acid">{formatBytes(item.result.bytesAfter)}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              item.result.bytesAfter < item.result.bytesBefore
                                ? 'bg-acid-wash text-acid'
                                : 'bg-flag-wash text-flag'
                            }`}
                          >
                            {percentSaved(item.result.bytesBefore, item.result.bytesAfter)}% smaller
                          </span>
                          {!item.result.hitTarget && (
                            <span className="rounded bg-flag-wash px-1.5 py-0.5 text-flag">
                              over budget
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="mt-1 font-mono text-[10px] text-fg-3">
                          {item.status === 'working' ? 'searching…' : 'ready — press compress'}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.result && (
                        <>
                          <button
                            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                            className="rounded border border-line px-2.5 py-1.5 font-mono text-[10px] text-fg-3 transition-colors hover:border-acid hover:text-acid"
                          >
                            {expanded === item.id ? 'hide' : 'compare'}
                          </button>
                          <button
                            onClick={() => saveBlob(item.result!.blob, item.result!.name)}
                            className="rounded bg-acid px-3 py-1.5 font-mono text-[11px] font-medium text-acid-ink transition-colors hover:bg-fg"
                          >
                            save
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setItems((prev) => prev.filter((x) => x.id !== item.id));
                          if (expanded === item.id) setExpanded(null);
                        }}
                        aria-label={`Remove ${item.file.name}`}
                        className="px-1 text-fg-3 transition-colors hover:text-flag"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {expanded === item.id && item.result && (
                    <Compare item={item} result={item.result} />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function labelFor(kb: number): string {
  return SIZE_PRESETS.find((p) => p.kb === kb)?.label ?? `${kb} KB`;
}

/**
 * Side by side at the same rendered size, because that is the only way to judge
 * whether the saving cost anything — a percentage alone tells you nothing about
 * what the picture looks like now.
 */
function Compare({ item, result }: { item: Item; result: CompressResult }) {
  return (
    <div className="border-t border-line bg-surface px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['original', item.sourceUrl, result.bytesBefore, `${result.srcWidth}×${result.srcHeight}`],
            ['compressed', item.outputUrl, result.bytesAfter, `${result.width}×${result.height}`],
          ] as const
        ).map(([label, url, bytes, dims]) => (
          <figure key={label} className="overflow-hidden rounded-lg border border-line bg-bg">
            <div className="flex h-56 items-center justify-center bg-raised">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`${label} preview`} className="max-h-full max-w-full object-contain" />
              ) : null}
            </div>
            <figcaption className="flex items-baseline justify-between gap-2 border-t border-line px-3 py-2 font-mono text-[10px]">
              <span className={label === 'compressed' ? 'text-acid' : 'text-fg-3'}>{label}</span>
              <span className="text-fg-2">
                {formatBytes(bytes)} · {dims}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <dl className="mt-4 space-y-1.5">
        <Row label="size" before={formatBytes(result.bytesBefore)} after={formatBytes(result.bytesAfter)} />
        <Row
          label="pixels"
          before={`${result.srcWidth}×${result.srcHeight}`}
          after={`${result.width}×${result.height}`}
        />
        <Row label="format" before={item.file.type || '—'} after={result.type} />
      </dl>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-fg-3">
        {result.quality === null
          ? 'Encoded losslessly — every pixel is identical.'
          : `Settled at quality ${Math.round(result.quality * 100)} after ${result.attempts} ${
              result.attempts === 1 ? 'encode' : 'encodes'
            }${result.downscaled ? ', with the image scaled down to fit' : ''}.`}
        {result.targetBytes !== null &&
          (result.hitTarget
            ? ` Budget ${formatBytes(result.targetBytes)} — met.`
            : ` Budget ${formatBytes(result.targetBytes)} — not reachable at a usable size.`)}
      </p>

      <p className="mt-2 text-[11px] leading-relaxed text-fg-3">
        Compressing re-encodes through a canvas, which also drops every metadata block the file was
        carrying — EXIF, GPS, C2PA and the rest.{' '}
        <a href="/remove-ai-label" className="text-fg-2 underline underline-offset-2 hover:text-acid">
          The AI label remover
        </a>{' '}
        does the same thing but reports what was in there first.
      </p>
    </div>
  );
}

function Row({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-[11px]">
      <dt className="w-20 shrink-0 text-fg-3">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-fg-3 line-through">{before}</span>
        <span className="text-fg-3">→</span>
        <span className="truncate text-acid">{after}</span>
      </dd>
    </div>
  );
}
