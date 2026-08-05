create or replace function public.is_contract_party(_contract_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trade_contracts c
    where c.id = _contract_id
      and (c.created_by = auth.uid() or c.buyer_user_id = auth.uid() or c.seller_user_id = auth.uid())
  )
$$;

drop policy if exists "party screenings read" on public.compliance_screenings;
drop policy if exists "party screenings write" on public.compliance_screenings;
create policy "party screenings read" on public.compliance_screenings for select to authenticated
  using (public.is_contract_party(contract_id));
create policy "party screenings write" on public.compliance_screenings for insert to authenticated
  with check (((screened_by is null) or (screened_by = auth.uid())) and public.is_contract_party(contract_id));

drop policy if exists "party documents" on public.contract_documents;
create policy "party documents" on public.contract_documents for all to authenticated
  using (public.is_contract_party(contract_id))
  with check (((created_by is null) or (created_by = auth.uid())) and public.is_contract_party(contract_id));

drop policy if exists "party events read" on public.contract_events;
drop policy if exists "party events write" on public.contract_events;
create policy "party events read" on public.contract_events for select to authenticated
  using (public.is_contract_party(contract_id));
create policy "party events write" on public.contract_events for insert to authenticated
  with check (((actor_id is null) or (actor_id = auth.uid())) and public.is_contract_party(contract_id));

drop policy if exists "party milestones" on public.contract_milestones;
create policy "party milestones" on public.contract_milestones for all to authenticated
  using (public.is_contract_party(contract_id))
  with check (((completed_by is null) or (completed_by = auth.uid())) and public.is_contract_party(contract_id));

drop policy if exists "party signatures read" on public.contract_signatures;
drop policy if exists "party signatures write" on public.contract_signatures;
create policy "party signatures read" on public.contract_signatures for select to authenticated
  using (public.is_contract_party(contract_id));
create policy "party signatures write" on public.contract_signatures for insert to authenticated
  with check (((signer_user_id is null) or (signer_user_id = auth.uid())) and public.is_contract_party(contract_id));