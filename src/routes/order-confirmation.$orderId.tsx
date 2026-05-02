import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Truck, Store, ChefHat, Package, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/order-confirmation/$orderId")({
  component: ConfirmationPage,
  head: () => ({ meta: [{ title: "تم استلام الطلب | بهار الهند" }] }),
});

const STATUS_STEPS = ["new", "preparing", "ready", "delivered"] as const;

function ConfirmationPage() {
  const { orderId } = Route.useParams();
  const { t, lang } = useI18n();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: o } = await supabase.from("orders").select("*").eq("id", orderId).single();
      setOrder(o);
      const { data: it } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setItems(it || []);
    };
    load();

    // realtime status
    const channel = supabase.channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => setOrder(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  if (!order) return <div className="container mx-auto px-4 py-20 text-center">...</div>;

  const stepIndex = STATUS_STEPS.indexOf(order.status as any);
  const statusKey = `status_${order.status}` as const;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/15 text-success mb-4 animate-float">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-2">{t("order_received")}</h1>
        <p className="text-muted-foreground">
          {lang === "ar" ? "شكراً لطلبك من بهار الهند، يتم تجهيز طلبك الآن" : "Thank you for ordering, we're preparing your meal"}
        </p>
      </div>

      <Card className="p-6 mb-6 bg-card-gradient">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-muted-foreground">{t("order_number")}</div>
            <div className="font-display text-3xl font-bold text-primary">#{order.order_number}</div>
          </div>
          <div className="text-end">
            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> {t("estimated_time")}</div>
            <div className="font-display text-3xl font-bold text-saffron">{order.estimated_minutes} {t("minutes")}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="relative">
          <div className="grid grid-cols-4 gap-2 relative z-10">
            {STATUS_STEPS.map((s, i) => {
              const Icon = i === 0 ? Package : i === 1 ? ChefHat : i === 2 ? CheckCircle2 : (order.order_type === "delivery" ? Truck : Store);
              const done = i <= stepIndex;
              return (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-smooth ${done ? "bg-primary text-primary-foreground shadow-elegant" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-medium text-center ${done ? "text-primary" : "text-muted-foreground"}`}>
                    {t(`status_${s}` as any)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="absolute top-6 start-6 end-6 h-0.5 bg-muted -z-0">
            <div className="h-full bg-primary transition-smooth" style={{ width: `${(stepIndex / 3) * 100}%` }} />
          </div>
        </div>

        <div className="text-center mt-5">
          <Badge className="bg-saffron text-saffron-foreground border-0 text-sm px-4 py-1">
            {t(statusKey as any)}
          </Badge>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="font-display text-lg font-bold mb-3">{lang === "ar" ? "تفاصيل الطلب" : "Order Details"}</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-muted-foreground">{lang === "ar" ? "النوع: " : "Type: "}</span>{order.order_type === "delivery" ? t("delivery") : t("pickup")}</div>
          <div><span className="text-muted-foreground">{lang === "ar" ? "الدفع: " : "Payment: "}</span>{order.payment_method === "cash_on_delivery" ? t("cash_on_delivery") : t("online_payment")}</div>
          {order.delivery_address && <div className="sm:col-span-2"><span className="text-muted-foreground">{t("address")}: </span>{order.delivery_address}</div>}
          {order.contactless && <div className="sm:col-span-2 text-spice font-semibold">✓ {t("contactless")}</div>}
        </div>
        <div className="border-t border-border pt-3 space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>{it.quantity}× {lang === "ar" ? it.item_name_ar : it.item_name_en}</span>
              <span className="font-semibold">{Number(it.line_total).toFixed(0)} {t("sar")}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between font-display text-xl font-bold">
          <span>{t("total")}</span>
          <span className="text-primary">{Number(order.total).toFixed(0)} {t("sar")}</span>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild variant="outline"><Link to="/orders">{t("my_orders")}</Link></Button>
        <Button asChild className="bg-primary hover:bg-primary-glow"><Link to="/menu">{t("view_menu")}</Link></Button>
        <Button variant="outline" className="gap-2" onClick={() => setShowChat(!showChat)}>
          <MessageCircle size={18} />
          {lang === "ar" ? "الدعم الفني" : "Support Chat"}
        </Button>
      </div>

      {/* Support Chat UI */}
      {showChat && (
        <div className="mt-8 text-start bg-background border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-primary text-primary-foreground p-4 font-bold flex justify-between items-center">
            <span>{lang === "ar" ? "تواصل مع الدعم الفني" : "Customer Support"}</span>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-transparent h-auto p-0" onClick={() => setShowChat(false)}>✕</Button>
          </div>
          <div className="h-64 bg-muted/30 p-4 overflow-y-auto flex flex-col gap-3">
            <div className="bg-muted text-foreground p-3 rounded-lg rounded-tr-none self-end max-w-[80%] text-sm">
              {lang === "ar" ? `أهلاً بك، كيف يمكننا مساعدتك بخصوص الطلب #${order.order_number}؟` : "Hello, how can we help with your order?"}
            </div>
          </div>
          <div className="p-3 bg-background border-t border-border flex gap-2">
            <Input placeholder={lang === "ar" ? "اكتب رسالتك هنا..." : "Type your message..."} className="bg-muted/50" />
            <Button>{lang === "ar" ? "إرسال" : "Send"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}