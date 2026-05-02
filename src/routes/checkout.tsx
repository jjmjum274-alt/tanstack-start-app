import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCart, cartStore, cartSubtotal, lineTotal } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, Store, CreditCard, Banknote, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// استيراد المكونات التي لا تدعم الـ SSR ديناميكياً
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "إتمام الطلب | بهار الهند" }] }),
});

const DELIVERY_FEE = 15;
const phoneSchema = z.string().trim().regex(/^[0-9+\s-]{8,15}$/);

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

function CheckoutPage() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const cart = useCart();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "online">("cash_on_delivery");
  const [contactless, setContactless] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  // التأكد من أننا في المتصفح قبل محاولة عرض الخريطة
  useEffect(() => {
    setIsClient(true);
    // استيراد leaflet وحل مشكلة الأيقونات فقط في جهة العميل
    import("leaflet").then((L) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
  }, []);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/auth" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,phone").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.full_name || "");
          setPhone(data.phone || "");
        }
      });
  }, [user]);

  const subtotal = cartSubtotal(cart);
  const deliveryFee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  if (cart.length === 0 && !submitting) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">{t("empty_cart")}</p>
        <Button asChild><Link to="/menu">{t("view_menu")}</Link></Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) { toast.error(lang === "ar" ? "الاسم مطلوب" : "Name required"); return; }
    try { phoneSchema.parse(phone); } catch { toast.error(lang === "ar" ? "رقم الجوال غير صحيح" : "Invalid phone"); return; }
    
    if (orderType === "delivery" && !position) {
      toast.error(lang === "ar" ? "يرجى تحديد موقعك على الخريطة" : "Please select your location on the map");
      return;
    }

    setSubmitting(true);
    const mapLink = position ? `https://www.google.com/maps?q=${position.lat},${position.lng}` : null;

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      order_type: orderType,
      payment_method: paymentMethod,
      payment_status: paymentMethod === "online" ? "paid" : "pending",
      contactless,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      delivery_address: orderType === "delivery" ? mapLink : null,
      notes: notes.trim() || null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      estimated_minutes: orderType === "delivery" ? 45 : 25,
      status: "new",
    } as any).select().single();

    if (error || !order) { toast.error(error?.message || "Error"); setSubmitting(false); return; }

    const items = cart.map((line) => ({
      order_id: order.id,
      item_id: line.item_id,
      item_name_ar: line.name_ar,
      item_name_en: line.name_en,
      quantity: line.quantity,
      unit_price: line.unit_price,
      selected_options: line.options,
      options_total: line.options.reduce((s, o) => s + Number(o.extra_price), 0),
      line_total: lineTotal(line),
      notes: line.notes || null,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) { toast.error(itemsErr.message); setSubmitting(false); return; }

    cartStore.clear();
    nav({ to: "/order-confirmation/$orderId", params: { orderId: order.id } });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <h1 className="font-display text-4xl font-bold mb-8">{t("checkout")}</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <Label className="text-base font-bold mb-3 block">{lang === "ar" ? "نوع الطلب" : "Order Type"}</Label>
            <RadioGroup value={orderType} onValueChange={(v: any) => setOrderType(v)} className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-smooth ${orderType === "delivery" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="delivery" className="sr-only" />
                <Truck className="h-7 w-7 text-primary" />
                <span className="font-semibold">{t("delivery")}</span>
                <span className="text-xs text-muted-foreground">+{DELIVERY_FEE} {t("sar")}</span>
              </label>
              <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-smooth ${orderType === "pickup" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="pickup" className="sr-only" />
                <Store className="h-7 w-7 text-primary" />
                <span className="font-semibold">{t("pickup")}</span>
                <span className="text-xs text-success">{lang === "ar" ? "مجاناً" : "Free"}</span>
              </label>
            </RadioGroup>
          </Card>

          <Card className="p-6 space-y-3">
            <Label className="text-base font-bold mb-1 block">{lang === "ar" ? "بيانات العميل" : "Customer Info"}</Label>
            <div><Label>{t("full_name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>{t("phone")}</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" required /></div>
            
            {orderType === "delivery" && (
              <div className="space-y-2 mt-4">
                <Label className="block mb-2 font-bold">{lang === "ar" ? "حدد موقعك على الخريطة" : "Pin your location"}</Label>
                <div className="h-64 w-full rounded-xl border-2 border-border overflow-hidden relative z-0 bg-muted flex items-center justify-center">
                  {!isClient ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <MapContainer center={[24.7136, 46.6753]} zoom={12} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                  )}
                </div>
                {position && <p className="text-sm text-green-600 font-medium">{lang === "ar" ? "تم تحديد الموقع ✓" : "Location pinned ✓"}</p>}
                
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-spice/10 border border-spice/30 mt-4">
                  <Checkbox checked={contactless} onCheckedChange={(v) => setContactless(!!v)} />
                  <ShieldCheck className="h-4 w-4 text-spice" />
                  <span className="text-sm font-medium">{t("contactless")}</span>
                </label>
              </div>
            )}
            <div className="mt-4"><Label>{t("notes")}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          </Card>

          <Card className="p-6">
            <Label className="text-base font-bold mb-3 block">{lang === "ar" ? "طريقة الدفع" : "Payment"}</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-smooth ${paymentMethod === "cash_on_delivery" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="cash_on_delivery" className="sr-only" />
                <Banknote className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t("cash_on_delivery")}</span>
              </label>
              <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-smooth ${paymentMethod === "online" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="online" className="sr-only" />
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t("online_payment")}</span>
              </label>
            </RadioGroup>
          </Card>
        </div>

        <div className="lg:sticky lg:top-20 self-start">
          <Card className="p-6 bg-card-gradient">
            <h3 className="font-display text-xl font-bold mb-4">{lang === "ar" ? "ملخص الطلب" : "Order Summary"}</h3>
            <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pe-1">
              {cart.map((l) => (
                <div key={l.lineId} className="flex justify-between text-sm">
                  <span className="line-clamp-1">{l.quantity}× {lang === "ar" ? l.name_ar : l.name_en}</span>
                  <span className="font-semibold whitespace-nowrap ms-2">{lineTotal(l).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>{t("subtotal")}</span><span>{subtotal.toFixed(0)} {t("sar")}</span></div>
              <div className="flex justify-between"><span>{t("delivery_fee")}</span><span>{deliveryFee.toFixed(0)} {t("sar")}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>{t("total")}</span>
                <span className="text-primary font-display">{total.toFixed(0)} {t("sar")}</span>
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full mt-5 h-12 bg-primary hover:bg-primary-glow text-base">
              {submitting ? "..." : t("place_order")}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}