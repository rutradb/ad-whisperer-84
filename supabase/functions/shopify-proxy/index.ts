/**
 * Shopify Proxy — Supabase Edge Function
 *
 * Proxies requests to the Shopify Admin REST API server-side,
 * bypassing browser CORS restrictions.
 *
 * POST body: { store: string, token: string, path: string, params?: Record<string, string> }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { store, token, path, params } = await req.json() as {
      store: string;
      token: string;
      path: string;
      params?: Record<string, string | number>;
    };

    if (!store || !token || !path) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: store, token, path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(`https://${store}/admin/api/2024-04${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const shopifyRes = await fetch(url.toString(), {
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
    });

    const data = await shopifyRes.json();

    return new Response(JSON.stringify(data), {
      status: shopifyRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
