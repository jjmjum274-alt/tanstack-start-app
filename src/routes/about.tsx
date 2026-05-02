import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Star, Award, Heart, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({ meta: [{ title: "عن المطعم | بهار الهند" }, { name: "description", content: "تعرف على قصة مطعم بهار الهند، رحلتنا في تقديم أصالة المطبخ الهندي في الرياض." }] }),
});

function About() {
  const { lang } = useI18n();
  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground py-20 pattern-indian text-center">
        <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">{lang === "ar" ? "قصتنا" : "Our Story"}</h1>
        <p className="text-primary-foreground/80 max-w-xl mx-auto px-4">{lang === "ar" ? "أصالة الهند في كل لقمة" : "Authentic India in every bite"}</p>
      </section>
      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-12">
        <p className="text-lg leading-loose text-foreground">
          {lang === "ar"
            ? "بدأ مطعم بهار الهند برؤية بسيطة: أن نقدم لأهل الرياض تجربة هندية أصيلة بكل تفاصيلها — من البهارات المختارة بعناية إلى الأطباق المحضرة في فرن التندور التقليدي. على مدى السنوات الماضية، أصبحنا الوجهة المفضلة لعشاق الطعام الهندي بفضل التزامنا بالجودة والذوق."
            : "Indian Bhar started with a simple vision: bring authentic Indian dining to Riyadh, from carefully selected spices to dishes prepared in our traditional tandoor. Over the years we've become the destination for Indian food lovers thanks to our commitment to quality and taste."}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Star, n: "4.7", label_ar: "تقييم Google", label_en: "Google rating" },
            { icon: Users, n: "1.7K+", label_ar: "مراجعة سعيدة", label_en: "Happy reviews" },
            { icon: Heart, n: "100%", label_ar: "حلال", label_en: "Halal" },
            { icon: Award, n: "10+", label_ar: "سنوات خبرة", label_en: "Years of expertise" },
          ].map((s) => (
            <Card key={s.n} className="p-6 text-center bg-card-gradient">
              <s.icon className="h-8 w-8 mx-auto mb-2 text-saffron" />
              <div className="font-display text-3xl font-bold text-primary">{s.n}</div>
              <div className="text-xs text-muted-foreground mt-1">{lang === "ar" ? s.label_ar : s.label_en}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
