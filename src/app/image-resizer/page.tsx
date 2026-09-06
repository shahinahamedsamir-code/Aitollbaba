import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import RelatedTools from '@/components/RelatedTools';
import Resizer from '@/components/Resizer';
import { FITS, presetGroups } from '@/lib/resize';
import { OG_IMAGE, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Image Resizer — exact pixel sizes, free',
  description:
    'Resize to the exact dimensions a platform asks for, or your own numbers. Crop, pad or stretch is your choice, and the aspect ratio locks across a mixed batch.',
  alternates: { canonical: '/image-resizer' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/image-resizer',
    title: 'Image Resizer — exact pixel sizes in your browser, free',
    description:
      'Resize to platform presets or your own numbers, with crop and padding under your control. No upload.',
  },
};

const STEPS = [
  {
    code: 'target',
    title: 'Work out the target',
    body: 'A preset gives exact pixels. With the aspect locked in custom mode you fill in one number and every file keeps its own proportions — which is what makes a mixed batch come out right instead of all one shape.',
  },
  {
    code: 'fit',
    title: 'Resolve the shape',
    body: 'A 3:2 photograph does not go into a 1:1 post without something giving. There are three honest answers — crop, pad, or distort — and you pick, rather than the tool choosing quietly.',
  },
  {
    code: 'draw',
    title: 'Redraw at the new size',
    body: 'For a crop, the largest centred rectangle of the right shape is taken from the source and drawn straight to the target, so there is no intermediate resample to soften it.',
  },
  {
    code: 'encode',
    title: 'Write the file',
    body: 'Re-encoded at your quality and named with the size it came out at — beach-photo-1080x1080.jpg — so a folder of resized files is readable at a glance.',
  },
];

