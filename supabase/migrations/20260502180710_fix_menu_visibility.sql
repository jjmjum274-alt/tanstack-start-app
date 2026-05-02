-- السماح للجميع برؤية الأطباق
ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read menu_items" ON "public"."menu_items" FOR SELECT USING (true);

-- السماح للجميع برؤية التصنيفات
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read categories" ON "public"."categories" FOR SELECT USING (true);