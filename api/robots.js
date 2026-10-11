import { getSiteOrigin } from './site-origin.js';

export default function robots(req, res) {
  const origin = getSiteOrigin(req);
  if (!origin) {
    return res.status(503).send('Site URL is not configured.');
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
}
