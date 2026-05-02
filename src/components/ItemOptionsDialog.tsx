import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cartStore, type SelectedOption } from "@/lib/cart-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { resolveImg, type MenuItem } from "./MenuItemCard";
import { toast } from "sonner";

type Group = { id: string; name_ar: string; name_en: string; is_required: boolean; multi_select: boolean; display_order: number };
type Option = { id: string; group_id: string; name_ar: string; name_en: string; extra_price: number; display_order: number };

export function ItemOptionsDialog({ item, open, onOpenChange }: { item: MenuItem; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lang, t } = useI18n();
  const [groups, setGroups] = useState<Group[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected({}); setQty(1); setNotes("");
    (async () => {
      const { data: g } = await supabase.from("item_option_groups").select("*").eq("item_id", item.id).order("display_order");
      setGroups(g || []);
      if (g && g.length) {
        const { data: o } = await supabase.from("item_options").select("*").in("group_id", g.map((x) => x.id)).order("display_order");
        setOptions(o || []);
      }
    })();
  }, [open, item.id]);

  const toggle = (groupId: string, optionId: string, multi: boolean) => {
    setSelected((s) => {
      const cur = s[groupId] || [];
      if (multi) {
        return { ...s, [groupId]: cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId] };
      }
      return { ...s, [groupId]: [optionId] };
    });
  };

  const totalExtra = Object.values(selected).flat().reduce((s, oid) => {
    const opt = options.find((o) => o.id === oid);
    return s + (opt ? Number(opt.extra_price) : 0);
  }, 0);
  const lineTotal = (Number(item.price) + totalExtra) * qty;

  const handleAdd = () => {
    // validate required
    for (const g of groups) {
      if (g.is_required && !(selected[g.id]?.length)) {
        toast.error(lang === "ar" ? `يرجى اختيار ${g.name_ar}` : `Please select ${g.name_en}`);
        return;
      }
    }
    const selOpts: SelectedOption[] = Object.entries(selected).flatMap(([gid, oids]) =>
      oids.map((oid) => {
        const o = options.find((x) => x.id === oid)!;
        const g = groups.find((x) => x.id === gid)!;
        return {
          group_id: gid, group_name_ar: g.name_ar, group_name_en: g.name_en,
          option_id: oid, option_name_ar: o.name_ar, option_name_en: o.name_en,
          extra_price: Number(o.extra_price),
        };
      })
    );
    cartStore.add({
      item_id: item.id,
      name_ar: item.name_ar,
      name_en: item.name_en,
      image_url: item.image_url,
      unit_price: Number(item.price),
      quantity: qty,
      options: selOpts,
      notes: notes || undefined,
    });
    toast.success(lang === "ar" ? "أضيف للسلة" : "Added to cart");
    onOpenChange(false);
  };

  const name = lang === "ar" ? item.name_ar : item.name_en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="aspect-[16/9] -mt-6 -mx-6 mb-2 overflow-hidden rounded-t-lg">
            <img src={resolveImg(item.image_url)} alt={name} className="w-full h-full object-cover" />
          </div>
          <DialogTitle className="font-display text-2xl">{name}</DialogTitle>
        </DialogHeader>

        {(item.ingredients_ar || item.ingredients_en) && (
          <div className="-mt-2 p-3 rounded-lg bg-saffron/10 border border-saffron/20 text-sm">
            <div className="font-semibold text-saffron text-xs mb-1">🌿 {t("ingredients")}</div>
            <p className="text-foreground/80 leading-relaxed">{lang === "ar" ? item.ingredients_ar : item.ingredients_en}</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
              {item.calories ? <span>🔥 {item.calories} kcal</span> : null}
              {item.prep_minutes ? <span>⏱ {item.prep_minutes} {lang === "ar" ? "دقيقة" : "min"}</span> : null}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {groups.map((g) => {
            const opts = options.filter((o) => o.group_id === g.id);
            return (
              <div key={g.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="font-semibold">{lang === "ar" ? g.name_ar : g.name_en}</Label>
                  <Badge variant="outline" className="text-[10px]">{g.is_required ? t("required") : t("optional")}</Badge>
                </div>
                {g.multi_select ? (
                  <div className="space-y-2">
                    {opts.map((o) => {
                      const checked = selected[g.id]?.includes(o.id) || false;
                      return (
                        <label key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-saffron/50 transition-smooth cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={checked} onCheckedChange={() => toggle(g.id, o.id, true)} />
                            <span>{lang === "ar" ? o.name_ar : o.name_en}</span>
                          </div>
                          {Number(o.extra_price) > 0 && <span className="text-sm text-primary font-semibold">+{Number(o.extra_price)} {t("sar")}</span>}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <RadioGroup value={selected[g.id]?.[0] || ""} onValueChange={(v) => toggle(g.id, v, false)} className="space-y-2">
                    {opts.map((o) => (
                      <label key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-saffron/50 transition-smooth cursor-pointer">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={o.id} id={o.id} />
                          <span>{lang === "ar" ? o.name_ar : o.name_en}</span>
                        </div>
                        {Number(o.extra_price) > 0 && <span className="text-sm text-primary font-semibold">+{Number(o.extra_price)} {t("sar")}</span>}
                      </label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            );
          })}

          <div>
            <Label className="font-semibold mb-2 block">{t("notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={lang === "ar" ? "بدون بصل، حار جداً..." : "No onion, extra spicy..."} rows={2} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <Label className="font-semibold">{t("quantity")}</Label>
            <div className="flex items-center gap-3">
              <Button type="button" size="icon" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))}>−</Button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <Button type="button" size="icon" variant="outline" onClick={() => setQty(qty + 1)}>+</Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} className="w-full bg-primary hover:bg-primary-glow h-12 text-base">
            {t("add_to_cart")} · {lineTotal.toFixed(0)} {t("sar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
