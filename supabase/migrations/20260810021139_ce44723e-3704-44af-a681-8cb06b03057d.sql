CREATE TABLE public.pi_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_pi NUMERIC(20,7) NOT NULL DEFAULT 0 CHECK (balance_pi >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pi_wallets TO authenticated;
GRANT ALL ON public.pi_wallets TO service_role;
ALTER TABLE public.pi_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.pi_wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER pi_wallets_updated BEFORE UPDATE ON public.pi_wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pi_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('topup','transfer_in','transfer_out','bill_payment')),
  amount_pi NUMERIC(20,7) NOT NULL CHECK (amount_pi > 0),
  direction TEXT NOT NULL CHECK (direction IN ('credit','debit')),
  counterparty TEXT,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  pi_payment_id TEXT,
  pi_txid TEXT,
  balance_after NUMERIC(20,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pi_transactions_payment_unique ON public.pi_transactions (pi_payment_id) WHERE pi_payment_id IS NOT NULL;
CREATE INDEX pi_transactions_user_idx ON public.pi_transactions (user_id, created_at DESC);
GRANT SELECT ON public.pi_transactions TO authenticated;
GRANT ALL ON public.pi_transactions TO service_role;
ALTER TABLE public.pi_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ledger" ON public.pi_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER pi_transactions_updated BEFORE UPDATE ON public.pi_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pi_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biller TEXT NOT NULL,
  reference TEXT,
  category TEXT,
  amount_pi NUMERIC(20,7) NOT NULL CHECK (amount_pi > 0),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
  paid_at TIMESTAMPTZ,
  pi_payment_id TEXT,
  pi_txid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pi_bills_user_idx ON public.pi_bills (user_id, status, due_date);
GRANT SELECT, INSERT, DELETE ON public.pi_bills TO authenticated;
GRANT ALL ON public.pi_bills TO service_role;
ALTER TABLE public.pi_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bills" ON public.pi_bills FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users add own bills" ON public.pi_bills FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own unpaid bills" ON public.pi_bills FOR DELETE TO authenticated USING (user_id = auth.uid() AND status = 'unpaid');
CREATE TRIGGER pi_bills_updated BEFORE UPDATE ON public.pi_bills FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();