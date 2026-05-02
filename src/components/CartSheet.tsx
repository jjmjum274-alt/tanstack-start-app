import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useCart, cartStore, cartSubtotal, lineTotal } from "@/lib/cart-store";
import { resolveImg } from "./MenuItemCard";

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, lang } = useI18n();
  const cart = useCart();
  const subtotal = cartSubtotal(cart);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={lang === "ar" ? "left" : "right"} className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">{t("your_cart")}</SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-12">
            <div className="text-6xl animate-float">🍛</div>
            <p className="text-muted-foreground">{t("empty_cart")}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2 space-y-3">
              {cart.map((line) => (
                <div key={line.lineId} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                  <img src={resolveImg(line.image_url)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <h4 className="font-semibold text-sm line-clamp-1">{lang === "ar" ? line.name_ar : line.name_en}</h4>
                      <button onClick={() => cartStore.remove(line.lineId)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {line.options.length > 0 && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {line.options.map((o) => lang === "ar" ? o.option_name_ar : o.option_name_en).join("، ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cartStore.update(line.lineId, line.quantity - 1)}>−</Button>
                        <span className="text-sm font-bold w-6 text-center">{line.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => cartStore.update(line.lineId, line.quantity + 1)}>+</Button>
                      </div>
                      <span className="text-sm font-bold text-primary">{lineTotal(line).toFixed(0)} {t("sar")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t border-border pt-4 mt-2 flex-col gap-3 sm:flex-col">
              <div className="flex justify-between items-center w-full">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-display text-2xl font-bold text-primary">{subtotal.toFixed(0)} {t("sar")}</span>
              </div>
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary-glow h-12" onClick={() => onOpenChange(false)}>
                <Link to="/checkout">{t("checkout")}</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
