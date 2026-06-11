
-- ai_action_plans
CREATE TABLE IF NOT EXISTS public.ai_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  login_customer_id TEXT,
  source TEXT NOT NULL DEFAULT 'agent',
  title TEXT NOT NULL,
  rationale TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',
  risk_tier TEXT NOT NULL DEFAULT 'medium',
  estimated_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_action_plans_status_chk CHECK (status IN ('proposed','authorized','rejected','executing','executed','verified','rolled_back','failed')),
  CONSTRAINT ai_action_plans_risk_tier_chk CHECK (risk_tier IN ('low','medium','high'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_action_plans TO authenticated;
GRANT ALL ON public.ai_action_plans TO service_role;
ALTER TABLE public.ai_action_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own action plans" ON public.ai_action_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action plans" ON public.ai_action_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action plans" ON public.ai_action_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action plans" ON public.ai_action_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_plans_user_id ON public.ai_action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_plans_customer ON public.ai_action_plans(user_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_plans_status ON public.ai_action_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_action_plans_created_at ON public.ai_action_plans(created_at DESC);
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_action_plans;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_action_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ai_action_items
CREATE TABLE IF NOT EXISTS public.ai_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.ai_action_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  resource_name TEXT,
  before_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  execution_status TEXT NOT NULL DEFAULT 'pending',
  google_result JSONB,
  error JSONB,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_action_items_exec_status_chk CHECK (execution_status IN ('pending','success','error','skipped'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_action_items TO authenticated;
GRANT ALL ON public.ai_action_items TO service_role;
ALTER TABLE public.ai_action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own action items" ON public.ai_action_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own action items" ON public.ai_action_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own action items" ON public.ai_action_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own action items" ON public.ai_action_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_items_plan_id ON public.ai_action_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_items_user_id ON public.ai_action_items(user_id);
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_action_items;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_action_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- mcp_endpoint_invocations
CREATE TABLE IF NOT EXISTS public.mcp_endpoint_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,
  login_customer_id TEXT,
  tool_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  http_method TEXT NOT NULL DEFAULT 'POST',
  operation_type TEXT NOT NULL DEFAULT 'read',
  risk_tier TEXT,
  request_hash TEXT,
  request_summary JSONB,
  response_status INTEGER,
  error_code TEXT,
  latency_ms INTEGER,
  plan_id UUID REFERENCES public.ai_action_plans(id) ON DELETE SET NULL,
  action_item_id UUID REFERENCES public.ai_action_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mcp_invocations_op_type_chk CHECK (operation_type IN ('read','write'))
);
GRANT SELECT, INSERT ON public.mcp_endpoint_invocations TO authenticated;
GRANT ALL ON public.mcp_endpoint_invocations TO service_role;
ALTER TABLE public.mcp_endpoint_invocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own invocations" ON public.mcp_endpoint_invocations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invocations" ON public.mcp_endpoint_invocations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_invocations_user_id ON public.mcp_endpoint_invocations(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_invocations_tool ON public.mcp_endpoint_invocations(user_id, tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_invocations_plan_id ON public.mcp_endpoint_invocations(plan_id);
CREATE INDEX IF NOT EXISTS idx_mcp_invocations_created_at ON public.mcp_endpoint_invocations(created_at DESC);

-- ai_action_outcomes
CREATE TABLE IF NOT EXISTS public.ai_action_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.ai_action_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_days INTEGER,
  metric_before JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_after JSONB NOT NULL DEFAULT '{}'::jsonb,
  verdict TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_action_outcomes_verdict_chk CHECK (verdict IS NULL OR verdict IN ('improved','neutral','worsened'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_action_outcomes TO authenticated;
GRANT ALL ON public.ai_action_outcomes TO service_role;
ALTER TABLE public.ai_action_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own outcomes" ON public.ai_action_outcomes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own outcomes" ON public.ai_action_outcomes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own outcomes" ON public.ai_action_outcomes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_outcomes_plan_id ON public.ai_action_outcomes(plan_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_outcomes_user_id ON public.ai_action_outcomes(user_id);
