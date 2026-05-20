import { createFileRoute } from "@tanstack/react-router";
import { ingestAllFeeds } from "@/lib/rss.server";

export const Route = createFileRoute("/api/public/ingest-rss")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token") || request.headers.get("x-ingest-token");
        const expected = process.env.RSS_INGEST_TOKEN;
        if (!expected || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const result = await ingestAllFeeds();
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
