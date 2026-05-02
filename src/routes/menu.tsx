import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { MenuItemCard, type MenuItem } from "@/components/MenuItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/menu")({
  component: MenuPage,
  head: () => ({ meta: [{ title: "قائمة الطعام | بهار الهند" }, { name: "description", content: "تصفح قائمة طعام مطعم بهار الهند: برياني، تكا مسالا، تندوري ومأكولات هندية أصيلة." }] }),
});

type Category = { id: string; name_ar: string; name_en: string; slug: string; icon: string | null };

function MenuPage() {
  const { t, lang } = useI18n();
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [active, setActive] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("categories").select("*").eq("is_active", true).order("display_order").then(({ data }) => setCats(data || []));
    supabase.from("menu_items").select("*").eq("is_available", true).order("display_order").then(({ data }) => setItems(data as any || []));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it: any) => {
      const matchCat = active === "all" || it.category_id === active;
      const q = search.toLowerCase();
      const matchQ = !q || it.name_ar.toLowerCase().includes(q) || it.name_en.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [items, active, search]);

  const grouped = useMemo(() => {
    if (active !== "all") return [{ cat: cats.find((c) => c.id === active)!, list: filtered }].filter((g) => g.cat);
    return cats.map((c) => ({ cat: c, list: filtered.filter((it: any) => it.category_id === c.id) })).filter((g) => g.list.length);
  }, [cats, filtered, active]);

  return (
    <div className="min-h-screen">
      <section className="bg-hero-gradient text-primary-foreground py-16 pattern-indian">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">{t("menu")}</h1>
          <p className="text-primary-foreground/80">{lang === "ar" ? "أصناف محضرة بحب من المطبخ الهندي" : "Crafted with love from the Indian kitchen"}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="max-w-md mx-auto mb-6 relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "ابحث عن طبق..." : "Search dishes..."}
            className="ps-9 h-11"
          />
        </div>

        {/* Tabs */}
        <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
            <Button
              variant={active === "all" ? "default" : "outline"}
              onClick={() => setActive("all")}
              className={active === "all" ? "bg-primary hover:bg-primary-glow flex-shrink-0" : "flex-shrink-0"}
            >
              {t("all")}
            </Button>
            {cats.map((c) => (
              <Button
                key={c.id}
                variant={active === c.id ? "default" : "outline"}
                onClick={() => setActive(c.id)}
                className={active === c.id ? "bg-primary hover:bg-primary-glow flex-shrink-0" : "flex-shrink-0"}
              >
                <span className="me-1">{c.icon}</span>
                {lang === "ar" ? c.name_ar : c.name_en}
              </Button>
            ))}
          </div>
        </div>

        {/* Items grouped */}
        {grouped.map(({ cat, list }) => (
          <div key={cat.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{cat.icon}</span>
              <h2 className="font-display text-3xl font-bold">{lang === "ar" ? cat.name_ar : cat.name_en}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {list.map((it) => <MenuItemCard key={it.id} item={it} />)}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {lang === "ar" ? "لا توجد نتائج" : "No results"}
          </div>
        )}
      </div>
    </div>
  );
}
