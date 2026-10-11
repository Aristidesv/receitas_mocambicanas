CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo TEXT,
  country TEXT,
  address TEXT,
  recovery_answer_hash TEXT,
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

CREATE TABLE IF NOT EXISTS recipe_comments (
  id BIGSERIAL PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT REFERENCES users(email) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recipe_comments_recipe_id_created_at_idx
  ON recipe_comments (recipe_id, created_at DESC);
