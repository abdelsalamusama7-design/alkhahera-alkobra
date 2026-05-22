// Client-safe permission helpers — shared by UI and server functions.

export const ALL_ROLES = [
  "admin",
  "president",
  "board_director",
  "editor_in_chief",
  "chief_editor",
  "editor",
  "journalist",
  "it_specialist",
] as const;

export type AppRoleAll = (typeof ALL_ROLES)[number];

export const ROLE_LABELS: Record<AppRoleAll, string> = {
  admin: "مسؤول النظام",
  president: "الرئيس",
  board_director: "مدير مجلس الإدارة",
  editor_in_chief: "رئيس التحرير",
  chief_editor: "مدير التحرير",
  editor: "محرر",
  journalist: "صحفي",
  it_specialist: "أخصائي نظم معلومات",
};

export type Permission =
  | "view_admin"
  | "create_article"
  | "edit_any_article"
  | "edit_own_article"
  | "publish_article"
  | "mark_breaking"
  | "delete_article"
  | "manage_categories"
  | "manage_users"
  | "ingest_rss"
  | "view_publish_stats";


const PERMS: Record<AppRoleAll, Permission[]> = {
  admin: [
    "view_admin", "create_article", "edit_any_article", "edit_own_article",
    "publish_article", "mark_breaking", "delete_article",
    "manage_categories", "manage_users", "ingest_rss",
  ],
  president: [
    "view_admin", "edit_any_article", "publish_article",
    "mark_breaking", "delete_article", "manage_categories",
  ],
  board_director: [
    "view_admin", "edit_any_article", "publish_article",
    "mark_breaking", "delete_article", "manage_categories",
  ],
  editor_in_chief: [
    "view_admin", "create_article", "edit_any_article", "edit_own_article",
    "publish_article", "mark_breaking", "delete_article", "manage_categories",
  ],
  chief_editor: [
    "view_admin", "create_article", "edit_any_article", "edit_own_article",
    "publish_article", "mark_breaking", "delete_article", "manage_categories",
  ],
  editor: [
    "view_admin", "create_article", "edit_any_article", "edit_own_article",
    "publish_article",
  ],
  journalist: [
    "view_admin", "create_article", "edit_own_article",
  ],
  it_specialist: [
    "view_admin", "ingest_rss", "manage_categories",
  ],
};

export function hasPerm(roles: readonly string[], perm: Permission): boolean {
  for (const r of roles) {
    const list = PERMS[r as AppRoleAll];
    if (list && list.includes(perm)) return true;
  }
  return false;
}

export function isStaff(roles: readonly string[]): boolean {
  return roles.some((r) => (PERMS as any)[r]);
}
