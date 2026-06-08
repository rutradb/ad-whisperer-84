import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-gads-developer-token, x-gads-login-customer-id",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const GOOGLE_ADS_BASE_URL = "https://googleads.googleapis.com/v23";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("authorization");
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Developer token can come from request header or environment
    const developerToken =
      req.headers.get("x-gads-developer-token") ||
      Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");

    if (!developerToken) {
      return new Response(
        JSON.stringify({ error: "Missing developer token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const loginCustomerId = req.headers.get("x-gads-login-customer-id");

    const { endpoint, method, body } = await req.json();

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the full Google Ads API URL
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${GOOGLE_ADS_BASE_URL}${endpoint}`;

    // Build headers for the Google Ads API call
    const gadsHeaders: Record<string, string> = {
      Authorization: authorization,
      "Content-Type": "application/json",
      "developer-token": developerToken,
    };

    if (loginCustomerId) {
      gadsHeaders["login-customer-id"] = loginCustomerId.replace(/-/g, "");
    }

    // Forward the request to Google Ads API
    const gadsResponse = await fetch(url, {
      method: method || "POST",
      headers: gadsHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = await gadsResponse.text();

    return new Response(responseData, {
      status: gadsResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    const message = error instanceof Error ? error.message : "Internal proxy error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
