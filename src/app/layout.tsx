import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { SITE } from '@/lib/site';
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-face',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body-face',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-face',
  display: 'swap',
});



export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    // Brand first on the hub, because the homepage is now the catalogue rather
    // than the cleaner. Each tool page carries its own query in its own title.
    default: 'Aitoollbaba — free AI tools that run in your browser',
    template: '%s | Aitoollbaba',
  },
  description:
    'Free image and privacy tools that run in your browser — clean metadata, compress, convert, resize, read EXIF, make QR codes. Nothing is ever uploaded.',
  keywords: [
    'aitoollbaba',
    'ai tool baba',
    'free ai tools',
    'online image tools',
    'browser image tools no upload',
    'ai label remover',
    'remove ai label',
    'ai metadata remover',
    'c2pa remover',
    'metadata cleaner',
    'exif remover',
    'image compressor',
    'image converter',
  ],
  authors: [{ name: 'Aitoollbaba' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: 'Aitoollbaba',
    title: 'Aitoollbaba — free AI tools that run in your browser',
    description:
      'Free image and privacy tools that run entirely in your browser. Nothing is uploaded, nothing is stored, no account.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aitoollbaba — free AI tools that run in your browser',
    description: 'Free browser-based image and privacy tools. Nothing is uploaded.',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'Aitoollbaba',
      alternateName: ['AI Tool Baba', 'Aitoolbaba'],
      description:
        'Free image and privacy tools that run entirely in the browser — no upload, no account.',
      inLanguage: 'en',
      publisher: { '@id': `${SITE}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: 'Aitoollbaba',
      url: SITE,
      logo: `${SITE}/logo-mark.svg`,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="relative z-10">{children}</div>

        {/* Histats page counter. It counts visits to these pages — never a
            file, which is never sent anywhere in the first place. Loaded after
            the page is interactive so it cannot delay a tool, and the tools
            keep working with it blocked or with the network off. */}
        <Script id="histats" strategy="afterInteractive">
          {`var _Hasync = _Hasync || [];
_Hasync.push(['Histats.start', '1,5049843,4,0,0,0,00010000']);
_Hasync.push(['Histats.fasi', '1']);
_Hasync.push(['Histats.track_hits', '']);
(function () {
  var hs = document.createElement('script');
  hs.type = 'text/javascript';
  hs.async = true;
  hs.src = '//s10.histats.com/js15_as.js';
  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
})();`}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="//sstatic1.histats.com/0.gif?5049843&101" alt="" width="1" height="1" />
        </noscript>
      </body>
    </html>
  );
}
