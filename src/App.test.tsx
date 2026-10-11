import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === '/api/auth/me') {
          return {
            ok: false,
            status: 401,
            json: async () => ({ ok: false, message: 'Não autenticado.' }),
          } as Response;
        }

        if (url === '/api/recipes') {
          return {
            ok: true,
            json: async () => [],
          } as Response;
        }

        return {
          ok: false,
          status: 500,
          json: async () => ({ ok: false, message: 'Erro de teste.' }),
        } as Response;
      }),
    );
  });

  it('renderiza a página inicial com receitas padrão', async () => {
    render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(await screen.findByRole('heading', { name: /O que vai para a mesa/i })).toBeInTheDocument();
    expect(screen.getByText('Nhoque de abóbora com sálvia')).toBeInTheDocument();
  });

  it('filtra receitas por texto de pesquisa', async () => {
    const user = userEvent.setup();
    render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 700));

    await screen.findByText('Nhoque de abóbora com sálvia');
    await user.type(screen.getByTestId('input-search'), 'salada');

    expect(screen.getByText('Salada morna de grão-de-bico')).toBeInTheDocument();
    expect(screen.queryByText('Nhoque de abóbora com sálvia')).not.toBeInTheDocument();
  });

  it('guarda uma receita como favorita', async () => {
    const user = userEvent.setup();
    render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 700));

    const saveButton = await screen.findByTestId('button-save-nhoque-abobora');
    await user.click(saveButton);

    expect(screen.getByTestId('text-favorites-count')).toHaveTextContent('1');
    expect(JSON.parse(localStorage.getItem('receitas-favoritas') || '[]')).toContain('nhoque-abobora');
  });

  it('atualiza os metadados e dados estruturados ao abrir uma receita', async () => {
    const user = userEvent.setup();
    render(<App />);
    await new Promise((resolve) => setTimeout(resolve, 700));

    await user.click(await screen.findByTestId('button-open-nhoque-abobora'));

    expect(document.title).toBe('Nhoque de abóbora com sálvia | a mesa');
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Nhoque de abóbora com sálvia | a mesa',
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${window.location.origin}${window.location.pathname}`,
    );
    const structuredData = JSON.parse(document.getElementById('recipe-structured-data')?.textContent || '{}');
    expect(structuredData['@type']).toBe('Recipe');
    expect(structuredData.name).toBe('Nhoque de abóbora com sálvia');
  });
});
