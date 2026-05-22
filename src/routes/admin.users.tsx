import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  adminListUsers,
  adminAssignRole,
  adminRevokeRole,
  ALL_ROLES,
  ROLE_LABELS,
  type AppRoleAll,
} from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, UserPlus } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "إدارة المستخدمين — لوحة التحكم" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers(),
  });

  const assign = useMutation({
    mutationFn: (vars: { user_id: string; role: AppRoleAll }) =>
      adminAssignRole({ data: vars }),
    onSuccess: () => {
      toast.success("تم منح الدور");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (vars: { user_id: string; role: AppRoleAll }) =>
      adminRevokeRole({ data: vars }),
    onSuccess: () => {
      toast.success("تم إزالة الدور");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-center p-8">جارٍ التحميل...</div>;

  return (
    <div dir="rtl">
      <h1 className="text-2xl font-extrabold text-primary mb-4">إدارة المستخدمين والصلاحيات</h1>
      <p className="text-sm text-muted-foreground mb-6">
        امنح كل مستخدم الأدوار المناسبة. المستخدم قد يحمل أكثر من دور.
      </p>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-right">
            <tr>
              <th className="p-3 font-bold">المستخدم</th>
              <th className="p-3 font-bold">الأدوار الحالية</th>
              <th className="p-3 font-bold">إضافة دور</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.user_id}
                user={u}
                onAssign={(role) => assign.mutate({ user_id: u.user_id, role })}
                onRevoke={(role) => revoke.mutate({ user_id: u.user_id, role })}
                busy={assign.isPending || revoke.isPending}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  لا يوجد مستخدمون.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onAssign,
  onRevoke,
  busy,
}: {
  user: {
    user_id: string;
    email: string;
    display_name: string | null;
    roles: AppRoleAll[];
  };
  onAssign: (role: AppRoleAll) => void;
  onRevoke: (role: AppRoleAll) => void;
  busy: boolean;
}) {
  const [pick, setPick] = useState<AppRoleAll | "">("");
  const available = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <tr className="border-t border-border align-top">
      <td className="p-3">
        <div className="font-bold">{user.display_name || "—"}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1.5">
          {user.roles.length === 0 && (
            <span className="text-xs text-muted-foreground">بدون أدوار</span>
          )}
          {user.roles.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded"
            >
              {ROLE_LABELS[r] ?? r}
              <button
                type="button"
                onClick={() => onRevoke(r)}
                disabled={busy}
                className="hover:text-breaking"
                aria-label="إزالة"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Select value={pick} onValueChange={(v) => setPick(v as AppRoleAll)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="اختر دورًا" />
            </SelectTrigger>
            <SelectContent>
              {available.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!pick || busy}
            onClick={() => {
              if (pick) {
                onAssign(pick);
                setPick("");
              }
            }}
          >
            <UserPlus size={14} className="ml-1" /> إضافة
          </Button>
        </div>
      </td>
    </tr>
  );
}
