// Server-only Web Push sender.
import webpush from "web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

function configure() {
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!priv) throw new Error("VAPID_PRIVATE_KEY غير مكوّن");
  webpush.setVapidDetails(
    "mailto:admin@kaheraalkobra.online",
    VAPID_PUBLIC_KEY,
    priv,
  );
}

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  image?: string;
  tag?: string;
};

export async function sendPushToAll(payload: PushPayload) {
  configure();
  const { data: subs, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (error) throw new Error(error.message);
  if (!subs || subs.length === 0) return { sent: 0, failed: 0, removed: 0 };

  let sent = 0, failed = 0, removed = 0;
  const json = JSON.stringify(payload);

  for (const s of subs as Array<{ id: string; endpoint: string; p256dh: string; auth: string }>) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        json,
      );
      sent++;
    } catch (e: any) {
      failed++;
      const code = e?.statusCode;
      if (code === 404 || code === 410) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      }
    }
  }
  return { sent, failed, removed };
}
