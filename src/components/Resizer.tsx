'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACCEPTED, MAX_BATCH, MAX_BYTES, formatBytes } from '@/lib/clean';
import {
  DEFAULT_RESIZE,
  FITS,
  MATTES,
  PRESETS,
  TRANSPARENT,
  presetGroups,
  resizeFile,
  type ResizeOptions,
  type ResizeResult,
} from '@/lib/resize';
import { makeZip } from '@/lib/zip';

type Status = 'ready' | 'working' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  status: Status;
  error?: string;
  result?: ResizeResult;
  outputUrl?: string;
}

const HANDLING_LABEL: Record<ResizeResult['handling'], string> = {
  none: '',
  cropped: 'cropped to fit',
  padded: 'padded',
  stretched: 'stretched',
};

export default function Resizer() {
  const [items, setItems] = useState<Item[]>([]);
  const [options, setOptions] = useState<ResizeOptions>(DEFAULT_RESIZE);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const itemsRef = useRef<Item[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const run = useCallback(async (item: Item, opts: ResizeOptions) => {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'working' } : x)));
    try {
      const result = await resizeFile(item.file, opts);
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

  const addFiles = useCallback((list: FileList | File[]) => {
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
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  /** Settings only change the settings; the button is what touches a file. */
  const update = (next: ResizeOptions) => {
    setOptions(next);
    setDirty(true);
  };

  const runAll = (force = false) => {
    const opts = options;
    const reset = itemsRef.current.map((x) =>
      x.status === 'done' && !dirty && !force
        ? x
        : { ...x, status: 'ready' as Status, result: undefined, error: undefined, outputUrl: undefined },
    );
    setItems(reset);
    setDirty(false);
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
      saveBlob(zip, 'resized-images.zip');
    } finally {
      setZipping(false);
    }
  };

  const stats = useMemo(() => {
    const done = items.filter((x) => x.result);
    return {
      done: done.length,
      working: items.some((x) => x.status === 'working'),
      pending: items.filter(
        (x) => x.status === 'ready' || x.status === 'error' || (dirty && x.status === 'done'),
      ).length,
      bytesBefore: done.reduce((sum, x) => sum + x.result!.bytesBefore, 0),
      bytesAfter: done.reduce((sum, x) => sum + x.result!.bytesAfter, 0),
      upscaled: done.filter((x) => x.result!.upscaled).length,
      cropped: done.filter((x) => x.result!.handling === 'cropped').length,
    };
  }, [items, dirty]);

  const preset = PRESETS.find((p) => p.id === options.presetId) ?? PRESETS[0];
  const presetMode = options.mode === 'preset';
  // With the aspect locked in custom mode nothing can be cropped or padded,
  // so the fit and matte controls have nothing to decide.
  const shapeMayDiffer = presetMode || !options.lockAspect;
  const lossless = options.format === 'image/png';
  const fitInfo = FITS.find((f) => f.value === options.fit);

  const targetLabel = presetMode
    ? `${preset.width}×${preset.height}`
    : options.lockAspect
      ? options.width > 0
        ? `${options.width}px wide`
        : options.height > 0
          ? `${options.height}px tall`
          : 'original size'
      : `${options.width || '?'}×${options.height || '?'}`;

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
          resizer
          {stats.working
            ? ' — working…'
            : stats.done
              ? ` — ${stats.done} resized`
              : items.length
                ? ` — ${items.length} ready`
                : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">{targetLabel}</span>
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
          aria-label="Choose images to resize"
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
              <path d="M4 4h9v9H4zM11 11h9v9h-9zM13 4h7v7" />
            </svg>
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {items.length ? 'Add more images' : 'Drop an image to resize it'}
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
          <div className="flex items-center gap-3 border-b border-line px-3.5 py-2.5">
            <span className="font-mono text-[11px] text-fg-3">size from</span>
            <div className="flex overflow-hidden rounded border border-line">
              {(
                [
                  ['preset', 'a preset'],
                  ['custom', 'my numbers'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => update({ ...options, mode })}
                  aria-pressed={options.mode === mode}
                  className={`px-3 py-1 font-mono text-[11px] transition-colors ${
                    options.mode === mode ? 'bg-acid text-acid-ink' : 'bg-surface text-fg-3 hover:text-fg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {presetMode ? (
            <div className="max-h-52 overflow-y-auto border-b border-line px-3.5 py-3">
              {presetGroups().map(({ group, items: presets }) => (
                <div key={group} className="mb-2.5 last:mb-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-3">
                    {group}
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {presets.map((p) => {
                      const active = options.presetId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => update({ ...options, presetId: p.id })}
                          aria-pressed={active}
                          title={`${p.width} × ${p.height}`}
                          className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
                            active
                              ? 'bg-acid text-acid-ink'
                              : 'border border-line text-fg-2 hover:border-acid/40 hover:text-fg'
                          }`}
                        >
                          {p.label}
                          <span className={active ? 'ml-1.5 opacity-70' : 'ml-1.5 text-fg-3'}>
                            {p.width}×{p.height}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-b border-line px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-fg-3">width</span>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={options.width || ''}
                    placeholder="auto"
                    onChange={(e) => update({ ...options, width: Number(e.target.value) || 0 })}
                    className="w-20 rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-fg-3">height</span>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={options.height || ''}
                    placeholder={options.lockAspect && options.width > 0 ? 'from ratio' : 'auto'}
                    disabled={options.lockAspect && options.width > 0}
                    onChange={(e) => update({ ...options, height: Number(e.target.value) || 0 })}
                    className="w-24 rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid disabled:opacity-40"
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.lockAspect}
                    onChange={(e) => update({ ...options, lockAspect: e.target.checked })}
                    className="h-3.5 w-3.5"
                  />
                  <span className="font-mono text-[11px] text-fg-3">lock aspect ratio</span>
                </label>
              </div>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-fg-3">
                {options.lockAspect
                  ? 'Locked: fill in one number and every file keeps its own proportions, so a mixed batch stays correct.'
                  : 'Unlocked: both numbers are exact, and the fit below decides what happens to the shape difference.'}
              </p>
            </div>
          )}

          <div className="grid gap-x-5 gap-y-3 px-3.5 py-3 sm:grid-cols-2">
            {shapeMayDiffer && (
              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">when the shape differs</span>
                <select
                  value={options.fit}
                  onChange={(e) => update({ ...options, fit: e.target.value as ResizeOptions['fit'] })}
                  className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
                >
                  {FITS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {shapeMayDiffer && options.fit === 'contain' && (
              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">padding</span>
                <select
                  value={options.matte}
                  onChange={(e) => update({ ...options, matte: e.target.value })}
                  className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
                >
                  {MATTES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">output format</span>
              <select
                value={options.format}
                onChange={(e) =>
                  update({ ...options, format: e.target.value as ResizeOptions['format'] })
                }
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
              >
                <option value="auto">keep original</option>
                <option value="image/jpeg">jpeg</option>
                <option value="image/webp">webp</option>
                <option value="image/png">png · lossless</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">quality</span>
              <span className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.4}
                  max={1}
                  step={0.02}
                  value={options.quality}
                  disabled={lossless}
                  onChange={(e) => update({ ...options, quality: Number(e.target.value) })}
                  className="w-24 disabled:opacity-40"
                />
                <span className="w-9 font-mono text-[11px] text-fg-2">
                  {lossless ? '—' : `${Math.round(options.quality * 100)}%`}
                </span>
              </span>
            </label>
          </div>

          <p className="border-t border-line px-3.5 py-2 font-mono text-[10px] leading-relaxed text-fg-3">
            {presetMode
              ? `${preset.group} ${preset.label} — ${preset.width} × ${preset.height}. Platform sizes change from time to time; use “my numbers” when a form asks for something else. `
              : ''}
            {shapeMayDiffer
              ? `When a picture’s shape does not match the frame it ${fitInfo?.note}.`
              : 'Every file keeps its own proportions, so nothing is cropped, padded or distorted.'}
            {options.matte === TRANSPARENT &&
              shapeMayDiffer &&
              options.fit === 'contain' &&
              ' Transparent padding needs a PNG or WebP output — a JPEG will come out white.'}
          </p>
        </div>

        {notice && (
          <p className="mt-3 rounded border border-flag/40 bg-flag-wash px-3 py-2 font-mono text-[11px] text-flag">
            {notice}
          </p>
        )}

        {/* Nothing runs until this is pressed. */}
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
                  ? `resize ${stats.pending} image${stats.pending === 1 ? '' : 's'}`
                  : 'run again'}
            </button>

            {!stats.working &&
              (dirty && stats.done > 0 ? (
                <span className="font-mono text-[11px] text-flag">
                  settings changed — press resize to apply them
                </span>
              ) : stats.pending > 0 ? (
                <span className="font-mono text-[11px] text-fg-3">nothing has been touched yet</span>
              ) : (
                <span className="font-mono text-[11px] text-fg-3">
                  save each file below, or download them all at once
                </span>
              ))}
          </div>
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
                    setNotice(null);
                  }}
                  className="rounded border border-line px-3 py-1.5 font-mono text-[11px] text-fg-3 transition-colors hover:border-flag hover:text-flag"
                >
                  clear
                </button>
              </span>
            </div>

            {stats.upscaled > 0 && (
              <p className="mt-3 rounded border border-flag/40 bg-flag-wash px-3 py-2 text-[11px] leading-relaxed text-fg-2">
                {stats.upscaled === 1 ? 'One file' : `${stats.upscaled} files`} was smaller than the target
                and had to be enlarged. Nothing can invent detail that was never captured, so expect it to
                look soft — start from a larger original where you can.
              </p>
            )}

            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rise overflow-hidden rounded-lg border border-line bg-bg">
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded border border-line bg-raised">
                      {item.outputUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.outputUrl} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-fg-3">
                          {item.status === 'error' ? '!' : '···'}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[12px] text-fg">
                        {item.result ? item.result.name : item.file.name}
                      </p>
                      {item.status === 'error' ? (
                        <p className="mt-1 text-[11px] text-flag">{item.error}</p>
                      ) : item.result ? (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px]">
                          <span className="text-fg-3 line-through">
                            {item.result.srcWidth}×{item.result.srcHeight}
                          </span>
                          <span className="text-fg-3">→</span>
                          <span className="text-acid">
                            {item.result.width}×{item.result.height}
                          </span>
                          <span className="text-line-2">·</span>
                          <span className="text-fg-3">
                            {formatBytes(item.result.bytesBefore)} → {formatBytes(item.result.bytesAfter)}
                          </span>
                          {item.result.handling !== 'none' && (
                            <span className="rounded bg-raised px-1.5 py-0.5 text-fg-3">
                              {HANDLING_LABEL[item.result.handling]}
                            </span>
                          )}
                          {item.result.upscaled && (
                            <span className="rounded bg-flag-wash px-1.5 py-0.5 text-flag">enlarged</span>
                          )}
                        </p>
                      ) : (
                        <p className="mt-1 font-mono text-[10px] text-fg-3">
                          {item.status === 'working' ? 'resizing…' : 'ready — press resize'}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.result && (
                        <button
                          onClick={() => saveBlob(item.result!.blob, item.result!.name)}
                          className="rounded bg-acid px-3 py-1.5 font-mono text-[11px] font-medium text-acid-ink transition-colors hover:bg-fg"
                        >
                          save
                        </button>
                      )}
                      <button
                        onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                        aria-label={`Remove ${item.file.name}`}
                        className="px-1 text-fg-3 transition-colors hover:text-flag"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
