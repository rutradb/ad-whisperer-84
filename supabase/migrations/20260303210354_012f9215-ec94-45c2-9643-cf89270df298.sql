
-- 1. Criar tabela user_tokens
CREATE TABLE public.user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  fb_access_token TEXT NOT NULL,
  fb_account_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own token" ON public.user_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own token" ON public.user_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own token" ON public.user_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own token" ON public.user_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_user_tokens_user_id ON public.user_tokens(user_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Corrigir policies da automated_rules (RESTRICTIVE -> PERMISSIVE)
DROP POLICY "Users can select own rules" ON public.automated_rules;
DROP POLICY "Users can insert own rules" ON public.automated_rules;
DROP POLICY "Users can update own rules" ON public.automated_rules;
DROP POLICY "Users can delete own rules" ON public.automated_rules;

CREATE POLICY "Users can select own rules" ON public.automated_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.automated_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.automated_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.automated_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);
