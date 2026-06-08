
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES saved_reports(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER,
  day_of_month INTEGER,
  time_of_day TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'webhook')),
  delivery_target TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own schedules" ON report_schedules
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_report_schedules_next_send ON report_schedules(next_send_at)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION calculate_next_send(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_time_of_day TIME,
  p_timezone TEXT
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_next TIMESTAMPTZ;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      v_next := (v_now AT TIME ZONE p_timezone)::date + p_time_of_day;
      IF v_next <= v_now THEN v_next := v_next + INTERVAL '1 day'; END IF;
    WHEN 'weekly' THEN
      v_next := date_trunc('week', v_now AT TIME ZONE p_timezone)
        + (p_day_of_week || ' days')::INTERVAL + p_time_of_day;
      IF v_next <= v_now THEN v_next := v_next + INTERVAL '1 week'; END IF;
    WHEN 'monthly' THEN
      v_next := date_trunc('month', v_now AT TIME ZONE p_timezone)
        + ((p_day_of_month - 1) || ' days')::INTERVAL + p_time_of_day;
      IF v_next <= v_now THEN v_next := v_next + INTERVAL '1 month'; END IF;
  END CASE;
  RETURN v_next AT TIME ZONE p_timezone;
END;
$$ LANGUAGE plpgsql
SET search_path = 'public';
