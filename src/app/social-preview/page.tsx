import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SocialPreview from '@/components/SocialPreview';
import { PLACEMENTS, placementGroups } from '@/lib/placements';
import { OG_IMAGE, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Social Crop Preview — see every crop first',
  description:
    'See how Instagram, Facebook, X, LinkedIn, YouTube and WhatsApp will crop one image — feed, story, banner and the profile circle, all at once. Nothing is uploaded.',
  alternates: { canonical: '/social-preview' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/social-preview',
    title: 'Social Media Image Preview — see every crop before you post',
    description:
      'One image, every platform crop side by side. See what gets cut before you post it.',
  },
};

const FAQ: [string, string][] = [
  [
    'Will my photo get cropped on Instagram?',
    'If its shape does not match the frame, yes. Instagram takes the middle of your picture and discards the rest — a square feed post from a landscape photo loses both sides. This page shows you exactly how much, for every placement at once, before you post.',
  ],
  [
    'Why does my profile picture look wrong?',
    'Because it is masked into a circle. You upload a square, and the platform hides the corners — so anything near a corner is gone, and a face placed off-centre gets clipped at the edge. The profile previews here are drawn as circles for that reason.',
  ],
  [
    'Can I choose which part gets kept?',
    'Not on the platform — every one of them crops from the centre, and none of them ask. What you can do is crop the picture yourself first so the part you care about is in the middle, then upload that. The image resizer does exactly that with the same presets.',
  ],
  [
    'Are my images uploaded anywhere?',
    'No. There is no upload endpoint on this site. The previews are literally your own file rendered by CSS in your own browser, and the downloads are drawn on your own machine. Load the page once and you can disconnect entirely.',
  ],
  [
    'What size should I make my image?',
    'Something at least as large as the biggest placement you care about, and shaped closest to where it will actually be seen. If a photo is mainly for a feed post, shoot or crop it square or 4:5 — then the other placements lose less, because they are cropping from something already close to their shape.',
  ],
  [
    'Are these sizes current?',
    'They are the current common ones, but platforms move them without notice, and some placements differ between the app and the web. Treat them as close rather than exact, and trust the platform if it tells you something different today.',
  ],
  [
    'Does downloading a crop lose quality?',
    'The crop is re-encoded as a JPEG at 92%, which is not visible at normal viewing sizes. If a placement is larger than your original, it is scaled up — the tool counts how many of those there are, because no tool can invent the detail.',
  ],
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Social Media Image Preview',
        alternateName: [
          'Aitoollbaba Social Preview',
          'Instagram crop preview',
          'Profile picture crop checker',
        ],
        url: `${SITE}/social-preview`,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          `Preview one image across ${PLACEMENTS.length} placements at once`,
          'Instagram, Facebook, X, LinkedIn, YouTube and WhatsApp',
          'Circular masks shown for profile pictures',
          'Toggle between the result and what gets cut off',
          'Reports how much of the picture each placement keeps',
          'Download any single size, or all of them as a ZIP',
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
            name: 'Social Media Image Preview',
            item: `${SITE}/social-preview`,
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
          <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8 sm:pt-14">
            <nav aria-label="Breadcrumb" className="mb-8 font-mono text-[11px] text-fg-3">
              <a href="/" className="transition-colors hover:text-acid">
                tools
              </a>
              <span className="mx-2 text-line-2">/</span>
              <span className="text-acid">social preview</span>
            </nav>

            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                free crop preview · runs on your device
              </span>

              <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem]">
                See the crop
                <br />
                <span className="text-fg-3">before you post.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-fg-2">
                Every platform takes the middle of your picture and throws the rest away, and none of
                them show you first. Drop one image here and see all {PLACEMENTS.length} placements at
                once — feed, story, banner, and the profile circle that quietly eats the corners.
              </p>
            </div>

            {/* Full width: this tool is a wall of previews, so it gets the room. */}
            <div className="mt-10">
              <SocialPreview />
            </div>
          </div>
        </section>

        {/* ====================================================== placements */}
        <section id="placements" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">what is covered</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              {PLACEMENTS.length} places one photo can end up.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {placementGroups().map(({ group, items }) => (
                <div key={group} className="bg-bg p-6">
                  <h3 className="font-display text-[17px] font-semibold tracking-tight">{group}</h3>
                  <dl className="mt-3 space-y-1.5">
                    {items.map((p) => (
                      <div key={p.id} className="flex items-baseline justify-between gap-3">
                        <dt className="text-[13px] text-fg-2">
                          {p.label}
                          {p.shape === 'circle' && (
                            <span className="ml-1.5 font-mono text-[10px] text-fg-3">circle</span>
                          )}
                        </dt>
                        <dd className="shrink-0 font-mono text-[11px] text-acid">
                          {p.width}×{p.height}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ why */}
        <section id="why" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the rule</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              They crop from the centre, and they do not ask.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {[
                {
                  code: 'centre',
                  title: 'The middle survives',
                  body: 'Whatever shape the frame is, the platform keeps the largest centred rectangle of that shape and discards the rest. Put what matters in the middle and it survives everywhere.',
                },
                {
                  code: 'circle',
                  title: 'Profile pictures lose the corners',
                  body: 'A profile photo is a square masked into a circle. About 21% of a square is outside that circle — which is why a face pushed toward a corner gets clipped.',
                },
                {
                  code: 'fix',
                  title: 'The only real fix is to crop first',
                  body: 'Nothing changes how a platform crops. What you can change is what you hand it: crop the picture yourself so the subject is centred, then upload that.',
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

        {/* ============================================================= faq */}
        <section id="faq" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">questions</h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              Cropping, answered.
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
              Know before you post.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              One image in, every crop out — and the sizes to download if you want them.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                check an image
              </a>
              <a
                href="/image-resizer"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                crop it yourself first →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
