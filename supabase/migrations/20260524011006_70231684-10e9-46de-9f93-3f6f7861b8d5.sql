
-- Add RSS sources for major Egyptian newspapers via Google News RSS (reliable & uniform)
-- Papers: الأهرام, الأخبار, الجمهورية, المصري اليوم, اليوم السابع
INSERT INTO public.rss_sources (name, url, category_slug, source_label, enabled, auto_publish, max_items, sort_order)
VALUES
  -- الأهرام
  ('الأهرام - عام',     'https://news.google.com/rss/search?q=site:ahram.org.eg&hl=ar&gl=EG&ceid=EG:ar',                                                           'local',    'الأهرام',     true, false, 10, 20),
  ('الأهرام - سياسة',   'https://news.google.com/rss/search?q=site:ahram.org.eg+%D8%B3%D9%8A%D8%A7%D8%B3%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                            'politics', 'الأهرام',     true, false, 8,  21),
  ('الأهرام - اقتصاد',  'https://news.google.com/rss/search?q=site:ahram.org.eg+%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF&hl=ar&gl=EG&ceid=EG:ar',                      'economy',  'الأهرام',     true, false, 8,  22),
  ('الأهرام - رياضة',   'https://news.google.com/rss/search?q=site:ahram.org.eg+%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                            'sports',   'الأهرام',     true, false, 8,  23),

  -- الأخبار (أخبار اليوم)
  ('الأخبار - عام',     'https://news.google.com/rss/search?q=site:akhbarelyom.com&hl=ar&gl=EG&ceid=EG:ar',                                                        'local',    'الأخبار',     true, false, 10, 30),
  ('الأخبار - سياسة',   'https://news.google.com/rss/search?q=site:akhbarelyom.com+%D8%B3%D9%8A%D8%A7%D8%B3%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                         'politics', 'الأخبار',     true, false, 8,  31),
  ('الأخبار - اقتصاد',  'https://news.google.com/rss/search?q=site:akhbarelyom.com+%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF&hl=ar&gl=EG&ceid=EG:ar',                   'economy',  'الأخبار',     true, false, 8,  32),
  ('الأخبار - رياضة',   'https://news.google.com/rss/search?q=site:akhbarelyom.com+%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                         'sports',   'الأخبار',     true, false, 8,  33),

  -- الجمهورية
  ('الجمهورية - عام',    'https://news.google.com/rss/search?q=site:gomhuriaonline.com&hl=ar&gl=EG&ceid=EG:ar',                                                    'local',    'الجمهورية',   true, false, 10, 40),
  ('الجمهورية - سياسة',  'https://news.google.com/rss/search?q=site:gomhuriaonline.com+%D8%B3%D9%8A%D8%A7%D8%B3%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                     'politics', 'الجمهورية',   true, false, 8,  41),
  ('الجمهورية - اقتصاد', 'https://news.google.com/rss/search?q=site:gomhuriaonline.com+%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF&hl=ar&gl=EG&ceid=EG:ar',               'economy',  'الجمهورية',   true, false, 8,  42),
  ('الجمهورية - رياضة',  'https://news.google.com/rss/search?q=site:gomhuriaonline.com+%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                     'sports',   'الجمهورية',   true, false, 8,  43),

  -- المصري اليوم (إضافة أقسام جديدة بجانب الموجود)
  ('المصري اليوم - عام',     'https://news.google.com/rss/search?q=site:almasryalyoum.com&hl=ar&gl=EG&ceid=EG:ar',                                                  'local',    'المصري اليوم', true, false, 10, 50),
  ('المصري اليوم - سياسة',   'https://news.google.com/rss/search?q=site:almasryalyoum.com+%D8%B3%D9%8A%D8%A7%D8%B3%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                   'politics', 'المصري اليوم', true, false, 8,  51),
  ('المصري اليوم - اقتصاد',  'https://news.google.com/rss/search?q=site:almasryalyoum.com+%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF&hl=ar&gl=EG&ceid=EG:ar',             'economy',  'المصري اليوم', true, false, 8,  52),
  ('المصري اليوم - رياضة',   'https://news.google.com/rss/search?q=site:almasryalyoum.com+%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9&hl=ar&gl=EG&ceid=EG:ar',                   'sports',   'المصري اليوم', true, false, 8,  53),

  -- اليوم السابع (إضافة عام/عالم بجانب الأقسام الموجودة)
  ('اليوم السابع - عام',   'https://news.google.com/rss/search?q=site:youm7.com&hl=ar&gl=EG&ceid=EG:ar',                                                            'local',    'اليوم السابع', true, false, 10, 60),
  ('اليوم السابع - عالم',  'https://news.google.com/rss/search?q=site:youm7.com+%D8%B9%D8%A7%D9%84%D9%85&hl=ar&gl=EG&ceid=EG:ar',                                  'world',    'اليوم السابع', true, false, 8,  61)
ON CONFLICT (url) DO NOTHING;
