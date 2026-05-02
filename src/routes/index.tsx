import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, Truck, Clock, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { MenuItemCard, type MenuItem } from "@/components/MenuItemCard";
import heroImg from "@/assets/hero-feast.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const [featured, setFeatured] = useState<MenuItem[]>([]);

  useEffect(() => {
    supabase.from("menu_items").select("*").eq("is_featured", true).eq("is_available", true).limit(6)
      .then(({ data }) => setFeatured(data || []));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" width={1920} height={1080} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-l from-primary/40 via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-24 grid lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-start space-y-6 max-w-xl mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron/20 backdrop-blur border border-saffron/30 text-saffron-foreground text-xs font-semibold">
              <Star className="h-3 w-3 fill-saffron text-saffron" />
              {lang === "ar" ? "تقييم 4.7 · أكثر من 1,733 مراجعة" : "4.7 · 1,733+ reviews"}
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-foreground">
              {lang === "ar" ? (<>نكهات <span className="text-gradient-saffron">الهند</span><br />الأصيلة</>) : (<>Authentic <span className="text-gradient-saffron">Indian</span><br />Flavors</>)}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {lang === "ar"
                ? "من قلب الهند إلى مائدتك في الرياض. أطباق محضرة بشغف ومكونات طازجة."
                : "From the heart of India to your table in Riyadh. Crafted with passion and the freshest ingredients."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="bg-primary hover:bg-primary-glow h-14 px-8 text-base shadow-elegant">
                <Link to="/menu">{t("order_now")} <ArrowLeft className="ms-2 h-5 w-5 rtl:rotate-180" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base border-2">
                <Link to="/menu">{t("view_menu")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES STRIP */}
      <section className="bg-sidebar text-sidebar-foreground py-8">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, label_ar: "توصيل سريع", label_en: "Fast Delivery", desc_ar: "خلال 35 دقيقة", desc_en: "Within 35 minutes" },
            { icon: Award, label_ar: "جودة عالية", label_en: "Premium Quality", desc_ar: "مكونات طازجة يومياً", desc_en: "Daily fresh ingredients" },
            { icon: Clock, label_ar: "مفتوح يومياً", label_en: "Open Daily", desc_ar: "11ص - 2ص", desc_en: "11am - 2am" },
            { icon: Star, label_ar: "تقييم ممتاز", label_en: "Top Rated", desc_ar: "4.7 من 5", desc_en: "4.7 / 5" },
          ].map((f) => (
            <div key={f.label_en} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center text-saffron flex-shrink-0">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-saffron">{lang === "ar" ? f.label_ar : f.label_en}</div>
                <div className="text-xs text-sidebar-foreground/70">{lang === "ar" ? f.desc_ar : f.desc_en}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-3">{t("featured")}</h2>
          <p className="text-muted-foreground">
            {lang === "ar" ? "اكتشف أكثر الأطباق التي يفضلها عملاؤنا" : "Discover our customers' favorite dishes"}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((item) => <MenuItemCard key={item.id} item={item} />)}
        </div>
        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg" className="h-12 px-8">
            <Link to="/menu">{t("view_menu")} <ArrowLeft className="ms-2 h-4 w-4 rtl:rotate-180" /></Link>
          </Button>
        </div>
      </section>

      {/* STORY */}
      <section className="bg-card-gradient pattern-indian py-20 border-y border-border">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="text-saffron text-sm tracking-widest font-bold mb-2">قصتنا</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            {lang === "ar" ? "ضيافة هندية وفق أعلى المعايير" : "Indian hospitality at its highest standards"}
          </h2>
          <p className="text-lg text-muted-foreground leading-loose">
            {lang === "ar"
              ? "في مطعم بحر الهند، نقدم لكم أصالة المطبخ الهندي العريق بأشهى الأطباق المحضرة في فرن التندور التقليدي، وبإستخدام توابل فاخرة مستوردة مباشرة من الهند. نلتزم بتقديم تجربة طعام استثنائية تنقلكم في رحلة تذوق فريدة تعكس أصالة وعراقة التراث الهندي."
              : "At Bahar Al-Hind Restaurant, we bring you the authentic essence of Indian cuisine with exquisite dishes prepared in traditional tandoor ovens, using premium spices imported directly from India. We are committed to providing an exceptional dining experience that takes you on a unique tasting journey reflecting the rich heritage of India."}
          </p>
        </div>
      </section>
    </div>
  );
}