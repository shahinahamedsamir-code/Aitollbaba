import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import RelatedTools from '@/components/RelatedTools';
import PdfMaker from '@/components/PdfMaker';
import { PAGE_SIZES } from '@/lib/pdf';
import { OG_IMAGE, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'JPG to PDF — no re-encoding, no upload',
  description:
    'Turn JPG, PNG, HEIC or WebP images into one PDF. A JPEG is embedded exactly as it is — no re-encoding, no quality loss. No upload, and no date stamped in.',
  alternates: { canonical: '/jpg-to-pdf' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/jpg-to-pdf',
    title: 'JPG to PDF — combine images into a PDF, free, no upload',
    description:
      'Images into one PDF, built in your browser. JPEGs go in untouched. Nothing is uploaded.',
  },
};

const STEPS = [
  {
    code: 'inspect',
    title: 'Look at what came in',
    body: 'The JPEG marker chain is walked to find the frame header — width, height, channel count, and whether it is baseline or progressive. That decides whether the file can go in whole.',
  },
  {
    code: 'embed',
    title: 'Put JPEGs in whole',
    body: 'PDF can hold a JPEG as a JPEG, through the DCTDecode filter. A baseline photo is copied in byte for byte: no decode, no re-encode, no second generation of loss, and no waiting on a canvas.',
  },
  {
    code: 'convert',
    title: 'Convert only what has to be',
    body: 'A PNG, a HEIC, a progressive JPEG or a CMYK scan cannot go in directly, so those are drawn to a canvas and encoded once. Each page says which of the two happened to it.',
  },
  {
    code: 'write',
    title: 'Write the document',
    body: 'Pages, image objects and a cross-reference table, assembled here in the tab. No producer string and no creation date are written — nothing in the file records when you made it or with what.',
  },
];

