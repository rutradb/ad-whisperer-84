-- OAuth server-side: garante colunas necessárias no profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gads_refresh_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gads_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gads_account_json jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gads_login_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
