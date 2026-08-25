'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ACCEPTED,
  DEFAULT_OPTIONS,
  MAX_BATCH,
  MAX_BYTES,
  cleanFile,
  formatBytes,
  type CleanOptions,
  type CleanResult,
} from '@/lib/clean';
import { KIND_LABEL, type Finding, type MetaKind } from '@/lib/scan';
import { makeZip } from '@/lib/zip';

type Status = 'ready' | 'working' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  status: Status;
  error?: string;
  result?: CleanResult;
  previewUrl?: string;
}

/** Blocks that name you, your device or the generator get the alert colour. */
const IDENTIFYING: MetaKind[] = ['exif', 'gps', 'c2pa', 'ai', 'sd', 'xmp', 'iptc', 'thumbnail', 'comment'];

function Chip({ finding }: { finding: Finding }) {
  const hot = IDENTIFYING.includes(finding.kind);
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${
        hot ? 'bg-flag-wash text-flag' : 'bg-raised text-fg-3'
      }`}
      title={finding.detail ?? finding.label}
    >
      {KIND_LABEL[finding.kind]}
    </span>
  );
}

export default function Cleaner() {
  const [items, setItems] = useState<Item[]>([]);
  const [options, setOptions] = useState<CleanOptions>(DEFAULT_OPTIONS);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  // Set whenever a setting moves after something has already been cleaned, so
  // the button can say the results are behind the controls.
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

  const run = useCallback(async (item: Item, opts: CleanOptions) => {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'working' } : x)));
    try {
      const result = await cleanFile(item.file, opts);
      const previewUrl = URL.createObjectURL(result.blob);
      urls.current.push(previewUrl);
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: 'done', result, previewUrl } : x)),
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

  // Paste is the fastest path for a screenshot or an image copied out of a
  // generator, so it is wired up globally rather than only on the drop zone.
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
   * touched when the run button is pressed, so a format, a size and a quality
   * can be chosen in one go instead of re-running the whole batch per click.
   */
  const update = (next: CleanOptions) => {
    setOptions(next);
    setDirty(true);
  };

  /**
   * Cleans everything that has not been cleaned under the current settings —
   * new files, previous failures, and every result if a setting has moved.
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
            previewUrl: undefined,
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
      saveBlob(zip, 'cleaned-images.zip');
    } finally {
      setZipping(false);
    }
  };

  const stats = useMemo(() => {
    const done = items.filter((x) => x.result);
    return {
      done: done.length,
      working: items.some((x) => x.status === 'working'),
      // Anything the current settings have not been applied to yet.
      pending: items.filter(
        (x) => x.status === 'ready' || x.status === 'error' || (dirty && x.status === 'done'),
      ).length,
      stripped: done.reduce((sum, x) => sum + x.result!.before.findings.length, 0),
      bytesBefore: done.reduce((sum, x) => sum + x.result!.bytesBefore, 0),
      bytesAfter: done.reduce((sum, x) => sum + x.result!.bytesAfter, 0),
    };
  }, [items, dirty]);

  return (
    <div id="tool" className="scroll-mt-20 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/40">
      {/* ------------------------------------------------------ window bar */}
      <div className="flex items-center gap-3 border-b border-line bg-raised px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-line-2" />
          <span className="h-2 w-2 rounded-full bg-line-2" />
          <span className="h-2 w-2 rounded-full bg-acid/70" />
        </span>
        <span className="font-mono text-[11px] text-fg-3">
          scanner
          {stats.working
            ? ' — working…'
            : stats.done
              ? ` — ${stats.done} clean`
              : items.length
                ? ` — ${items.length} ready`
                : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">
          {options.format === 'auto' ? 'same format' : options.format.replace('image/', '')}
          {options.format !== 'image/png' && ` · q${Math.round(options.quality * 100)}`}
        </span>
      </div>

      {/* -------------------------------------------------------- dropzone */}
      <div className="p-4">
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
          aria-label="Choose images to clean"
          className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-6 text-center transition-colors ${
            items.length ? 'py-8' : 'py-14 sm:py-16'
          } ${dragging ? 'border-acid bg-acid-wash' : 'border-line-2 bg-bg hover:border-acid/60 hover:bg-raised'} ${
            stats.working ? 'scanline' : ''
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-2 bg-surface text-acid">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 15V3m0 0L8 7m4-4 4 4" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {items.length ? 'Add more images' : 'Drop an image to scan it'}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-fg-3">
            click · drag · or press ctrl+V
          </p>
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

        {/* Output settings sit in the open rather than behind a toggle: what
            format you get back and how much quality you trade are the two
            questions people have before they hand over a file. */}
        <div className="mt-3 rounded-lg border border-line bg-bg">
          <div className="grid gap-x-5 gap-y-3 px-3.5 py-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">output format</span>
              <select
                value={options.format}
                onChange={(e) =>
                  update({ ...options, format: e.target.value as CleanOptions['format'] })
                }
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
              >
                <option value="auto">keep original</option>
                <option value="image/jpeg">jpeg</option>
                <option value="image/png">png · lossless</option>
                <option value="image/webp">webp</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">resize to</span>
              <select
                value={options.maxEdge}
                onChange={(e) => update({ ...options, maxEdge: Number(e.target.value) })}
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
              >
                <option value={0}>original size</option>
                <option value={2048}>2048 px</option>
                <option value={1600}>1600 px</option>
                <option value={1080}>1080 px</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">quality</span>
              <span className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.5}
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

            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">reset fingerprint</span>
              <input
                type="checkbox"
                checked={options.jitter}
                onChange={(e) => update({ ...options, jitter: e.target.checked })}
                className="h-3.5 w-3.5"
              />
            </label>
          </div>

          <p className="border-t border-line px-3.5 py-2 font-mono text-[10px] leading-relaxed text-fg-3">
            {options.format === 'image/png'
              ? 'PNG is lossless — the pixels come back exactly as they went in.'
              : `Re-encoded once at ${Math.round(options.quality * 100)}% — ${
                  options.quality >= 0.9
                    ? 'no visible difference at normal viewing sizes'
                    : options.quality >= 0.75
                      ? 'slightly softer, smaller file'
                      : 'visibly compressed; use it only to save space'
                }.`}
            {options.jitter && ' Pixels nudged ±1–2 RGB to change the file hash.'}
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
                  ? `clean ${stats.pending} image${stats.pending === 1 ? '' : 's'}`
                  : 'run again'}
            </button>

            {!stats.working &&
              (dirty && stats.done > 0 ? (
                <span className="font-mono text-[11px] text-flag">
                  settings changed — press clean to apply them
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
                {stats.stripped > 0 && ` · ${stats.stripped} blocks removed`}
                {stats.done > 0 && (
                  <>
                    {' · '}
                    <span className="text-fg-2">
                      {formatBytes(stats.bytesBefore)} → {formatBytes(stats.bytesAfter)}
                    </span>
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

            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rise overflow-hidden rounded-lg border border-line bg-bg">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded border border-line bg-raised">
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
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
                        <>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {item.result.before.findings.length === 0 ? (
                              <span className="font-mono text-[10px] text-fg-3">
                                nothing embedded — re-encoded, fingerprint reset
                              </span>
                            ) : (
                              dedupe(item.result.before.findings).map((f, i) => (
                                <Chip key={i} finding={f} />
                              ))
                            )}
                          </div>
                          <SizeDelta before={item.result.bytesBefore} after={item.result.bytesAfter} />
                        </>
                      ) : (
                        <p className="mt-1 font-mono text-[10px] text-fg-3">
                          {item.status === 'working' ? 'scanning…' : 'ready — press clean'}
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
                            {expanded === item.id ? 'hide' : 'report'}
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

                  {expanded === item.id && item.result && <Report result={item.result} />}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * What the file weighs now. Re-encoding can land either side of the original —
 * a heavily compressed JPEG grows when it is written back at 92, a large PNG
 * usually shrinks — and neither is a fault, so "larger" is stated plainly
 * rather than flagged as a problem.
 */
function SizeDelta({ before, after }: { before: number; after: number }) {
  const pct = before > 0 ? Math.round((Math.abs(after - before) / before) * 100) : 0;
  const smaller = after < before;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px]">
      <span className="text-fg-3 line-through">{formatBytes(before)}</span>
      <span className="text-fg-3">→</span>
      <span className={smaller ? 'text-acid' : 'text-fg'}>{formatBytes(after)}</span>
      <span
        className={`rounded px-1.5 py-0.5 ${
          smaller ? 'bg-acid-wash text-acid' : 'bg-raised text-fg-3'
        }`}
      >
        {pct === 0 ? 'same size' : smaller ? `${pct}% smaller` : `${pct}% larger`}
      </span>
    </p>
  );
}

/** Collapses repeated kinds so a file with six text chunks shows one chip. */
function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<MetaKind>();
  return findings.filter((f) => (seen.has(f.kind) ? false : (seen.add(f.kind), true)));
}

function Report({ result }: { result: CleanResult }) {
  const tags = Object.entries(result.before.tags);
  return (
    <div className="border-t border-line bg-surface px-4 py-4">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.14em] text-flag">found in the original</h4>
      {result.before.findings.length === 0 ? (
        <p className="mt-2 text-[12px] text-fg-2">Nothing embedded — the file was already clean.</p>
      ) : (
        <ul className="mt-2.5 space-y-1.5">
          {result.before.findings.map((f, i) => (
            <li key={i} className="text-[12px] leading-snug">
              <span className="text-fg">{f.label}</span>
              {f.bytes > 0 && <span className="ml-2 font-mono text-[10px] text-fg-3">{formatBytes(f.bytes)}</span>}
              {f.detail && <span className="mt-0.5 block text-[11px] text-fg-3">{f.detail}</span>}
            </li>
          ))}
        </ul>
      )}

      {tags.length > 0 && (
        <>
          <h4 className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-flag">decoded values</h4>
          <dl className="mt-2 space-y-1">
            {tags.map(([key, value]) => (
              <div key={key} className="flex gap-3 text-[11px]">
                <dt className="w-28 shrink-0 text-fg-3">{key}</dt>
                <dd className="min-w-0 flex-1 truncate font-mono text-fg-2" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <h4 className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-acid">after the pass</h4>
      <dl className="mt-2.5 space-y-1.5">
        <Row label="blocks" before={String(result.before.findings.length)} after={String(result.after.findings.length)} />
        <Row label="size" before={formatBytes(result.bytesBefore)} after={formatBytes(result.bytesAfter)} />
        <Row
          label="pixels"
          before={result.before.width ? `${result.before.width}×${result.before.height}` : '—'}
          after={`${result.width}×${result.height}`}
        />
        <Row label="sha-256" before={result.hashBefore.slice(0, 14)} after={result.hashAfter.slice(0, 14)} />
      </dl>

      {result.after.findings.length > 0 && (
        <p
          className={`mt-4 rounded border px-3 py-2 text-[11px] leading-relaxed ${
            result.remaining > 0 ? 'border-flag/40 bg-flag-wash text-fg-2' : 'border-line bg-bg text-fg-3'
          }`}
        >
          {result.remaining > 0 ? 'Still present: ' : 'Written back by your browser on encode: '}
          {result.after.findings.map((f) => f.label).join(', ')}.
          {result.remaining === 0 &&
            ' A colour profile carries no identifying history — every field that named you, your device or the generator is gone.'}
        </p>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-fg-3">
        This works on the file, not the picture. In-pixel watermarks such as SynthID, and statistical AI
        detectors, are unaffected by any tool of this kind.
      </p>
    </div>
  );
}

function Row({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-[11px]">
      <dt className="w-28 shrink-0 text-fg-3">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-fg-3 line-through">{before}</span>
        <span className="text-fg-3">→</span>
        <span className="truncate text-acid">{after}</span>
      </dd>
    </div>
  );
}
