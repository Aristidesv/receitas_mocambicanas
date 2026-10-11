import express from 'express';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const { Pool } = pg;
const scrypt = promisify(scryptCallback);
const sessionCookieName = 'mesa_session';
const sessionDurationSeconds = 60 * 60 * 24 * 30;
const resetPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { ok: false, message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
});
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const sampleRecipes = [
  {
    id: 'nhoque-abobora',
    name: 'Nhoque de abóbora com sálvia',
    category: 'Vegetarianas',
    description: 'Macio, dourado e com aquele perfume de manteiga que abraça a cozinha.',
    time: '45 min',
    servings: '2 porcoes',
    image: 'dish-gold',
    ingredients: [
      { name: 'Abóbora cabotiá assada', amount: '500 g' },
      { name: 'Farinha de trigo', amount: '1 xícara' },
      { name: 'Manteiga', amount: '2 colheres' },
      { name: 'Folhas de sálvia', amount: '8 unidades' },
      { name: 'Parmesão ralado', amount: '½ xícara' },
      { name: 'Sal e noz-moscada', amount: 'a gosto' },
    ],
    steps: [
      'Asse a abóbora até ficar bem macia e amasse ainda quente. Espere esfriar um pouco.',
      'Junte a farinha, o sal e a noz-moscada aos poucos, apenas até formar uma massa macia.',
      'Faça rolinhos, corte os nhoques e cozinhe em água fervente até subirem à superfície.',
      'Doure a manteiga com a sálvia, envolva os nhoques e finalize com parmesão.',
    ],
    tip: 'Quanto menos farinha, mais leve o nhoque. A abóbora deve estar bem sequinha antes de entrar na massa.',
    is_user_created: false,
  },
  {
    id: 'arroz-forno',
    name: 'Arroz de forno da casa',
    category: 'Conforto',
    description: 'A receita que transforma sobras honestas em um almoço cheio de sabor.',
    time: '35 min',
    servings: '4 porcoes',
    image: 'dish-tomato',
    ingredients: [
      { name: 'Arroz cozido', amount: '3 xícaras' },
      { name: 'Frango desfiado', amount: '300 g' },
      { name: 'Milho verde', amount: '½ lata' },
      { name: 'Tomate picado', amount: '2 unidades' },
      { name: 'Muçarela', amount: '150 g' },
      { name: 'Cheiro-verde', amount: 'a gosto' },
    ],
    steps: [
      'Refogue o tomate até desmanchar e junte o frango, o milho e o cheiro-verde.',
      'Misture o refogado ao arroz cozido, ajustando o sal e a pimenta.',
      'Espalhe em uma assadeira, cubra com a muçarela e leve ao forno alto.',
      'Asse por 15 minutos, até o queijo borbulhar e ganhar pontinhos dourados.',
    ],
    tip: 'Um fio de azeite sobre o queijo antes de assar deixa a cobertura mais dourada.',
    is_user_created: false,
  },
];

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password_hash TEXT,
        photo TEXT,
        country TEXT,
        address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        time TEXT NOT NULL,
        servings TEXT NOT NULL,
        image TEXT,
        ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
        steps JSONB NOT NULL DEFAULT '[]'::jsonb,
        tip TEXT,
        video_url TEXT,
        photo TEXT,
        author_name TEXT,
        author_email TEXT,
        author_photo TEXT,
        author_country TEXT,
        author_address TEXT,
        is_user_created BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photo TEXT;
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_name TEXT;
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_email TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_answer_hash TEXT;
      CREATE TABLE IF NOT EXISTS user_sessions (
        token_hash TEXT PRIMARY KEY,
        user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions (expires_at);
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_photo TEXT;
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_country TEXT;
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_address TEXT;
      ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_email TEXT;
      INSERT INTO users (email, name, photo, country, address)
        SELECT DISTINCT ON (author_email) author_email, author_name, author_photo, author_country, author_address
        FROM recipes
        WHERE author_email IS NOT NULL AND author_name IS NOT NULL
        ORDER BY author_email, created_at DESC
        ON CONFLICT (email) DO NOTHING;
      UPDATE recipes SET author_name = users.name, author_photo = users.photo, author_country = users.country
        FROM users WHERE recipes.author_email = users.email;
      CREATE TABLE IF NOT EXISTS recipe_comments (
        id BIGSERIAL PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT REFERENCES users(email) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE recipe_comments ADD COLUMN IF NOT EXISTS author_email TEXT REFERENCES users(email) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS recipe_comments_recipe_id_created_at_idx
        ON recipe_comments (recipe_id, created_at DESC);
    `);

    const { rowCount } = await client.query('SELECT 1 FROM recipes LIMIT 1;');

    if (rowCount === 0) {
      for (const recipe of sampleRecipes) {
        await client.query(
          `
            INSERT INTO recipes (id, name, category, description, time, servings, image, ingredients, steps, tip, is_user_created)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `,
          [
            recipe.id,
            recipe.name,
            recipe.category,
            recipe.description,
            recipe.time,
            recipe.servings,
            recipe.image,
            JSON.stringify(recipe.ingredients),
            JSON.stringify(recipe.steps),
            recipe.tip,
            recipe.is_user_created,
          ],
        );
      }
    }
  } finally {
    client.release();
  }
}

function readSessionToken(req) {
  const cookies = req.headers.cookie?.split(';') ?? [];
  const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith(`${sessionCookieName}=`));
  return sessionCookie?.trim().slice(sessionCookieName.length + 1) ?? '';
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${sessionCookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDurationSeconds}${secure}`);
}

