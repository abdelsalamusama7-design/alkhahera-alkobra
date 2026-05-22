import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ALL_ROLES, ROLE_LABELS, type AppRoleAll } from "@/lib/permissions";

export { ALL_ROLES, ROLE_LABELS };
export type { AppRoleAll };

async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin")) throw new Error("ليس لديك صلاحية");
}

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);
    const { data, error } = await supabaseAdmin.rpc("admin_list_users");
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      user_id: string;
      email: string;
      display_name: string | null;
      created_at: string;
      roles: AppRoleAll[];
    }>;
  });

export const adminAssignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(ALL_ROLES),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.user_id, role: data.role });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const adminRevokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(ALL_ROLES),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    // Prevent removing last admin
    if (data.role === "admin") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) throw new Error("لا يمكن إزالة آخر مسؤول للنظام");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);

    const { data: authUser, error: authErr } =
      await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (authErr) throw new Error(authErr.message);
    if (!authUser?.user) throw new Error("المستخدم غير موجود");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, phone, bio, avatar_url")
      .eq("id", data.user_id)
      .maybeSingle();

    const { data: rolesData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user_id);

    return {
      user_id: authUser.user.id,
      email: authUser.user.email ?? "",
      created_at: authUser.user.created_at,
      display_name: profile?.display_name ?? null,
      phone: (profile?.phone as string | null) ?? null,
      bio: profile?.bio ?? null,
      avatar_url: profile?.avatar_url ?? null,
      roles: (rolesData ?? []).map((r) => r.role) as AppRoleAll[],
    };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        user_id: z.string().uuid(),
        display_name: z.string().trim().max(255).optional().nullable(),
        phone: z
          .string()
          .trim()
          .max(32)
          .regex(/^[+\d\s()-]*$/, "رقم غير صالح")
          .optional()
          .nullable(),
        bio: z.string().trim().max(1000).optional().nullable(),
        email: z.string().email().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);

    if (data.email) {
      const { error: emailErr } = await supabaseAdmin.auth.admin.updateUserById(
        data.user_id,
        { email: data.email },
      );
      if (emailErr) throw new Error(emailErr.message);
    }

    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: data.user_id,
          display_name: data.display_name ?? null,
          phone: data.phone ?? null,
          bio: data.bio ?? null,
        },
        { onConflict: "id" },
      );
    if (upsertErr) throw new Error(upsertErr.message);

    return { ok: true };
  });

