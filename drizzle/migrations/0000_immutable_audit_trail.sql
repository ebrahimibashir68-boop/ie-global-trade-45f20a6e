-- Tamper-proof audit trail: ledger entries, signatures, screenings and contract
-- events are append-only. No one — not even the service role via the Data API —
-- can update or delete a row once written.

CREATE OR REPLACE FUNCTION public.block_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'This record is part of an immutable audit trail and cannot be modified or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS pi_transactions_immutable ON public.pi_transactions;
CREATE TRIGGER pi_transactions_immutable
BEFORE UPDATE OR DELETE ON public.pi_transactions
FOR EACH ROW EXECUTE FUNCTION public.block_audit_mutation();

DROP TRIGGER IF EXISTS contract_signatures_immutable ON public.contract_signatures;
CREATE TRIGGER contract_signatures_immutable
BEFORE UPDATE OR DELETE ON public.contract_signatures
FOR EACH ROW EXECUTE FUNCTION public.block_audit_mutation();

DROP TRIGGER IF EXISTS compliance_screenings_immutable ON public.compliance_screenings;
CREATE TRIGGER compliance_screenings_immutable
BEFORE UPDATE OR DELETE ON public.compliance_screenings
FOR EACH ROW EXECUTE FUNCTION public.block_audit_mutation();

DROP TRIGGER IF EXISTS contract_events_immutable ON public.contract_events;
CREATE TRIGGER contract_events_immutable
BEFORE UPDATE OR DELETE ON public.contract_events
FOR EACH ROW EXECUTE FUNCTION public.block_audit_mutation();