import type { Metadata } from 'next';
import Cleaner from '@/components/Cleaner';
import FileAnatomy from '@/components/FileAnatomy';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { docHref } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { PLATFORMS } from '@/lib/platforms';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'AI Label Remover — strip C2PA, EXIF & AI metadata, free',
  description:
    'Remove the metadata platforms read when they add an AI label: C2PA content credentials, IPTC digitalSourceType, generator tags, plus EXIF and GPS. Runs in your browser — no upload, no signup, no limit.',
  alternates: { canonical: '/remove-ai-label' },
  openGraph: {
    type: 'website',
    url: '/remove-ai-label',
    title: 'AI Label Remover — strip C2PA, EXIF & AI metadata, free',
    description:
      'Strips C2PA content credentials, AI generator tags, EXIF and GPS in your browser. Nothing is uploaded.',
  },
};

const TICKER = [
  'EXIF',
  'GPS / geotags',
  'XMP',
  'IPTC',
  'C2PA manifests',
  'PNG tEXt',
  'iTXt · zTXt',
  'prompt · seed · CFG',
  'model hash',
  'camera serial',
  'CreatorTool',
  'digitalSourceType',
  'edit history',
  'EXIF thumbnails',
  'timestamps',
];

const STEPS = [
  {
    code: 'read',
    title: 'Read locally',
    body: 'The File API hands the bytes to the page. No request goes out — open your network tab and watch, or pull the plug and try again.',
  },
  {
    code: 'parse',
    title: 'Walk the container',
    body: 'JPEG segments, PNG chunks, RIFF chunks, ISOBMFF boxes. Every metadata block is located and sized, and the EXIF IFDs are decoded into readable values.',
  },
  {
    code: 'redraw',
    title: 'Repaint the pixels',
    body: 'The image is decoded — orientation baked in first — and painted to a canvas. A canvas holds pixels and nothing else, so every block is left behind at this step.',
  },
  {
    code: 'encode',
    title: 'Write a clean file',
    body: 'Re-encoded at your quality, optionally with a scattered ±1–2 RGB nudge that moves every hash of the file without moving what you can see.',
  },
];

const AUDIENCE = [
  ['Photographers', 'GPS and body serial numbers off a shot before it lands in a public portfolio.'],
  ['AI artists', 'Prompt, seed and model hash out of the PNG, without publishing your recipe.'],
  ['Journalists & sources', 'Clear the device trail before an image leaves the building.'],
  ['Marketplace sellers', 'Listing photos without the camera history riding along.'],
  ['Support & IT', 'Screenshots and attachments scrubbed of location and account-linked fields.'],
  ['Everyone else', 'The fastest way to know a picture carries nothing but the picture.'],
];

const COMPARE: [string, boolean, boolean, boolean][] = [
  ['Never transmits the file', true, false, true],
  ['Reports what it found first', true, false, false],
  ['Removes C2PA content credentials', true, false, true],
  ['Removes PNG prompt / seed chunks', true, true, true],
  ['Resets the file fingerprint', true, false, false],
  ['20 at once, one ZIP', true, false, false],
  ['Works with the network off', true, false, true],
  ['Nothing to install', true, true, false],
  ['No account, no watermark, no cap', true, false, true],
];

