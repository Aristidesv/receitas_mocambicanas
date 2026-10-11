import { getSiteOrigin } from './site-origin.js';

export default function sitemap(req, res) {
  const origin = getSiteOrigin(req);
  if (!origin) {
    return res.status(503).send('Site URL is not configured.');
  }

  const pages = ['', '/termos.html'];
  const urls = pages
    .map((page) => `  <url><loc>${origin}${page}</loc></url>`)
    .join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
  );
}
