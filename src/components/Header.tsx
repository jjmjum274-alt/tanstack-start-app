import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, LayoutDashboard, LogOut, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth, useIsAdmin } from "@/lib/auth";
import { useCart, cartCount } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const cart = useCart();
  const count = cartCount(cart);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-saffron-gradient flex items-center justify-center text-xl shadow-glow group-hover:scale-110 transition-smooth">
            🌶️
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-primary">{t("restaurant_name")}</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">INDIAN BHAR</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-smooth" activeProps={{ className: "text-primary" }}>{t("home")}</Link>
          <Link to="/menu" className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-smooth" activeProps={{ className: "text-primary" }}>{t("menu")}</Link>
          <Link to="/about" className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-smooth" activeProps={{ className: "text-primary" }}>{t("about")}</Link>
          <Link to="/contact" className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-smooth" activeProps={{ className: "text-primary" }}>{t("contact")}</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label="Toggle language">
            <Globe className="h-4 w-4" />
            <span className="sr-only">lang</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={onCartOpen} className="relative" aria-label="Cart">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-1 -end-1 h-5 min-w-5 px-1 bg-saffron text-saffron-foreground border-0">
                {count}
              </Badge>
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild><Link to="/orders">{t("my_orders")}</Link></DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><LayoutDashboard className="h-4 w-4 me-2" />{t("admin")}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                  <LogOut className="h-4 w-4 me-2" />{t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="bg-primary hover:bg-primary-glow">
              <Link to="/auth">{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
