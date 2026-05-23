
-- RSS Sources management
CREATE TABLE public.rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category_slug TEXT NOT NULL,
  source_label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  max_items INTEGER NOT NULL DEFAULT 8,
  sort_order INTEGER NOT NULL DEFAULT 0,
  last_fetched_at TIMESTAMPTZ,
  last_inserted_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  total_inserted BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rss_sources staff read" ON public.rss_sources
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "rss_sources admin write" ON public.rss_sources
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER rss_sources_updated_at BEFORE UPDATE ON public.rss_sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Article drafts (preview before publish)
CREATE TABLE public.article_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  category_id UUID,
  source TEXT,
  source_url TEXT UNIQUE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  original_title TEXT,
  original_excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejected_reason TEXT,
  approved_article_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX article_drafts_status_idx ON public.article_drafts (status, created_at DESC);

ALTER TABLE public.article_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drafts staff read" ON public.article_drafts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "drafts staff write" ON public.article_drafts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER article_drafts_updated_at BEFORE UPDATE ON public.article_drafts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default RSS sources
INSERT INTO public.rss_sources (name, url, category_slug, source_label, sort_order, auto_publish) VALUES
('اليوم السابع - سياسة', 'https://www.youm7.com/rss/SectionRss?SectionID=65', 'politics', 'اليوم السابع', 10, true),
('اليوم السابع - اقتصاد', 'https://www.youm7.com/rss/SectionRss?SectionID=297', 'economy', 'اليوم السابع', 20, true),
('اليوم السابع - رياضة', 'https://www.youm7.com/rss/SectionRss?SectionID=88', 'sports', 'اليوم السابع', 30, true),
('اليوم السابع - فنون', 'https://www.youm7.com/rss/SectionRss?SectionID=203', 'arts', 'اليوم السابع', 40, false),
('اليوم السابع - حوادث', 'https://www.youm7.com/rss/SectionRss?SectionID=319', 'accidents', 'اليوم السابع', 50, false),
('اليوم السابع - تكنولوجيا', 'https://www.youm7.com/rss/SectionRss?SectionID=94', 'technology', 'اليوم السابع', 60, false),
('اليوم السابع - محليات', 'https://www.youm7.com/rss/SectionRss?SectionID=97', 'local', 'اليوم السابع', 70, false),
('المصري اليوم - عام', 'https://www.almasryalyoum.com/rss/rssfeed', 'local', 'المصري اليوم', 80, false),
('المصري اليوم - سياسة', 'https://www.almasryalyoum.com/rss/rssfeeds?sectionId=14', 'politics', 'المصري اليوم', 90, true),
('المصري اليوم - اقتصاد', 'https://www.almasryalyoum.com/rss/rssfeeds?sectionId=18', 'economy', 'المصري اليوم', 100, true),
('المصري اليوم - رياضة', 'https://www.almasryalyoum.com/rss/rssfeeds?sectionId=16', 'sports', 'المصري اليوم', 110, false),
('المصري اليوم - فنون', 'https://www.almasryalyoum.com/rss/rssfeeds?sectionId=20', 'arts', 'المصري اليوم', 120, false),
('مصراوي - عام', 'https://www.masrawy.com/export/rss', 'local', 'مصراوي', 130, false),
('مصراوي - سياسة', 'https://www.masrawy.com/export/rss?sectionId=204895', 'politics', 'مصراوي', 140, false),
('مصراوي - اقتصاد', 'https://www.masrawy.com/export/rss?sectionId=204896', 'economy', 'مصراوي', 150, false),
('مصراوي - رياضة', 'https://www.masrawy.com/export/rss?sectionId=205220', 'sports', 'مصراوي', 160, false),
('مصراوي - تكنولوجيا', 'https://www.masrawy.com/export/rss?sectionId=205230', 'technology', 'مصراوي', 170, false),
('MSN عربي', 'https://www.msn.com/ar-xl/news/rss', 'world', 'MSN عربي', 180, true),
('BBC عربي', 'https://feeds.bbci.co.uk/arabic/rss.xml', 'world', 'BBC عربي', 190, true),
('الجزيرة', 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9', 'world', 'الجزيرة', 200, true),
('الشرق - عام', 'https://news.google.com/rss/search?q=site:asharq.com&hl=ar&gl=EG&ceid=EG:ar', 'world', 'الشرق', 210, true),
('الشرق - سياسة', 'https://news.google.com/rss/search?q=site:asharq.com+%D8%B3%D9%8A%D8%A7%D8%B3%D8%A9&hl=ar&gl=EG&ceid=EG:ar', 'politics', 'الشرق', 220, true),
('الشرق - اقتصاد', 'https://news.google.com/rss/search?q=site:asharq.com+%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF&hl=ar&gl=EG&ceid=EG:ar', 'economy', 'الشرق', 230, true)
ON CONFLICT (url) DO NOTHING;
