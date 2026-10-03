DROP POLICY IF EXISTS "denied public read" ON public.denied_parties;
DROP POLICY IF EXISTS "controlled public read" ON public.controlled_goods;
REVOKE SELECT ON public.denied_parties FROM anon;
REVOKE SELECT ON public.controlled_goods FROM anon;
GRANT SELECT ON public.denied_parties TO authenticated;
GRANT SELECT ON public.controlled_goods TO authenticated;
CREATE POLICY "denied signed-in read" ON public.denied_parties FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "controlled signed-in read" ON public.controlled_goods FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);