ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS hubspot_access_token TEXT,
  ADD COLUMN IF NOT EXISTS hubspot_is_connected  BOOLEAN NOT NULL DEFAULT false;