const FAQ: [string, string][] = [
  [
    'What is an AI label remover?',
    'It is a tool that removes the metadata a platform reads when it decides to put an AI label on your post. That metadata is a C2PA content-credentials manifest, an IPTC digitalSourceType field, and XMP fields naming the software — all written into the file by the generator or editor. An AI label remover strips those fields, so nothing in the file announces how it was made. It changes the file, never the picture.',
  ],
  [
    'Why did a photo I took myself get an AI label?',
    'Because the label is triggered by metadata, not by the image. If you used generative fill, an AI denoise, or almost any recent Photoshop or Lightroom feature, the exporter writes a C2PA manifest saying generative AI was involved — even when the edit was a small cleanup on a real photograph. Stripping the metadata returns the file to what a plain camera export would have contained.',
  ],
  [
    'Does removing the metadata guarantee no AI label?',
    'No, and nobody can honestly promise that. Removing the metadata removes the most common trigger, but platforms also run their own classifiers on the pixels, and some generators embed invisible watermarks such as SynthID that no metadata tool can touch. Treat this as removing the data your file carries — which is exactly what it does — not as a guaranteed outcome on any particular platform.',
  ],
  [
    'What is a metadata cleaner?',
    'Every image file carries hidden fields alongside the picture: which camera or program made it, when, at what settings, sometimes where, and — for generated images — which model produced it. A metadata cleaner strips those fields and hands back a file that holds the picture and nothing else.',
  ],
  [
    'Are my images uploaded anywhere?',
    'No. There is no upload endpoint on this site. The file is read into your browser’s memory, processed by JavaScript on your own machine, and released when you close the tab. Load the page once and you can disconnect entirely — the tool keeps working.',
  ],
  [
    'Which formats does it handle?',
    'JPEG, PNG, WebP and AVIF are read and written. HEIC and HEIF are read wherever your browser can decode them (Safari always; Chrome and Firefox depend on the platform) and come back as JPEG, since no browser encodes HEIC.',
  ],
  [
    'Does cleaning reduce image quality?',
    'The image is re-encoded, so a lossy format is re-compressed once. At the default 92% that is not visible at normal viewing sizes. If you need exact pixels, choose PNG as the output and switch the fingerprint reset off — that path is lossless.',
  ],
  [
    'What does the fingerprint reset actually do?',
    'It shifts colour channels by at most two values out of 256, scattered over roughly one pixel in eight. You cannot see a change that small, but it moves every hash of the file, so a cleaned copy no longer matches a stored hash of the original. Scattering rather than covering every pixel is deliberate: blanket noise is incompressible and can double the file size.',
  ],
  [
    'Will this make an AI image undetectable?',
    'No, and be suspicious of any tool that claims it will. Metadata lives in the file; SynthID-style watermarks and the statistical traces detectors look for live in the pixels. Removing metadata touches neither. This is a privacy tool, not a detection bypass.',
  ],
  [
    'How many images at once?',
    'Twenty per batch, up to 25 MB each, with no daily cap. The work happens on your own CPU, so your machine is the only limit.',
  ],
  [
    'Is it really free?',
    'Yes. It is static files plus browser JavaScript — serving it costs almost nothing, so there is no account, no tier and nothing to buy.',
  ],
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'AI Label Remover',
        alternateName: ['Aitoollbaba AI Label Remover', 'AI Metadata Remover', 'C2PA Remover', 'EXIF Cleaner'],
        url: `${SITE}/remove-ai-label`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'Remove EXIF, GPS and timestamp data',
          'Remove XMP and IPTC fields',
          'Remove C2PA content credentials',
          'Remove Stable Diffusion prompt and seed data from PNG text chunks',
          'Reset the file fingerprint with invisible pixel jitter',
          'Batch process up to 20 images',
          'Runs fully client-side — no upload',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'AI Label Remover', item: `${SITE}/remove-ai-label` },
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
              <span className="text-acid">ai label remover</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-x-16 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free AI label remover · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.9rem]">
                  Remove the AI label.
                  <br />
                  <span className="text-fg-3">And everything else</span>
                  <br />
                  <span className="text-fg-3">your photo carries.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows,
                  which puts the layout back side by side. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pl-4">
                <Cleaner />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  Platforms read hidden metadata to decide what gets an AI label. Aitoollbaba strips
                  the C2PA content credentials and generator tags that trigger it — along with the EXIF, GPS
                  and timestamps you never meant to publish. Drop a file in and see the list first.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'bytes uploaded'],
                    ['20', 'files per batch'],
                    ['9', 'block types detected'],
                  ].map(([value, label]) => (
                    <div key={label} className="bg-surface px-4 py-3.5">
                      <dt className="font-display text-2xl font-semibold text-acid">{value}</dt>
                      <dd className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-3">
                        {label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== ticker */}
        <section className="overflow-hidden border-b border-line bg-surface py-3.5" aria-hidden>
          <div className="ticker-track flex w-max gap-8 whitespace-nowrap">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} className="flex items-center gap-8 font-mono text-[12px] text-fg-3">
                {item}
                <span className="text-acid/40">/</span>
              </span>
            ))}
          </div>
        </section>

        {/* ======================================================= ai labels */}
        <section id="ai-label" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:items-end">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  01 / the ai label
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  Where the &ldquo;Made with AI&rdquo; label comes from
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed text-fg-2">
                No platform looks at your picture to decide this. They read fields inside the file. If those
                fields say a generative tool touched it, the label goes on — automatically, before a human
                sees it. Which is why a photograph you shot yourself can end up labelled, and why an AI label
                remover is really just a metadata remover.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {[
                {
                  tag: 'C2PA',
                  title: 'Content credentials',
                  body: 'A signed manifest written by Firefly, Photoshop, and a growing list of cameras and generators. It records the tool, the edits, and whether generative AI was involved.',
                },
                {
                  tag: 'IPTC',
                  title: 'digitalSourceType',
                  body: 'A single field with a value like trainedAlgorithmicMedia. It is the most direct “this was generated” marker there is, and platforms read it first.',
                },
                {
                  tag: 'XMP',
                  title: 'CreatorTool & history',
                  body: 'The name of the software that wrote the file, plus its edit trail. “Adobe Firefly” or a Stable Diffusion signature here is enough on its own.',
                },
              ].map((item) => (
                <div key={item.tag} className="bg-surface p-6">
                  <span className="font-mono text-[11px] tracking-wider text-acid">{item.tag}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 rounded-xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  The common case: a real photo, labelled anyway
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">
                  Use generative fill to take a bin out of the corner of a landscape, or run an AI denoise on
                  a night shot, and the exporter stamps the whole file as AI-touched. The picture is yours;
                  the metadata no longer says so. Stripping those fields puts the file back to what a camera
                  export would have looked like.
                </p>
                <a
                  href="/facebook"
                  className="mt-3 inline-block font-mono text-[11px] text-acid transition-opacity hover:opacity-70"
                >
                  why Facebook says your photo is AI →
                </a>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-flag">
                  What it will not do
                </h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">
                  It will not make a fully generated image read as a photograph. Invisible watermarks like
                  SynthID sit in the pixels and survive this, classifiers judge pixels too, and from August
                  2026 the EU AI Act requires machine-readable AI disclosure on content distributed in
                  Europe. Where disclosure is required, disclose.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== guides */}
        <section id="guides" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:items-end">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  02 / by platform
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  Every platform reads it differently
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed text-fg-2">
                The mechanism is the same everywhere, but what each platform does with it is not. Meta labels
                automatically from the manifest, Pinterest leans on classifiers as well, LinkedIn shows the
                credentials as a badge you can click. Pick yours for the specifics — each page has the
                scanner built into it.
              </p>
            </div>

            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
              {[...PLATFORMS, ...GUIDES].map((doc) => (
                <li key={doc.slug}>
                  <a
                    href={docHref(doc)}
                    className="flex h-full flex-col bg-bg p-6 transition-colors hover:bg-raised"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-acid">
                      {doc.eyebrow}
                    </span>
                    <span className="mt-3 font-display text-[17px] font-semibold leading-snug tracking-tight">
                      {doc.title}
                    </span>
                    <span className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">
                      {doc.description}
                    </span>
                    <span className="mt-auto pt-4 font-mono text-[11px] text-fg-3">read →</span>
                  </a>
                </li>
              ))}
              {/* Fills the last row exactly and gives the hub a second link. */}
              <li className="lg:col-span-2">
                <a
                  href="/guides"
                  className="flex h-full flex-col justify-center bg-bg p-6 transition-colors hover:bg-raised"
                >
                  <span className="font-display text-[17px] font-semibold leading-snug tracking-tight">
                    All guides in one place
                  </span>
                  <span className="mt-2 text-[13.5px] leading-relaxed text-fg-2">
                    Every platform page and explainer, indexed.
                  </span>
                  <span className="mt-4 font-mono text-[11px] text-acid">open the index →</span>
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* ========================================================= anatomy */}
        <section id="anatomy" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:items-end">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  03 / inside a file
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  A JPEG is a stack of blocks. Most of them are not the picture.
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed text-fg-2">
                Photographs are not one thing. Ahead of the pixel data sits a queue of labelled segments, each
                written by whatever touched the file — the phone, the editor, the generator. They travel
                everywhere the file travels. Here is what that queue looks like, and what a pass through the
                canvas leaves of it.
              </p>
            </div>

            <div className="mt-12">
              <FileAnatomy />
            </div>
          </div>
        </section>

        {/* ========================================================== how it works */}
        <section id="how" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              04 / pipeline
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Four stages, none of them on a server
            </h2>

            <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.code} className="relative bg-bg p-6 lg:p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-acid font-mono text-[12px] font-medium text-acid-ink">
                      {i + 1}
                    </span>
                    <span className="font-mono text-[11px] tracking-wider text-fg-3">{step.code}()</span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ======================================================== audience */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  05 / who runs it
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  Anyone publishing a file they did not type by hand
                </h2>
              </div>

              <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {AUDIENCE.map(([title, note]) => (
                  <li key={title} className="border-t border-line pt-4">
                    <h3 className="font-display text-[15px] font-semibold tracking-tight">{title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-2">{note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ========================================================= compare */}
        <section id="compare" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              06 / alternatives
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Honestly compared
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-2">
              Upload-based cleaners send your file to a machine you cannot inspect. Desktop tools like
              ExifTool are more thorough than any browser can be — if you are comfortable at a command line,
              use them. This sits between the two: nothing installed, nothing transmitted.
            </p>

            <div className="mt-12 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[620px] border-collapse text-[13.5px]">
                <thead>
                  <tr>
                    <th className="w-[46%] border-b border-line py-3 pr-4 text-left font-normal" />
                    <th className="border-b border-acid/40 bg-acid-wash px-4 py-3 text-left font-display text-[15px] font-semibold text-acid">
                      This tool
                    </th>
                    <th className="border-b border-line px-4 py-3 text-left font-mono text-[12px] font-normal text-fg-2">
                      upload sites
                    </th>
                    <th className="border-b border-line px-4 py-3 text-left font-mono text-[12px] font-normal text-fg-2">
                      ExifTool (CLI)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([label, a, b, c]) => (
                    <tr key={label}>
                      <td className="border-b border-line py-3 pr-4 text-fg-2">{label}</td>
                      <Cell on={a} lit />
                      <Cell on={b} />
                      <Cell on={c} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 font-mono text-[10px] text-fg-3 sm:hidden">
              swipe the table sideways to see every column →
            </p>
          </div>
        </section>

        {/* ========================================================== limits */}
        <section id="limits" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <div className="grid gap-10 rounded-2xl border border-flag/35 bg-flag-wash p-8 sm:p-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-flag">
                  07 / the honest part
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.4rem]">
                  What no metadata cleaner can do
                </h2>
              </div>
              <div className="space-y-4 text-[15px] leading-relaxed text-fg-2">
                <p>
                  Metadata is data <em className="text-fg">about</em> the picture, stored beside it. Removing
                  it does nothing to the pixels. Invisible watermarks such as Google&rsquo;s SynthID are
                  encoded into the pixels themselves and survive metadata stripping, re-encoding and resizing
                  by design.
                </p>
                <p>
                  Statistical AI detectors also read pixels, not tags — a cleaned image can still be flagged.
                  And where a platform or the law requires you to disclose that content is AI-generated, this
                  is not a way around that. It removes the data your file carries. That is the whole claim.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= faq */}
        <section id="faq" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  08 / questions
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  Worth asking before you trust any of this
                </h2>
              </div>

              <div className="border-t border-line">
                {FAQ.map(([q, a]) => (
                  <details key={q} className="group border-b border-line py-4">
                    <summary className="flex items-start justify-between gap-6 text-[15px] text-fg transition-colors hover:text-acid">
                      <span>{q}</span>
                      <span className="plus mt-0.5 shrink-0 font-mono text-lg leading-none text-acid transition-transform duration-200">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-fg-2">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= cta */}
        <section className="halo relative overflow-hidden">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
            <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Find out what your last photo is carrying.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              It takes one drag and about a second, and the file never leaves the tab.
            </p>
            <a
              href="#tool"
              className="mt-8 inline-block rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
            >
              run a scan
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Cell({ on, lit }: { on: boolean; lit?: boolean }) {
  return (
    <td className={`border-b px-4 py-3 ${lit ? 'border-acid/25 bg-acid-wash/40' : 'border-line'}`}>
      {on ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={lit ? 'text-acid' : 'text-fg-2'} role="img" aria-label="yes">
          <path d="m5 13 4 4L19 7" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="text-fg-3/45" role="img" aria-label="no">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )}
    </td>
  );
}
