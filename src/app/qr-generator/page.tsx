import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import QrMaker from '@/components/QrMaker';
import { ECLS } from '@/lib/qr';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'QR Code Generator — no tracking, no expiry, free',
  description:
    'Make a QR code for a link, plain text, Wi-Fi or a contact card. The address goes straight into the code with no shortener in between, so nothing counts your scans and it cannot expire. Export SVG or PNG.',
  alternates: { canonical: '/qr-generator' },
  openGraph: {
    type: 'website',
    url: '/qr-generator',
    title: 'QR Code Generator — no tracking, no expiry, free',
    description:
      'QR codes built in your browser. No redirect, no account, no expiry. SVG and PNG export.',
  },
};

const FAQ: [string, string][] = [
  [
    'Do these QR codes expire?',
    'No, and they cannot. The address you type is encoded directly into the pattern — there is no shortener or redirect service sitting in the middle that could shut down, start charging, or point somewhere else later. A QR code with a redirect in it is only as permanent as the company running the redirect.',
  ],
  [
    'Is anything tracked?',
    'Not the codes. There is nothing between the code and the destination, so no one counts the scans — not us either. Free generators that offer "scan analytics" do it by encoding their own URL and forwarding you, which means every scan goes through them and the code stops working if they do. This site does keep a plain counter of page visits, which has nothing to do with the codes you make here.',
  ],
  [
    'Is my data sent anywhere?',
    'No. The encoder runs as JavaScript in your browser — the Wi-Fi password or contact details you type never leave the tab. Load the page once and you can disconnect entirely; it keeps working.',
  ],
  [
    'Which error-correction level should I use?',
    'M is the right default for a screen or a clean print. Go to Q or H if the code will be on something that gets scuffed, curved or partly covered — a sticker, a mug, a code with a logo dropped in the middle. Higher levels make the code physically denser for the same text, so do not reach for H by reflex.',
  ],
  [
    'Should I download SVG or PNG?',
    'SVG for anything printed — it is a handful of vector shapes, so it stays sharp at any size and a printer can scale it without a jagged edge. PNG for places that only take an image file, and pick a size larger than you think you need.',
  ],
  [
    'Why does the Wi-Fi code show my password?',
    'Because that is what the Wi-Fi QR format is: the network name and password in plain text, wrapped in a WIFI: prefix. Every generator does this, including this one — there is no encryption in the format. Anyone who photographs the code has the password, so put it somewhere only people you have already let in can see.',
  ],
  [
    'Can I change the colours?',
    'Yes, but keep the contrast high and keep the code darker than its background. Most scanners assume dark-on-light and will not read an inverted code; the tool warns you when your colours drop below the point where a camera can separate the modules.',
  ],
  [
    'How much can a QR code hold?',
    'Up to about 2,950 bytes at the lowest error-correction level, and roughly 1,270 at the highest. Long text makes a physically denser code that needs to be printed larger to stay scannable, so short payloads are worth the effort.',
  ],
];

