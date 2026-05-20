import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "editor";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", sess.user.id)
            .then(({ data }) => setRoles(((data ?? []).map((r: any) => r.role)) as AppRole[]));
        }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .then(({ data: rd }) => setRoles(((rd ?? []).map((r: any) => r.role)) as AppRole[]));
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    session,
    user,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isEditor: roles.includes("admin") || roles.includes("editor"),
    signOut: () => supabase.auth.signOut(),
  };
}