async function createSession(email, res) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await pool.query(
    'INSERT INTO user_sessions (token_hash, user_email, expires_at) VALUES ($1, $2, NOW() + ($3 * INTERVAL \'1 second\'))',
    [tokenHash, email, sessionDurationSeconds],
  );
  setSessionCookie(res, token);
}

async function requireAuth(req, res, next) {
  const token = readSessionToken(req);
  if (!token) return res.status(401).json({ ok: false, message: 'Inicie sessão para continuar.' });

  try {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      `SELECT users.email, users.name, users.photo, users.country, users.address,
              users.recovery_answer_hash IS NOT NULL AS "hasRecoveryAnswer"
       FROM user_sessions
       JOIN users ON users.email = user_sessions.user_email
       WHERE user_sessions.token_hash = $1 AND user_sessions.expires_at > NOW()`,
      [tokenHash],
    );
    if (result.rowCount === 0) return res.status(401).json({ ok: false, message: 'Sessão expirada. Entre novamente.' });
    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao validar sessão.', error: error.message });
  }
}

async function verifyPassword(password, storedHash) {
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  const actualHash = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actualHash.length && timingSafeEqual(expected, actualHash);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const passwordHash = await scrypt(password, salt, 64);
  return `${salt}:${passwordHash.toString('hex')}`;
}