const PIPELINE = [
  {
    code: 'segment',
    title: 'Pick the cheapest mode',
    body: 'Digits pack three characters into ten bits, uppercase-and-symbols packs two into eleven, anything else goes in as UTF-8 bytes. The tool picks whichever fits your text and shows which one it used.',
  },
  {
    code: 'correct',
    title: 'Add Reed–Solomon',
    body: 'The data is split into blocks and each gets error-correction codewords computed over GF(256). That redundancy is what lets a scuffed or partly covered code still read.',
  },
  {
    code: 'place',
    title: 'Lay out the modules',
    body: 'Finder squares, timing lines and alignment patterns go down first, then the data snakes through the remaining space in a two-module-wide zigzag from the bottom right.',
  },
  {
    code: 'mask',
    title: 'Try all eight masks',
    body: 'Large blank areas and accidental finder-like stripes make a code hard to read. All eight mask patterns are applied, each scored against the spec penalty rules, and the best one kept.',
  },
];

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'QR Code Generator',
        alternateName: ['Aitoollbaba QR Generator', 'Wi-Fi QR code maker', 'vCard QR code'],
        url: `${SITE}/qr-generator`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any browser',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
        featureList: [
          'QR codes for links, text, Wi-Fi, contact cards and email',
          'No redirect service — the address is encoded directly',
          'Four error-correction levels',
          'SVG and PNG export up to 2048px',
          'Custom colours with a contrast warning',
          'Runs fully client-side — nothing is sent anywhere',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'QR Code Generator', item: `${SITE}/qr-generator` },
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
              <span className="text-acid">qr generator</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-x-14 lg:gap-y-6">
              <div className="min-w-0 lg:col-start-1 lg:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
                  free QR generator · runs on your device
                </span>

                <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.6rem]">
                  No redirect.
                  <br />
                  <span className="text-fg-3">No expiry.</span>
                  <br />
                  <span className="text-fg-3">No one counting.</span>
                </h1>
              </div>

              {/* Second in the source so a phone gets the tool straight after the
                  headline. On lg it moves to column two and spans both copy rows. */}
              <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <QrMaker />
              </div>

              <div className="min-w-0 lg:col-start-1 lg:row-start-2">
                <p className="max-w-lg text-[17px] leading-relaxed text-fg-2">
                  Most free QR generators encode <em>their</em> address and forward the scan to yours.
                  That is how they count scans — and why the code dies when they change their plan.
                  This one puts your address in the pattern itself. Nothing sits in the middle.
                </p>

                <dl className="mt-9 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
                  {[
                    ['0', 'redirects'],
                    ['0', 'bytes sent'],
                    ['40', 'versions supported'],
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

        {/* ======================================================== redirect */}
        <section id="redirect" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the catch elsewhere</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              A QR code with a redirect in it is a subscription.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
              <div className="bg-bg p-7">
                <span className="font-mono text-[11px] text-flag">what a tracked code holds</span>
                <p className="mt-3 font-mono text-[12px] text-fg-2">qr.example-service.com/r/8Xf2Qa</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">
                  Every scan goes to their server first and is counted, then forwarded to you. Useful if
                  you want the analytics. Fatal when the service shuts down, starts charging, or the
                  free tier expires — the printed code is then a dead link and you cannot edit paper.
                </p>
              </div>
              <div className="bg-bg p-7">
                <span className="font-mono text-[11px] text-acid">what this one holds</span>
                <p className="mt-3 font-mono text-[12px] text-fg-2">https://your-actual-address.example</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">
                  The address is the code. Nobody is in the middle, so there is nothing to expire, no
                  scan count anywhere, and the code keeps working for exactly as long as your own
                  address does. You can check for yourself — “show what this encodes” prints it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ ecls */}
        <section id="levels" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">
              error correction
            </h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              How much damage it can survive.
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-2">
              A QR code carries spare copies of its own data. The more it carries, the more of the code
              can be scratched, curved or covered and still read — and the denser the pattern gets for
              the same text.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {ECLS.map((e) => (
                <div key={e.value} className="bg-bg p-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-semibold text-acid">{e.label}</span>
                    <span className="font-mono text-[11px] text-fg-3">{e.recovery}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">
                    {e.note.charAt(0).toUpperCase() + e.note.slice(1)}.
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
              Built here, not fetched from anywhere.
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-2">
              The encoder is written into this site rather than pulled from a library, so the whole
              thing stays a handful of static files that work with the network off.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {PIPELINE.map((step) => (
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
              worth knowing before you print
            </h2>
            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              A QR code is not a secret.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                [
                  'A Wi-Fi code hands out the password',
                  'The Wi-Fi QR format is the network name and password in plain text. That is the format, not a shortcut taken here. Anyone who photographs the code can read the password out of it, so treat the code exactly as you would treat the password written on a card.',
                ],
                [
                  'The code cannot be edited once printed',
                  'That is the point of having no redirect, and it is also the trade-off. If the destination has to change later, point the code at an address you control and change where that address goes.',
                ],
                [
                  'Long text needs a bigger print',
                  'More characters mean more modules in the same square, so each one gets smaller. If a code has to be read from a distance or off a curved surface, shorten the text rather than enlarging the print.',
                ],
                [
                  'Colour and contrast still matter',
                  'Cameras separate the modules by brightness. Low contrast, an inverted code, or a background pattern showing through will all stop it reading — the tool warns about the first two.',
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
              QR codes, answered.
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
              Make one that outlives us.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Type an address, take the SVG, and the code works for as long as the address does.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tool"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                make a QR code
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
