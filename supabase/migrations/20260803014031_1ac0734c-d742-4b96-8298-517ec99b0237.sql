-- compliance_screenings
DROP POLICY IF EXISTS "party screenings write" ON public.compliance_screenings;
CREATE POLICY "party screenings write" ON public.compliance_screenings
FOR INSERT TO authenticated
WITH CHECK (
  (screened_by IS NULL OR screened_by = auth.uid())
  AND EXISTS (SELECT 1 FROM public.trade_contracts c WHERE c.id = contract_id)
);

-- contract_documents
DROP POLICY IF EXISTS "party documents" ON public.contract_documents;
CREATE POLICY "party documents" ON public.contract_documents
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.trade_contracts c WHERE c.id = contract_id))
WITH CHECK (
  (created_by IS NULL OR created_by = auth.uid())
  AND EXISTS (SELECT 1 FROM public.trade_contracts c WHERE c.id = contract_id)
);

-- contract_events
DROP POLICY IF EXISTS "party events write" ON public.contract_events;
CREATE POLICY "party events write" ON public.contract_events
FOR INSERT TO authenticated
WITH CHECK (
  (actor_id IS NULL OR actor_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.trade_contracts c WHERE c.id = contract_id)
);

-- contract_milestones
DROP POLICY IF EXISTS "party milestones" ON public.contract_milestones;
CREATE POLICY "party milestones" ON public.contract_milestones
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.trade_contracts c WHERE c.id = contract_id))
WITH CHECK (
  (completed_by IS NULL OR completed_by = auth.uid())
  AND EXISTS (SELECT 1 FROM public.trade_contracts c WHERE c.id = contract_id)
);

-- contract_signatures
DROP POLICY IF EXISTS "party signatures write" ON public.contract_signatures;
CREATE POLICY "party signatures write" ON public.contract_signatures
FOR INSERT TO authenticated
WITH CHECK (
  (signer_user_id IS NULL OR signer_user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.trade_contracts c WHERE c.id = contract_id)
);