function normalizeFavoriteFood(answer) {
  return answer.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

let databaseInitialization;

app.use(async (_req, res, next) => {
  if (process.env.VERCEL !== '1' || process.env.NODE_ENV === 'test') return next();

  try {
    databaseInitialization ??= initializeDatabase();
    await databaseInitialization;
    next();
  } catch (error) {
    databaseInitialization = undefined;
    console.error('Erro ao inicializar banco de dados:', error.message);
    res.status(503).json({ ok: false, message: 'Banco de dados temporariamente indisponível.' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'PostgreSQL conectado com sucesso.' });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Não foi possível conectar ao PostgreSQL.',
      error: error.message,
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const favoriteFood = typeof req.body.favoriteFood === 'string' ? normalizeFavoriteFood(req.body.favoriteFood) : '';
  const photo = typeof req.body.photo === 'string' ? req.body.photo : '';
  const country = typeof req.body.country === 'string' ? req.body.country.trim() : '';
  const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';

  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 200 || favoriteFood.length < 2 || favoriteFood.length > 120 || country.length > 80 || address.length > 250) {
    return res.status(400).json({ ok: false, message: 'Confira nome, email, senha e comida favorita.' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const recoveryAnswerHash = await hashPassword(favoriteFood);
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, recovery_answer_hash, photo, country, address)
       VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''))
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         recovery_answer_hash = EXCLUDED.recovery_answer_hash,
         photo = EXCLUDED.photo,
         country = EXCLUDED.country,
         address = EXCLUDED.address,
         updated_at = NOW()
       WHERE users.password_hash IS NULL
      RETURNING email, name, photo, country, address, recovery_answer_hash IS NOT NULL AS "hasRecoveryAnswer"`,
          [email, name, passwordHash, recoveryAnswerHash, photo, country, address],
    );
    if (result.rowCount === 0) return res.status(409).json({ ok: false, message: 'Este email já tem uma conta. Entre com sua senha.' });
    await createSession(email, res);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao criar conta.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ ok: false, message: 'Informe email e senha.' });

  try {
    const result = await pool.query(
      'SELECT email, name, password_hash, photo, country, address, recovery_answer_hash IS NOT NULL AS "hasRecoveryAnswer" FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];
    if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ ok: false, message: 'Email ou senha incorretos.' });
    }
    await createSession(email, res);
    const { password_hash: _passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao iniciar sessão.', error: error.message });
  }
});

app.post('/api/auth/reset-password', resetPasswordRateLimit, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const favoriteFood = typeof req.body.favoriteFood === 'string' ? normalizeFavoriteFood(req.body.favoriteFood) : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || favoriteFood.length < 2 || favoriteFood.length > 120 || password.length < 8 || password.length > 200) {
    return res.status(400).json({ ok: false, message: 'Email, resposta ou senha inválidos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'SELECT recovery_answer_hash FROM users WHERE email = $1 AND password_hash IS NOT NULL FOR UPDATE',
      [email],
    );
    const user = result.rows[0];
    if (!user?.recovery_answer_hash || !(await verifyPassword(favoriteFood, user.recovery_answer_hash))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, message: 'Email, resposta ou senha inválidos.' });
    }

    const passwordHash = await hashPassword(password);
    await client.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE email = $1', [email, passwordHash]);
    await client.query('DELETE FROM user_sessions WHERE user_email = $1', [email]);
    await client.query('COMMIT');
    res.json({ ok: true, message: 'Senha alterada. Entre com a nova senha.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ ok: false, message: 'Não foi possível alterar a senha.' });
  } finally {
    client.release();
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(req.user);
});

app.post('/api/auth/logout', async (req, res) => {
  const token = readSessionToken(req);
  if (token) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]).catch(() => {});
  }
  res.setHeader('Set-Cookie', `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

app.get('/api/users/profile', requireAuth, async (req, res) => {
  res.json(req.user);
});

app.put('/api/users/profile', requireAuth, async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const photo = typeof req.body.photo === 'string' ? req.body.photo : '';
  const country = typeof req.body.country === 'string' ? req.body.country.trim() : '';
  const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
  const favoriteFood = typeof req.body.favoriteFood === 'string' ? normalizeFavoriteFood(req.body.favoriteFood) : '';

  if (!name || name.length > 100 || country.length > 80 || address.length > 250 || favoriteFood.length > 120) {
    return res.status(400).json({ ok: false, message: 'Confira nome, país e morada.' });
  }

  try {
    const recoveryAnswerHash = favoriteFood ? await hashPassword(favoriteFood) : null;
    const result = await pool.query(
      `UPDATE users SET name = $2, photo = NULLIF($3, ''), country = NULLIF($4, ''), address = NULLIF($5, ''),
       recovery_answer_hash = COALESCE($6, recovery_answer_hash), updated_at = NOW()
       WHERE email = $1
       RETURNING email, name, photo, country, address, recovery_answer_hash IS NOT NULL AS "hasRecoveryAnswer"`,
      [req.user.email, name, photo, country, address, recoveryAnswerHash],
    );
    if (result.rowCount === 0) return res.status(404).json({ ok: false, message: 'Conta não encontrada.' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao guardar perfil.', error: error.message });
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const sessionToken = readSessionToken(req);
    const sessionTokenHash = sessionToken ? createHash('sha256').update(sessionToken).digest('hex') : '';
    const result = await pool.query(
      `SELECT recipes.*, users.name AS profile_name, users.photo AS profile_photo, users.country AS profile_country,
              user_sessions.user_email IS NOT NULL AS is_owner
       FROM recipes
       LEFT JOIN users ON users.email = recipes.author_email
       LEFT JOIN user_sessions ON user_sessions.token_hash = $1
         AND user_sessions.user_email = recipes.author_email
         AND user_sessions.expires_at > NOW()
       WHERE recipes.is_user_created = true
       ORDER BY recipes.created_at DESC`,
      [sessionTokenHash],
    );

    const recipes = result.rows.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      description: recipe.description,
      time: recipe.time,
      servings: recipe.servings,
      image: recipe.image,
      ingredients: (recipe.ingredients ?? []).map((item) => Array.isArray(item) ? item : [item.name, item.amount]),
      steps: recipe.steps ?? [],
      tip: recipe.tip,
      isUserCreated: true,
      isOwner: recipe.is_owner,
      photo: recipe.photo,
      videoUrl: recipe.video_url ?? '',
      authorName: recipe.profile_name ?? recipe.author_name ?? '',
      authorPhoto: recipe.profile_photo ?? recipe.author_photo ?? '',
      authorCountry: recipe.profile_country ?? recipe.author_country ?? '',
    }));

    res.json(recipes);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Erro ao buscar receitas.',
      error: error.message,
    });
  }
});

