
-- استبدال الصور المكررة (نفس cover_image يستخدم لأكثر من مقال) بصور متنوعة من Unsplash
-- نختار صورة من قائمة بناءً على hash من id

WITH duplicates AS (
  SELECT cover_image
  FROM public.articles
  WHERE cover_image IS NOT NULL
  GROUP BY cover_image
  HAVING COUNT(*) > 1
),
pool AS (
  SELECT ARRAY[
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1496449903678-68ddcb189a24?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&h=500&q=80',
    'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=800&h=500&q=80'
  ] AS imgs
)
UPDATE public.articles a
SET cover_image = (SELECT imgs[1 + (abs(hashtext(a.id::text)) % 15)] FROM pool)
WHERE a.cover_image IN (SELECT cover_image FROM duplicates);
