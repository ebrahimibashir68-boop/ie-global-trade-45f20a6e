-- Lock down pi_wallets: read-only for owners, all mutations server-side only
REVOKE ALL ON public.pi_wallets FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.pi_wallets FROM authenticated;
GRANT SELECT ON public.pi_wallets TO authenticated;
GRANT ALL ON public.pi_wallets TO service_role;

-- Explicit deny-by-default write policies (documented, no client write path)
DROP POLICY IF EXISTS "No client wallet inserts" ON public.pi_wallets;
CREATE POLICY "No client wallet inserts" ON public.pi_wallets FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS "No client wallet updates" ON public.pi_wallets;
CREATE POLICY "No client wallet updates" ON public.pi_wallets FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "No client wallet deletes" ON public.pi_wallets;
CREATE POLICY "No client wallet deletes" ON public.pi_wallets FOR DELETE TO authenticated USING (false);

-- Contracts: ensure no anonymous access to counterparty contact data
REVOKE ALL ON public.trade_contracts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_contracts TO authenticated;
GRANT ALL ON public.trade_contracts TO service_role;