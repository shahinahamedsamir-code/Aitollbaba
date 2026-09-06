import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { OG_IMAGE, SITE } from '@/lib/site';
import { LIVE_TOOLS } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'About — who made these tools and why',
  description:
    'Aitoollbaba is a set of free image tools that run entirely inside your browser. No account, no upload, no server. Here is who built it and what it will not do.',
  alternates: { canonical: '/about' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/about',
    title: 'About Aitoollbaba',
    description: 'Free image tools with no back end — and an honest list of what they cannot do.',
  },
};

/* The three claims the whole site rests on, each with the reason it is true
   rather than a promise that it is. */
const FACTS: [string, string, string][] = [
  [
    'no upload',
    'There is nowhere to send a file',
    'The site is a folder of static files. It has no API route, no database and no storage bucket, because the build produces plain HTML and JavaScript and nothing else. Your file is read from disk by the tab, worked on there, and handed back. Open the network tab while you use any tool — you will not see the picture leave.',
  ],
  [
    'no account',
    'Nothing to sign up for',
    'No login, no email, no trial. The tools do not remember you between visits because the site stores nothing in your browser either — no cookies of ours, no localStorage, nothing. Close the tab and every trace of what you did is gone.',
  ],
  [
    'no cost',
    'Free because it is cheap to run',
    'Serving static files costs almost nothing, and the work happens on your computer rather than a server we pay for. That is the entire business model. There is no paid tier waiting behind a limit.',
  ],
];

/* What the site refuses to pretend. Stated here as plainly as on the tool
   pages, because a page called About is exactly where a visitor checks
   whether they are being sold something. */
const LIMITS: [string, string][] = [
  [
    'It does not make AI images undetectable',
    'Removing metadata removes a declaration. The pixels are unchanged, and a platform that analyses pixels rather than fields is unaffected by anything here.',
  ],
  [
    'It is not a way around disclosure rules',
    'Where you are required to label AI-generated work, label it. These tools exist for privacy — stripping a camera serial number, a GPS fix, an editing history — not for hiding what something is.',
  ],
  [
    'Nothing here guesses',
    'The AI Image Checker reads what a file declares about itself. When a file declares nothing, it says so instead of inventing a probability. That is narrower than a detector and it is also the reason it cannot be wrong about your own photograph.',
  ],
  [
    'Browsers set the ceiling',
    'Everything runs on your device, so your device decides. A very large image can be slow on an old phone, and a format your browser cannot encode is simply not offered.',
  ],
];

export default function About() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        name: 'About Aitoollbaba',
        url: `${SITE}/about`,
        publisher: { '@id': `${SITE}/#org` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE}/about` },
        ],
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
              <span className="text-acid">about</span>
            </nav>

            <div className="max-w-3xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">about</span>
              <h1 className="mt-4 font-display text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[3rem]">
                Image tools that never
                <br />
                <span className="text-fg-3">see your images.</span>
              </h1>
              <p className="mt-6 text-[17px] leading-relaxed text-fg-2">
                Aitoollbaba is {LIVE_TOOLS.length} small tools for the ordinary things people do to a
                picture — strip its metadata, shrink it, convert it, resize it, check what it admits about
                itself. All of them run inside the browser tab you already have open. None of them upload
                anything, and that is not a policy we are asking you to trust. It is what the site is made
                of.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================== facts */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              01 / how it works
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Three claims, and why each one holds
            </h2>

            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {FACTS.map(([code, title, body]) => (
                <div key={code} className="bg-bg p-6 sm:p-7">
                  <span className="font-mono text-[11px] text-acid">{code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ why */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  02 / why it exists
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  The usual version of these tools wants your file
                </h2>
              </div>

              <div className="space-y-5 text-[15px] leading-relaxed text-fg-2 md:pt-2">
                <p>
                  Search for an image compressor and almost every result asks you to upload the picture to
                  a machine you know nothing about, keeps it for some number of hours, and describes that
                  arrangement in a privacy policy you will not read. For a holiday snap that is merely
                  untidy. For a passport scan, a medical photo, a screenshot of something private, or a
                  picture with a GPS fix on your house in it, it is a genuinely bad trade for a job the
                  browser can already do.
                </p>
                <p>
                  Browsers have had everything needed for this for years — decoding, canvas, encoding, file
                  access. So these tools do the work where the file already is. The site is a static export
                  with three dependencies and no runtime services, which is what makes the privacy claim
                  checkable rather than promised: there is no endpoint to send a file to, so no version of
                  this code can quietly start sending them.
                </p>
                <p>
                  It also means the tools keep working with the network switched off. Load a page once,
                  disconnect, and every one of them still runs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== limits */}
        <section id="limits" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-flag">
              03 / what it cannot do
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              The parts nobody advertises
            </h2>

            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {LIMITS.map(([title, body]) => (
                <li key={title} className="bg-bg p-6 sm:p-7">
                  <h3 className="font-display text-[17px] font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================ who */}
        <section className="border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
                  04 / who made it
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  One person, in the open
                </h2>
              </div>

              <div className="space-y-5 text-[15px] leading-relaxed text-fg-2 md:pt-2">
                <p>
                  Aitoollbaba is built and maintained by Shahin Ahamed Samir. There is no company behind it
                  and no team — one developer, a static site, and a domain.
                </p>
                <p>
                  The source is public, which is the only way the central claim on this site can be
                  verified rather than believed. Anyone can read the code, see that there is no upload
                  path, and check that the deployed site is built from it.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href="/contact"
                    className="rounded-md border border-line-2 px-5 py-2.5 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
                  >
                    get in touch →
                  </a>
                  <a
                    href="/privacy"
                    className="rounded-md border border-line-2 px-5 py-2.5 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
                  >
                    privacy →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================= cta */}
        <section className="halo relative overflow-hidden">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
            <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Try one and watch the network tab.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              It is the fastest way to confirm everything on this page.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/#tools"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                all {LIVE_TOOLS.length} tools
              </a>
              <a
                href="/guides"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                guides →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
