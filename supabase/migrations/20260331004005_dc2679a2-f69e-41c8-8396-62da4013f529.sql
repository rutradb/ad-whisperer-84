
-- 1. Rename profiles columns from fb_* to google_ads_*
ALTER TABLE profiles RENAME COLUMN fb_access_token TO google_ads_access_token;
ALTER TABLE profiles RENAME COLUMN fb_account_id TO google_ads_customer_id;
ALTER TABLE profiles RENAME COLUMN fb_account_json TO google_ads_customer_json;

-- 2. Add new Google Ads OAuth2 columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_ads_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_ads_developer_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_ads_client_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_ads_client_secret TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_ads_login_customer_id TEXT;

-- 3. Rename user_tokens columns from fb_* to google_ads_*
ALTER TABLE user_tokens RENAME COLUMN fb_access_token TO google_ads_access_token;
ALTER TABLE user_tokens RENAME COLUMN fb_account_id TO google_ads_customer_id;

-- 4. Add new columns to user_tokens
ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS google_ads_refresh_token TEXT;
ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS google_ads_developer_token TEXT;
