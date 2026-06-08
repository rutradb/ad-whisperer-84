CREATE TABLE IF NOT EXISTS campaign_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE campaign_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own labels" ON campaign_labels
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS campaign_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  label_id UUID NOT NULL REFERENCES campaign_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, label_id)
);

ALTER TABLE campaign_label_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assignments" ON campaign_label_assignments
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_cla_campaign ON campaign_label_assignments(campaign_id);
CREATE INDEX idx_cla_label ON campaign_label_assignments(label_id);