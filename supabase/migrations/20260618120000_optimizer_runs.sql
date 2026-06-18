-- =============================================================================
-- optimizer_runs — histórico de análises do Otimizador (reabríveis)
-- RLS por usuário (auth.uid() = user_id), padrão do projeto.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.optimizer_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id   TEXT,
  campaign_id   TEXT,
  campaign_name TEXT NOT NULL DEFAULT '',
  date_preset   TEXT,
  cpa_target    NUMERIC,
  classified    JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ClassifiedAd[]
  crm_context   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.optimizer_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own optimizer runs" ON public.optimizer_runs;
DROP POLICY IF EXISTS "Users insert own optimizer runs" ON public.optimizer_runs;
DROP POLICY IF EXISTS "Users delete own optimizer runs" ON public.optimizer_runs;

CREATE POLICY "Users select own optimizer runs" ON public.optimizer_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own optimizer runs" ON public.optimizer_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own optimizer runs" ON public.optimizer_runs FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_optimizer_runs_user ON public.optimizer_runs(user_id, created_at DESC);
