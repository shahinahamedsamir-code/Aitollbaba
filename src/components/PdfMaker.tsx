'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACCEPTED, MAX_BATCH, MAX_BYTES, formatBytes } from '@/lib/clean';
import {
  DEFAULT_PDF,
  PAGE_SIZES,
  buildPdf,
  pdfFileName,
  prepareImage,
  type PdfOptions,
  type PreparedImage,
} from '@/lib/pdf';

type Status = 'ready' | 'working' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  status: Status;
  error?: string;
  prepared?: PreparedImage;
  previewUrl?: string;
}

export default function PdfMaker() {
  const [items, setItems] = useState<Item[]>([]);
  const [options, setOptions] = useState<PdfOptions>(DEFAULT_PDF);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [building, setBuilding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);
  const itemsRef = useRef<Item[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const run = useCallback(async (item: Item, opts: PdfOptions) => {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'working' } : x)));
    try {
      const prepared = await prepareImage(item.file, opts.quality);
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: 'done', prepared } : x)));
    } catch (e) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === item.id
            ? { ...x, status: 'error', error: e instanceof Error ? e.message : 'Failed' }
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
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        status: 'ready',
        previewUrl: url,
      });
    }

    const room = MAX_BATCH - itemsRef.current.length;
    if (accepted.length > room) problems.push(`${MAX_BATCH} pages at a time — the rest were skipped`);
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
  const update = (next: PdfOptions) => {
    setOptions(next);
    // Only the quality dial changes what preparing produces; page geometry is
    // applied when the PDF is written, so it does not invalidate the pages.
    if (next.quality !== options.quality) setDirty(true);
  };

  const prepareAll = (force = false) => {
    const opts = options;
    const reset = itemsRef.current.map((x) =>
      x.status === 'done' && !dirty && !force
        ? x
        : { ...x, status: 'ready' as Status, prepared: undefined, error: undefined },
    );
    setItems(reset);
    setDirty(false);
    reset.filter((x) => x.status === 'ready').forEach((item) => void run(item, opts));
  };

  const move = (index: number, by: number) => {
    setItems((prev) => {
      const next = [...prev];
      const to = index + by;
      if (to < 0 || to >= next.length) return prev;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  };

  const stats = useMemo(() => {
    const done = items.filter((x) => x.prepared);
    return {
      done: done.length,
      working: items.some((x) => x.status === 'working'),
      pending: items.filter(
        (x) => x.status === 'ready' || x.status === 'error' || (dirty && x.status === 'done'),
      ).length,
      untouched: done.filter((x) => x.prepared!.embeddedAsIs).length,
      reencoded: done.filter((x) => !x.prepared!.embeddedAsIs).length,
      bytes: done.reduce((sum, x) => sum + x.prepared!.bytes.length, 0),
    };
  }, [items, dirty]);

  const savePdf = () => {
    const pages = items.filter((x) => x.prepared).map((x) => x.prepared!);
    if (!pages.length) return;
    setBuilding(true);
    try {
      const blob = buildPdf(pages, options);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFileName(pages);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not write the PDF.');
    } finally {
      setBuilding(false);
    }
  };

  const matchMode = options.pageSize === 'match';

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
          pdf
          {stats.working
            ? ' — working…'
            : stats.done
              ? ` — ${stats.done} page${stats.done === 1 ? '' : 's'}`
              : items.length
                ? ` — ${items.length} ready`
                : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">
          {PAGE_SIZES.find((p) => p.value === options.pageSize)?.label}
          {!matchMode && ` · ${options.marginMm}mm`}
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
          aria-label="Choose images to put in a PDF"
          className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-6 text-center transition-colors ${
            items.length ? 'py-6' : 'py-14 sm:py-16'
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
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5" />
            </svg>
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {items.length ? 'Add more pages' : 'Drop images to make a PDF'}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-fg-3">click · drag · or press ctrl+V</p>
          {!items.length && (
            <p className="mt-5 font-mono text-[10px] tracking-wider text-fg-3/70">
              JPG · PNG · WEBP · AVIF · HEIC — up to {MAX_BATCH} pages
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
          <div className="border-b border-line px-3.5 py-3">
            <span className="font-mono text-[11px] text-fg-3">page size</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PAGE_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => update({ ...options, pageSize: size.value })}
                  aria-pressed={options.pageSize === size.value}
                  title={size.note}
                  className={`rounded px-3 py-1 font-mono text-[11px] transition-colors ${
                    options.pageSize === size.value
                      ? 'bg-acid text-acid-ink'
                      : 'border border-line text-fg-2 hover:border-acid/40 hover:text-fg'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-x-5 gap-y-3 px-3.5 py-3 sm:grid-cols-2">
            {!matchMode && (
              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">orientation</span>
                <select
                  value={options.orientation}
                  onChange={(e) =>
                    update({ ...options, orientation: e.target.value as PdfOptions['orientation'] })
                  }
                  className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
                >
                  <option value="auto">follow each image</option>
                  <option value="portrait">portrait</option>
                  <option value="landscape">landscape</option>
                </select>
              </label>
            )}

            {!matchMode && (
              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">margin</span>
                <span className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={options.marginMm}
                    onChange={(e) => update({ ...options, marginMm: Number(e.target.value) })}
                    className="w-20"
                  />
                  <span className="w-12 font-mono text-[11px] text-fg-2">{options.marginMm} mm</span>
                </span>
              </label>
            )}

            <label className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-fg-3">re-encode quality</span>
              <span className="flex items-center gap-2">
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.02}
                  value={options.quality}
                  onChange={(e) => update({ ...options, quality: Number(e.target.value) })}
                  className="w-20"
                />
                <span className="w-9 font-mono text-[11px] text-fg-2">
                  {Math.round(options.quality * 100)}%
                </span>
              </span>
            </label>
          </div>

          <p className="border-t border-line px-3.5 py-2 font-mono text-[10px] leading-relaxed text-fg-3">
            {matchMode
              ? 'Each page takes the shape of its own picture, with no border — the longest side is sized to A4’s longest side so it stays printable.'
              : 'Every picture is fitted inside the margins and centred. Nothing is cropped.'}{' '}
            A JPEG goes into the PDF exactly as it is, so the quality dial only affects files that
            have to be converted first — PNGs, HEICs and progressive JPEGs.
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
              onClick={() => prepareAll(stats.pending === 0)}
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
                  ? `prepare ${stats.pending} page${stats.pending === 1 ? '' : 's'}`
                  : 'prepare again'}
            </button>

            {stats.done > 0 && !stats.working && (
              <button
                onClick={savePdf}
                disabled={building || stats.pending > 0}
                className="rounded-md bg-acid px-5 py-2.5 font-mono text-[12px] font-medium text-acid-ink transition-colors hover:bg-fg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {building ? 'writing…' : `save PDF (${stats.done} page${stats.done === 1 ? '' : 's'})`}
              </button>
            )}

            {!stats.working && stats.pending > 0 && (
              <span className="font-mono text-[11px] text-fg-3">nothing has been touched yet</span>
            )}
          </div>
        )}

        {/* ------------------------------------------------------- results */}
        {items.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
              <span className="font-mono text-[11px] text-fg-3">
                {stats.done}/{items.length} prepared
                {stats.untouched > 0 && (
                  <>
                    {' · '}
                    <span className="text-acid">{stats.untouched} embedded untouched</span>
                  </>
                )}
                {stats.reencoded > 0 && ` · ${stats.reencoded} converted`}
              </span>
              <button
                onClick={() => {
                  setItems([]);
                  setNotice(null);
                }}
                className="rounded border border-line px-3 py-1.5 font-mono text-[11px] text-fg-3 transition-colors hover:border-flag hover:text-flag"
              >
                clear
              </button>
            </div>

            <ol className="mt-3 space-y-2">
              {items.map((item, i) => (
                <li key={item.id} className="rise overflow-hidden rounded-lg border border-line bg-bg">
                  <div className="flex items-center gap-3 p-3">
                    <span className="w-6 shrink-0 text-center font-mono text-[11px] text-fg-3">
                      {i + 1}
                    </span>
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded border border-line bg-raised">
                      {item.previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[12px] text-fg">{item.file.name}</p>
                      {item.status === 'error' ? (
                        <p className="mt-1 text-[11px] text-flag">{item.error}</p>
                      ) : item.prepared ? (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px]">
                          <span className="text-fg-3">
                            {item.prepared.width}×{item.prepared.height}
                          </span>
                          <span className="text-line-2">·</span>
                          <span className="text-fg-3">{formatBytes(item.prepared.bytes.length)}</span>
                          {item.prepared.embeddedAsIs ? (
                            <span className="rounded bg-acid-wash px-1.5 py-0.5 text-acid">
                              embedded as-is
                            </span>
                          ) : (
                            <span className="rounded bg-raised px-1.5 py-0.5 text-fg-3">
                              converted — {item.prepared.reason}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="mt-1 font-mono text-[10px] text-fg-3">
                          {item.status === 'working' ? 'preparing…' : 'ready — press prepare'}
                        </p>
                      )}
                    </div>

                    {/* Page order is the whole point of a multi-page document,
                        so it is adjustable without a drag interaction. */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label={`Move ${item.file.name} earlier`}
                        className="rounded border border-line px-2 py-1 font-mono text-[11px] text-fg-3 transition-colors hover:border-acid hover:text-acid disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === items.length - 1}
                        aria-label={`Move ${item.file.name} later`}
                        className="rounded border border-line px-2 py-1 font-mono text-[11px] text-fg-3 transition-colors hover:border-acid hover:text-acid disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        ↓
                      </button>
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
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
