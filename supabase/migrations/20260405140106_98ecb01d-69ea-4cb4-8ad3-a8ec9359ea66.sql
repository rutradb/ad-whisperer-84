ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gads_login_customer_id text,
  ADD COLUMN IF NOT EXISTS gads_refresh_token text,
  ADD COLUMN IF NOT EXISTS gads_customer_id text,
  ADD COLUMN IF NOT EXISTS gads_account_json jsonb;