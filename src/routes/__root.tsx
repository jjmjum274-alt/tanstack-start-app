import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartSheet } from "@/components/CartSheet";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "بهار الهند | أصالة المطبخ الهندي في الرياض" },
      { name: "description", content: "اطلب أشهى الأطباق الهندية الأصيلة من مطعم بهار الهند: برياني، تكا مسالا، تندوري، نان وحلويات. توصيل واستلام في الرياض." },
      { property: "og:title", content: "بهار الهند | أصالة المطبخ الهندي في الرياض" },
      { property: "og:description", content: "اطلب أشهى الأطباق الهندية الأصيلة من مطعم بهار الهند: برياني، تكا مسالا، تندوري، نان وحلويات. توصيل واستلام في الرياض." },
      { property: "og:type", content: "restaurant" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "بهار الهند | أصالة المطبخ الهندي في الرياض" },
      { name: "twitter:description", content: "اطلب أشهى الأطباق الهندية الأصيلة من مطعم بهار الهند: برياني، تكا مسالا، تندوري، نان وحلويات. توصيل واستلام في الرياض." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/671e2b72-710f-4287-a396-325f81d851f3/id-preview-597708a3--c208164d-014e-4b4b-beac-7d2df90dfc0d.lovable.app-1777729615422.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/671e2b72-710f-4287-a396-325f81d851f3/id-preview-597708a3--c208164d-014e-4b4b-beac-7d2df90dfc0d.lovable.app-1777729615422.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700;900&family=Cormorant+Garamond:wght@500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col">
        <Header onCartOpen={() => setCartOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
        <Toaster position="top-center" richColors />
      </div>
    </I18nProvider>
  );
}
