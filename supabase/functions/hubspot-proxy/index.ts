/**
 * HubSpot Proxy — Supabase Edge Function
 *
 * Encaminha requisições para a HubSpot CRM API v3 server-side, contornando o
 * CORS do browser (a API do HubSpot não permite chamadas cross-origin diretas).
 *
 * POST body: { token: string, method?: "GET" | "POST", path: string,
 *              params?: Record<string, string|number>, body?: unknown }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BASE_URL = "https://api.hubapi.com";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, method, path, params, body } = (await req.json()) as {
      token: string;
      method?: "GET" | "POST";
      path: string;
      params?: Record<string, string | number>;
      body?: unknown;
    };

    if (!token || !path) {
      return json({ error: "Missing required fields: token, path" }, 400);
    }

    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    }

    const hsRes = await fetch(url.toString(), {
      method: method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await hsRes.json().catch(() => ({}));
    return new Response(JSON.stringify(data), {
      status: hsRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
