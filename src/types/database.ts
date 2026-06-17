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

export interface AgentToolAction {
  toolName: string;
  input: Record<string, unknown>;
  result: string;
  status: "success" | "error";
}

export interface AgentConversationRow {
  id: string;
  user_id: string;
  customer_id: string | null;
  profile: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AgentMessageRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  tool_actions: AgentToolAction[];
  created_at: string;
}

export interface StrategicScanRow {
  id: string;
  user_id: string;
  customer_id: string | null;
  title: string;
  date_range: string | null;
  complexity: string | null;
  result: unknown; // ScanResult (de @/lib/strategic-scan)
  created_at: string;
}

export interface AIInsightsCacheRow {
  id: string;
  user_id: string;
  customer_id: string;
  context: string;
  insights: unknown[]; // Insight[] (de @/hooks/useAIInsights)
  prompt: string | null;
  created_at: string;
  updated_at: string;
}
