-- =============================================================================
-- Persistência de resultados de IA
--   strategic_scans : histórico de varreduras estratégicas (reabríveis)
--   ai_insights     : cache do último painel de insights por (conta + contexto)
-- RLS por usuário (auth.uid() = user_id), padrão do projeto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- strategic_scans (histórico)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.strategic_scans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,
  title       TEXT NOT NULL DEFAULT 'Varredura',
  date_range  TEXT,
  complexity  TEXT,
  result      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own scans" ON public.strategic_scans;
DROP POLICY IF EXISTS "Users insert own scans" ON public.strategic_scans;
DROP POLICY IF EXISTS "Users delete own scans" ON public.strategic_scans;

CREATE POLICY "Users select own scans" ON public.strategic_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scans" ON public.strategic_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own scans" ON public.strategic_scans FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_strategic_scans_user ON public.strategic_scans(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- ai_insights (cache do último por contexto)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL DEFAULT '',
  context     TEXT NOT NULL DEFAULT '',
  insights    JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_insights_unique_scope UNIQUE (user_id, customer_id, context)
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users insert own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users update own insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users delete own insights" ON public.ai_insights;

CREATE POLICY "Users select own insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own insights" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own insights" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_ai_insights_updated_at ON public.ai_insights;
CREATE TRIGGER trg_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
