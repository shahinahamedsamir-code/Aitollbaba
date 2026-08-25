import { LIVE_TOOLS, TOOLS } from '../lib/tools';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Logo size={32} wordClassName="font-display text-lg font-semibold tracking-tight" />
            <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-fg-2">
              Free image and privacy tools with no back end. Files are read from disk into the tab, worked
              on there and handed back. Nothing is transmitted, stored or logged, because there is nowhere
              for it to go.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] text-fg-3">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
              works with the network disconnected
            </span>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">tools</h3>
            <ul className="mt-3 space-y-2 text-[13.5px]">
              {/* Only what actually works gets a link; the rest are named on the
                  homepage grid where their status is visible. */}
              {LIVE_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <a href={`/${tool.slug}`} className="text-fg-2 transition-colors hover:text-acid">
                    {tool.name}
                  </a>
                </li>
              ))}
              {TOOLS.length > LIVE_TOOLS.length && (
                <li>
                  <a href="/#tools" className="text-fg-3 transition-colors hover:text-acid">
                    {TOOLS.length - LIVE_TOOLS.length} more in build →
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-3">about</h3>
            <ul className="mt-3 space-y-2 text-[13.5px]">
              {[
                ['/#tools', 'All tools'],
                ['/guides', 'Guides'],
                ['/#why', 'Why no upload'],
                ['/#faq', 'FAQ'],
                ['/remove-ai-label#limits', 'What it cannot do'],
                ['/#privacy', 'Privacy'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-fg-2 transition-colors hover:text-acid">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div id="privacy" className="mt-12 grid gap-6 border-t border-line pt-6 md:grid-cols-2">
          <p className="text-[11.5px] leading-relaxed text-fg-3">
            <span className="text-fg-2">Privacy.</span> This page has no upload endpoint. Every file you add is
            processed by JavaScript on your own device and discarded when the tab closes. No account, no
            cookies for the tool, no copy kept anywhere.
          </p>
          <p className="text-[11.5px] leading-relaxed text-fg-3">
            <span className="text-fg-2">Use it honestly.</span> Stripping metadata is a privacy measure. It does
            not make an AI-generated image undetectable and it is not a way around a platform&rsquo;s
            disclosure rules. Where you are required to label AI-generated content, label it.
          </p>
        </div>

        <p className="mt-8 font-mono text-[10px] tracking-wider text-fg-3">
          © {new Date().getFullYear()} Aitoollbaba — static files, no server, no cost.
        </p>
      </div>
    </footer>
  );
}
