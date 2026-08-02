revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop policy "party milestones" on public.contract_milestones;
create policy "party milestones" on public.contract_milestones for all to authenticated
  using (exists (select 1 from public.trade_contracts c where c.id = contract_id))
  with check (exists (select 1 from public.trade_contracts c where c.id = contract_id));

drop policy "party documents" on public.contract_documents;
create policy "party documents" on public.contract_documents for all to authenticated
  using (exists (select 1 from public.trade_contracts c where c.id = contract_id))
  with check (exists (select 1 from public.trade_contracts c where c.id = contract_id));

drop policy "party signatures read" on public.contract_signatures;
drop policy "party signatures write" on public.contract_signatures;
create policy "party signatures read" on public.contract_signatures for select to authenticated
  using (exists (select 1 from public.trade_contracts c where c.id = contract_id));
create policy "party signatures write" on public.contract_signatures for insert to authenticated
  with check (exists (select 1 from public.trade_contracts c where c.id = contract_id));

drop policy "party screenings read" on public.compliance_screenings;
drop policy "party screenings write" on public.compliance_screenings;
create policy "party screenings read" on public.compliance_screenings for select to authenticated
  using (exists (select 1 from public.trade_contracts c where c.id = contract_id));
create policy "party screenings write" on public.compliance_screenings for insert to authenticated
  with check (exists (select 1 from public.trade_contracts c where c.id = contract_id));

drop policy "party events read" on public.contract_events;
drop policy "party events write" on public.contract_events;
create policy "party events read" on public.contract_events for select to authenticated
  using (exists (select 1 from public.trade_contracts c where c.id = contract_id));
create policy "party events write" on public.contract_events for insert to authenticated
  with check (exists (select 1 from public.trade_contracts c where c.id = contract_id));

drop function public.is_contract_party(uuid, uuid);