const FAQ: [string, string][] = [
  [
    'How do I resize an image to exact pixels?',
    'Pick a preset for the platform you are posting to, or switch to "my numbers" and type the width and height a form is asking for. Drop the file in and press resize — the output is exactly those pixels, and the filename carries the size so you can see it in the folder.',
  ],
  [
    'Are my images uploaded to a server?',
    'No. There is no upload endpoint on this site. The file is read into your browser’s memory, redrawn and re-encoded by JavaScript on your own machine, and released when you close the tab. Load the page once and you can disconnect entirely — it keeps working.',
  ],
  [
    'What is the difference between crop, fit and stretch?',
    'Crop to fill fills the frame exactly and cuts off whatever hangs over the edges — best for covers and thumbnails where filling the space matters more than keeping every corner. Fit inside keeps the whole picture and pads the leftover space with a colour you choose. Stretch forces the picture into the frame and distorts it, which is almost never what you want.',
  ],
  [
    'How do I resize a batch that are different shapes?',
    'Use "my numbers" with the aspect ratio locked, and fill in only the width. Each file is then scaled to that width and keeps its own height, so a mix of portrait and landscape all come out at a consistent width without any of them being cropped.',
  ],
  [
    'Can it make a small image bigger?',
    'It will, but it cannot invent detail that was never captured — an enlarged image looks soft, and no tool changes that. Files this happened to are marked "enlarged" in the results so you know before you use them.',
  ],
  [
    'Are the platform sizes up to date?',
    'They are the current common ones, but platforms move them around without much notice. If a size here disagrees with what a platform is telling you today, trust the platform and type the numbers into the custom tab.',
  ],
  [
    'Does resizing remove metadata?',
    'Yes, as a side effect. Everything is redrawn through a canvas, which holds pixels and nothing else, so EXIF, GPS, XMP and C2PA are all left behind. If knowing what was in the file matters, run it through the AI label remover instead — that one reports every block before removing it.',
  ],
  [
    'How many images at once?',
    'Twenty per batch, up to 25 MB each, with no daily cap. They come back individually or as one ZIP.',
  ],
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Image Resizer',
        alternateName: [
          'Aitoollbaba Image Resizer',
          'Resize image to exact pixels',
          'Instagram image size tool',
          'Resize image online',
          'Change image dimensions',
          'Crop image to exact size',
        ],
        url: `${SITE}/image-resizer`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'Presets for Instagram, Facebook, X, LinkedIn, YouTube and Pinterest',
          'Custom width and height in exact pixels',
          'Lock the aspect ratio across a mixed batch',
          'Crop to fill, fit inside with padding, or stretch',
          'JPEG, PNG and WebP output',
          'Batch up to 20 images, download as one ZIP',
          'Runs fully client-side — no upload',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Image Resizer', item: `${SITE}/image-resizer` },
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
              <span className="text-acid">image resizer</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-x-16 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free image resizer · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.9rem]">
                  The exact size
                  <br />
                  <span className="text-fg-3">they asked for.</span>
                  <br />
                  <span className="text-fg-3">Your call on the crop.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pl-4">
                <Resizer />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  Presets for the places that dictate a size, and plain numbers for everywhere else.
                  When the shape does not match the frame, you choose whether to crop, pad or stretch
                  — the tool never decides that quietly on your behalf.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'bytes uploaded'],
                    ['12', 'platform presets'],
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

        {/* ========================================================= presets */}
        <section id="sizes" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the sizes</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              What each platform actually wants.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {presetGroups().map(({ group, items }) => (
                <div key={group} className="bg-bg p-6">
                  <h3 className="font-display text-[17px] font-semibold tracking-tight">{group}</h3>
                  <dl className="mt-3 space-y-1.5">
                    {items.map((p) => (
                      <div key={p.id} className="flex items-baseline justify-between gap-3">
                        <dt className="text-[13.5px] text-fg-2">{p.label}</dt>
                        <dd className="font-mono text-[11px] text-acid">
                          {p.width}×{p.height}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-[13.5px] leading-relaxed text-fg-3">
              Platforms move these around without much notice. If one of them tells you something
              different today, trust the platform and type the numbers into the custom tab.
            </p>
          </div>
        </section>

        {/* ============================================================ fits */}
        <section id="fit" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the choice</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              A 3:2 photo does not fit a 1:1 frame.
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-2">
              Something has to give, and there are only three honest answers. Most tools pick one for
              you without saying which.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {FITS.map((f) => (
                <div key={f.value} className="bg-bg p-7">
                  <span className="font-mono text-[11px] text-acid">{f.value}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">
                    {f.label}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">
                    {f.note.charAt(0).toUpperCase() + f.note.slice(1)}.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================= how */}
        <section id="how" className="scroll-mt-16 border-b border-line bg-surface">
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
        <section id="limits" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-flag">
              what it will not do
            </h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Pixels can be thrown away, not conjured.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                [
                  'It cannot add detail when enlarging',
                  'Scaling a 400px image up to 1080px stretches the same information over more pixels. It will be soft, and no amount of processing changes that — files this happened to are marked "enlarged" rather than passed off as fine.',
                ],
                [
                  'It crops from the centre, not the subject',
                  'There is no face or saliency detection here. A crop takes the middle of the frame, so if your subject sits off to one side, use "fit inside" or crop it yourself first.',
                ],
                [
                  'It cannot promise a platform will not re-encode',
                  'Handing a site the exact pixel size it asks for avoids its own scaling, which is the main thing. Most platforms still re-compress on upload, and nothing done here prevents that.',
                ],
                [
                  'It is not a metadata report',
                  'Redrawing does strip EXIF, GPS and C2PA, but this tool never tells you what was there. If knowing matters, run the file through the AI label remover instead.',
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
        <section id="faq" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">questions</h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Resizing images, answered.
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

        <RelatedTools slug="image-resizer" />

        {/* ============================================================= cta */}
        <section className="halo relative overflow-hidden">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
            <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Hit the size on the first try.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Drop a file in, pick the frame it has to fill, and decide what happens to the edges.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                resize an image
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
