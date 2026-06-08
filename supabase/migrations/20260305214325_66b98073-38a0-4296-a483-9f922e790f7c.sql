CREATE TABLE IF NOT EXISTS targeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  targeting_spec JSONB NOT NULL DEFAULT '{}',
  category TEXT DEFAULT 'custom',
  is_shared BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE targeting_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates" ON targeting_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users read shared templates" ON targeting_templates
  FOR SELECT USING (is_shared = true);

CREATE OR REPLACE FUNCTION update_targeting_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_targeting_templates_updated_at
  BEFORE UPDATE ON targeting_templates
  FOR EACH ROW EXECUTE FUNCTION update_targeting_templates_updated_at();