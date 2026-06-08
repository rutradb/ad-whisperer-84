import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

const CLIENT_ID = Deno.env.get("GOOGLE_ADS_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!;
const DEVELOPER_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN")!;

function getSupabaseClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

async function getUserId(authHeader: string): Promise<string> {
  const supabase = getSupabaseClient(authHeader);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Não autenticado");
  return user.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const authHeader = req.headers.get("Authorization") || "";

    // --- get-auth-url: retorna URL do Google OAuth ---
    if (action === "get-auth-url") {
      const { redirectUri } = params;
      if (!CLIENT_ID)
        throw new Error("Google Ads não configurado no servidor.");
      const url = new URL(GOOGLE_AUTH_URL);
      url.searchParams.set("client_id", CLIENT_ID);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", GOOGLE_ADS_SCOPE);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      return new Response(JSON.stringify({ url: url.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- exchange-code: troca auth code por tokens ---
    if (action === "exchange-code") {
      const userId = await getUserId(authHeader);
      const { code, redirectUri } = params;
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok)
        throw new Error("Falha na troca do código: " + (await tokenRes.text()));
      const tokenData = await tokenRes.json();

      const supabase = getSupabaseClient(authHeader);
      await supabase
        .from("profiles")
        .update({
          gads_refresh_token: tokenData.refresh_token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in,
          developer_token: DEVELOPER_TOKEN,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- refresh-token: renova access token usando refresh token do DB ---
    if (action === "refresh-token") {
      const userId = await getUserId(authHeader);
      const supabase = getSupabaseClient(authHeader);
      const { data: profile } = await supabase
        .from("profiles")
        .select("gads_refresh_token")
        .eq("id", userId)
        .single();
      if (!profile?.gads_refresh_token)
        throw new Error("Refresh token não encontrado. Reconecte o Google Ads.");

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: profile.gads_refresh_token,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      if (!tokenRes.ok)
        throw new Error("Falha ao renovar token: " + (await tokenRes.text()));
      const tokenData = await tokenRes.json();

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in,
          developer_token: DEVELOPER_TOKEN,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- list-customers: lista contas Google Ads acessíveis ---
    if (action === "list-customers") {
      await getUserId(authHeader);
      const { accessToken, loginCustomerId } = params;
      const headers: Record<string, string> = {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        "developer-token": DEVELOPER_TOKEN,
      };
      if (loginCustomerId)
        headers["login-customer-id"] = loginCustomerId.replace(/-/g, "");

      const res = await fetch(
        "https://googleads.googleapis.com/v23/customers:listAccessibleCustomers",
        { headers }
      );
      if (!res.ok) throw new Error(await res.text());
      return new Response(JSON.stringify(await res.json()), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- get-customer: busca detalhes de uma conta ---
    if (action === "get-customer") {
      const { accessToken, customerId, loginCustomerId } = params;
      const cid = customerId.replace(/-/g, "").replace("customers/", "");
      const headers: Record<string, string> = {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        "developer-token": DEVELOPER_TOKEN,
      };
      if (loginCustomerId)
        headers["login-customer-id"] = loginCustomerId.replace(/-/g, "");

      const query =
        "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager, customer.status FROM customer LIMIT 1";
      const res = await fetch(
        `https://googleads.googleapis.com/v23/customers/${cid}/googleAds:search`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ query, pageSize: 1 }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const row = data.results?.[0]?.customer;
      if (!row) throw new Error("Conta não encontrada");

      return new Response(
        JSON.stringify({
          id: row.resourceName,
          descriptiveName: row.descriptiveName || "Conta " + cid,
          customerId: row.id,
          currencyCode: row.currencyCode,
          timeZone: row.timeZone,
          manager: row.manager || false,
          status: row.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- save-account: salva conta selecionada no perfil ---
    if (action === "save-account") {
      const userId = await getUserId(authHeader);
      const { account, loginCustomerId } = params;
      const supabase = getSupabaseClient(authHeader);
      await supabase
        .from("profiles")
        .update({
          gads_customer_id: account.customerId,
          gads_account_json: account,
          gads_login_customer_id: loginCustomerId || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação desconhecida: " + action);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
