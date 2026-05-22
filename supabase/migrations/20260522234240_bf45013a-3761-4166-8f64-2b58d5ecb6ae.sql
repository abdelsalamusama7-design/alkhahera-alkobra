-- Keep one published article per original source URL, then prevent future duplicates.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY source_url
      ORDER BY published_at ASC NULLS LAST, created_at ASC, id ASC
    ) AS rn
  FROM public.articles
  WHERE source_url IS NOT NULL
    AND btrim(source_url) <> ''
)
DELETE FROM public.articles a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS articles_unique_source_url_idx
ON public.articles (source_url)
WHERE source_url IS NOT NULL AND btrim(source_url) <> '';
