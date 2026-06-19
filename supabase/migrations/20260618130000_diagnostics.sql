-- =============================================================================
-- diagnostics — histórico de diagnósticos da conta (reabríveis)
-- RLS por usuário (auth.uid() = user_id), padrão do projeto.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.diagnostics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,
  date_preset TEXT,
  alerts      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- DiagnosticAlert[]
  total       INTEGER NOT NULL DEFAULT 0,
  critical    INTEGER NOT NULL DEFAULT 0,
  warning     INTEGER NOT NULL DEFAULT 0,
  healthy     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Users insert own diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Users delete own diagnostics" ON public.diagnostics;

CREATE POLICY "Users select own diagnostics" ON public.diagnostics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diagnostics" ON public.diagnostics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own diagnostics" ON public.diagnostics FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_diagnostics_user ON public.diagnostics(user_id, created_at DESC);
