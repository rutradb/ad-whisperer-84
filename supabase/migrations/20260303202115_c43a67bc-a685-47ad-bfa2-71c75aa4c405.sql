CREATE TABLE public.automated_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'campaign',
  condition_metric TEXT NOT NULL,
  condition_operator TEXT NOT NULL,
  condition_value NUMERIC NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'pause',
  date_preset TEXT NOT NULL DEFAULT 'last_7d',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automated_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own rules" ON public.automated_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.automated_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.automated_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.automated_rules FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_automated_rules_user_id ON public.automated_rules(user_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.automated_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();