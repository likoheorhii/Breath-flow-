-- Requires PostgreSQL + pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  age INT,
  location TEXT,
  consent_flags JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dreams (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  mood TEXT,
  visibility TEXT DEFAULT 'private',
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE symbols (
  id UUID PRIMARY KEY,
  dream_id UUID REFERENCES dreams(id) ON DELETE CASCADE,
  span TEXT NOT NULL,
  label TEXT NOT NULL,
  confidence REAL
);

CREATE TABLE archetype_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vector vector(15) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX archetype_profiles_ivf ON archetype_profiles USING ivfflat (vector);

CREATE TABLE insights (
  id UUID PRIMARY KEY,
  dream_id UUID REFERENCES dreams(id) ON DELETE CASCADE,
  summary TEXT,
  archetypes JSONB,
  practices JSONB,
  safety_notes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE circles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  rules TEXT
);

CREATE TABLE posts (
  id UUID PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);