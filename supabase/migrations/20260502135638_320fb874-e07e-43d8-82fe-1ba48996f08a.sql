-- 1) Add ingredients column to menu_items
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS ingredients_ar text,
  ADD COLUMN IF NOT EXISTS ingredients_en text,
  ADD COLUMN IF NOT EXISTS calories integer,
  ADD COLUMN IF NOT EXISTS prep_minutes integer DEFAULT 20;

-- 2) Storage bucket for menu images (public read, admin write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view all images
DROP POLICY IF EXISTS "menu_images_public_read" ON storage.objects;
CREATE POLICY "menu_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

-- Only admins can upload/update/delete
DROP POLICY IF EXISTS "menu_images_admin_insert" ON storage.objects;
CREATE POLICY "menu_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "menu_images_admin_update" ON storage.objects;
CREATE POLICY "menu_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "menu_images_admin_delete" ON storage.objects;
CREATE POLICY "menu_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

-- 3) Top-selling items view (admins read via has_role)
CREATE OR REPLACE VIEW public.top_selling_items AS
SELECT
  mi.id,
  mi.name_ar,
  mi.name_en,
  mi.price,
  mi.image_url,
  COALESCE(SUM(oi.quantity), 0)::int AS total_sold,
  COALESCE(SUM(oi.line_total), 0)::numeric AS total_revenue
FROM public.menu_items mi
LEFT JOIN public.order_items oi ON oi.item_id = mi.id
LEFT JOIN public.orders o ON o.id = oi.order_id AND o.status <> 'cancelled'
GROUP BY mi.id;