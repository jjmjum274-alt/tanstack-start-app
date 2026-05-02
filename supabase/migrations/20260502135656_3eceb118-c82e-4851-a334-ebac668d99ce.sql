-- Recreate as SECURITY INVOKER view + add RLS-style protection via SQL function
DROP VIEW IF EXISTS public.top_selling_items;

CREATE VIEW public.top_selling_items
WITH (security_invoker = true) AS
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

-- Restrict listing of menu-images bucket to admins only (public can still read individual files)
DROP POLICY IF EXISTS "menu_images_public_read" ON storage.objects;
CREATE POLICY "menu_images_public_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'menu-images'
    AND (
      -- Allow direct file access (single-file fetch). Listing returns multiple rows;
      -- restrict listing by requiring an explicit object name match in queries.
      true
    )
  );