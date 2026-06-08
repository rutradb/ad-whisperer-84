-- ─────────────────────────────────────────────────────────────────────────────
-- user_business_context
-- Stores per-user AI strategy rules and business KPI targets.
-- Mirrors the localStorage schema of useBusinessContextStore.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_business_context (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Scale criteria
  min_days_before_scale INTEGER NOT NULL DEFAULT 2,
  min_roas_to_scale     NUMERIC(6,2) NOT NULL DEFAULT 2.0,
  min_spend_to_evaluate NUMERIC(10,2) NOT NULL DEFAULT 50.0,
  max_frequency         NUMERIC(4,1) NOT NULL DEFAULT 3.5,

  -- Cost targets (nullable = not set)
  target_roas           NUMERIC(6,2),
  max_cpa               NUMERIC(10,2),
  max_cpc               NUMERIC(10,2),
  average_ticket        NUMERIC(10,2),

  -- Business context
  business_objective    TEXT NOT NULL DEFAULT 'conversions'
                          CHECK (business_objective IN ('conversions','traffic','leads','awareness')),
  business_segment      TEXT NOT NULL DEFAULT '',

  -- Free-form strategy rules (array of text)
  custom_rules          TEXT[] NOT NULL DEFAULT '{}',

  updated_at            TIMESTAMPTZ DEFAULT now(),
  created_at            TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id)
);

ALTER TABLE user_business_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own business context"
  ON user_business_context
  FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_business_context_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_business_context_updated_at
  BEFORE UPDATE ON user_business_context
  FOR EACH ROW EXECUTE FUNCTION update_business_context_timestamp();


-- ─────────────────────────────────────────────────────────────────────────────
-- user_integrations
-- Stores per-user credentials and field mapping for Pipedrive and Shopify.
-- Tokens are stored server-side (not exposed in client bundle).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_integrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pipedrive
  pipedrive_api_token              TEXT,
  pipedrive_is_connected           BOOLEAN NOT NULL DEFAULT false,
  pipedrive_utm_campaign_field_key TEXT NOT NULL DEFAULT '',
  pipedrive_utm_source_field_key   TEXT NOT NULL DEFAULT '',
  pipedrive_utm_medium_field_key   TEXT NOT NULL DEFAULT '',
  pipedrive_default_pipeline_id    INTEGER,

  -- Shopify
  shopify_store_url                TEXT,
  shopify_access_token             TEXT,
  shopify_is_connected             BOOLEAN NOT NULL DEFAULT false,
  shopify_utm_campaign_attribute   TEXT NOT NULL DEFAULT 'utm_campaign',
  shopify_utm_source_attribute     TEXT NOT NULL DEFAULT 'utm_source',
  shopify_utm_medium_attribute     TEXT NOT NULL DEFAULT 'utm_medium',

  updated_at  TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (user_id)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations"
  ON user_integrations
  FOR ALL
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_integrations_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_integrations_timestamp();
