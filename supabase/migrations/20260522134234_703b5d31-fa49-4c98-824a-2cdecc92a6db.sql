ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN(tags);