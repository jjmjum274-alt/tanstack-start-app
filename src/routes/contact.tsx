import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Phone, MapPin, Clock, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "تواصل معنا | بهار الهند" }, { name: "description", content: "تواصل مع مطعم بهار الهند بالرياض - الهاتف، الموقع، وساعات العمل." }] }),
});

function Contact() {
  const { lang } = useI18n();
  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground py-16 pattern-indian text-center">
        <h1 className="font-display text-5xl font-bold mb-2">{lang === "ar" ? "تواصل معنا" : "Contact Us"}</h1>
        <p className="text-primary-foreground/80">{lang === "ar" ? "نحن في خدمتك دائماً" : "Always at your service"}</p>
      </section>
      <div className="container mx-auto px-4 py-16 max-w-4xl grid md:grid-cols-2 gap-6">
        {[
          { icon: Phone, title_ar: "اتصل بنا", title_en: "Call us", val: "011 200 5858", href: "tel:0112005858" },
          { icon: MessageCircle, title_ar: "واتساب", title_en: "WhatsApp", val: "0591443391", href: "https://wa.me/966591443391" },
          { icon: MapPin, title_ar: "العنوان", title_en: "Address", val: lang === "ar" ? "شارع الأمير سلطان، الورود، الرياض" : "Prince Sultan Rd, Al Wurud, Riyadh", href: "https://maps.app.goo.gl/sHHMm3Bp5LPECaCq7" },
          { icon: Clock, title_ar: "ساعات العمل", title_en: "Hours", val: lang === "ar" ? "يومياً 11ص - 2ص" : "Daily 11am - 2am" },
        ].map((c) => (
          <Card key={c.title_en} className="p-6 hover:border-saffron/50 transition-smooth">
            <c.icon className="h-7 w-7 text-saffron mb-3" />
            <div className="font-display text-lg font-bold mb-1">{lang === "ar" ? c.title_ar : c.title_en}</div>
            {c.href ? <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-smooth">{c.val}</a> : <div>{c.val}</div>}
          </Card>
        ))}
      </div>
      <div className="container mx-auto px-4 pb-16 max-w-4xl">
        <iframe title="map" src="https://www.google.com/maps?q=24.7485,46.6753&z=15&output=embed" className="w-full h-80 rounded-2xl border border-border" loading="lazy" />
      </div>
    </div>
  );
}
