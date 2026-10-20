CREATE TABLE public.trade_service_dossiers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid(), contract_id uuid REFERENCES public.trade_contracts(id), service_slug text NOT NULL, title text NOT NULL CHECK (length(title) BETWEEN 3 AND 160), reach text NOT NULL CHECK (reach IN ('global','national','regional')), provider text NOT NULL DEFAULT '', external_reference text NOT NULL DEFAULT '', origin_country text NOT NULL DEFAULT '', destination_country text NOT NULL DEFAULT '', quoted_pi numeric NOT NULL DEFAULT 0 CHECK (quoted_pi >= 0), due_date date, status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','in_progress','completed','cancelled')), checklist jsonb NOT NULL DEFAULT '[]', evidence jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trade_service_dossiers TO authenticated;
GRANT ALL ON public.trade_service_dossiers TO service_role;
ALTER TABLE public.trade_service_dossiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY dossier_read ON public.trade_service_dossiers FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY dossier_insert ON public.trade_service_dossiers FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (contract_id IS NULL OR public.is_contract_party(contract_id)));
CREATE POLICY dossier_update ON public.trade_service_dossiers FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND (contract_id IS NULL OR public.is_contract_party(contract_id)));
CREATE TABLE public.trade_service_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dossier_id uuid NOT NULL REFERENCES public.trade_service_dossiers(id), actor_id uuid NOT NULL, snapshot jsonb NOT NULL, previous_hash text, record_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trade_service_audit TO authenticated;
GRANT SELECT, INSERT ON public.trade_service_audit TO service_role;
ALTER TABLE public.trade_service_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY dossier_audit_read ON public.trade_service_audit FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.trade_service_dossiers d WHERE d.id = dossier_id AND d.owner_id = auth.uid()));
CREATE INDEX ON public.trade_service_dossiers(owner_id, created_at DESC);
CREATE INDEX ON public.trade_service_audit(dossier_id, created_at);
CREATE FUNCTION public.validate_trade_dossier() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'UPDATE' THEN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.service_slug IS DISTINCT FROM OLD.service_slug OR NEW.contract_id IS DISTINCT FROM OLD.contract_id THEN RAISE EXCEPTION 'Dossier identity cannot change'; END IF;
  IF OLD.status IN ('completed','cancelled') THEN RAISE EXCEPTION 'Closed dossiers are read-only'; END IF;
  IF NEW.status <> OLD.status AND NOT ((OLD.status = 'draft' AND NEW.status IN ('submitted','cancelled')) OR (OLD.status = 'submitted' AND NEW.status IN ('in_progress','cancelled')) OR (OLD.status = 'in_progress' AND NEW.status IN ('completed','cancelled'))) THEN RAISE EXCEPTION 'Invalid workflow transition'; END IF;
 ELSE
  IF NEW.status <> 'draft' THEN RAISE EXCEPTION 'New dossiers must be drafts'; END IF;
 END IF;
 IF jsonb_typeof(NEW.checklist) <> 'array' OR jsonb_typeof(NEW.evidence) <> 'array' THEN RAISE EXCEPTION 'Invalid evidence format'; END IF;
 IF NEW.status = 'completed' AND (jsonb_array_length(NEW.checklist) = 0 OR EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.checklist) x WHERE COALESCE((x->>'done')::boolean,false) = false) OR EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.evidence) x WHERE COALESCE(trim(x->>'reference'),'') = '')) THEN RAISE EXCEPTION 'Complete every task and document reference before closing'; END IF;
 NEW.updated_at = clock_timestamp(); RETURN NEW;
END $$;
CREATE TRIGGER validate_trade_dossier BEFORE INSERT OR UPDATE ON public.trade_service_dossiers FOR EACH ROW EXECUTE FUNCTION public.validate_trade_dossier();
CREATE FUNCTION public.audit_trade_dossier() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE prior text; payload jsonb; stamp timestamptz := clock_timestamp();
BEGIN
 SELECT record_hash INTO prior FROM public.trade_service_audit WHERE dossier_id = NEW.id ORDER BY created_at DESC LIMIT 1;
 payload := to_jsonb(NEW);
 INSERT INTO public.trade_service_audit(dossier_id,actor_id,snapshot,previous_hash,record_hash,created_at) VALUES (NEW.id,COALESCE(auth.uid(),NEW.owner_id),payload,prior,encode(extensions.digest(convert_to(COALESCE(prior,'') || payload::text || stamp::text,'UTF8'),'sha256'),'hex'),stamp);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audit_trade_dossier() FROM PUBLIC;
CREATE TRIGGER audit_trade_dossier AFTER INSERT OR UPDATE ON public.trade_service_dossiers FOR EACH ROW EXECUTE FUNCTION public.audit_trade_dossier();
CREATE FUNCTION public.protect_trade_service_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Trade service audit is append-only'; END $$;
CREATE TRIGGER protect_trade_service_audit BEFORE UPDATE OR DELETE ON public.trade_service_audit FOR EACH ROW EXECUTE FUNCTION public.protect_trade_service_audit();