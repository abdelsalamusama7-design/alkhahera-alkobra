import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  adminGetUser,
  adminUpdateUser,
  adminAssignRole,
  adminRevokeRole,
  ALL_ROLES,
  ROLE_LABELS,
  type AppRoleAll,
} from "@/lib/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Save, UserPlus, X } from "lucide-react";

export const Route = createFileRoute("/admin/users/$id")({
  head: () => ({ meta: [{ title: "بيانات المستخدم — لوحة التحكم" }] }),
  component: AdminUserDetail,
});

function AdminUserDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => adminGetUser({ data: { user_id: id } }),
  });

  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    email: "",
    bio: "",
  });
  const [pickRole, setPickRole] = useState<AppRoleAll | "">("");

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
        bio: user.bio ?? "",
      });
    }
  }, [user]);

  const save = useMutation({
    mutationFn: () =>
      adminUpdateUser({
        data: {
          user_id: id,
          display_name: form.display_name || null,
          phone: form.phone || null,
          bio: form.bio || null,
          email: form.email && form.email !== user?.email ? form.email : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("تم حفظ التغييرات");
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assign = useMutation({
    mutationFn: (role: AppRoleAll) =>
      adminAssignRole({ data: { user_id: id, role } }),
    onSuccess: () => {
      toast.success("تم منح الدور");
      setPickRole("");
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (role: AppRoleAll) =>
      adminRevokeRole({ data: { user_id: id, role } }),
    onSuccess: () => {
      toast.success("تم إزالة الدور");
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-center p-8">جارٍ التحميل...</div>;
  if (!user) return <div className="text-center p-8">المستخدم غير موجود</div>;

  const available = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <div dir="rtl" className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-primary">بيانات المستخدم</h1>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowRight size={16} /> العودة للقائمة
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">رقم الموبايل</Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+201xxxxxxxxx"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="bio">نبذة</Label>
            <Textarea
              id="bio"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save size={16} className="ml-2" />
            {save.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mt-6">
        <h2 className="text-lg font-bold mb-4">الأدوار والصلاحيات</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {user.roles.length === 0 && (
            <span className="text-sm text-muted-foreground">لا يوجد أدوار معيّنة</span>
          )}
          {user.roles.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-bold px-3 py-1.5 rounded"
            >
              {ROLE_LABELS[r] ?? r}
              <button
                type="button"
                onClick={() => revoke.mutate(r)}
                disabled={revoke.isPending}
                className="hover:text-breaking"
                aria-label="إزالة"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>

        {available.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={pickRole} onValueChange={(v) => setPickRole(v as AppRoleAll)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="اختر دورًا للإضافة" />
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
              disabled={!pickRole || assign.isPending}
              onClick={() => pickRole && assign.mutate(pickRole)}
            >
              <UserPlus size={14} className="ml-1" /> إضافة
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          تاريخ الإنشاء: {new Date(user.created_at).toLocaleString("ar-EG")}
        </p>
      </div>
    </div>
  );
}
