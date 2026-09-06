import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { OG_IMAGE, REPO, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact — bugs, ideas and legal notices',
  description:
    'Report a bug, suggest a tool, or tell us a file read wrong. It all goes to the public issue tracker — no contact form, and no email address to harvest.',
  alternates: { canonical: '/contact' },
  openGraph: {
    images: OG_IMAGE,
    type: 'website',
    url: '/contact',
    title: 'Contact — bugs, ideas and legal notices',
    description: 'One public issue tracker. No contact form, no mailing list.',
  },
};

/* Each route says what to include, because a bug report about a browser tool
   is almost useless without the browser and the file type. */
const ROUTES: [string, string, string, string][] = [
  [
    'bug',
    'Something is broken',
    'A tool that fails, hangs, or produces a file you cannot open.',
    'Tell us which tool, which browser and version, and what kind of file — JPEG, PNG, HEIC, how large. Everything runs on your device, so those three things are usually the whole answer.',
  ],
  [
    'wrong',
    'A result looks wrong',
    'The checker read your file differently than you expected, or metadata you wanted gone is still there.',
    'Describe what the file is and what you expected. Please do not attach anything private — a description is nearly always enough, and the point of this site is that your files stay yours.',
  ],
  [
    'idea',
    'A tool you wish existed',
    'Something you currently upload to a stranger’s server to do.',
    'Say what you are actually trying to get done rather than the feature you have in mind. If a browser can do it without a server, it can probably be built here.',
  ],
  [
    'legal',
    'Legal or takedown',
    'Trademark, copyright, or a claim about the content of the site.',
    'Open an issue describing the page and the specific concern. The site hosts no user content — nothing you process here is ever stored — so this is only ever about the site’s own pages.',
  ],
];

const FAQ: [string, string][] = [
  [
    'Why is there no contact form?',
    'A form needs a server to receive it, and this site does not have one — that is the same fact that makes the tools private. Rather than adding a back end just for a message box, and quietly weakening the one claim the whole site rests on, contact goes through the public issue tracker.',
  ],
  [
    'Why no email address?',
    'An email address published on a page is scraped within days, and the inbox becomes unusable. The issue tracker is public, spam-resistant, and has the useful side effect that an answer helps the next person with the same question instead of disappearing into one inbox.',
  ],
  [
    'Do I need a GitHub account?',
    'To open an issue, yes — it is free and takes a minute. If that is genuinely not possible for you, the repository is public, so you can also read existing issues without an account to see whether your problem is already known and answered.',
  ],
  [
    'How fast is a reply?',
    'This is maintained by one person alongside other work, so days rather than hours. Reproducible bug reports get looked at first, because they are the ones that can actually be fixed.',
  ],
  [
    'Should I attach my image?',
    'Please do not, unless it is something you would happily publish — a GitHub issue is public and permanent. A description of the file usually pins the problem down faster than the file itself.',
  ],
];

export default function Contact() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        name: 'Contact Aitoollbaba',
        url: `${SITE}/contact`,
        publisher: { '@id': `${SITE}/#org` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE}/contact` },
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
              <span className="text-acid">contact</span>
            </nav>

            <div className="max-w-3xl">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">contact</span>
              <h1 className="mt-4 font-display text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[3rem]">
                One inbox,
                <br />
                <span className="text-fg-3">and it is public.</span>
              </h1>
              <p className="mt-6 text-[17px] leading-relaxed text-fg-2">
                There is no contact form here, because a form needs a server and this site does not have
                one. Everything — bugs, tool ideas, a file that gave the wrong answer, legal notices — goes
                to the same place: the issue tracker on the public repository.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`${REPO}/issues/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
                >
                  open an issue →
                </a>
                <a
                  href={`${REPO}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
                >
                  read existing issues
                </a>
              </div>
              <p className="mt-4 font-mono text-[11px] text-fg-3">
                a free GitHub account is needed to post · reading needs nothing
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================== routes */}
        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              01 / what to say
            </span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Four kinds of message, and what makes each one useful
            </h2>

            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {ROUTES.map(([code, title, when, how]) => (
                <li key={code} className="bg-bg p-6 sm:p-7">
                  <span className="font-mono text-[11px] text-acid">{code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{when}</p>
                  <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-fg-3">
                    {how}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================= faq */}
        <section id="faq" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">
              02 / questions
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[2.7rem]">
              Getting in touch, answered
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
              Found something broken?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              A report with the tool, the browser and the file type in it is usually enough to fix it.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`${REPO}/issues/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-acid px-6 py-3 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                open an issue →
              </a>
              <a
                href="/about"
                className="rounded-md border border-line-2 px-6 py-3 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                about the site
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
