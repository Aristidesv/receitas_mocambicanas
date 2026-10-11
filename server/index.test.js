import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const poolQueryMock = vi.fn();
const poolConnectMock = vi.fn();

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(function MockPool() {
      return {
        query: poolQueryMock,
        connect: poolConnectMock,
        release: vi.fn(),
      };
    }),
  },
}));

const scrypt = promisify(scryptCallback);

async function makePasswordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

const { default: app } = await import('./index.js');

describe('API do servidor', () => {
  beforeEach(() => {
    poolQueryMock.mockReset();
    poolConnectMock.mockReset();
  });

  it('GET /api/health responde com sucesso', async () => {
    poolQueryMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }], rowCount: 1 });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.message).toContain('PostgreSQL conectado');
  });

  it('POST /api/auth/login autentica com senha válida', async () => {
    const password = 'senha123';
    const passwordHash = await makePasswordHash(password);

    poolQueryMock
      .mockResolvedValueOnce({
        rows: [{
          email: 'ana@exemplo.com',
          name: 'Ana',
          password_hash: passwordHash,
          photo: '',
          country: '',
          address: '',
          hasRecoveryAnswer: true,
        }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@exemplo.com', password });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('ana@exemplo.com');
    expect(response.body.name).toBe('Ana');
    expect(response.headers['set-cookie'][0]).toContain('mesa_session=');
  });

  it('POST /api/auth/login rejeita credenciais inválidas', async () => {
    poolQueryMock.mockResolvedValueOnce({
      rows: [{
        email: 'ana@exemplo.com',
        name: 'Ana',
        password_hash: await makePasswordHash('outraSenha'),
        photo: '',
        country: '',
        address: '',
        hasRecoveryAnswer: false,
      }],
      rowCount: 1,
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@exemplo.com', password: 'senha123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Email ou senha incorretos.');
  });
});
