import { useState } from "react";
import { Flame, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ItemOptionsDialog } from "./ItemOptionsDialog";
import { toast } from "sonner";

import biryani from "@/assets/dish-biryani.jpg";
import butterChicken from "@/assets/dish-butter-chicken.jpg";
import tandoori from "@/assets/dish-tandoori.jpg";
import samosa from "@/assets/dish-samosa.jpg";
import naan from "@/assets/dish-naan.jpg";
import gulab from "@/assets/dish-gulab.jpg";
import lassi from "@/assets/dish-lassi.jpg";
import paneer from "@/assets/dish-paneer.jpg";
import shrimp from "@/assets/dish-shrimp.jpg";

const IMG_MAP: Record<string, string> = {
  "/src/assets/dish-biryani.jpg": biryani,
  "/src/assets/dish-butter-chicken.jpg": butterChicken,
  "/src/assets/dish-tandoori.jpg": tandoori,
  "/src/assets/dish-samosa.jpg": samosa,
  "/src/assets/dish-naan.jpg": naan,
  "/src/assets/dish-gulab.jpg": gulab,
  "/src/assets/dish-lassi.jpg": lassi,
  "/src/assets/dish-paneer.jpg": paneer,
  "/src/assets/dish-shrimp.jpg": shrimp,
};

export function resolveImg(url: string | null) {
  if (!url) return biryani;
  return IMG_MAP[url] || url;
}

export type MenuItem = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  ingredients_ar?: string | null;
  ingredients_en?: string | null;
  calories?: number | null;
  prep_minutes?: number | null;
  price: number;
  image_url: string | null;
  spicy_level: number;
  is_featured: boolean;
};

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { lang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const name = lang === "ar" ? item.name_ar : item.name_en;
  const desc = lang === "ar" ? item.description_ar : item.description_en;

  const quickAdd = async () => {
    // check if has option groups
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("item_option_groups").select("id").eq("item_id", item.id).limit(1);
    if (data && data.length > 0) {
      setOpen(true);
      return;
    }
    cartStore.add({
      item_id: item.id,
      name_ar: item.name_ar,
      name_en: item.name_en,
      image_url: item.image_url,
      unit_price: Number(item.price),
      quantity: 1,
      options: [],
    });
    toast.success(lang === "ar" ? "أضيف للسلة" : "Added to cart");
  };

  return (
    <>
      <Card className="group overflow-hidden border-border hover:border-saffron/40 transition-smooth shadow-card hover:shadow-elegant bg-card-gradient flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={resolveImg(item.image_url)}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-700"
          />
          {item.is_featured && (
            <Badge className="absolute top-3 start-3 bg-saffron-gradient text-saffron-foreground border-0 shadow-glow">
              ⭐ {lang === "ar" ? "مميز" : "Featured"}
            </Badge>
          )}
          {item.spicy_level > 0 && (
            <div className="absolute top-3 end-3 flex gap-0.5 bg-background/90 rounded-full px-2 py-1">
              {Array.from({ length: item.spicy_level }).map((_, i) => (
                <Flame key={i} className="h-3 w-3 text-destructive fill-destructive" />
              ))}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-display text-lg font-bold text-foreground line-clamp-1">{name}</h3>
          {desc && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>}
          {(item.ingredients_ar || item.ingredients_en) && (
            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 italic">
              <span className="font-semibold not-italic text-saffron">{lang === "ar" ? "المكونات: " : "Ingredients: "}</span>
              {lang === "ar" ? item.ingredients_ar : item.ingredients_en}
            </p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {item.calories ? <span>🔥 {item.calories} kcal</span> : null}
            {item.prep_minutes ? <span>⏱ {item.prep_minutes} {lang === "ar" ? "د" : "min"}</span> : null}
          </div>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="font-display text-xl font-bold text-primary">{Number(item.price).toFixed(0)} <span className="text-xs text-muted-foreground">{t("sar")}</span></span>
            <Button size="sm" onClick={quickAdd} className="bg-primary hover:bg-primary-glow rounded-full">
              <Plus className="h-4 w-4" />
              <span className="ms-1 hidden sm:inline">{t("add_to_cart")}</span>
            </Button>
          </div>
        </div>
      </Card>
      <ItemOptionsDialog item={item} open={open} onOpenChange={setOpen} />
    </>
  );
}