const FAQ: [string, string][] = [
  [
    'How do I convert JPG to PDF without uploading?',
    'Drop the images into the tool on this page, choose a page size, and press save. The whole thing runs as JavaScript in your own browser — there is no upload endpoint on this site, so the files never leave your machine. Load the page once and you can disconnect entirely and it still works.',
  ],
  [
    'Does it reduce the quality of my photos?',
    'For a normal JPEG, no — not at all. PDF can carry a JPEG in its original compressed form, so the exact bytes of your file go into the document untouched. Only images that cannot be stored that way — PNG, HEIC, progressive or CMYK JPEG — get converted, and the tool marks those individually.',
  ],
  [
    'Can I put several images in one PDF?',
    'Yes, up to 20 pages at a time, in whatever order you like. Use the arrows next to each page to move it up or down before you save.',
  ],
  [
    'Is it safe for documents like an NID or a certificate?',
    'That is the case this tool is built for. Nothing is uploaded, so no copy of your document exists anywhere but your own machine. The PDF also carries no creation date and no producer name — most converters stamp both, which quietly records when the file was made and with which service.',
  ],
  [
    'Which page size should I pick?',
    'A4 for anything you will send to an office or a form in most of the world, Letter in the US. Pick “Match image” when the pictures are not documents — each page then takes the shape of its own picture with no white border, which suits photos and scans of receipts.',
  ],
  [
    'Are my images cropped to fit the page?',
    'No. Every picture is scaled to fit inside the margins and centred, so the whole image is always on the page. If you want the page to have no border at all, use “Match image”.',
  ],
  [
    'Does it work with iPhone HEIC photos?',
    'Yes, wherever your browser can decode HEIC — always on Safari, and on Chrome and Firefox depending on the platform. HEIC cannot be embedded directly, so those pages are converted to JPEG first and marked as converted.',
  ],
  [
    'Why is my PDF large?',
    'Because the photos are going in at full quality and untouched. If the file has to be smaller, run the images through the image compressor first, then bring the results here — that way you choose exactly how much quality to trade.',
  ],
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'JPG to PDF',
        alternateName: [
          'Aitoollbaba JPG to PDF',
          'Image to PDF converter',
          'Photos to PDF',
          'JPG to PDF online',
          'Combine images into one PDF',
          'Photo to PDF converter',
        ],
        url: `${SITE}/jpg-to-pdf`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'Combine up to 20 images into one PDF',
          'JPEGs embedded without re-encoding — no quality loss',
          'A4, Letter, Legal, A5 or a page matching each image',
          'Reorder pages before saving',
          'Reads PNG, WebP, AVIF and HEIC',
          'No creation date or producer written into the file',
          'Runs fully client-side — no upload',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'JPG to PDF', item: `${SITE}/jpg-to-pdf` },
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
              <span className="text-acid">jpg to pdf</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-x-14 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free JPG to PDF · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.6rem]">
                  Your photos.
                  <br />
                  <span className="text-fg-3">Same pixels,</span>
                  <br />
                  <span className="text-fg-3">now a PDF.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <PdfMaker />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  A PDF can carry a JPEG as a JPEG. So a photo that is already a JPEG goes into the
                  document byte for byte — not decoded, not compressed again, not degraded. Most
                  converters re-encode everything and cost you a generation of quality for nothing.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'bytes uploaded'],
                    ['0', 'quality lost'],
                    ['20', 'pages per file'],
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

        {/* ======================================================== untouched */}
        <section id="untouched" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the difference</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Most converters throw away quality they never needed to.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
              <div className="bg-bg p-7">
                <span className="font-mono text-[11px] text-flag">the usual way</span>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">
                  Decode the JPEG to pixels, draw it, compress it again into the PDF. The picture has
                  now been through lossy compression twice, so edges soften and gradients band — and
                  nothing was gained, because the original was already a format PDF understands.
                </p>
              </div>
              <div className="bg-bg p-7">
                <span className="font-mono text-[11px] text-acid">what this does</span>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">
                  Read the frame header, wrap the untouched bytes in a{' '}
                  <span className="font-mono text-[12px]">/DCTDecode</span> image object, and write the
                  page around it. The compressed data in the PDF is identical to the compressed data
                  in your file — the same picture, in a different container.
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-[13.5px] leading-relaxed text-fg-3">
              This only works for baseline JPEGs, which is what a phone or camera produces. PNG, HEIC,
              progressive and CMYK files genuinely have to be converted, and each page tells you which
              of the two it got.
            </p>
          </div>
        </section>

        {/* ========================================================== sizes */}
        <section id="sizes" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">page sizes</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Paper for documents, image shape for photos.
            </p>

            <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
              {PAGE_SIZES.map((size) => (
                <li key={size.value} className="bg-bg p-6">
                  <span className="font-display text-lg font-semibold text-acid">{size.label}</span>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-fg-2">{size.note}</p>
                </li>
              ))}
            </ul>
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
              It makes a PDF. That is all.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                [
                  'It does not make the file smaller',
                  'Photos go in at full quality, so a PDF of ten phone photos is a large PDF. If it has to fit under a size limit, compress the images first and then bring them here — that way you decide what to trade.',
                ],
                [
                  'It does not read PDFs',
                  'This goes one way: images in, PDF out. Opening an existing PDF to pull pictures out of it needs a PDF renderer, which is a much heavier thing to load and does not belong on a page that has to work offline.',
                ],
                [
                  'It does not add text or signatures',
                  'Each page is one picture, scaled and centred. There is no text layer, so the result is not searchable — a scan made here is an image of a document, not a document.',
                ],
                [
                  'The images keep their own metadata',
                  'An embedded JPEG goes in whole, which means any EXIF and GPS inside it goes in too. The PDF itself records nothing about you, but the photos might — run them through the AI label remover first if that matters.',
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
              Images into PDF, answered.
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

        <RelatedTools slug="jpg-to-pdf" />

        {/* ============================================================= cta */}
        <section className="halo relative overflow-hidden">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
            <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              One document, no upload.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Drop the pages in, put them in order, and save the file.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                make a PDF
              </a>
              <a
                href="/image-compressor"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                compress the images first →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
