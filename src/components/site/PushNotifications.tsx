import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { subscribePush } from "@/lib/push.functions";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const subscribe = useServerFn(subscribePush);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
      reg?.pushManager.getSubscription().then((s) => setSubscribed(!!s));
    });
  }, []);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("تم رفض إذن الإشعارات");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON() as any;
      const res = await subscribe({
        data: {
          endpoint: sub.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          user_agent: navigator.userAgent.slice(0, 500),
        },
      });
      if (res.success) {
        setSubscribed(true);
        toast.success("تم الاشتراك في الأخبار العاجلة 🔔");
      } else {
        toast.error(res.error || "تعذّر الاشتراك");
      }
    } catch (e: any) {
      toast.error(e.message || "خطأ في الاشتراك");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      await sub?.unsubscribe();
      setSubscribed(false);
      toast.success("تم إلغاء الاشتراك");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={subscribed ? handleUnsubscribe : handleSubscribe}
      disabled={loading || permission === "denied"}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 min-h-[40px] text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50"
      title={permission === "denied" ? "تم حظر الإشعارات من المتصفح" : subscribed ? "إلغاء اشتراك الإشعارات" : "اشترك في الأخبار العاجلة"}
    >
      {subscribed ? <BellOff size={14} /> : <Bell size={14} />}
      {subscribed ? "إلغاء الإشعارات" : "إشعارات عاجلة"}
    </button>
  );
}
