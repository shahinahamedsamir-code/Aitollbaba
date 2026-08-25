import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { docHref } from '@/lib/content';
import { GUIDES } from '@/lib/guides';
import { PLATFORMS } from '@/lib/platforms';
import { SITE } from '@/lib/site';
import { CATEGORY_LABEL, LIVE_TOOLS, TOOLS, type Tool, toolHref } from '@/lib/tools';

/* The three claims that decide whether a tool belongs on this site at all. */
const PRINCIPLES = [
  {
    code: '01',
    title: 'The file never leaves the tab',
    body: 'There is no upload endpoint anywhere on this site. Files are read from your disk into browser memory, worked on by JavaScript on your own machine, and dropped when you close the tab.',
  },
  {
    code: '02',
    title: 'It works with the network off',
    body: 'Load a page once and pull the plug. Everything still runs, because everything that runs is already on your machine. That is the proof, not a promise in a policy.',
  },
  {
    code: '03',
    title: 'No account, no cap, no cost',
    body: 'Static files and browser JavaScript cost almost nothing to serve, so there is nothing to sign up for, nothing metered and nothing to buy.',
  },
];

const FAQ: [string, string][] = [
  [
    'What is Aitoollbaba?',
    'A collection of small, free tools for images and file privacy that run entirely inside your browser. Each one does a single job well — the first is an AI label remover that strips the metadata platforms read when they tag a post as AI-generated. More are being added, and every one of them holds to the same rule: your file is never uploaded.',
  ],
  [
    'Are my files uploaded to a server?',
    'No. There is no upload endpoint on this site. The tools are static files plus JavaScript; your image is read into your browser’s memory, processed on your own CPU and released when the tab closes. Open your network tab and watch, or disconnect entirely and try again — it keeps working.',
  ],
  [
    'Do I need an account?',
    'No. There is no sign-up, no email, no login and no daily limit. Nothing about you is collected, because there is nowhere for it to be collected to.',
  ],
  [
    'Is Aitoollbaba free?',
    'Yes, and there is no paid tier waiting behind it. Serving static files costs almost nothing, and the work happens on your machine rather than on a server that would need paying for.',
  ],
  [
    'Which tools are available right now?',
    'All six: the AI label remover, EXIF viewer, image compressor, converter, resizer and QR generator. Every one of them runs entirely in your browser — nothing on this site uploads a file, and any tool added later will hold to the same rule or not be added.',
  ],
  [
    'Will more tools be added?',
    'Yes. The bar for adding one is that it can run fully client-side. Anything that would need your file sent to a server does not belong here and will not be added.',
  ],
];

export default function Page() {
  const liveCount = LIVE_TOOLS.length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE}/#tools`,
        url: SITE,
        name: 'Aitoollbaba — free browser-based tools',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: LIVE_TOOLS.map((tool, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: tool.name,
            url: `${SITE}/${tool.slug}`,
          })),
        },
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
          <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-fg-2">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" aria-hidden />
              {liveCount} live{TOOLS.length > liveCount ? ` · ${TOOLS.length - liveCount} in build` : ''} ·
              nothing uploaded
            </span>

            <h1 className="mx-auto mt-6 max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[3.4rem] lg:text-[3.9rem]">
              Small tools that run
              <br />
              <span className="text-acid">on your machine</span>
              <span className="text-fg-3">, not ours.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-fg-2">
              Aitoollbaba is a growing set of free image and privacy tools with no server behind them.
              Your file is read into the tab, worked on there, and handed back. There is no upload
              endpoint on this site to send it to.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tools"
                className="rounded-md bg-acid px-5 py-2.5 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                browse the tools
              </a>
              <a
                href="/remove-ai-label"
                className="rounded-md border border-line-2 px-5 py-2.5 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
              >
                open the AI label remover →
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================== tools */}
        <section id="tools" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">the tools</h2>
                <p className="mt-3 max-w-xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                  One job each, done properly.
                </p>
              </div>
              <p className="max-w-sm text-[13.5px] leading-relaxed text-fg-2">
                Anything listed here can run fully client-side. If a tool would need your file sent
                somewhere, it does not get added.
              </p>
            </div>

            <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </ul>
          </div>
        </section>

        {/* ============================================================= why */}
        <section id="why" className="scroll-mt-16 border-b border-line bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">how it works here</h2>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              The whole site is files your browser downloads once.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <div key={p.code} className="bg-bg p-7">
                  <span className="font-mono text-[11px] text-acid">{p.code}</span>
                  <h3 className="mt-3 font-display text-[17px] font-semibold tracking-tight">{p.title}</h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================== guides */}
        <section id="guides" className="scroll-mt-16 border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">reading</h2>
                <p className="mt-3 max-w-xl font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                  What is actually inside your files.
                </p>
              </div>
              <a
                href="/guides"
                className="font-mono text-[12px] text-fg-2 transition-colors hover:text-acid"
              >
                all guides →
              </a>
            </div>

            <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {[...PLATFORMS.slice(0, 3), ...GUIDES.slice(0, 3)].map((doc) => (
                <li key={doc.slug} className="bg-bg">
                  <a href={docHref(doc)} className="group block h-full p-7">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-acid">
                      {doc.eyebrow}
                    </span>
                    <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-acid">
                      {doc.title}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{doc.description}</p>
                    <span className="mt-4 inline-block font-mono text-[11px] text-fg-3 transition-colors group-hover:text-acid">
                      read →
                    </span>
                  </a>
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
              About the site, not the tools.
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
              Start with the one that is ready.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-fg-2">
              Drop an image in and see every hidden block it carries before anything is changed.
            </p>
            <a
              href="/remove-ai-label#tool"
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

/**
 * Live tools are links; the ones still in build are inert list items carrying a
 * visible badge, so the grid can show the roadmap without implying it works.
 */
function ToolCard({ tool }: { tool: Tool }) {
  const href = toolHref(tool);
  const live = href !== null;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            live ? 'bg-acid text-acid-ink' : 'bg-raised text-fg-3'
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d={tool.icon} />
          </svg>
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
            live ? 'border-acid/30 bg-acid-wash text-acid' : 'border-line-2 text-fg-3'
          }`}
        >
          {live ? 'live' : 'in build'}
        </span>
      </div>

      <h3
        className={`mt-5 font-display text-[17px] font-semibold tracking-tight ${
          live ? 'transition-colors group-hover:text-acid' : 'text-fg-2'
        }`}
      >
        {tool.name}
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-fg-2">{tool.tagline}</p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {tool.meta.map((m) => (
          <li key={m} className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-fg-3">
            {m}
          </li>
        ))}
      </ul>

      <span className="mt-5 inline-block font-mono text-[11px] text-fg-3">
        {live ? (
          <span className="transition-colors group-hover:text-acid">open →</span>
        ) : (
          `${CATEGORY_LABEL[tool.category]} · coming`
        )}
      </span>
    </>
  );

  return (
    <li className="bg-bg">
      {live ? (
        <a href={href} className="group flex h-full flex-col p-7">
          {inner}
        </a>
      ) : (
        <div className="flex h-full flex-col p-7 opacity-70">{inner}</div>
      )}
    </li>
  );
}
