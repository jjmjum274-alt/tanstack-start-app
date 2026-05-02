import { useI18n } from "@/lib/i18n";
import { MapPin, Phone, Clock } from "lucide-react";

export function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="mt-20 bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-saffron-gradient flex items-center justify-center">🌶️</div>
            <h3 className="font-display text-xl text-saffron">{t("restaurant_name")}</h3>
          </div>
          <p className="text-sm text-sidebar-foreground/70 leading-relaxed">{t("tagline")}</p>
        </div>
        <div>
          <h4 className="font-display text-saffron mb-3">{t("contact")}</h4>
          <ul className="space-y-2 text-sm text-sidebar-foreground/80">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-saffron" /> {lang === "ar" ? "شارع الأمير سلطان بن سلمان، الورود، الرياض" : "Prince Sultan Rd, Al Wurud, Riyadh"}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-saffron" /> 011 200 5858</li>
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-saffron" /> {lang === "ar" ? "يومياً 11ص - 2ص" : "Daily 11am - 2am"}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-saffron mb-3">{t("location")}</h4>
          <a
            href="https://maps.app.goo.gl/sHHMm3Bp5LPECaCq7"
            target="_blank" rel="noopener noreferrer"
            className="block rounded-xl overflow-hidden border border-sidebar-border hover:border-saffron transition-smooth"
          >
            <iframe
              title="map"
              src="https://www.google.com/maps?q=24.7485,46.6753&z=15&output=embed"
              className="w-full h-32 grayscale opacity-90"
              loading="lazy"
            />
          </a>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs text-sidebar-foreground/50">
        © 2026 {t("restaurant_name")} · جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
