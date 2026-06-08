export interface Profile {
  id: string;
  email: string | null;
  cloud_run_url: string | null;
  google_ads_access_token: string | null;
  google_ads_refresh_token: string | null;
  google_ads_developer_token: string | null;
  google_ads_client_id: string | null;
  google_ads_client_secret: string | null;
  google_ads_customer_id: string | null;
  google_ads_customer_json: Record<string, any> | null;
  google_ads_login_customer_id: string | null;
  anthropic_api_key: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CopyHistoryRow {
  id: string;
  user_id: string;
  product_description: string;
  target_audience: string;
  tone: string;
  objective: string;
  framework: string;
  variations: { headlines: string[]; descriptions: string[] }[];
  variation_count: number;
  created_at: string;
}
