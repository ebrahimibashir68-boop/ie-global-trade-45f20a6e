-- ============ enums ============
create type public.entity_type as enum ('individual','company','institution','government');
create type public.incoterm_2020 as enum ('EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP');
create type public.contract_status as enum ('draft','pending_counterparty','signed','funded','in_transit','customs','delivered','completed','cancelled','disputed');
create type public.transport_mode as enum ('sea','air','road','rail','multimodal','post');
create type public.trade_doc_type as enum ('commercial_invoice','packing_list','certificate_of_origin','bill_of_lading','air_waybill','insurance_certificate','inspection_certificate','phytosanitary','export_licence','customs_declaration','other');
create type public.screening_outcome as enum ('clear','review','blocked');

-- ============ helper: updated_at ============
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  pi_username text,
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile write" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ organizations ============
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  legal_name text not null,
  entity_type public.entity_type not null default 'company',
  country_code text not null,
  registration_no text,
  tax_id text,
  eori_no text,
  address text,
  contact_email text,
  pi_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
alter table public.organizations enable row level security;
create policy "own orgs" on public.organizations for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create trigger organizations_updated before update on public.organizations for each row execute function public.set_updated_at();

-- ============ contracts ============
create table public.trade_contracts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('TC-' || to_char(now(),'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  created_by uuid not null references auth.users(id) on delete cascade,
  buyer_user_id uuid references auth.users(id) on delete set null,
  seller_user_id uuid references auth.users(id) on delete set null,
  buyer_org_id uuid references public.organizations(id) on delete set null,
  seller_org_id uuid references public.organizations(id) on delete set null,
  buyer_legal_name text,
  seller_legal_name text,
  counterparty_email text,
  title text not null,
  goods_description text not null,
  hs_code text,
  category text,
  quantity numeric not null default 1,
  unit text not null default 'units',
  net_weight_kg numeric,
  gross_weight_kg numeric,
  volume_m3 numeric,
  package_count integer,
  origin_country text not null,
  destination_country text not null,
  incoterm public.incoterm_2020 not null default 'CIF',
  named_place text,
  port_of_loading text,
  port_of_discharge text,
  currency text not null default 'USD',
  contract_value numeric not null default 0,
  amount_pi numeric not null default 0,
  payment_terms text,
  transport_mode public.transport_mode not null default 'sea',
  carrier text,
  vessel_or_flight text,
  container_no text,
  transport_doc_no text,
  etd date,
  eta date,
  insurer text,
  policy_no text,
  insured_value numeric,
  insurance_clauses text,
  duty_estimate numeric,
  vat_estimate numeric,
  compliance_notes text,
  status public.contract_status not null default 'draft',
  pi_payment_id text,
  pi_txid text,
  funded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index trade_contracts_parties_idx on public.trade_contracts (buyer_user_id, seller_user_id, created_by);

create or replace function public.is_contract_party(_contract_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trade_contracts c
    where c.id = _contract_id
      and (c.created_by = _user_id or c.buyer_user_id = _user_id or c.seller_user_id = _user_id)
  );
$$;

grant select, insert, update, delete on public.trade_contracts to authenticated;
grant all on public.trade_contracts to service_role;
alter table public.trade_contracts enable row level security;
create policy "party read" on public.trade_contracts for select to authenticated
  using (created_by = auth.uid() or buyer_user_id = auth.uid() or seller_user_id = auth.uid());
create policy "create own" on public.trade_contracts for insert to authenticated with check (created_by = auth.uid());
create policy "party update" on public.trade_contracts for update to authenticated
  using (created_by = auth.uid() or buyer_user_id = auth.uid() or seller_user_id = auth.uid())
  with check (created_by = auth.uid() or buyer_user_id = auth.uid() or seller_user_id = auth.uid());
create policy "creator delete draft" on public.trade_contracts for delete to authenticated
  using (created_by = auth.uid() and status = 'draft');
create trigger trade_contracts_updated before update on public.trade_contracts for each row execute function public.set_updated_at();

-- ============ milestones ============
create table public.contract_milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.trade_contracts(id) on delete cascade,
  seq integer not null,
  key text not null,
  label text not null,
  release_pct numeric not null default 0,
  required_docs text[] not null default '{}',
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index contract_milestones_contract_idx on public.contract_milestones (contract_id, seq);
grant select, insert, update, delete on public.contract_milestones to authenticated;
grant all on public.contract_milestones to service_role;
alter table public.contract_milestones enable row level security;
create policy "party milestones" on public.contract_milestones for all to authenticated
  using (public.is_contract_party(contract_id, auth.uid()))
  with check (public.is_contract_party(contract_id, auth.uid()));

-- ============ documents ============
create table public.contract_documents (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.trade_contracts(id) on delete cascade,
  doc_type public.trade_doc_type not null,
  doc_number text,
  issuer text,
  issued_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  hash text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index contract_documents_contract_idx on public.contract_documents (contract_id);
grant select, insert, update, delete on public.contract_documents to authenticated;
grant all on public.contract_documents to service_role;
alter table public.contract_documents enable row level security;
create policy "party documents" on public.contract_documents for all to authenticated
  using (public.is_contract_party(contract_id, auth.uid()))
  with check (public.is_contract_party(contract_id, auth.uid()));

-- ============ signatures ============
create table public.contract_signatures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.trade_contracts(id) on delete cascade,
  role text not null,
  signer_user_id uuid references auth.users(id) on delete set null,
  signer_name text not null,
  hash text not null,
  signed_at timestamptz not null default now(),
  unique (contract_id, role)
);
grant select, insert on public.contract_signatures to authenticated;
grant all on public.contract_signatures to service_role;
alter table public.contract_signatures enable row level security;
create policy "party signatures read" on public.contract_signatures for select to authenticated
  using (public.is_contract_party(contract_id, auth.uid()));
create policy "party signatures write" on public.contract_signatures for insert to authenticated
  with check (public.is_contract_party(contract_id, auth.uid()));

-- ============ screenings ============
create table public.compliance_screenings (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.trade_contracts(id) on delete cascade,
  outcome public.screening_outcome not null,
  matches jsonb not null default '[]'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  screened_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index compliance_screenings_contract_idx on public.compliance_screenings (contract_id);
grant select, insert on public.compliance_screenings to authenticated;
grant all on public.compliance_screenings to service_role;
alter table public.compliance_screenings enable row level security;
create policy "party screenings read" on public.compliance_screenings for select to authenticated
  using (public.is_contract_party(contract_id, auth.uid()));
create policy "party screenings write" on public.compliance_screenings for insert to authenticated
  with check (public.is_contract_party(contract_id, auth.uid()));

-- ============ audit events ============
create table public.contract_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.trade_contracts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index contract_events_contract_idx on public.contract_events (contract_id, created_at desc);
grant select, insert on public.contract_events to authenticated;
grant all on public.contract_events to service_role;
alter table public.contract_events enable row level security;
create policy "party events read" on public.contract_events for select to authenticated
  using (public.is_contract_party(contract_id, auth.uid()));
create policy "party events write" on public.contract_events for insert to authenticated
  with check (public.is_contract_party(contract_id, auth.uid()));

-- ============ reference data (public) ============
create table public.hs_codes (
  code text primary key,
  chapter text not null,
  description text not null,
  unit text,
  keywords text[] not null default '{}'
);
grant select on public.hs_codes to anon, authenticated;
grant all on public.hs_codes to service_role;
alter table public.hs_codes enable row level security;
create policy "hs public read" on public.hs_codes for select to anon, authenticated using (true);

create table public.duty_rates (
  id uuid primary key default gen_random_uuid(),
  destination_country text not null,
  hs_prefix text not null,
  duty_pct numeric not null default 0,
  vat_pct numeric not null default 0,
  note text,
  unique (destination_country, hs_prefix)
);
grant select on public.duty_rates to anon, authenticated;
grant all on public.duty_rates to service_role;
alter table public.duty_rates enable row level security;
create policy "duty public read" on public.duty_rates for select to anon, authenticated using (true);

create table public.denied_parties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text,
  list_source text not null,
  reason text
);
grant select on public.denied_parties to anon, authenticated;
grant all on public.denied_parties to service_role;
alter table public.denied_parties enable row level security;
create policy "denied public read" on public.denied_parties for select to anon, authenticated using (true);

create table public.controlled_goods (
  id uuid primary key default gen_random_uuid(),
  hs_prefix text not null,
  regime text not null,
  description text not null,
  severity public.screening_outcome not null default 'review'
);
grant select on public.controlled_goods to anon, authenticated;
grant all on public.controlled_goods to service_role;
alter table public.controlled_goods enable row level security;
create policy "controlled public read" on public.controlled_goods for select to anon, authenticated using (true);

-- ============ seed reference data ============
insert into public.hs_codes (code, chapter, description, unit, keywords) values
('0901.11','09','Coffee, not roasted, not decaffeinated','kg','{coffee,arabica,robusta,green beans}'),
('0902.30','09','Black tea, in packings not exceeding 3 kg','kg','{tea,black tea}'),
('1006.30','10','Semi-milled or wholly milled rice','kg','{rice,grain}'),
('1511.10','15','Crude palm oil','kg','{palm oil,vegetable oil}'),
('2523.29','25','Portland cement, other','kg','{cement,construction}'),
('2709.00','27','Petroleum oils, crude','bbl','{crude oil,petroleum}'),
('3004.90','30','Medicaments, other, put up in measured doses','kg','{medicine,pharmaceutical}'),
('4015.19','40','Gloves of vulcanised rubber, other','pcs','{gloves,nitrile,medical}'),
('4407.11','44','Coniferous wood sawn lengthwise, pine','m3','{timber,lumber,wood}'),
('5201.00','52','Cotton, not carded or combed','kg','{cotton,fibre}'),
('6109.10','61','T-shirts, singlets, of cotton, knitted','pcs','{apparel,tshirt,garment}'),
('7108.13','71','Gold in other semi-manufactured forms','g','{gold,bullion}'),
('7208.51','72','Flat-rolled iron/steel, thickness > 10 mm','kg','{steel,plate,metal}'),
('7601.10','76','Aluminium, not alloyed, unwrought','kg','{aluminium,ingot}'),
('8471.30','84','Portable digital automatic data-processing machines','pcs','{laptop,computer}'),
('8481.80','84','Taps, cocks, valves, other appliances','pcs','{valve,industrial}'),
('8504.40','85','Static converters (inverters, rectifiers)','pcs','{inverter,solar,converter}'),
('8541.43','85','Photovoltaic cells assembled in modules','pcs','{solar panel,photovoltaic}'),
('8703.23','87','Motor cars, spark-ignition, 1500-3000 cc','pcs','{car,vehicle,automobile}'),
('8708.99','87','Parts and accessories of motor vehicles, other','pcs','{auto parts,spares}'),
('8802.40','88','Aeroplanes, unladen weight exceeding 15,000 kg','pcs','{aircraft,aeroplane}'),
('9018.90','90','Instruments and appliances used in medical sciences','pcs','{medical device,surgical}'),
('9403.60','94','Other wooden furniture','pcs','{furniture,wood}'),
('1701.99','17','Cane or beet sugar, other','kg','{sugar}'),
('3102.10','31','Urea, whether or not in aqueous solution','kg','{urea,fertiliser,fertilizer}');

insert into public.duty_rates (destination_country, hs_prefix, duty_pct, vat_pct, note) values
('DE','09',0,7,'EU MFN — most coffee/tea duty free, reduced VAT on foodstuffs'),
('DE','84',2.7,19,'EU MFN machinery'),
('DE','85',3.7,19,'EU MFN electrical'),
('DE','87',10,19,'EU MFN vehicles'),
('DE','61',12,19,'EU MFN apparel'),
('US','09',0,0,'US HTS — no federal VAT'),
('US','84',2.5,0,'US HTS machinery'),
('US','85',2.6,0,'US HTS electrical'),
('US','61',16.5,0,'US HTS apparel'),
('US','87',2.5,0,'US HTS passenger vehicles'),
('GB','84',2,20,'UKGT machinery'),
('GB','85',2,20,'UKGT electrical'),
('GB','61',12,20,'UKGT apparel'),
('KE','84',10,16,'EAC CET intermediate goods'),
('KE','85',10,16,'EAC CET'),
('KE','87',25,16,'EAC CET finished vehicles'),
('BR','30',8,17,'Mercosur TEC pharmaceuticals'),
('BR','40',16,17,'Mercosur TEC rubber articles'),
('IN','84',7.5,18,'India BCD + IGST'),
('IN','85',10,18,'India BCD + IGST'),
('CN','84',5,13,'China MFN'),
('AE','84',5,5,'GCC common tariff'),
('ZA','72',10,15,'SACU steel'),
('NG','25',20,7.5,'ECOWAS CET cement'),
('JP','09',0,10,'Japan MFN foodstuffs');

insert into public.denied_parties (name, country_code, list_source, reason) values
('Global Arms Trading LLC','XX','Illustrative denied-party list','Arms trafficking designation'),
('Northstar Nuclear Supply Co','XX','Illustrative denied-party list','Proliferation concern'),
('Redline Shipping Group','XX','Illustrative denied-party list','Sanctions evasion — vessel spoofing'),
('Meridian Petro Holdings','XX','Illustrative denied-party list','Oil sanctions circumvention'),
('Blackhawk Defence Systems','XX','Illustrative denied-party list','Military end-use restriction');

insert into public.controlled_goods (hs_prefix, regime, description, severity) values
('93','Conventional arms control','Arms and ammunition — export licence and end-user certificate required','blocked'),
('2844','Nuclear Suppliers Group','Radioactive elements and isotopes — NSG licence required','blocked'),
('8802','Wassenaar Arrangement','Aircraft and airframes — dual-use review required','review'),
('8526','Wassenaar Arrangement','Radar and radio navigation apparatus — dual-use review','review'),
('2933','Chemical Weapons Convention','Heterocyclic compounds — precursor screening required','review'),
('3002','Australia Group','Vaccines, toxins and cultures — biological controls apply','review'),
('7108','FATF / precious metals','Gold — enhanced due diligence and provenance evidence required','review'),
('8542','Export control (semiconductors)','Integrated circuits — advanced-node end-use screening','review'),
('4403','CITES / EUDR','Untreated wood — deforestation-free due diligence statement required','review'),
('0301','CITES','Live fish — species permits may be required','review');
