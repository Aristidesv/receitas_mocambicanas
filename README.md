# a mesa

Aplicação web de receitas pensada para o dia a dia: busca por ingredientes, categorias, favoritos, comentários, perfil do autor e criação de receitas pessoais.

## Visão geral

- Front-end em React + Vite
- Estilo com CSS modular e componentes UI reutilizáveis
- Back-end em Express com PostgreSQL
- Fluxo de autenticação com sessão e recuperação de senha
- Edição e exclusão de receitas do utilizador autenticado
- Experiência web apenas (sem suporte nativo mobile no escopo atual)

## Stack

- React 19
- Vite 8
- TypeScript
- Express 5
- PostgreSQL + pg
- Vitest + Testing Library

## Estrutura do projeto

- `src/` — frontend da aplicação web
- `server/` — API Express e esquema do PostgreSQL
- `dist/` — build de produção
- `.env.example` — variáveis de ambiente de exemplo

## Requisitos

- Node.js 20+
- PostgreSQL em execução
- Acesso local ou remoto com `DATABASE_URL` configurada

## Configuração

1. Instale dependências:

   ```bash
   npm install
   ```

2. Copie o ficheiro de exemplo e configure as variáveis:

   ```bash
   cp .env.example .env
   ```

3. Ajuste o valor de `DATABASE_URL` para o seu PostgreSQL local:

   ```env
   PORT=3001
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/receita
   DATABASE_SSL=false
   ```

## Execução

### Front-end

```bash
npm run dev
```

### API

Em um terminal separado:

```bash
npm run dev:server
```

A API fica disponível em `http://localhost:3001` e o frontend em `http://localhost:5173` por padrão.

## Scripts disponíveis

```bash
npm run dev
npm run build
npm run serve
npm run typecheck
npm run test
npm run test:watch
npm run server
npm run dev:server
```

## Testes

Os testes cobrem comportamentos principais do frontend e da API, como:

- renderização inicial da página
- pesquisa e filtragem por texto
- gestão de receitas favoritas
- saúde do servidor e autenticação de login

Para executar:

```bash
npm run test
```

## CI/CD

O projeto inclui um workflow do GitHub Actions em [.github/workflows/ci.yml](.github/workflows/ci.yml) que valida automaticamente:

- instalação das dependências
- `npm run typecheck`
- `npm run test`
- `npm run build`

Sempre que houver `push` para `main`/`master` ou `pull request` aberto.

## Deploy automático na Vercel

O projeto está preparado para servir a aplicação web estática e a API Express na Vercel:

- `vercel.json` configura o build do Vite e a pasta publicada.
- `api/[...path].js` encaminha os endpoints `/api/*` para a API Express.
- `.github/workflows/deploy-vercel.yml` executa os testes, a verificação de tipos e o build antes de publicar em produção após cada `push` para `main` ou `master`.

### Configuração inicial

1. Importe este repositório na Vercel e crie um projeto.
2. Na Vercel, configure as variáveis de ambiente de produção:
   - `DATABASE_URL` — ligação à base PostgreSQL.
   - `DATABASE_SSL` — `true` se o provedor PostgreSQL exigir SSL; caso contrário, `false`.
3. Nas configurações do repositório GitHub, adicione estes *repository secrets*:
   - `VERCEL_TOKEN` — token de acesso da Vercel.
   - `VERCEL_ORG_ID` — ID da conta/equipa Vercel.
   - `VERCEL_PROJECT_ID` — ID do projeto Vercel criado no passo 1.
4. Envie o workflow para o GitHub. A publicação automática começa após um `push` para `main`/`master`.

Também é possível publicar diretamente pela integração GitHub da Vercel; nesse caso, a Vercel gere os deploys sem precisar do workflow de publicação deste repositório.

O banco deve estar acessível pela função serverless. A inicialização do esquema ocorre na primeira chamada à API de cada instância Vercel. Como a Vercel executa funções serverless, use um PostgreSQL gerido acessível pela internet e configure corretamente SSL quando exigido pelo provedor.

## SEO

- A página inicial e os Termos de Uso incluem títulos, descrições, metadados Open Graph e robots.
- Ao abrir uma receita, o título e a descrição da página são atualizados e é adicionado JSON-LD `Recipe`.
- `/robots.txt` e `/sitemap.xml` são gerados com o domínio de produção da Vercel. Se necessário, defina `SITE_URL` nas variáveis da Vercel, por exemplo `https://www.exemplo.com`.
- Depois do deploy, submeta `https://SEU-DOMINIO/sitemap.xml` no Google Search Console.

As receitas abrem atualmente num painel associado a um fragmento `#receita=...`, não em URLs independentes renderizadas no servidor. Assim, o JSON-LD ajuda a descrever a receita quando a página é renderizada, mas não substitui páginas públicas individuais/pré-renderizadas para indexação completa de cada receita.

## Observações

- Este projeto é web-only: não inclui build nativo para Android/iOS como objetivo principal.
- Os comandos de Capacitor continuam disponíveis, mas não são a base do fluxo recomendado para desenvolvimento web.
- Termos de Uso: [`public/termos.html`](public/termos.html). Contacto do desenvolvedor: [aristidesvundo@gmail.com](mailto:aristidesvundo@gmail.com).
