import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { OG_IMAGE, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy — no uploads, no accounts',
  description:
    'Your images are never uploaded, because there is no server to upload them to. What the visitor counter records, what it does not, and how to switch it off.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/privacy',
    title: 'Privacy Policy — no uploads, no accounts',
    description: 'No uploads, no accounts, no cookies of ours. One third-party visit counter, named.',
  },
};

/* The date this text last changed. Update it whenever the policy does — a
   privacy policy with a stale date is worse than none. */
const UPDATED = 'September 6, 2026';

/* Data the site could plausibly be asked about, and what actually happens to
   each. Rendered as a table so nothing can hide in a paragraph. */
const DATA: [string, string, string][] = [
  ['Your images and files', 'Never leaves your device', 'Read into the browser tab, processed there, discarded when the tab closes.'],
  ['Filenames and metadata', 'Never leaves your device', 'Read in the same tab as the picture. Nothing is transmitted, including what a file declares about itself.'],
  ['Name, email, account', 'Never collected', 'There is nothing to sign up for and no form on the site.'],
  ['Cookies set by this site', 'None', 'The site sets no cookies and writes nothing to localStorage or IndexedDB.'],
  ['Your IP address', 'Seen by the host and the counter', 'Unavoidable for anything on the internet: a server cannot send you a page without knowing where to send it.'],
  ['Which pages you visit', 'Counted by Histats', 'Aggregate visit statistics only — which pages are popular, roughly where visitors come from.'],
];

const FAQ: [string, string][] = [
  [
    'Are my images uploaded anywhere?',
    'No. This site is a set of static files with no API route, no database and no storage. Your file is opened by JavaScript running in your own tab, worked on there, and given back to you as a download. Open your browser developer tools, watch the network tab while you use any tool, and you will see the picture never leaves.',
  ],
  [
    'Do you store my files?',
    'There is nowhere to store them. The site has no back end at all — the same reason nothing is uploaded is the reason nothing is kept. When you close the tab, the copy the browser was holding in memory is gone.',
  ],
  [
    'Do you use cookies?',
    'This site sets none, and stores nothing in your browser — no cookies, no localStorage, no IndexedDB. The Histats counter described below is a third party and may set its own cookie to tell a returning visitor from a new one. Blocking it, or using a browser that blocks third-party cookies by default, breaks nothing here.',
  ],
  [
    'What does the visitor counter see?',
    'The things any web request carries: your IP address, which page you asked for, the page you came from, and your browser and screen size. It is used for one thing — knowing which tools people actually use. It cannot see your files, because your files never reach the network.',
  ],
  [
    'Can I use the site without the counter?',
    'Yes. Any content blocker, or a browser with tracker blocking on, will stop it loading. Every tool keeps working — in fact you can disconnect from the internet entirely after the page loads and they still run.',
  ],
  [
    'Do you sell or share data?',
    'No. There is no data to sell. Nothing is collected beyond the aggregate visit counts described above, and those are not shared with anyone.',
  ],
  [
    'Is the site suitable for children?',
    'It collects nothing from anyone, of any age. No account, no personal information, no way to submit anything to us.',
  ],
];

export default function Privacy() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'Privacy Policy',
        url: `${SITE}/privacy`,
        publisher: { '@id': `${SITE}/#org` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${SITE}/privacy` },
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
              <span className="text-acid">privacy</span>
            </nav>

            <div className="max-w-3xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">privacy</span>
              <h1 className="mt-4 font-display text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[3rem]">
                Your files are private
                <br />
                <span className="text-fg-3">for a structural reason.</span>
              </h1>
              <p className="mt-6 text-[17px] leading-relaxed text-fg-2">
                Most privacy policies ask you to trust a promise about what a company does with your data
                after it arrives. This one does not need to. Aitoollbaba has no server that receives files,
                so the question of what happens to your image after upload has no answer — there is no
                upload.
              </p>
              <p className="mt-4 font-mono text-[11px] text-fg-3">last updated {UPDATED}</p>
            </div>
          </div>
        </section>

        {/* ============================================================ data */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              01 / the whole list
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Everything the site could touch
            </h2>

            <div className="mt-12 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
                <thead>
                  <tr>
                    <th className="w-[24%] border-b border-line py-3 pr-4 font-display text-[15px] font-semibold">
                      What
                    </th>
                    <th className="w-[24%] border-b border-line px-4 py-3 font-display text-[15px] font-semibold">
                      What happens
                    </th>
                    <th className="border-b border-line px-4 py-3 font-display text-[15px] font-semibold">
                      Why
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DATA.map(([what, happens, why]) => (
                    <tr key={what}>
                      <td className="border-b border-line py-3 pr-4 align-top font-medium">{what}</td>
                      <td className="border-b border-line px-4 py-3 align-top font-mono text-[12px] text-acid">
                        {happens}
                      </td>
                      <td className="border-b border-line px-4 py-3 align-top leading-relaxed text-fg-2">
                        {why}
                      </td>
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

        {/* ======================================================== counter */}
        <section id="analytics" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-flag">
                  02 / the one third party
                </span>
                <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
                  A visit counter, named plainly
                </h2>
              </div>

              <div className="space-y-5 text-[15px] leading-relaxed text-fg-2 md:pt-2">
                <p>
                  Every page loads a small script from Histats, a third-party visit counter, so that it is
                  possible to know which tools people actually use. It is the only external thing the site
                  loads, and it is worth being exact about what that means.
                </p>
                <p>
                  It sees what any web request carries: an IP address, the page requested, the referring
                  page, and browser and screen details. It may set its own cookie to distinguish a
                  returning visitor from a new one. It reports these as aggregate counts — visits per page,
                  roughly where from.
                </p>
                <p>
                  It cannot see your images. Not because it promises not to, but because your images are
                  never put on the network for anything to see. The counter observes that a page was
                  opened; the work you do on that page happens afterwards, entirely inside your own
                  browser.
                </p>
                <p className="rounded-lg border border-line bg-surface p-4 text-[14px] text-fg-2">
                  <span className="font-medium text-fg">To switch it off:</span> any content blocker will
                  stop it loading, as will a browser with tracker blocking enabled. Nothing on the site
                  depends on it — every tool works with it blocked, and with the network disconnected
                  altogether.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================== rights */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              03 / your rights
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              There is nothing to request or delete
            </h2>

            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {[
                [
                  'access',
                  'Ask what is held about you',
                  'Nothing is held. No account exists, no file is stored, and the visit counts are aggregate figures with no way to pick one person out of them.',
                ],
                [
                  'deletion',
                  'Ask for it to be deleted',
                  'There is no record to delete. If you want the counter to stop seeing you at all, block it — that takes effect immediately and needs nobody’s permission.',
                ],
                [
                  'changes',
                  'When this page changes',
                  'The date at the top changes with it. If the site ever adds something that collects more than this, it will be described here before it ships, not after.',
                ],
              ].map(([code, title, body]) => (
                <div key={code} className="bg-bg p-6 sm:p-7">
                  <span className="font-mono text-[11px] text-acid">{code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================= faq */}
        <section id="faq" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              04 / questions
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Privacy, answered
            </h2>

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
                  <p className="mt-3 text-[14px] leading-relaxed text-fg-2">{a}</p>
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
              Do not take our word for it.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Open any tool with the network tab showing, or read the source. Both settle it faster than
              this page does.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/#tools"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                open a tool
              </a>
              <a
                href="/about"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                about the site →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
