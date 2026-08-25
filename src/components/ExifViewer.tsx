'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACCEPTED, MAX_BYTES, formatBytes } from '@/lib/clean';
import { countTags, readMetadata, reportToJson, type ExifReport } from '@/lib/exif';
import { KIND_LABEL, type Finding, type MetaKind } from '@/lib/scan';

/** Blocks that name you, your device or the generator get the alert colour. */
const IDENTIFYING: MetaKind[] = ['exif', 'gps', 'c2pa', 'ai', 'sd', 'xmp', 'iptc', 'thumbnail', 'comment'];

/** Tags worth pulling to the top, because they are the ones that identify you. */
const SENSITIVE = new Set([
  'Make',
  'Model',
  'Software',
  'Artist',
  'Copyright',
  'BodySerialNumber',
  'LensSerialNumber',
  'CameraSerialNumber',
  'OwnerName',
  'ImageUniqueID',
  'DateTimeOriginal',
  'CreateDate',
  'ModifyDate',
  'XPAuthor',
  'XPComment',
  'UserComment',
]);

type Status = 'idle' | 'reading' | 'done' | 'error';

export default function ExifViewer() {
  const [report, setReport] = useState<ExifReport | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState('');
  const [openText, setOpenText] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const read = useCallback(async (file: File) => {
    setStatus('reading');
    setError(null);
    setFilter('');
    setOpenText(null);
    try {
      if (file.size > MAX_BYTES) throw new Error(`That file is over ${formatBytes(MAX_BYTES)}.`);
      const result = await readMetadata(file);
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      setPreviewUrl(url);
      setReport(result);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files?.[0];
      if (file) void read(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [read]);

  const tagCount = report ? countTags(report) : 0;

  const filtered = useMemo(() => {
    if (!report) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return report.ifds;
    return report.ifds
      .map((ifd) => ({
        name: ifd.name,
        entries: ifd.entries.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.value.toLowerCase().includes(q) ||
            e.idHex.includes(q),
        ),
      }))
      .filter((ifd) => ifd.entries.length > 0);
  }, [report, filter]);

  const saveJson = () => {
    if (!report) return;
    const blob = new Blob([reportToJson(report)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\.[^.]+$/, '')}-metadata.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

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
          inspector
          {status === 'reading'
            ? ' — reading…'
            : report
              ? ` — ${tagCount} tags`
              : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">read-only · nothing is written</span>
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
            if (file) void read(file);
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
          aria-label="Choose an image to inspect"
          className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-6 text-center transition-colors ${
            report ? 'py-6' : 'py-14 sm:py-16'
          } ${dragging ? 'border-acid bg-acid-wash' : 'border-line-2 bg-bg hover:border-acid/60 hover:bg-raised'} ${
            status === 'reading' ? 'scanline' : ''
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
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="2.8" />
            </svg>
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {report ? 'Inspect another file' : 'Drop an image to read it'}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-fg-3">click · drag · or press ctrl+V</p>
          {!report && (
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
              if (file) void read(file);
              e.target.value = '';
            }}
          />
        </div>

        {error && (
          <p className="mt-3 rounded border border-flag/40 bg-flag-wash px-3 py-2 font-mono text-[11px] text-flag">
            {error}
          </p>
        )}

        {report && (
          <>
            {/* --------------------------------------------------- summary */}
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-bg p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-line bg-raised">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] text-fg">{report.name}</p>
                <p className="mt-1 font-mono text-[10px] text-fg-3">
                  {report.format.toUpperCase()} · {report.width}×{report.height} ·{' '}
                  {formatBytes(report.bytes)}
                  {report.metadataBytes > 0 && (
                    <>
                      {' · '}
                      <span className="text-flag">{formatBytes(report.metadataBytes)} of metadata</span>
                    </>
                  )}
                </p>
                <p className="mt-1 truncate font-mono text-[10px] text-fg-3" title={report.sha256}>
                  sha-256 {report.sha256.slice(0, 32)}…
                </p>
              </div>
              <button
                onClick={saveJson}
                className="shrink-0 rounded border border-line px-2.5 py-1.5 font-mono text-[10px] text-fg-3 transition-colors hover:border-acid hover:text-acid"
              >
                save JSON
              </button>
            </div>

            {report.empty && (
              <p className="mt-3 rounded border border-line bg-bg px-3 py-2.5 text-[12px] leading-relaxed text-fg-2">
                Nothing embedded. No EXIF, no GPS, no XMP, no text chunks — this file carries the
                picture and nothing else. That is what an image looks like after a cleaner has been
                through it, or straight out of a tool that never wrote any.
              </p>
            )}

            {/* ---------------------------------------------------- blocks */}
            {report.findings.length > 0 && (
              <div className="mt-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-3">
                  blocks in the container
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {report.findings.map((f, i) => (
                    <li key={i} className="flex items-baseline gap-2.5 text-[12px] leading-snug">
                      <Chip finding={f} />
                      <span className="min-w-0 flex-1">
                        <span className="text-fg">{f.label}</span>
                        {f.detail && <span className="mt-0.5 block text-[11px] text-fg-3">{f.detail}</span>}
                      </span>
                      {f.bytes > 0 && (
                        <span className="shrink-0 font-mono text-[10px] text-fg-3">
                          {formatBytes(f.bytes)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ------------------------------------------------------- GPS */}
            {report.gps && (
              <div className="mt-4 rounded-lg border border-flag/40 bg-flag-wash p-3.5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-flag">
                  this file knows where it was taken
                </h3>
                <p className="mt-2 font-mono text-[15px] text-fg">
                  {report.gps.lat.toFixed(6)}, {report.gps.lon.toFixed(6)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-fg-2">
                  {report.gps.latDms} · {report.gps.lonDms}
                </p>
                <dl className="mt-2.5 space-y-1">
                  {[
                    ['altitude', report.gps.altitude],
                    ['direction faced', report.gps.direction],
                    ['GPS time', report.gps.timestamp],
                    ['speed', report.gps.speed],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="flex gap-3 font-mono text-[11px]">
                        <dt className="w-28 shrink-0 text-fg-3">{k}</dt>
                        <dd className="text-fg-2">{v}</dd>
                      </div>
                    ))}
                </dl>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      void navigator.clipboard?.writeText(`${report.gps!.lat}, ${report.gps!.lon}`)
                    }
                    className="rounded border border-line-2 px-2.5 py-1 font-mono text-[10px] text-fg-2 transition-colors hover:border-acid hover:text-acid"
                  >
                    copy coordinates
                  </button>
                  {/* Deliberately links rather than an embedded map: a map tile
                      would send these coordinates to a third party on load, and
                      this site does not make requests you did not ask for. */}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${report.gps.lat}&mlon=${report.gps.lon}#map=16/${report.gps.lat}/${report.gps.lon}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded border border-line-2 px-2.5 py-1 font-mono text-[10px] text-fg-2 transition-colors hover:border-acid hover:text-acid"
                  >
                    open in OpenStreetMap ↗
                  </a>
                </div>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-fg-3">
                  No map is drawn here on purpose — loading map tiles would send these coordinates to
                  someone else. That link sends them only if you click it.
                </p>
              </div>
            )}

            {/* ------------------------------------------------------ tags */}
            {report.ifds.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-3">
                    every tag ({tagCount})
                  </h3>
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="filter tags…"
                    aria-label="Filter tags"
                    className="w-40 rounded border border-line bg-bg px-2 py-1 font-mono text-[11px] text-fg outline-none placeholder:text-fg-3/60 focus:border-acid"
                  />
                </div>

                {filtered.length === 0 ? (
                  <p className="mt-2 font-mono text-[11px] text-fg-3">Nothing matches “{filter}”.</p>
                ) : (
                  filtered.map((ifd) => (
                    <div key={ifd.name} className="mt-3">
                      <h4 className="font-mono text-[10px] text-acid">{ifd.name}</h4>
                      <div className="mt-1.5 overflow-x-auto rounded-lg border border-line">
                        <table className="w-full min-w-[30rem] border-collapse text-left">
                          <tbody>
                            {ifd.entries.map((e) => {
                              const hot = SENSITIVE.has(e.name);
                              return (
                                <tr key={`${ifd.name}-${e.idHex}-${e.name}`} className="border-b border-line last:border-0">
                                  <td className="w-24 whitespace-nowrap px-2.5 py-1.5 align-top font-mono text-[10px] text-fg-3">
                                    {e.idHex}
                                  </td>
                                  <td
                                    className={`w-52 px-2.5 py-1.5 align-top font-mono text-[11px] ${
                                      hot ? 'text-flag' : 'text-fg-2'
                                    }`}
                                  >
                                    {e.name}
                                  </td>
                                  <td className="px-2.5 py-1.5 align-top text-[11.5px] text-fg">
                                    {e.value || '—'}
                                    {e.note && (
                                      <span className="mt-0.5 block font-mono text-[10px] text-fg-3">
                                        {e.note}
                                      </span>
                                    )}
                                  </td>
                                  <td className="w-24 whitespace-nowrap px-2.5 py-1.5 text-right align-top font-mono text-[10px] text-fg-3">
                                    {e.type}
                                    {e.count > 1 && `[${e.count}]`}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ------------------------------------------------ text blocks */}
            {report.texts.length > 0 && (
              <div className="mt-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-3">
                  text payloads ({report.texts.length})
                </h3>
                <ul className="mt-2 space-y-2">
                  {report.texts.map((t, i) => (
                    <li key={i} className="overflow-hidden rounded-lg border border-line bg-bg">
                      <button
                        onClick={() => setOpenText(openText === i ? null : i)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                      >
                        <span className="min-w-0 truncate font-mono text-[11px] text-fg-2">{t.label}</span>
                        <span className="shrink-0 font-mono text-[10px] text-fg-3">
                          {formatBytes(t.bytes)} · {openText === i ? 'hide' : 'show'}
                        </span>
                      </button>
                      {openText === i && (
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all border-t border-line px-3 py-2.5 font-mono text-[10.5px] leading-relaxed text-fg-2">
                          {t.text}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-fg-3">
              This tool only reads. Your file was not modified, re-encoded or written back — to get a
              cleaned copy, run it through the{' '}
              <a href="/remove-ai-label" className="text-fg-2 underline underline-offset-2 hover:text-acid">
                AI label remover
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ finding }: { finding: Finding }) {
  const hot = IDENTIFYING.includes(finding.kind);
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${
        hot ? 'bg-flag-wash text-flag' : 'bg-raised text-fg-3'
      }`}
    >
      {KIND_LABEL[finding.kind]}
    </span>
  );
}
