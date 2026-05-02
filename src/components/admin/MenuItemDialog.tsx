import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { resolveImg } from "@/components/MenuItemCard";

type Cat = { id: string; name_ar: string; name_en: string };

export function MenuItemDialog({
  open, onOpenChange, item, categories, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: any | null;
  categories: Cat[];
  onSaved: () => void;
}) {
  const { lang, t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<any>({
    name_ar: "", name_en: "",
    description_ar: "", description_en: "",
    ingredients_ar: "", ingredients_en: "",
    price: 0, calories: null, prep_minutes: 20,
    spicy_level: 0, image_url: "",
    category_id: categories[0]?.id || "",
    is_available: true, is_featured: false,
  });

  useEffect(() => {
    if (item) setForm({ ...item });
    else setForm({
      name_ar: "", name_en: "",
      description_ar: "", description_en: "",
      ingredients_ar: "", ingredients_en: "",
      price: 0, calories: null, prep_minutes: 20,
      spicy_level: 0, image_url: "",
      category_id: categories[0]?.id || "",
      is_available: true, is_featured: false,
    });
  }, [item, open, categories]);

  const upload = async (f: File) => {
    setUploading(true);
    try {
      const ext = f.name.split(".").pop();
      const path = `dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, f, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      setForm((s: any) => ({ ...s, image_url: data.publicUrl }));
      toast.success(lang === "ar" ? "تم رفع الصورة" : "Image uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name_ar || !form.name_en || !form.price || !form.category_id) {
      toast.error(lang === "ar" ? "يرجى تعبئة الحقول المطلوبة" : "Please fill required fields");
      return;
    }
    setSaving(true);
    const payload = {
      name_ar: form.name_ar, name_en: form.name_en,
      description_ar: form.description_ar || null, description_en: form.description_en || null,
      ingredients_ar: form.ingredients_ar || null, ingredients_en: form.ingredients_en || null,
      price: Number(form.price),
      calories: form.calories ? Number(form.calories) : null,
      prep_minutes: Number(form.prep_minutes) || 20,
      spicy_level: Number(form.spicy_level) || 0,
      image_url: form.image_url || null,
      category_id: form.category_id,
      is_available: form.is_available, is_featured: form.is_featured,
    };
    const { error } = item?.id
      ? await supabase.from("menu_items").update(payload).eq("id", item.id)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {item?.id ? t("edit") : t("add_dish")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image upload */}
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {form.image_url ? (
                <img src={resolveImg(form.image_url)} alt="" className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center text-3xl">🍛</div>}
            </div>
            <div className="flex-1">
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="ms-2">{t("upload_image")}</span>
              </Button>
              <Input className="mt-2" placeholder="https://..." value={form.image_url || ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("name_ar")} *</Label>
              <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            </div>
            <div>
              <Label>{t("name_en")} *</Label>
              <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            </div>
            <div>
              <Label>{t("desc_ar")}</Label>
              <Textarea rows={2} value={form.description_ar || ""} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
            </div>
            <div>
              <Label>{t("desc_en")}</Label>
              <Textarea rows={2} value={form.description_en || ""} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
            </div>
            <div>
              <Label>{t("ingredients_ar")}</Label>
              <Textarea rows={2} value={form.ingredients_ar || ""} onChange={(e) => setForm({ ...form, ingredients_ar: e.target.value })} />
            </div>
            <div>
              <Label>{t("ingredients_en")}</Label>
              <Textarea rows={2} value={form.ingredients_en || ""} onChange={(e) => setForm({ ...form, ingredients_en: e.target.value })} />
            </div>
            <div>
              <Label>{t("category")} *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{lang === "ar" ? c.name_ar : c.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("price")} ({t("sar")}) *</Label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label>{t("calories")}</Label>
              <Input type="number" value={form.calories || ""} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
            </div>
            <div>
              <Label>{t("prep_time")} ({lang === "ar" ? "دقيقة" : "min"})</Label>
              <Input type="number" value={form.prep_minutes} onChange={(e) => setForm({ ...form, prep_minutes: e.target.value })} />
            </div>
            <div>
              <Label>{t("spicy_level")} (0-3)</Label>
              <Input type="number" min={0} max={3} value={form.spicy_level} onChange={(e) => setForm({ ...form, spicy_level: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
              <Label>{t("available")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              <Label>{t("featured_flag")}</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary-glow">
            {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
