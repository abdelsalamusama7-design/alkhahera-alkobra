export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  category_id: string | null;
  author_id: string | null;
  author_name: string | null;
  source: string | null;
  source_url: string | null;
  is_breaking: boolean;
  is_published: boolean;
  published_at: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  category?: { id: string; slug: string; name: string } | null;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};