app.post('/api/recipes', requireAuth, async (req, res) => {
  try {
    const { id, name, category, description, time, servings, image, ingredients, steps, tip, videoUrl, photo } = req.body;

    if (!id || !name || !category || !description || !time || !servings || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return res.status(400).json({ ok: false, message: 'Dados da receita incompletos.' });
    }

    const query = `
      INSERT INTO recipes (id, name, category, description, time, servings, image, ingredients, steps, tip, video_url, photo, author_email, is_user_created)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        time = EXCLUDED.time,
        servings = EXCLUDED.servings,
        image = EXCLUDED.image,
        ingredients = EXCLUDED.ingredients,
        steps = EXCLUDED.steps,
        tip = EXCLUDED.tip,
        video_url = EXCLUDED.video_url,
        photo = EXCLUDED.photo,
        author_email = EXCLUDED.author_email,
        is_user_created = true
      WHERE recipes.author_email = EXCLUDED.author_email AND recipes.is_user_created = true
      RETURNING id
    `;

    const result = await pool.query(query, [
      id,
      name,
      category,
      description,
      time,
      servings,
      image || null,
      JSON.stringify(ingredients ?? []),
      JSON.stringify(steps ?? []),
      tip || null,
      videoUrl || null,
      photo || null,
      req.user.email,
    ]);
    if (result.rowCount === 0) {
      return res.status(403).json({ ok: false, message: 'Só quem criou a receita pode editá-la.' });
    }

    res.status(200).json({ ok: true, message: 'Receita salva com sucesso.' });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Erro ao salvar receita.',
      error: error.message,
    });
  }
});

app.delete('/api/recipes/:id', requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      'DELETE FROM recipes WHERE id = $1 AND author_email = $2 AND is_user_created = true RETURNING id',
      [req.params.id, req.user.email],
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, message: 'Receita não encontrada.' });
    }
    await client.query('DELETE FROM recipe_comments WHERE recipe_id = $1', [req.params.id]);
    await client.query('COMMIT');

    res.json({ ok: true, message: 'Receita excluída.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ ok: false, message: 'Erro ao excluir receita.', error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/recipes/:id/comments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT recipe_comments.id, recipe_comments.recipe_id AS "recipeId",
              COALESCE(users.name, recipe_comments.author_name) AS "authorName",
              recipe_comments.content, recipe_comments.created_at AS "createdAt"
       FROM recipe_comments
       LEFT JOIN users ON users.email = recipe_comments.author_email
       WHERE recipe_comments.recipe_id = $1
       ORDER BY recipe_comments.created_at DESC`,
      [req.params.id],
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao carregar comentários.', error: error.message });
  }
});

app.post('/api/recipes/:id/comments', requireAuth, async (req, res) => {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!content || content.length > 1000) {
      return res.status(400).json({ ok: false, message: 'Escreva um comentário com até 1000 caracteres.' });
    }

    const result = await pool.query(
      'INSERT INTO recipe_comments (recipe_id, author_name, author_email, content) VALUES ($1, $2, $3, $4) RETURNING id, recipe_id AS "recipeId", author_name AS "authorName", content, created_at AS "createdAt"',
      [req.params.id, req.user.name, req.user.email, content],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Erro ao publicar comentário.', error: error.message });
  }
});

app.use((error, _req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, message: 'A foto excede o limite de 3 MB. Escolha uma imagem menor.' });
  }
  next(error);
});

if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
  app.listen(port, async () => {
    console.log(`Servidor rodando na porta ${port}`);

    try {
      await initializeDatabase();
      console.log('Banco de dados inicializado com sucesso.');
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error.message);
    }
  });
}

export default app;
