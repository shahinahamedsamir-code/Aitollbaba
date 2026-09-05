'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCEPTED, MAX_BYTES, formatBytes } from '@/lib/clean';
import {
  ALWAYS_TRUE,
  VERDICT_TONE,
  checkProvenance,
  type ProvenanceReport,
  type Signal,
} from '@/lib/provenance';

export default function AiChecker() {
  const [report, setReport] = useState<ProvenanceReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const created = urls.current;
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const check = useCallback(async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      if (file.size > MAX_BYTES) throw new Error(`That file is over ${formatBytes(MAX_BYTES)}.`);
      const result = await checkProvenance(file);
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      setPreviewUrl(url);
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files?.[0];
      if (file) void check(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [check]);

  const tone = report ? VERDICT_TONE[report.verdict] : 'neutral';
  const toneClass =
    tone === 'ai'
      ? 'border-flag/40 bg-flag-wash'
      : tone === 'camera'
        ? 'border-acid/30 bg-acid-wash'
        : 'border-line bg-bg';
  const toneText = tone === 'ai' ? 'text-flag' : tone === 'camera' ? 'text-acid' : 'text-fg-2';

  const aiSignals = report?.signals.filter((s) => s.side === 'ai') ?? [];
  const cameraSignals = report?.signals.filter((s) => s.side === 'camera') ?? [];
  const editSignals = report?.signals.filter((s) => s.side === 'edit') ?? [];

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
          provenance{busy ? ' — reading…' : report ? ` — ${report.signals.length} signals` : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">reads the file, not the picture</span>
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
            if (file) void check(file);
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
          aria-label="Choose an image to check"
          className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-6 text-center transition-colors ${
            report ? 'py-6' : 'py-14 sm:py-16'
          } ${dragging ? 'border-acid bg-acid-wash' : 'border-line-2 bg-bg hover:border-acid/60 hover:bg-raised'} ${
            busy ? 'scanline' : ''
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
              <path d="M12 3 4 6.4v5.2c0 4.5 3.2 8.2 8 9.4 4.8-1.2 8-4.9 8-9.4V6.4L12 3z" />
              <path d="M12 8v4M12 15.5v.5" />
            </svg>
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight">
            {report ? 'Check another image' : 'Drop an image to read its receipt'}
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
              if (file) void check(file);
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
            {/* ---------------------------------------------------- verdict */}
            <div className={`mt-4 rounded-lg border p-4 ${toneClass}`}>
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-line bg-raised">
                  {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-display text-[17px] font-semibold leading-snug ${toneText}`}>
                    {report.headline}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] text-fg-3">
                    {report.file.name} · {report.file.format.toUpperCase()} · {report.file.width}×
                    {report.file.height}
                  </p>
                </div>
              </div>

              {report.generators.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {report.generators.map((g) => (
                    <span
                      key={g}
                      className="rounded border border-flag/40 bg-bg px-2 py-0.5 font-mono text-[10px] text-flag"
                    >
                      {g}
                    </span>
                  ))}
                </p>
              )}

              <p className="mt-3 text-[12.5px] leading-relaxed text-fg-2">{report.caveat}</p>
            </div>

            {/* ---------------------------------------------------- signals */}
            {aiSignals.length > 0 && (
              <SignalGroup
                title="points to AI"
                tone="flag"
                signals={aiSignals}
                empty="Nothing in the file names a generator."
              />
            )}
            {cameraSignals.length > 0 && (
              <SignalGroup
                title="points to a camera"
                tone="acid"
                signals={cameraSignals}
                empty="No camera fields."
              />
            )}
            {editSignals.length > 0 && (
              <SignalGroup title="editing" tone="muted" signals={editSignals} empty="" />
            )}

            {report.signals.length === 0 && (
              <p className="mt-3 rounded-lg border border-line bg-bg px-3.5 py-3 text-[12.5px] leading-relaxed text-fg-2">
                The file carries no signals at all — no camera fields, no generator tags, nothing.
                That is the normal state for an image that has been through a social platform, and it
                is also exactly what a metadata cleaner leaves behind.
              </p>
            )}

            {/* The line that must never be missing from a verdict. */}
            <p className="mt-4 rounded-lg border border-line-2 bg-bg px-3.5 py-3 text-[12px] leading-relaxed text-fg-3">
              <span className="text-fg-2">How to read this. </span>
              {ALWAYS_TRUE} A file with no declaration is not proof that a picture is real, and a
              camera&rsquo;s fields can be edited by anyone who wants to.
            </p>

            <p className="mt-3 font-mono text-[10px] leading-relaxed text-fg-3">
              Want every tag rather than a verdict? The{' '}
              <a href="/exif-viewer" className="underline underline-offset-2 hover:text-acid">
                EXIF viewer
              </a>{' '}
              prints all {report.file.ifds.reduce((n, i) => n + i.entries.length, 0) || 0} of them.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SignalGroup({
  title,
  tone,
  signals,
}: {
  title: string;
  tone: 'flag' | 'acid' | 'muted';
  signals: Signal[];
  empty: string;
}) {
  const colour = tone === 'flag' ? 'text-flag' : tone === 'acid' ? 'text-acid' : 'text-fg-3';
  return (
    <div className="mt-4">
      <h3 className={`font-mono text-[10px] uppercase tracking-[0.14em] ${colour}`}>{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {signals.map((s, i) => (
          <li key={i} className="rounded-lg border border-line bg-bg px-3.5 py-2.5">
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-[13px] font-medium text-fg">{s.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] ${
                  s.strength === 'strong' ? 'bg-raised text-fg-2' : 'bg-raised text-fg-3'
                }`}
              >
                {s.strength === 'strong' ? 'a declaration' : 'suggestive only'}
              </span>
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-fg-2">{s.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
