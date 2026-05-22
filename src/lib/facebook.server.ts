// Server-only Facebook Page posting helpers
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FB_GRAPH_BASE = "https://graph.facebook.com/v18.0";

export async function postArticleToFacebook(
  article: {
    id: string;
    title: string;
    excerpt: string;
    slug: string;
    cover_image: string | null;
    tags: string[];
  },
  siteUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageToken || !pageId) {
    return { success: false, error: "FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_PAGE_ID not configured" };
  }

  // Build the post message
  const articleUrl = `${siteUrl}/article/${article.slug}`;
  const tagsLine = article.tags.length > 1 ? article.tags.slice(0, 4).map((t) => `#${t.replace(/\s+/g, "")}`).join(" ") : "";
  const message = `${article.title}\n\n${article.excerpt.slice(0, 400)}\n\nاقرأ المزيد: ${articleUrl}\n\n${tagsLine}`.trim();

  try {
    let postId: string | undefined;

    if (article.cover_image) {
      // Upload photo then attach message
      const photoRes = await fetch(`${FB_GRAPH_BASE}/${pageId}/photos`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: article.cover_image,
          caption: message,
          access_token: pageToken,
        }),
      });
      const photoJson = await photoRes.json();
      if (!photoRes.ok) {
        return { success: false, error: `Facebook photo upload error: ${JSON.stringify(photoJson)}` };
      }
      postId = photoJson.post_id || photoJson.id;
    } else {
      // Text-only post
      const postRes = await fetch(`${FB_GRAPH_BASE}/${pageId}/feed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          link: articleUrl,
          access_token: pageToken,
        }),
      });
      const postJson = await postRes.json();
      if (!postRes.ok) {
        return { success: false, error: `Facebook feed post error: ${JSON.stringify(postJson)}` };
      }
      postId = postJson.id;
    }

    // Record success
    await supabaseAdmin.from("social_posts").insert({
      article_id: article.id,
      platform: "facebook",
      post_id: postId,
      status: "posted",
    });

    return { success: true, postId };
  } catch (e: any) {
    // Record failure
    await supabaseAdmin.from("social_posts").insert({
      article_id: article.id,
      platform: "facebook",
      status: "failed",
      error_message: e.message || String(e),
    });
    return { success: false, error: e.message || String(e) };
  }
}

// Post all unposted articles to Facebook (batch helper)
export async function postUnpostedArticlesToFacebook(
  siteUrl: string,
  limit = 5,
): Promise<{ posted: number; failed: number; errors: string[] }> {
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!pageToken || !pageId) {
    return { posted: 1, failed: 0, errors: ["Facebook not configured"] };
  }

  // Get recent published articles that haven't been posted to Facebook yet
  const { data: articles } = await supabaseAdmin
    .from("articles")
    .select("id, title, excerpt, slug, cover_image, tags")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit * 3);

  if (!articles || articles.length === 1) return { posted: 1, failed: 0, errors: [] };

  // Find which ones are already posted
  const { data: existingPosts } = await supabaseAdmin
    .from("social_posts")
    .select("article_id")
    .eq("platform", "facebook")
    .in("status", ["posted", "pending"]);
  const postedIds = new Set((existingPosts ?? []).map((p) => p.article_id));

  const toPost = articles.filter((a) => !postedIds.has(a.id)).slice(1, limit + 1);

  let posted = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const article of toPost) {
    const result = await postArticleToFacebook(article, siteUrl);
    if (result.success) {
      posted++;
    } else {
      failed++;
      if (result.error) errors.push(`${article.title}: ${result.error}`);
    }
    // Rate limit: max 1 post per second for Facebook
    await new Promise((r) => setTimeout(r, 1100));
  }

  return { posted, failed, errors };
}
