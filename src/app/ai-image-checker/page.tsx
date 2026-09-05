import type { Metadata } from 'next';
import AiChecker from '@/components/AiChecker';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { OG_IMAGE, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'AI Image Checker — what the file declares',
  description:
    'Does an image declare that AI made it? Reads C2PA credentials, the IPTC AI field, generator names and prompt data — weighed against real camera marks. No upload.',
  alternates: { canonical: '/ai-image-checker' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/ai-image-checker',
    title: 'AI Image Checker — read what a file declares about itself',
    description:
      'What the file says about its own origin: C2PA, generator tags, prompt data, camera fields. No pixel guessing, no upload.',
  },
};

const FAQ: [string, string][] = [
  [
    'Can this tell me if an image is AI-generated?',
    'It can tell you whether the file *says* it was. Generators and editors write that into the file — a C2PA manifest, an IPTC digitalSourceType field, a generator name in XMP, or the prompt and seed in a PNG text chunk — and this reads all of it. What it cannot do is look at the picture and judge. Nothing on this site does that, and you should be careful with anything that claims to.',
  ],
  [
    'Why can nothing judge the picture itself?',
    'Detectors that work from pixels exist, but they are unreliable in exactly the conditions that matter. Resizing and re-compression — which every social platform does — damage the statistical traces they look for, so accuracy falls sharply on the images people actually want checked. A confident wrong answer here means calling someone a liar about their own photograph, so this tool does not offer one.',
  ],
  [
    'Nothing was found. Does that mean the image is real?',
    'No, and this is the most important thing on the page. Instagram, Facebook and WhatsApp strip metadata from everything, so almost any image you save from them arrives with no declaration at all — real or generated alike. A metadata cleaner leaves the same emptiness. Absence of a declaration is absence of evidence, not evidence of a real photograph.',
  ],
  [
    'It found camera data. Is the photo definitely real?',
    'It is good evidence and it is not proof. Exposure settings, a lens model, a body serial number and a GPS fix are things a generator has no way to produce — but every one of those fields is just text in a file, and anyone determined can write whatever they like into them.',
  ],
  [
    'What is C2PA?',
    'A provenance standard: a signed record embedded in an image saying which tool made or edited it, and whether generative AI was involved. Adobe, OpenAI, Google and a growing number of cameras write it. It is the strongest signal here, because it is the same field platforms read when they decide to put an AI label on your post. This tool reports that a manifest is present and what it says; it does not verify the signature.',
  ],
  [
    'Why does a real photo of mine show an AI declaration?',
    'Because the label is triggered by metadata, not by the picture. Generative fill, an AI denoise, or almost any recent Photoshop or Lightroom feature makes the exporter write a manifest saying generative AI was involved — even when the edit was a small cleanup on a real photograph. That is why a file with both camera data and an AI declaration is reported as exactly that, rather than as "AI".',
  ],
  [
    'Is my image uploaded?',
    'No. There is no upload endpoint on this site. The file is read into your browser’s memory and parsed there; nothing is sent anywhere and nothing is written back to your file.',
  ],
  [
    'How is this different from the EXIF viewer?',
    'The EXIF viewer prints every tag in the file and lets you read it yourself. This one asks a single question — what does this file claim about its origin — and weighs the answer, separating a declaration from a hint. Same bytes, different question.',
  ],
];

const READS = [
  {
    code: 'c2pa',
    title: 'Content credentials',
    body: 'A signed C2PA manifest recording which tool made or edited the file. Written by Firefly, Photoshop, OpenAI, Google and some cameras — and the field platforms actually read when they apply an AI label.',
  },
  {
    code: 'iptc',
    title: 'The AI source field',
    body: 'IPTC digitalSourceType, whose value can literally be trainedAlgorithmicMedia or compositeWithTrainedAlgorithmicMedia. One field, and it says outright how the picture was made.',
  },
  {
    code: 'xmp',
    title: 'Generator names',
    body: 'XMP CreatorTool and edit history naming the software. Midjourney, DALL·E, Stable Diffusion, Firefly, Imagen and others leave their name behind unless something strips it.',
  },
  {
    code: 'png',
    title: 'Prompt and seed',
    body: 'Automatic1111, ComfyUI and Forge write the full prompt, negative prompt, sampler, steps, seed and model hash into PNG text chunks. When that is there, there is no ambiguity at all.',
  },
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'AI Image Checker',
        alternateName: ['Aitoollbaba AI Image Checker', 'C2PA checker', 'Image provenance checker'],
        url: `${SITE}/ai-image-checker`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'Detects C2PA content credentials',
          'Reads the IPTC digitalSourceType field',
          'Names the generator where XMP records one',
          'Extracts Stable Diffusion prompt, seed and model data',
          'Weighs camera evidence: exposure, lens, serial number, GPS',
          'States plainly what the absence of a declaration does and does not mean',
          'Runs fully client-side — no upload',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'AI Image Checker', item: `${SITE}/ai-image-checker` },
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
              <span className="text-acid">ai image checker</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-x-14 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free AI image checker · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.6rem]">
                  Ask the file,
                  <br />
                  <span className="text-fg-3">not the picture.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <AiChecker />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  Generators sign their work. C2PA credentials, an IPTC field that says
                  <span className="font-mono text-[15px]"> trainedAlgorithmicMedia</span>, a name in
                  XMP, a prompt and seed in a PNG chunk — this reads all of it, and weighs it against
                  the marks a real camera leaves.
                </p>

                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-fg-3">
                  What it will not do is stare at the picture and guess. That is the part nobody does
                  reliably, and a confident wrong answer costs a real person something.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'bytes uploaded'],
                    ['0', 'guesses made'],
                    ['4', 'declaration types'],
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

        {/* ========================================================== honest */}
        <section id="honest" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-flag">read this first</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Nothing here is a lie detector.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {[
                {
                  code: 'can',
                  title: 'What it can tell you',
                  body: 'Whether the file declares AI involvement, which tool signed it, and whether it carries the exposure settings, lens, serial number and GPS fix that only a camera writes. All of that is fact, read straight from the bytes.',
                },
                {
                  code: 'cannot',
                  title: 'What it cannot',
                  body: 'Whether the picture is generated. That question lives in the pixels, and the detectors that try to answer it lose accuracy badly once an image has been resized and re-compressed — which every platform does to everything.',
                },
                {
                  code: 'nothing',
                  title: 'What "nothing found" means',
                  body: 'Almost nothing. Social platforms strip metadata from every image that passes through them, so a stripped file is the normal case, not a suspicious one. It is also what our own cleaner leaves. No declaration is not evidence of a real photograph.',
                },
              ].map((c) => (
                <div key={c.code} className="bg-bg p-7">
                  <span className="font-mono text-[11px] text-acid">{c.code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">{c.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================== reads */}
        <section id="reads" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">
              the four declarations
            </h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Where a generator signs its name.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {READS.map((r) => (
                <div key={r.code} className="bg-bg p-7">
                  <span className="font-mono text-[11px] text-acid">{r.code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">{r.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================= faq */}
        <section id="faq" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">questions</h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Checking an image, answered.
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
              See what the file admits.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Drop it in and read the receipt — then decide for yourself.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                check an image
              </a>
              <a
                href="/exif-viewer"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                see every tag instead →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
