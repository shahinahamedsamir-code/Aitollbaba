import type { Metadata } from 'next';
import Compressor from '@/components/Compressor';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import RelatedTools from '@/components/RelatedTools';
import { OG_IMAGE, SITE } from '@/lib/site';
import { SIZE_PRESETS } from '@/lib/compress';

export const metadata: Metadata = {
  title: 'Image Compressor — hit an exact size budget',
  description:
    'Compress JPG, PNG, WebP, AVIF and HEIC to a size budget you set. The quality is searched for, not guessed, and before and after sit side by side. No upload.',
  alternates: { canonical: '/image-compressor' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/image-compressor',
    title: 'Image Compressor — hit a KB budget in your browser, free',
    description:
      'Compress images to an exact size budget without an upload. Quality is searched for, not guessed.',
  },
};

const STEPS = [
  {
    code: 'decode',
    title: 'Decode once',
    body: 'The file is read from your disk with the File API and decoded to pixels a single time, with EXIF orientation baked in so a phone photo stays the right way up.',
  },
  {
    code: 'search',
    title: 'Search for the quality',
    body: 'Rather than guessing a number, the encoder is run repeatedly — a binary search between quality 35 and 95 — to find the highest setting whose output still fits your budget.',
  },
  {
    code: 'shrink',
    title: 'Scale only if it has to',
    body: 'If no quality reaches the budget, the image is scaled down 20% and the search runs again, down to a floor of 320px on the long edge. Resolution is spent last, not first.',
  },
  {
    code: 'compare',
    title: 'Show both',
    body: 'The original and the result are rendered at the same size next to each other, with the quality it settled on and how many encodes it took. A percentage alone tells you nothing about the picture.',
  },
];

const FAQ: [string, string][] = [
  [
    'How do I compress an image to a specific size?',
    'Pick the budget — 100 KB, 500 KB, 1 MB and so on — and drop the file in. The tool encodes the image over and over at different quality settings until it finds the highest quality whose output still fits under that number, so you get the best-looking file that meets the limit rather than an arbitrary one that happens to be small enough.',
  ],
  [
    'Are my images uploaded to a server?',
    'No. There is no upload endpoint on this site. The file is read into your browser’s memory, decoded and re-encoded by JavaScript on your own machine, and released when you close the tab. Load the page once and you can disconnect entirely — it keeps working.',
  ],
  [
    'What if it cannot reach my budget?',
    'It tells you, on that file, instead of quietly handing back something over the limit. When even the lowest usable quality is too big, the image is scaled down and tried again; if it still cannot get there without shrinking below 320px on the long edge, it stops and hands you the smallest honest encode with an “over budget” marker.',
  ],
  [
    'Which format should I choose?',
    'WebP is the smallest for the same visual quality and is supported everywhere that matters now. JPEG is the safest if something old has to read the file. PNG is lossless, so it has no quality dial at all — it can only get smaller by being resized, which is why a size budget cannot be set in PNG.',
  ],
  [
    'Does compressing lose quality?',
    'JPEG and WebP are lossy, so yes — that is what makes the file smaller. How much is up to you: the tool shows the quality it settled on and puts the result next to the original so you can see the cost before you save. PNG output is lossless and loses nothing.',
  ],
  [
    'Does this remove metadata too?',
    'Yes, as a side effect. Compressing re-encodes the image through a canvas, and a canvas holds pixels and nothing else — so EXIF, GPS, XMP, IPTC and C2PA all get left behind. If that is what you are actually after, use the AI label remover instead: it does the same thing but reports what was in the file first.',
  ],
  [
    'How many images at once?',
    'Twenty per batch, up to 25 MB each, with no daily cap. They come back individually or as one ZIP. The work happens on your own CPU, so your machine is the only limit.',
  ],
  [
    'Is it free?',
    'Yes. It is static files plus browser JavaScript — there is no account, no tier and nothing to buy.',
  ],
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Image Compressor',
        alternateName: [
          'Aitoollbaba Image Compressor',
          'Compress image to KB',
          'Reduce image size',
          'Compress image to 100KB',
          'Reduce photo size online',
          'Compress JPEG online',
        ],
        url: `${SITE}/image-compressor`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'Compress to an exact KB or MB budget',
          'Quality found by search rather than guessed',
          'Automatic downscaling only when the budget demands it',
          'Before and after shown side by side',
          'JPEG, PNG and WebP output',
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
            name: 'Image Compressor',
            item: `${SITE}/image-compressor`,
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
              <span className="text-acid">image compressor</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-x-16 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free image compressor · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.9rem]">
                  Name a size.
                  <br />
                  <span className="text-fg-3">It finds the quality</span>
                  <br />
                  <span className="text-fg-3">that fits.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows,
                  which puts the layout back side by side. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pl-4">
                <Compressor />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  Most compressors hand you a slider and let you guess. This one takes the number you
                  actually have to meet — 200 KB, 1 MB, whatever the form demands — and searches for
                  the highest quality that lands under it. Then it shows you both files side by side.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'bytes uploaded'],
                    ['20', 'files per batch'],
                    ['7', 'encodes per search'],
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

        {/* ========================================================= budgets */}
        <section id="budgets" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the budgets</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              The limits people are usually handed.
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-2">
              Almost nobody wants &ldquo;smaller&rdquo;. They want under a number somebody else picked
              — an upload form, an email server, a page-speed budget. These are the ones that come up.
            </p>

            <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {SIZE_PRESETS.map((preset) => (
                <li key={preset.kb} className="bg-bg p-6">
                  <span className="font-display text-xl font-semibold text-acid">{preset.label}</span>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-2">{preset.note}</p>
                </li>
              ))}
            </ul>
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
              Compression is a trade, not magic.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                [
                  'It cannot add detail back',
                  'Once a file has been compressed, the discarded detail is gone. Always compress from your original export, never from a copy that has already been through this or anything like it.',
                ],
                [
                  'It cannot beat physics on a huge photo',
                  'A 6000px photograph will not reach 100 KB while staying 6000px. When the budget is impossible at full size, the image gets scaled — and the tool says so rather than pretending.',
                ],
                [
                  'PNG has no quality dial',
                  'A lossless format cannot be talked down to a size target. PNG output only shrinks by being resized, so size budgets are offered in JPEG and WebP.',
                ],
                [
                  'It is not a metadata report',
                  'Re-encoding does strip EXIF, GPS and C2PA, but this tool never tells you what was there. If knowing matters, run the file through the AI label remover instead.',
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
              Compressing images, answered.
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

        <RelatedTools slug="image-compressor" />

        {/* ============================================================= cta */}
        <section className="halo relative overflow-hidden">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
            <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Get it under the limit.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Drop a file in, pick the number you have to meet, and see what it costs.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                compress an image
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
