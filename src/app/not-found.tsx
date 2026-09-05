import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { LIVE_TOOLS } from '@/lib/tools';

/**
 * A 404 has no business in an index, and it was previously inheriting the
 * homepage's description — which made two pages look identical to a crawler.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  description: 'That page does not exist on Aitoollbaba. Every tool is listed here instead.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header />

      <main id="top">
        <section className="halo relative overflow-hidden border-b border-line">
          <div className="gridwash absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-3">404</span>
            <h1 className="mt-4 font-display text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[3.2rem]">
              Nothing here.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-fg-2">
              That address does not exist. Everything the site does is on one of the pages below —
              all of it free, and none of it uploading your files anywhere.
            </p>

            <ul className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-left sm:grid-cols-3">
              {LIVE_TOOLS.map((tool) => (
                <li key={tool.slug} className="bg-bg">
                  <a
                    href={`/${tool.slug}`}
                    className="group block h-full p-4 transition-colors hover:bg-raised"
                  >
                    <span className="block font-mono text-[11.5px] text-fg-2 transition-colors group-hover:text-acid">
                      {tool.name}
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-fg-3">{tool.short}</span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/"
                className="rounded-md bg-acid px-5 py-2.5 font-mono text-[13px] font-medium text-acid-ink transition-colors hover:bg-fg"
              >
                all tools
              </a>
              <a
                href="/guides"
                className="rounded-md border border-line-2 px-5 py-2.5 font-mono text-[13px] text-fg-2 transition-colors hover:border-acid/40 hover:text-fg"
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
