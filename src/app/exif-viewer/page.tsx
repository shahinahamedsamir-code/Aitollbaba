import type { Metadata } from 'next';
import ExifViewer from '@/components/ExifViewer';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'EXIF Viewer — read every tag in an image, free',
  description:
    'See exactly what an image is carrying: EXIF, GPS coordinates, camera and lens serial numbers, XMP, IPTC, C2PA and PNG prompt chunks. Read-only — the file is never modified, and nothing is uploaded.',
  alternates: { canonical: '/exif-viewer' },
  openGraph: {
    type: 'website',
    url: '/exif-viewer',
    title: 'EXIF Viewer — read every tag in an image, free',
    description:
      'Read every metadata tag in an image without changing it. No upload, no modification.',
  },
};

const FINDS = [
  {
    code: 'who',
    title: 'Who and what made it',
    body: 'Camera make and model, lens model, the software that exported it, and — on many bodies — the serial number of the exact camera and lens. That serial ties every photo you have ever published to the same device.',
  },
  {
    code: 'where',
    title: 'Where you were standing',
    body: 'Latitude and longitude to about a metre, plus altitude, the direction the camera was pointing, and the GPS clock in UTC. Phones write this by default unless you have turned it off.',
  },
  {
    code: 'when',
    title: 'When, to the second',
    body: 'Capture time, digitise time, modify time and the timezone offset. Three timestamps that disagree tell a story of their own about how a file was handled.',
  },
  {
    code: 'how',
    title: 'How it was generated',
    body: 'C2PA content credentials, the IPTC digitalSourceType field, and the PNG text chunks where Stable Diffusion interfaces store the full prompt, negative prompt, seed and model hash.',
  },
];

const FAQ: [string, string][] = [
  [
    'How do I see the EXIF data of a photo?',
    'Drop it into the tool on this page. Every directory in the file is walked and every tag is listed with its ID, type and decoded value — not just the handful most viewers show. Nothing is uploaded and nothing about the file is changed.',
  ],
  [
    'Does this modify my file?',
    'No. It is read-only by construction: the bytes are parsed in place and no canvas, re-encode or output file is involved anywhere in this tool. The file you dropped in is byte-for-byte the file you still have — the SHA-256 shown is of your original.',
  ],
  [
    'Is my photo uploaded anywhere?',
    'No. There is no upload endpoint on this site. The parser is JavaScript running in your own tab; load the page once and you can disconnect entirely and it keeps working.',
  ],
  [
    'Can it show where a photo was taken?',
    'If the file carries GPS tags, yes — decimal coordinates, degrees-minutes-seconds, altitude, compass direction and the GPS timestamp. There is deliberately no map drawn on the page, because loading map tiles would send those coordinates to a third party. There is a link you can click if you want that.',
  ],
  [
    'Why does it not show a map?',
    'Because a map would leak the thing you came here to inspect. Every tile a map loads is a request carrying your coordinates to whoever serves the tiles — which would make a privacy tool the source of the leak. The coordinates are printed instead, and the link only fires if you click it.',
  ],
  [
    'What is a camera serial number doing in my photo?',
    'Many cameras write the body and lens serial numbers into every file. It is meant for warranty and workflow, but in practice it is a persistent identifier: two photos from the same body carry the same number, which links them even if nothing else does. Those fields are highlighted here.',
  ],
  [
    'Can it read the Stable Diffusion prompt out of a PNG?',
    'Yes. Automatic1111, ComfyUI and Forge store the full prompt, negative prompt, steps, sampler, seed and model hash in PNG text chunks, and those are shown here verbatim. AVIF, HEIC and WebP are read too, wherever your browser can decode them.',
  ],
  [
    'How do I remove what it found?',
    'Use the AI label remover — it does the same scan and then hands back a cleaned copy. This tool is deliberately the read-only half, so you can look at a file without touching it.',
  ],
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'EXIF Viewer',
        alternateName: ['Aitoollbaba EXIF Viewer', 'Image metadata viewer', 'Photo GPS viewer'],
        url: `${SITE}/exif-viewer`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'Every EXIF, TIFF and GPS tag with ID, type and decoded value',
          'GPS coordinates in decimal and degrees-minutes-seconds',
          'XMP, IPTC and JPEG comment payloads shown verbatim',
          'PNG tEXt and iTXt chunks including Stable Diffusion prompts',
          'C2PA content credentials detected',
          'Export the whole report as JSON',
          'Read-only — the file is never modified',
          'Runs fully client-side — no upload',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'EXIF Viewer', item: `${SITE}/exif-viewer` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      <main id="top">
        {/* ============================================================ hero */}
        <section className="halo relative overflow-hidden border-b border-line">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
            <nav aria-label="Breadcrumb" className="mb-8 font-mono text-[11px] text-fg-3">
              <a href="/" className="transition-colors hover:text-acid">
                tools
              </a>
              <span className="mx-2 text-line-2">/</span>
              <span className="text-acid">exif viewer</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-x-14 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free EXIF viewer · read-only · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.6rem]">
                  Look inside.
                  <br />
                  <span className="text-fg-3">Change nothing.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <ExifViewer />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  Every tag in the file, with its ID, its type and what it actually means — not the
                  six fields most viewers bother with. The serial numbers and the coordinates are
                  flagged, and your file is never written to.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'bytes uploaded'],
                    ['0', 'bytes written'],
                    ['5', 'formats read'],
                  ].map(([value, label]) => (
                    <div key={label} className="bg-bg px-4 py-4">
                      <dt className="font-display text-2xl font-semibold text-acid">{value}</dt>
                      <dd className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-3">
                        {label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== finds */}
        <section id="finds" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">what turns up</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Four questions a photo answers about you.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {FINDS.map((f) => (
                <div key={f.code} className="bg-bg p-7">
                  <span className="font-mono text-[11px] text-acid">{f.code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== read-only */}
        <section id="readonly" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the guarantee</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Read-only is a property of the code, not a promise.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
              <div className="bg-bg p-7">
                <span className="font-mono text-[11px] text-acid">what this tool does</span>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">
                  Reads the bytes into memory and parses the container structure in place. There is no
                  canvas, no re-encode and no output file anywhere in this tool&rsquo;s code path — the
                  only file operation is reading. The SHA-256 it shows is of the file you dropped in,
                  so you can check it against your own copy.
                </p>
              </div>
              <div className="bg-bg p-7">
                <span className="font-mono text-[11px] text-flag">why no map</span>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">
                  Drawing a map would request tiles from a tile server, and every one of those requests
                  carries the coordinates you came here to inspect. A privacy tool that leaks the thing
                  it is inspecting is worse than useless, so the coordinates are printed and the map
                  link only fires if you decide to click it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= faq */}
        <section id="faq" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">questions</h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Reading metadata, answered.
            </p>

            <div className="mt-9 divide-y divide-line border-y border-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] font-medium leading-snug">
                    {q}
                    <span
                      className="mt-1 shrink-0 font-mono text-fg-3 transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-fg-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================= cta */}
        <section className="halo relative overflow-hidden">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
            <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              See it before you decide.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Look first here, then clean it next door if you do not like what is in there.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                inspect a file
              </a>
              <a
                href="/remove-ai-label"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                clean it instead →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
