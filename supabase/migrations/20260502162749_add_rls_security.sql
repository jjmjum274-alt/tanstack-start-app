-- تأمين جدول الطلبات
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to orders" ON "public"."orders" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admins to read orders" ON "public"."orders" FOR SELECT USING (auth.role() = 'authenticated');

-- تأمين جدول تفاصيل الطلبات
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to order items" ON "public"."order_items" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admins to read order items" ON "public"."order_items" FOR SELECT USING (auth.role() = 'authenticated');