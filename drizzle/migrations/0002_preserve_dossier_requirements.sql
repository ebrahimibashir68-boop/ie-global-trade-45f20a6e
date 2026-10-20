CREATE FUNCTION public.preserve_dossier_requirements() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.checklist IS DISTINCT FROM OLD.checklist AND (jsonb_array_length(NEW.checklist) <> jsonb_array_length(OLD.checklist) OR EXISTS (SELECT 1 FROM jsonb_array_elements(OLD.checklist) WITH ORDINALITY o(item,n) LEFT JOIN jsonb_array_elements(NEW.checklist) WITH ORDINALITY v(item,n) USING(n) WHERE o.item->>'label' IS DISTINCT FROM v.item->>'label')) THEN RAISE EXCEPTION 'Required milestones cannot be removed or renamed'; END IF;
 IF NEW.evidence IS DISTINCT FROM OLD.evidence AND (jsonb_array_length(NEW.evidence) <> jsonb_array_length(OLD.evidence) OR EXISTS (SELECT 1 FROM jsonb_array_elements(OLD.evidence) WITH ORDINALITY o(item,n) LEFT JOIN jsonb_array_elements(NEW.evidence) WITH ORDINALITY v(item,n) USING(n) WHERE o.item->>'label' IS DISTINCT FROM v.item->>'label')) THEN RAISE EXCEPTION 'Required evidence cannot be removed or renamed'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER preserve_dossier_requirements BEFORE UPDATE ON public.trade_service_dossiers FOR EACH ROW EXECUTE FUNCTION public.preserve_dossier_requirements();