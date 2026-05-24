import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Pin, Plus, Search } from "lucide-react";
import {
  listHomeSections,
  updateHomeSection,
  addHomeSectionItem,
  deleteHomeSectionItem,
  searchArticlesForPin,
  type HomeSectionConfig,
  type HomeSectionItem,
} from "@/lib/home-sections.functions";

export const Route = createFileRoute("/admin/home-sections")({
  head: () => ({ meta: [{ title: "أقسام الصفحة الرئيسية — لوحة التحكم" }] }),
  component: HomeSectionsAdmin,
});

function HomeSectionsAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(listHomeSections);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "home-sections"],
    queryFn: () => list(),
  });

  if (isLoading) return <div className="text-center py-10">جارٍ التحميل...</div>;
  const sections = data?.sections ?? [];
  const itemsBy = (key: string) => (data?.items ?? []).filter((i) => i.section_key === key);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-primary">أقسام الصفحة الرئيسية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          تحكّم في عدد العناصر، شكل العرض، وثبّت أخباراً أو بطاقات مخصّصة في كل قسم.
        </p>
      </div>

      <Tabs defaultValue={sections[0]?.key} dir="rtl">
        <TabsList className="flex-wrap h-auto">
          {sections.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>{s.title}</TabsTrigger>
          ))}
        </TabsList>
        {sections.map((s) => (
          <TabsContent key={s.key} value={s.key} className="space-y-4">
            <SectionConfigCard section={s} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "home-sections"] })} />
            <SectionItemsCard section={s} items={itemsBy(s.key)} onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "home-sections"] })} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SectionConfigCard({ section, onSaved }: { section: HomeSectionConfig; onSaved: () => void }) {
  const update = useServerFn(updateHomeSection);
  const [form, setForm] = useState(section);
  const m = useMutation({
    mutationFn: () => update({ data: {
      key: form.key,
      enabled: form.enabled,
      layout: form.layout,
      columns: form.columns,
      display_count: form.display_count,
      load_more_step: form.load_more_step,
      max_count: form.max_count,
    } }),
    onSuccess: () => { toast.success("تم حفظ الإعدادات"); onSaved(); },
    onError: (e: any) => toast.error(e?.message ?? "تعذّر الحفظ"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">إعدادات العرض — {section.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
          <Label>تفعيل القسم</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>شكل العرض</Label>
            <Select value={form.layout} onValueChange={(v) => setForm({ ...form, layout: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">شبكة</SelectItem>
                <SelectItem value="list">قائمة</SelectItem>
                <SelectItem value="circles">دوائر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>عدد الأعمدة</Label>
            <Select value={String(form.columns)} onValueChange={(v) => setForm({ ...form, columns: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6].map((c) => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>عدد العناصر الافتراضي</Label>
            <Input type="number" min={1} max={60} value={form.display_count}
              onChange={(e) => setForm({ ...form, display_count: Number(e.target.value) })} />
          </div>
          <div>
            <Label>خطوة "المزيد"</Label>
            <Input type="number" min={1} max={60} value={form.load_more_step}
              onChange={(e) => setForm({ ...form, load_more_step: Number(e.target.value) })} />
          </div>
          <div>
            <Label>الحد الأقصى</Label>
            <Input type="number" min={1} max={200} value={form.max_count}
              onChange={(e) => setForm({ ...form, max_count: Number(e.target.value) })} />
          </div>
        </div>
        <Button onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? "جارٍ الحفظ..." : "حفظ"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SectionItemsCard({ section, items, onChanged }: {
  section: HomeSectionConfig;
  items: HomeSectionItem[];
  onChanged: () => void;
}) {
  const add = useServerFn(addHomeSectionItem);
  const del = useServerFn(deleteHomeSectionItem);
  const search = useServerFn(searchArticlesForPin);

  const [q, setQ] = useState("");
  const { data: searchData, refetch, isFetching } = useQuery({
    queryKey: ["pin-search", section.key, q],
    queryFn: () => search({ data: { q } }),
    enabled: false,
  });

  const [custom, setCustom] = useState({ title: "", image: "", url: "", source: "" });

  const pin = useMutation({
    mutationFn: (article_id: string) => add({ data: { section_key: section.key, kind: "article", article_id, sort_order: items.length } }),
    onSuccess: () => { toast.success("تم التثبيت"); onChanged(); },
    onError: (e: any) => toast.error(e?.message ?? "فشل"),
  });

  const addCustom = useMutation({
    mutationFn: () => add({ data: {
      section_key: section.key, kind: "custom",
      custom_title: custom.title, custom_image: custom.image || null,
      custom_url: custom.url || null, custom_source: custom.source || null,
      sort_order: items.length,
    } }),
    onSuccess: () => { toast.success("تمت الإضافة"); setCustom({ title: "", image: "", url: "", source: "" }); onChanged(); },
    onError: (e: any) => toast.error(e?.message ?? "فشل"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); onChanged(); },
    onError: (e: any) => toast.error(e?.message ?? "فشل"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">عناصر مثبّتة في القسم ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد عناصر مثبّتة. القسم يعرض المحتوى التلقائي فقط.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 border border-border rounded p-3 bg-card">
                <img src={it.kind === "article" ? (it.article?.cover_image ?? "") : (it.custom_image ?? "")}
                  alt="" className="h-12 w-12 rounded object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{it.kind === "article" ? "مقال مثبّت" : "بطاقة مخصّصة"}</div>
                  <div className="font-bold text-sm truncate">{it.kind === "article" ? it.article?.title : it.custom_title}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(it.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><Pin className="h-4 w-4" /> تثبيت مقال موجود</h3>
          <div className="flex gap-2">
            <Input placeholder="ابحث بعنوان المقال..." value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={() => refetch()} disabled={isFetching}>
              <Search className="h-4 w-4 ml-1" /> بحث
            </Button>
          </div>
          {searchData?.articles && searchData.articles.length > 0 && (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {searchData.articles.map((a: any) => (
                <li key={a.id} className="flex items-center gap-3 border border-border rounded p-2">
                  <img src={a.cover_image ?? ""} alt="" className="h-10 w-10 rounded object-cover bg-muted" />
                  <div className="flex-1 min-w-0 text-sm truncate">{a.title}</div>
                  <Button size="sm" onClick={() => pin.mutate(a.id)}>تثبيت</Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> إضافة بطاقة مخصّصة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>العنوان *</Label><Input value={custom.title} onChange={(e) => setCustom({ ...custom, title: e.target.value })} /></div>
            <div><Label>المصدر</Label><Input value={custom.source} onChange={(e) => setCustom({ ...custom, source: e.target.value })} /></div>
            <div><Label>رابط الصورة</Label><Input value={custom.image} onChange={(e) => setCustom({ ...custom, image: e.target.value })} placeholder="https://..." /></div>
            <div><Label>رابط البطاقة</Label><Input value={custom.url} onChange={(e) => setCustom({ ...custom, url: e.target.value })} placeholder="https://..." /></div>
          </div>
          <Button onClick={() => addCustom.mutate()} disabled={!custom.title || addCustom.isPending}>
            {addCustom.isPending ? "جارٍ الإضافة..." : "إضافة بطاقة"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
