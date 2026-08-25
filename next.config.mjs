/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Every route is prerendered and the tool runs entirely in the browser, so
  // the whole site ships as plain files — no Node process to host.
  // `npm run build` writes them to ./out for upload to any static host.
  output: 'export',

  // Static export cannot run the image optimiser. Nothing here uses
  // next/image, but this keeps the door shut explicitly.
  images: { unoptimized: true },
};

export default nextConfig;
