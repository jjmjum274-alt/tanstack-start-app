import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "طلباتي | بهار الهند" }] }),
});

function OrdersPage() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data || []));
    const channel = supabase.channel("my-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || [])))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const statusColor: Record<string, string> = {
    new: "bg-saffron text-saffron-foreground",
    preparing: "bg-primary text-primary-foreground",
    ready: "bg-spice text-white",
    delivered: "bg-success text-success-foreground",
    cancelled: "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="font-display text-4xl font-bold mb-6">{t("my_orders")}</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-3">🍽️</div>
          <p className="text-muted-foreground mb-4">{lang === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}</p>
          <Button asChild><Link to="/menu">{t("view_menu")}</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} to="/order-confirmation/$orderId" params={{ orderId: o.id }}>
              <Card className="p-5 hover:border-saffron/50 transition-smooth cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-xl font-bold text-primary">#{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</div>
                  </div>
                  <Badge className={`${statusColor[o.status]} border-0`}>{t(`status_${o.status}` as any)}</Badge>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">{o.order_type === "delivery" ? t("delivery") : t("pickup")}</span>
                  <span className="font-bold text-primary">{Number(o.total).toFixed(0)} {t("sar")}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
