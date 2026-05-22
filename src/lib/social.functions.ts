import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hasPerm } from "@/lib/permissions";
import { postArticleToFacebook, postUnpostedArticlesToFacebook } from "@/lib/facebook.server";

async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.role as string);
}

// Post a single article to Facebook (manual trigger)
export const postToFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ articleId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const roles = await getUserRoles(context.userId);
    if (!hasPerm(roles, "ingest_rss")) throw new Error("ليس لديك صلاحية");

    const { data: article } = await supabaseAdmin
      .from("articles")
      .select("id, title, excerpt, slug, cover_image, tags")
      .eq("id", data.articleId)
      .maybeSingle();

    if (!article) throw new Error("الخبر غير موجود");

    const siteUrl = process.env.SITE_URL || "https://alkhahera-alkobra.lovable.app";
    const result = await postArticleToFacebook(
      { ...article, excerpt: article.excerpt ?? "" },
      siteUrl,
    );
    return result;
  });

// Post all unposted articles to Facebook (batch)
export const postAllToFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getUserRoles(context.userId);
    if (!hasPerm(roles, "ingest_rss")) throw new Error("ليس لديك صلاحية");

    const siteUrl = process.env.SITE_URL || "https://alkhahera-alkobra.lovable.app";
    return postUnpostedArticlesToFacebook(siteUrl, 5);
  });

// Get Facebook posting status for recent articles
export const getFacebookStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getUserRoles(context.userId);
    if (!hasPerm(roles, "ingest_rss")) throw new Error("ليس لديك صلاحية");

    const { data: posts } = await supabaseAdmin
      .from("social_posts")
      .select("article_id, platform, status, post_id, error_message, posted_at")
      .eq("platform", "facebook")
      .order("posted_at", { ascending: false })
      .limit(20);

    return { posts: posts ?? [] };
  });
