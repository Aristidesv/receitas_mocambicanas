import { afterEach, describe, expect, it, vi } from 'vitest';

import robots from './robots.js';
import sitemap from './sitemap.js';

function createResponse() {
  const response = {
    headers: {},
    statusCode: 200,
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
  return response;
}

describe('SEO endpoints', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('gera robots.txt com sitemap no domínio público', () => {
    vi.stubEnv('SITE_URL', 'https://receitas.exemplo.com');
    const response = createResponse();

    robots({ headers: { host: 'preview.vercel.app' } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toContain('text/plain');
    expect(response.body).toContain('Disallow: /api/');
    expect(response.body).toContain('Sitemap: https://receitas.exemplo.com/sitemap.xml');
  });

  it('gera sitemap XML para a página inicial e Termos de Uso', () => {
    vi.stubEnv('SITE_URL', 'https://receitas.exemplo.com');
    const response = createResponse();

    sitemap({ headers: {} }, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toContain('application/xml');
    expect(response.body).toContain('<loc>https://receitas.exemplo.com</loc>');
    expect(response.body).toContain('<loc>https://receitas.exemplo.com/termos.html</loc>');
  });

  it('não gera URL pública quando o domínio configurado é inválido', () => {
    vi.stubEnv('SITE_URL', 'javascript:alert(1)');
    const response = createResponse();

    robots({ headers: {} }, response);

    expect(response.statusCode).toBe(503);
  });
});
