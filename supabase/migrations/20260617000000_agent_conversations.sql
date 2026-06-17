-- =============================================================================
-- Histórico do Agente de IA — persistência de conversas e mensagens
-- =============================================================================
-- agent_conversations : uma thread por conversa (com perfil/persona e conta GAds)
-- agent_messages       : mensagens da thread (role user/assistant + tool_actions)
-- RLS por usuário (auth.uid() = user_id), seguindo o padrão do projeto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- agent_conversations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,                                  -- conta Google Ads (opcional)
  profile     TEXT NOT NULL DEFAULT 'analyst',       -- perfil/persona do agente
  title       TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own agent conversations" ON public.agent_conversations;
DROP POLICY IF EXISTS "Users insert own agent conversations" ON public.agent_conversations;
DROP POLICY IF EXISTS "Users update own agent conversations" ON public.agent_conversations;
DROP POLICY IF EXISTS "Users delete own agent conversations" ON public.agent_conversations;

CREATE POLICY "Users select own agent conversations" ON public.agent_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own agent conversations" ON public.agent_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own agent conversations" ON public.agent_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own agent conversations" ON public.agent_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_user ON public.agent_conversations(user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_agent_conversations_updated_at ON public.agent_conversations;
CREATE TRIGGER trg_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- agent_messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL DEFAULT '',
  tool_actions    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users select own agent messages" ON public.agent_messages;
DROP POLICY IF EXISTS "Users insert own agent messages" ON public.agent_messages;
DROP POLICY IF EXISTS "Users delete own agent messages" ON public.agent_messages;

CREATE POLICY "Users select own agent messages" ON public.agent_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own agent messages" ON public.agent_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own agent messages" ON public.agent_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON public.agent_messages(conversation_id, created_at);
