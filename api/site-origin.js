export function getSiteOrigin(req) {
  const configured = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost?.split(',')[0]?.trim();
  const candidate = configured || (host ? `https://${host}` : '');

  if (!candidate) return null;

  try {
    const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}
