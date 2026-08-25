'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ECLS,
  QrTooLongError,
  buildContact,
  buildEmail,
  buildWifi,
  encodeQr,
  normaliseLink,
  toCanvas,
  toSvg,
  type ContactFields,
  type Ecl,
  type EmailFields,
  type PayloadKind,
  type WifiFields,
} from '@/lib/qr';

const KINDS: { value: PayloadKind; label: string }[] = [
  { value: 'link', label: 'link' },
  { value: 'text', label: 'text' },
  { value: 'wifi', label: 'wi-fi' },
  { value: 'contact', label: 'contact' },
  { value: 'email', label: 'email' },
];

const PNG_SIZES = [256, 512, 1024, 2048];

/**
 * Relative luminance, so the tool can tell you when a colour pair is too close
 * to scan rather than letting you find out from a printed sticker.
 */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export default function QrMaker() {
  const [kind, setKind] = useState<PayloadKind>('link');
  const [link, setLink] = useState('aitoollbaba.com');
  const [text, setText] = useState('');
  const [wifi, setWifi] = useState<WifiFields>({
    ssid: '',
    password: '',
    security: 'WPA',
    hidden: false,
  });
  const [contact, setContact] = useState<ContactFields>({
    name: '',
    phone: '',
    email: '',
    org: '',
    url: '',
  });
  const [email, setEmail] = useState<EmailFields>({ to: '', subject: '', body: '' });

  const [ecl, setEcl] = useState<Ecl>('M');
  const [margin, setMargin] = useState(4);
  const [dark, setDark] = useState('#000000');
  const [light, setLight] = useState('#ffffff');
  const [pngSize, setPngSize] = useState(1024);
  const [showPayload, setShowPayload] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const payload = useMemo(() => {
    switch (kind) {
      case 'link':
        return normaliseLink(link);
      case 'text':
        return text;
      case 'wifi':
        return wifi.ssid ? buildWifi(wifi) : '';
      case 'contact':
        return contact.name || contact.phone || contact.email ? buildContact(contact) : '';
      case 'email':
        return email.to ? buildEmail(email) : '';
    }
  }, [kind, link, text, wifi, contact, email]);

  const encoded = useMemo(() => {
    if (!payload) return { qr: null, error: null as string | null };
    try {
      return { qr: encodeQr(payload, ecl), error: null };
    } catch (e) {
      if (e instanceof QrTooLongError) {
        return { qr: null, error: `That is ${e.bytes} bytes — more than a QR code can hold, even at level L.` };
      }
      return { qr: null, error: e instanceof Error ? e.message : 'Could not encode that.' };
    }
  }, [payload, ecl]);

  const svg = useMemo(
    () => (encoded.qr ? toSvg(encoded.qr, { margin, dark, light }) : ''),
    [encoded.qr, margin, dark, light],
  );

  const contrast = contrastRatio(dark, light);
  const lowContrast = contrast < 3;
  const inverted = luminance(dark) > luminance(light);

  const save = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = linkRef.current ?? document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const fileBase = kind === 'link' ? 'qr-link' : `qr-${kind}`;

  const downloadSvg = () => save(new Blob([svg], { type: 'image/svg+xml' }), `${fileBase}.svg`);

  const downloadPng = () => {
    if (!encoded.qr) return;
    const canvas = toCanvas(encoded.qr, pngSize, { margin, dark, light });
    canvas.toBlob((blob) => {
      if (blob) save(blob, `${fileBase}-${canvas.width}.png`);
    }, 'image/png');
  };

  const field =
    'w-full rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-[12px] text-fg outline-none placeholder:text-fg-3/60 focus:border-acid';

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
          qr{encoded.qr ? ` — version ${encoded.qr.version}` : ' — idle'}
        </span>
        <span className="ml-auto font-mono text-[11px] text-fg-3">
          {encoded.qr ? `${encoded.qr.size}×${encoded.qr.size} · ${encoded.qr.mode} · ${ecl}` : ecl}
        </span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        {/* --------------------------------------------------------- input */}
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.value}
                onClick={() => setKind(k.value)}
                aria-pressed={kind === k.value}
                className={`rounded px-3 py-1.5 font-mono text-[11px] transition-colors ${
                  kind === k.value
                    ? 'bg-acid text-acid-ink'
                    : 'border border-line text-fg-2 hover:border-acid/40 hover:text-fg'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2.5">
            {kind === 'link' && (
              <>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="aitoollbaba.com"
                  aria-label="Link"
                  className={field}
                />
                <p className="font-mono text-[10px] leading-relaxed text-fg-3">
                  The address goes into the code exactly as shown below — there is no shortener and no
                  redirect in between, so nothing counts your scans and the code cannot stop working
                  because a third party did.
                </p>
              </>
            )}

            {kind === 'text' && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Any text at all"
                aria-label="Text"
                className={`${field} resize-y`}
              />
            )}

            {kind === 'wifi' && (
              <>
                <input
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                  placeholder="network name (SSID)"
                  aria-label="Network name"
                  className={field}
                />
                <input
                  value={wifi.password}
                  onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                  placeholder="password"
                  aria-label="Wi-Fi password"
                  disabled={wifi.security === 'nopass'}
                  className={`${field} disabled:opacity-40`}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-fg-3">security</span>
                    <select
                      value={wifi.security}
                      onChange={(e) =>
                        setWifi({ ...wifi, security: e.target.value as WifiFields['security'] })
                      }
                      className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
                    >
                      <option value="WPA">WPA / WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">open</option>
                    </select>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wifi.hidden}
                      onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                      className="h-3.5 w-3.5"
                    />
                    <span className="font-mono text-[11px] text-fg-3">hidden network</span>
                  </label>
                </div>
                <p className="font-mono text-[10px] leading-relaxed text-fg-3">
                  The password is written into the code in plain text — that is how the Wi-Fi QR format
                  works, on every site that makes one. Anyone who can photograph the code has the
                  password, so put it on the wall inside, not in the window.
                </p>
              </>
            )}

            {kind === 'contact' && (
              <>
                <input
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="full name"
                  aria-label="Full name"
                  className={field}
                />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="phone"
                    aria-label="Phone"
                    className={field}
                  />
                  <input
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="email"
                    aria-label="Email"
                    className={field}
                  />
                  <input
                    value={contact.org}
                    onChange={(e) => setContact({ ...contact, org: e.target.value })}
                    placeholder="company"
                    aria-label="Company"
                    className={field}
                  />
                  <input
                    value={contact.url}
                    onChange={(e) => setContact({ ...contact, url: e.target.value })}
                    placeholder="website"
                    aria-label="Website"
                    className={field}
                  />
                </div>
                <p className="font-mono text-[10px] leading-relaxed text-fg-3">
                  Written as a vCard 3.0, which is the version phone cameras handle most consistently.
                </p>
              </>
            )}

            {kind === 'email' && (
              <>
                <input
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                  placeholder="to@example.com"
                  aria-label="Recipient"
                  className={field}
                />
                <input
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  placeholder="subject"
                  aria-label="Subject"
                  className={field}
                />
                <textarea
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  rows={3}
                  placeholder="message"
                  aria-label="Message"
                  className={`${field} resize-y`}
                />
              </>
            )}
          </div>

          {/* ------------------------------------------------------ options */}
          <div className="mt-4 rounded-lg border border-line bg-bg">
            <div className="border-b border-line px-3.5 py-3">
              <span className="font-mono text-[11px] text-fg-3">error correction</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ECLS.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => setEcl(e.value)}
                    aria-pressed={ecl === e.value}
                    title={e.note}
                    className={`rounded px-3 py-1 font-mono text-[11px] transition-colors ${
                      ecl === e.value
                        ? 'bg-acid text-acid-ink'
                        : 'border border-line text-fg-2 hover:border-acid/40 hover:text-fg'
                    }`}
                  >
                    {e.label}
                    <span className={ecl === e.value ? 'ml-1.5 opacity-70' : 'ml-1.5 text-fg-3'}>
                      {e.recovery}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-x-5 gap-y-3 px-3.5 py-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">quiet zone</span>
                <span className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="w-10 font-mono text-[11px] text-fg-2">{margin}</span>
                </span>
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">PNG size</span>
                <select
                  value={pngSize}
                  onChange={(e) => setPngSize(Number(e.target.value))}
                  className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-fg outline-none focus:border-acid"
                >
                  {PNG_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} px
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">code colour</span>
                <input
                  type="color"
                  value={dark}
                  onChange={(e) => setDark(e.target.value)}
                  aria-label="Code colour"
                  className="h-7 w-14 cursor-pointer rounded border border-line bg-surface"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-fg-3">background</span>
                <input
                  type="color"
                  value={light}
                  onChange={(e) => setLight(e.target.value)}
                  aria-label="Background colour"
                  className="h-7 w-14 cursor-pointer rounded border border-line bg-surface"
                />
              </label>
            </div>

            {(lowContrast || inverted) && (
              <p className="border-t border-flag/30 bg-flag-wash px-3.5 py-2 font-mono text-[10px] leading-relaxed text-flag">
                {lowContrast
                  ? `Contrast is ${contrast.toFixed(1)}:1 — too close for a camera to separate the modules reliably. Aim for 4:1 or better.`
                  : 'The code is lighter than its background. Many scanners assume dark-on-light and will not read an inverted code.'}
              </p>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------- preview */}
        <div className="min-w-0">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-line bg-raised p-4">
            {encoded.qr ? (
              <div
                className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                // The SVG is built by toSvg from our own numbers; nothing here
                // comes from the payload text.
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <p className="px-6 text-center font-mono text-[11px] leading-relaxed text-fg-3">
                {encoded.error ?? 'Fill in a field and the code appears here.'}
              </p>
            )}
          </div>

          {encoded.qr && (
            <>
              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
                {[
                  ['version', `${encoded.qr.version} · ${encoded.qr.size}²`],
                  ['mode', encoded.qr.mode],
                  ['capacity used', `${encoded.qr.usedCodewords}/${encoded.qr.capacityCodewords}`],
                  ['mask', String(encoded.qr.mask)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-bg px-3 py-2">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-fg-3">{k}</dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-fg-2">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={downloadSvg}
                  className="rounded-md bg-acid px-4 py-2 font-mono text-[12px] font-medium text-acid-ink transition-colors hover:bg-fg"
                >
                  save SVG
                </button>
                <button
                  onClick={downloadPng}
                  className="rounded-md border border-line-2 px-4 py-2 font-mono text-[12px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
                >
                  save PNG
                </button>
              </div>

              <button
                onClick={() => setShowPayload((v) => !v)}
                className="mt-3 font-mono text-[10px] text-fg-3 underline underline-offset-2 transition-colors hover:text-acid"
              >
                {showPayload ? 'hide' : 'show'} what this encodes
              </button>
              {showPayload && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded border border-line bg-bg px-3 py-2 font-mono text-[10px] leading-relaxed text-fg-2">
                  {payload}
                </pre>
              )}
            </>
          )}

          {/* One anchor reused for both downloads. */}
          <a ref={linkRef} className="hidden" aria-hidden />
        </div>
      </div>
    </div>
  );
}
