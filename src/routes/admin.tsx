import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  TrendingUp, ShoppingBag, Users, DollarSign, Plus, Pencil, Trash2, Search,
  Clock, ChefHat, CheckCircle2, Truck, XCircle, Printer, MapPin
} from "lucide-react";
import { resolveImg } from "@/components/MenuItemCard";
import { MenuItemDialog } from "@/components/admin/MenuItemDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "لوحة التحكم | مطعم بحر الهند" }] }),
});

const STATUSES = ["new", "preparing", "ready", "delivered", "cancelled"] as const;
const STATUS_ICONS = { new: Clock, preparing: ChefHat, ready: CheckCircle2, delivered: Truck, cancelled: XCircle };

function AdminPage() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin(user?.id);
  const nav = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const reload = () => {
    supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setOrders(data || []));
    supabase.from("menu_items").select("*, categories(name_ar, name_en)").order("display_order")
      .then(({ data }) => setItems(data || []));
    supabase.from("categories").select("*").order("display_order")
      .then(({ data }) => setCategories(data || []));
    supabase.from("top_selling_items" as any).select("*").order("total_sold", { ascending: false }).limit(10)
      .then(({ data }) => setTopItems((data as any[]) || []));
  };

  useEffect(() => {
    if (!isAdmin) return;
    reload();
    const channel = supabase.channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  // === STATS ===
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const active = orders.filter((o) => o.status !== "cancelled");

    const sumRevenue = (arr: any[]) => arr.reduce((s, o) => s + Number(o.total || 0), 0);
    const todayOrders = active.filter((o) => new Date(o.created_at) >= today);
    const weekOrders = active.filter((o) => new Date(o.created_at) >= weekAgo);
    const monthOrders = active.filter((o) => new Date(o.created_at) >= monthAgo);

    const uniqueCustomers = new Set(active.map((o) => o.user_id)).size;
    const avg = active.length ? sumRevenue(active) / active.length : 0;

    return {
      todayCount: todayOrders.length, todayRev: sumRevenue(todayOrders),
      weekCount: weekOrders.length, weekRev: sumRevenue(weekOrders),
      monthCount: monthOrders.length, monthRev: sumRevenue(monthOrders),
      totalCount: active.length, totalRev: sumRevenue(active),
      customers: uniqueCustomers, avg,
    };
  }, [orders]);

  if (loading || roleLoading) return <div className="container mx-auto px-4 py-20 text-center">...</div>;
  if (!isAdmin) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold mb-3">{lang === "ar" ? "صلاحية الإدارة مطلوبة" : "Admin access required"}</h1>
      <p className="text-muted-foreground text-sm mb-4">
        {lang === "ar" ? "لتجربة لوحة التحكم سجل الدخول بـ:" : "Try the demo admin account:"}
      </p>
      <Card className="max-w-sm mx-auto p-4 text-start">
        <div className="text-sm"><b>Email:</b> admin@bahar.demo</div>
        <div className="text-sm"><b>Password:</b> Admin@2026</div>
      </Card>
    </div>
  );

  const updateStatus = async (id: string, status: typeof STATUSES[number]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success(lang === "ar" ? "تم تحديث الحالة" : "Status updated");
  };

  const toggleAvailable = async (id: string, val: boolean) => {
    const { error } = await supabase.from("menu_items").update({ is_available: val }).eq("id", id);
    if (error) toast.error(error.message); else reload();
  };

  const deleteItem = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(lang === "ar" ? "تم الحذف" : "Deleted"); reload(); }
    setDeleteId(null);
  };

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (it: any) => { setEditing(it); setDialogOpen(true); };

  const printInvoice = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let itemsHtml = '';
    order.order_items?.forEach((item: any) => {
        itemsHtml += `
            <tr>
                <td>${lang === 'ar' ? item.item_name_ar : item.item_name_en}</td>
                <td>${item.quantity}</td>
                <td>${item.unit_price} ريال</td>
                <td>${item.line_total} ريال</td>
            </tr>
        `;
    });

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة طلب رقم ${order.order_number}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1f2937; }
            .details { margin-bottom: 30px; line-height: 1.8; font-size: 16px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9fafb;}
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            .table th { background-color: #f3f4f6; font-weight: bold; }
            .total { text-align: left; font-size: 20px; font-weight: bold; color: #1f2937; margin-top: 20px;}
            .footer { text-align: center; margin-top: 50px; font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px;}
          </style>
        </head>
        <body>
          <div class="header">
            <h1>مطعم بحر الهند</h1>
            <p>فاتورة ضريبية مبسطة</p>
          </div>
          <div class="details">
            <strong>رقم الطلب:</strong> ${order.order_number}<br>
            <strong>تاريخ الطلب:</strong> ${new Date(order.created_at).toLocaleString('ar-SA')}<br>
            <strong>اسم العميل:</strong> ${order.customer_name}<br>
            <strong>رقم الجوال:</strong> <span dir="ltr">${order.customer_phone}</span><br>
            <strong>نوع الطلب:</strong> ${order.order_type === 'delivery' ? 'توصيل' : 'استلام من الفرع'}<br>
            ${order.delivery_address && !order.delivery_address.includes('http') ? `<strong>عنوان التوصيل:</strong> ${order.delivery_address}<br>` : ''}
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">المجموع الفرعي: ${order.subtotal} ريال</div>
          ${order.delivery_fee > 0 ? `<div class="total" style="font-size: 16px;">رسوم التوصيل: ${order.delivery_fee} ريال</div>` : ''}
          <div class="total" style="font-size: 24px;">الإجمالي الشامل: ${order.total} ريال</div>
          <div class="footer">شكراً لثقتكم بخدماتنا - مطعم بحر الهند</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }), {} as Record<string, number>);
  const filteredMenu = items.filter((i) => {
    if (!menuSearch) return true;
    const q = menuSearch.toLowerCase();
    return i.name_ar.toLowerCase().includes(q) || i.name_en.toLowerCase().includes(q);
  });

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">{t("admin")}</h1>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "لوحة إدارة المطعم" : "Restaurant Management Dashboard"}</p>
        </div>
        <Badge variant="outline" className="border-spice text-spice">
          {lang === "ar" ? "النظام متصل" : "System Live"}
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="orders">{lang === "ar" ? "سجل الطلبات" : "Orders Log"} ({orders.length})</TabsTrigger>
          <TabsTrigger value="menu">{lang === "ar" ? "إدارة قائمة الطعام" : "Menu Management"} ({items.length})</TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW ============ */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={DollarSign} label={`${t("revenue")} - ${t("today")}`}
              value={`${stats.todayRev.toFixed(0)} ${t("sar")}`} sub={`${stats.todayCount} ${lang === "ar" ? "طلب" : "orders"}`} accent="primary" />
            <StatCard icon={TrendingUp} label={`${t("revenue")} - ${t("this_week")}`}
              value={`${stats.weekRev.toFixed(0)} ${t("sar")}`} sub={`${stats.weekCount} ${lang === "ar" ? "طلب" : "orders"}`} accent="saffron" />
            <StatCard icon={ShoppingBag} label={`${t("revenue")} - ${t("this_month")}`}
              value={`${stats.monthRev.toFixed(0)} ${t("sar")}`} sub={`${stats.monthCount} ${lang === "ar" ? "طلب" : "orders"}`} accent="spice" />
            <StatCard icon={Users} label={t("customers")}
              value={String(stats.customers)} sub={`${t("avg_order")}: ${stats.avg.toFixed(0)} ${t("sar")}`} accent="primary" />
          </div>

          <Card className="p-5">
            <h3 className="font-display text-lg font-bold mb-4">{lang === "ar" ? "توزيع الطلبات حسب الحالة" : "Orders by status"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {STATUSES.map((s) => {
                const Icon = STATUS_ICONS[s];
                return (
                  <div key={s} className="p-3 rounded-lg border border-border">
                    <Icon className="h-5 w-5 text-saffron mb-2" />
                    <div className="text-xs text-muted-foreground">{t(`status_${s}` as any)}</div>
                    <div className="font-display text-2xl font-bold">{counts[s]}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              {t("top_dishes")}
            </h3>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{lang === "ar" ? "لا توجد مبيعات مسجلة حتى الآن" : "No sales recorded yet"}</p>
            ) : (
              <div className="space-y-2">
                {topItems.map((it, i) => (
                  <div key={it.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="font-display text-2xl font-bold text-saffron w-8">{i + 1}</div>
                    <img src={resolveImg(it.image_url)} alt="" className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{lang === "ar" ? it.name_ar : it.name_en}</div>
                      <div className="text-xs text-muted-foreground">{Number(it.price).toFixed(0)} {t("sar")}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-display font-bold text-primary">{it.total_sold}</div>
                      <div className="text-[10px] text-muted-foreground">{lang === "ar" ? "الكمية المباعة" : "Sold Quantity"}</div>
                    </div>
                    <div className="text-end hidden sm:block">
                      <div className="font-display font-bold">{Number(it.total_revenue).toFixed(0)}</div>
                      <div className="text-[10px] text-muted-foreground">{t("sar")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ============ ORDERS ============ */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Card className={`p-3 cursor-pointer transition-smooth ${filter === "all" ? "border-primary border-2" : ""}`} onClick={() => setFilter("all")}>
              <div className="text-xs text-muted-foreground">{t("all")}</div>
              <div className="font-display text-2xl font-bold">{orders.length}</div>
            </Card>
            {STATUSES.map((s) => (
              <Card key={s} className={`p-3 cursor-pointer transition-smooth ${filter === s ? "border-primary border-2" : ""}`} onClick={() => setFilter(s)}>
                <div className="text-xs text-muted-foreground">{t(`status_${s}` as any)}</div>
                <div className="font-display text-2xl font-bold text-primary">{counts[s]}</div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {filteredOrders.map((o) => (
              <Card key={o.id} className="p-5 hover:shadow-elegant transition-smooth">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="font-display text-2xl font-bold text-primary">#{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => (
                      <Button key={s} size="sm" variant={o.status === s ? "default" : "outline"}
                        className={o.status === s ? "bg-primary hover:bg-primary-glow h-8" : "h-8"}
                        onClick={() => updateStatus(o.id, s)}>
                        {t(`status_${s}` as any)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm mb-2">
                  <div><span className="text-muted-foreground">{lang === "ar" ? "العميل: " : "Customer: "}</span>{o.customer_name} · <span dir="ltr">{o.customer_phone}</span></div>
                  <div><span className="text-muted-foreground">{lang === "ar" ? "النوع: " : "Type: "}</span>{o.order_type === "delivery" ? t("delivery") : t("pickup")}</div>
                  
                  {/* عرض موقع الخريطة كـ رابط قابل للنقر */}
                  {o.delivery_address && o.delivery_address.includes("http") ? (
                    <div className="sm:col-span-2">
                        <a href={o.delivery_address} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                            <MapPin size={16} /> فتح موقع التوصيل على الخريطة
                        </a>
                    </div>
                  ) : (
                    o.delivery_address && <div className="sm:col-span-2"><span className="text-muted-foreground">{t("address")}: </span>{o.delivery_address}</div>
                  )}

                  {o.contactless && <Badge className="bg-spice text-white border-0 w-fit">{t("contactless")}</Badge>}
                </div>
                
                <div className="border-t border-border pt-2 text-sm">
                  {o.order_items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{it.quantity}× {lang === "ar" ? it.item_name_ar : it.item_name_en}</span>
                      <span>{Number(it.line_total).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold">
                  <span>{t("total")}</span>
                  <span className="text-primary">{Number(o.total).toFixed(0)} {t("sar")}</span>
                </div>

                {/* زر طباعة الفاتورة */}
                <div className="mt-4 pt-3 border-t border-border">
                  <Button onClick={() => printInvoice(o)} variant="outline" className="w-full flex items-center justify-center gap-2 h-10">
                    <Printer size={18} />
                    {lang === "ar" ? "طباعة الفاتورة" : "Print Invoice"}
                  </Button>
                </div>
              </Card>
            ))}
            {filteredOrders.length === 0 && <div className="text-center text-muted-foreground py-12">{lang === "ar" ? "لا توجد سجلات حالية" : "No records found"}</div>}
          </div>
        </TabsContent>

        {/* ============ MENU MANAGEMENT ============ */}
        <TabsContent value="menu" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder={lang === "ar" ? "البحث في القائمة..." : "Search menu..."} value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)} className="ps-9" />
            </div>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary-glow">
              <Plus className="h-4 w-4 me-1" /> {t("add_dish")}
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMenu.map((it) => (
              <Card key={it.id} className="overflow-hidden hover:shadow-elegant transition-smooth">
                <div className="flex">
                  <img src={resolveImg(it.image_url)} alt="" className="w-24 h-24 object-cover flex-shrink-0" />
                  <div className="p-3 flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{lang === "ar" ? it.name_ar : it.name_en}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {lang === "ar" ? it.categories?.name_ar : it.categories?.name_en}
                    </div>
                    <div className="font-display font-bold text-primary text-sm mt-1">{Number(it.price).toFixed(0)} {t("sar")}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {it.is_featured && <Badge className="bg-saffron-gradient text-saffron-foreground border-0 text-[9px] px-1.5 py-0">مميز</Badge>}
                      <Switch checked={it.is_available} onCheckedChange={(v) => toggleAvailable(it.id, v)} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-border flex">
                  <Button variant="ghost" size="sm" className="flex-1 rounded-none h-9" onClick={() => openEdit(it)}>
                    <Pencil className="h-3.5 w-3.5 me-1" /> {t("edit")}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 rounded-none h-9 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(it.id)}>
                    <Trash2 className="h-3.5 w-3.5 me-1" /> {t("delete")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <MenuItemDialog open={dialogOpen} onOpenChange={setDialogOpen}
        item={editing} categories={categories} onSaved={reload} />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar" ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive hover:bg-destructive/90">{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: any) {
  const accentMap: any = {
    primary: "from-primary/20 to-primary/5 text-primary",
    saffron: "from-saffron/20 to-saffron/5 text-saffron",
    spice: "from-spice/20 to-spice/5 text-spice",
  };
  return (
    <Card className={`p-4 bg-gradient-to-br ${accentMap[accent]} border-0`}>
      <Icon className="h-5 w-5 mb-2 opacity-80" />
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </Card>
  );
}