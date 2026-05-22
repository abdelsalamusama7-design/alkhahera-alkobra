-- Article views tracking table
CREATE TABLE public.article_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  path text,
  referrer text,
  referrer_host text,
  source_type text NOT NULL DEFAULT 'direct',
  country text,
  device_type text NOT NULL DEFAULT 'unknown',
  user_agent text
);

CREATE INDEX idx_article_views_article ON public.article_views(article_id);
CREATE INDEX idx_article_views_viewed_at ON public.article_views(viewed_at DESC);
CREATE INDEX idx_article_views_source ON public.article_views(source_type);
CREATE INDEX idx_article_views_country ON public.article_views(country);

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Only admins/editors can read raw views; insertion happens through server fns using service role.
CREATE POLICY "article_views editor read"
ON public.article_views FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));