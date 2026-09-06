/** Canonical origin. Feeds metadataBase, canonical URLs, robots.txt and sitemap.xml. */
export const SITE = 'https://aitoolbaba.online';

/**
 * The social card. Next drops the file-based opengraph-image as soon as a page
 * declares its own `openGraph`, which is how every tool page ended up sharing
 * with no picture — so every page spreads this in explicitly.
 */
export const OG_IMAGE = [
  {
    url: '/opengraph-image',
    width: 1200,
    height: 630,
    alt: 'Aitoollbaba — free image and privacy tools that run in your browser',
  },
];

/**
 * The public repository. The contact page points here instead of publishing an
 * email address, so there is nothing on the site for an address harvester to
 * take.
 */
export const REPO = 'https://github.com/shahinahamedsamir-code/Aitollbaba';
