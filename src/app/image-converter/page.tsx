import type { Metadata } from 'next';
import Converter from '@/components/Converter';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { TARGETS } from '@/lib/convert';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Image Converter — JPG, PNG & WebP in your browser, free',
  description:
    'Convert images to JPG, PNG or WebP without an upload. HEIC from an iPhone and AVIF are read too. Transparency is kept where the target supports it and composited onto a colour you pick where it cannot.',
  alternates: { canonical: '/image-converter' },
  openGraph: {
    type: 'website',
    url: '/image-converter',
    title: 'Image Converter — JPG, PNG & WebP in your browser, free',
    description:
      'Convert images between formats in the tab. Transparency handled properly, nothing uploaded.',
  },
};

const STEPS = [
  {
    code: 'decode',
    title: 'Decode whatever came in',
    body: 'JPG, PNG, WebP and AVIF are all read. HEIC and HEIF are read wherever your browser can decode them — always on Safari, and on Chrome and Firefox depending on the platform.',
  },
  {
    code: 'probe',
    title: 'Check what can be written',
    body: 'canvas.toBlob does not fail on a format it cannot encode — it quietly returns a PNG instead. So each target is written once on load and the result inspected, and only formats that came back as the type actually asked for are offered.',
  },
  {
    code: 'matte',
    title: 'Handle the transparency',
    body: 'The image is drawn onto a clear canvas so its alpha is still readable. Converting to JPEG then paints your chosen colour behind the picture — never over it — so clear pixels do not come back black.',
  },
  {
    code: 'encode',
    title: 'Write the new file',
    body: 'Re-encoded at your quality, renamed to the new extension, and handed straight back. PNG output is lossless, so the quality dial is switched off for it.',
  },
];

const FAQ: [string, string][] = [
  [
    'How do I convert an image without uploading it?',
    'Drop it into the tool on this page. Everything runs as JavaScript inside your own browser tab — the file is read from disk into memory, decoded, re-encoded in the format you pick and handed back. There is no upload endpoint on this site to send it to, so nothing leaves your machine.',
  ],
  [
    'Can I convert HEIC from my iPhone to JPG?',
    'Yes, wherever your browser can decode HEIC. Safari always can; Chrome and Firefox depend on the operating system. No browser can write HEIC, which is why it is an input format only — pick JPEG, PNG or WebP as the output.',
  ],
  [
    'Which format should I convert to?',
    'WebP for almost everything on the web: it is smaller than JPEG at the same visual quality and keeps transparency. JPEG when something old or picky has to read the file. PNG when you need lossless pixels or crisp transparency on flat graphics. AVIF would be smaller still, but no browser can currently encode it, so it is offered as an input format only.',
  ],
  [
    'What happens to transparency when I convert to JPEG?',
    'JPEG has no alpha channel, so it has to go somewhere. This tool composites the image onto a colour you choose — white by default — behind the picture rather than over it, which is what stops clear areas turning black. Any file this happens to is marked "transparency flattened" in the results.',
  ],
  [
    'Does converting lose quality?',
    'Going into PNG is lossless. Going into JPEG or WebP re-encodes the pixels, so there is some loss — how much is the quality dial. Note that converting an already-lossy file (a JPEG, say) into another lossy format compresses it a second time, so work from the highest-quality original you have.',
  ],
  [
    'Does it remove metadata as well?',
    'Yes, as a side effect. Everything is redrawn through a canvas, which holds pixels and nothing else, so EXIF, GPS, XMP and C2PA are all left behind. If knowing what was in there matters, run the file through the AI label remover instead — it reports every block before removing it.',
  ],
  [
    'How many images at once?',
    'Twenty per batch, up to 25 MB each, with no daily cap. They come back individually or as one ZIP.',
  ],
  [
    'Is it free?',
    'Yes. Static files plus browser JavaScript — no account, no tier, nothing to buy.',
  ],
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Image Converter',
        alternateName: [
          'Aitoollbaba Image Converter',
          'HEIC to JPG converter',
          'PNG to WebP converter',
          'JPG to PNG converter',
        ],
        url: `${SITE}/image-converter`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'Convert to JPG, PNG or WebP',
          'Read HEIC, HEIF and AVIF as input',
          'Keep transparency in PNG and WebP',
          'Composite transparency onto a chosen colour for JPEG',
          'Resize while converting',
          'Batch up to 20 images, download as one ZIP',
          'Runs fully client-side — no upload',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Image Converter',
            item: `${SITE}/image-converter`,
          },
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
              <span className="text-acid">image converter</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-x-16 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free image converter · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.9rem]">
                  Change the format.
                  <br />
                  <span className="text-fg-3">Keep everything</span>
                  <br />
                  <span className="text-fg-3">that matters.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows,
                  which puts the layout back side by side. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pl-4">
                <Converter />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  Reads JPG, PNG, WebP, AVIF and HEIC straight off an iPhone; writes JPG, PNG and
                  WebP. Transparency is carried through where the target can hold it and composited
                  onto a colour you pick where it cannot, so nothing comes back with black edges.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'bytes uploaded'],
                    ['5', 'formats read'],
                    ['20', 'files per batch'],
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

        {/* ========================================================= formats */}
        <section id="formats" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the formats</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              What each one is actually for.
            </p>

            <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {TARGETS.map((t) => (
                <li key={t.type} className="bg-bg p-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-semibold text-acid">{t.label}</span>
                    <span className="font-mono text-[10px] text-fg-3">
                      {t.alpha ? 'keeps alpha' : 'no alpha'}
                    </span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{t.note}.</p>
                </li>
              ))}
            </ul>

            <p className="mt-6 max-w-2xl text-[13.5px] leading-relaxed text-fg-3">
              HEIC, HEIF and AVIF are read but not written. No browser can encode HEIC, and none can
              encode AVIF either — every one of them decodes it, none of them writes it — so those
              three are input formats only. The tool tests the encoder on load and offers a format
              only if it actually works, which is why you will normally see three buttons, not four.
            </p>
          </div>
        </section>

        {/* ============================================================= how */}
        <section id="how" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the pipeline</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Four steps, all of them on your machine.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div key={step.code} className="bg-bg p-7">
                  <span className="font-mono text-[11px] text-acid">{step.code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================== limits */}
        <section id="limits" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-flag">
              what it will not do
            </h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              A format change is not a repair.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                [
                  'It cannot write HEIC',
                  'No browser can encode HEIC or HEIF, so they are input formats only. Anything you convert lands as JPEG, PNG, WebP or AVIF.',
                ],
                [
                  'It cannot undo earlier compression',
                  'Converting a JPEG to PNG makes a lossless copy of an already-lossy picture. The detail that JPEG threw away does not come back — the file just gets bigger.',
                ],
                [
                  'It does not animate',
                  'Animated GIF and animated WebP come out as a single still frame. This tool works one picture at a time, not a timeline.',
                ],
                [
                  'It cannot write AVIF',
                  'Every current browser decodes AVIF and none of them encodes it — ask a canvas for one and it hands back a PNG without saying so. Rather than trust that, the tool probes the encoder on load and only offers formats that genuinely came back as the type requested. If a browser ever ships AVIF encoding, the button appears on its own.',
                ],
              ].map(([title, body]) => (
                <li key={title} className="rounded-lg border border-line bg-bg p-5">
                  <h3 className="font-display text-[15px] font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================= faq */}
        <section id="faq" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">questions</h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Converting images, answered.
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
              Pick a format and go.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Drop a file in, choose what it should become, and save the result.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                convert an image
              </a>
              <a
                href="/"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                all tools →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
