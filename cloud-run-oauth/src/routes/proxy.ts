import { Router, type Request, type Response } from "express";
import * as gads from "../lib/googleAds.js";

export const proxyRouter = Router();

// Extract access token from Authorization header
function getToken(req: Request): string {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }
  return auth.slice(7);
}

// Optional per-request login-customer-id override
function getLcid(req: Request): string | undefined {
  return (req.headers["x-login-customer-id"] as string) || undefined;
}

// POST /api/search { customerId, query, pageSize?, pageToken? }
proxyRouter.post("/search", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const { customerId, query, pageSize, pageToken } = req.body;
    if (!customerId || !query) {
      res.status(400).json({ error: "customerId and query required" });
      return;
    }
    const data = await gads.gaqlSearch(
      token, customerId, query, pageSize, pageToken, getLcid(req)
    );
    res.json(data);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json(err.data || { error: err.message });
  }
});

// POST /api/search-stream { customerId, query }
proxyRouter.post("/search-stream", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const { customerId, query } = req.body;
    if (!customerId || !query) {
      res.status(400).json({ error: "customerId and query required" });
      return;
    }
    const data = await gads.gaqlSearchStream(token, customerId, query, getLcid(req));
    res.json(data);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json(err.data || { error: err.message });
  }
});

// POST /api/mutate { customerId, resource, operations, partialFailure?, validateOnly? }
proxyRouter.post("/mutate", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const { customerId, resource, operations, partialFailure, validateOnly } = req.body;
    if (!customerId || !resource || !operations) {
      res.status(400).json({ error: "customerId, resource, and operations required" });
      return;
    }
    const data = await gads.mutate(
      token, customerId, resource, operations, getLcid(req), partialFailure, validateOnly
    );
    res.json(data);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json(err.data || { error: err.message });
  }
});

// GET /api/customers
proxyRouter.get("/customers", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const data = await gads.listAccessibleCustomers(token, getLcid(req));
    res.json(data);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json(err.data || { error: err.message });
  }
});

// POST /api/recommendations/apply { customerId, resourceName }
proxyRouter.post("/recommendations/apply", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const { customerId, resourceName } = req.body;
    if (!customerId || !resourceName) {
      res.status(400).json({ error: "customerId and resourceName required" });
      return;
    }
    const data = await gads.gaqlSearch(token, customerId, "", undefined, undefined, getLcid(req));
    // Use direct fetch for apply
    const { config } = await import("../config.js");
    const cid = customerId.replace(/-/g, "");
    const applyRes = await fetch(
      `${config.googleAdsBaseUrl}/customers/${cid}/recommendations:apply`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "developer-token": config.developerToken,
          ...(config.loginCustomerId ? { "login-customer-id": config.loginCustomerId.replace(/-/g, "") } : {}),
          ...(getLcid(req) ? { "login-customer-id": getLcid(req)! } : {}),
        },
        body: JSON.stringify({ operations: [{ resourceName }] }),
      }
    );
    const result = await applyRes.json();
    if (!applyRes.ok) {
      res.status(applyRes.status).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json(err.data || { error: err.message });
  }
});

// POST /api/recommendations/dismiss { customerId, resourceName }
proxyRouter.post("/recommendations/dismiss", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const { customerId, resourceName } = req.body;
    if (!customerId || !resourceName) {
      res.status(400).json({ error: "customerId and resourceName required" });
      return;
    }
    const { config } = await import("../config.js");
    const cid = customerId.replace(/-/g, "");
    const dismissRes = await fetch(
      `${config.googleAdsBaseUrl}/customers/${cid}/recommendations:dismiss`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "developer-token": config.developerToken,
          ...(config.loginCustomerId ? { "login-customer-id": config.loginCustomerId.replace(/-/g, "") } : {}),
          ...(getLcid(req) ? { "login-customer-id": getLcid(req)! } : {}),
        },
        body: JSON.stringify({ operations: [{ resourceName }] }),
      }
    );
    const result = await dismissRes.json();
    if (!dismissRes.ok) {
      res.status(dismissRes.status).json(result);
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json(err.data || { error: err.message });
  }
});

// POST /api/keyword-ideas { keywords, language, geoTargets, pageSize? }
proxyRouter.post("/keyword-ideas", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const { keywords, language, geoTargets, pageSize } = req.body;
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      res.status(400).json({ error: "keywords array required" });
      return;
    }
    const { config } = await import("../config.js");
    const lcid = getLcid(req) || config.loginCustomerId;
    const customerId = req.body.customerId || (lcid ? lcid.replace(/-/g, "") : "");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "developer-token": config.developerToken,
    };
    if (lcid) headers["login-customer-id"] = lcid.replace(/-/g, "");

    const body: Record<string, any> = {
      keywordSeed: { keywords },
      language: language || "languageConstants/1014",
      geoTargetConstants: geoTargets || ["geoTargetConstants/2076"],
      keywordPlanNetwork: "GOOGLE_SEARCH",
    };
    if (pageSize) body.pageSize = pageSize;

    const apiRes = await fetch(
      `${config.googleAdsBaseUrl}/customers/${customerId}:generateKeywordIdeas`,
      { method: "POST", headers, body: JSON.stringify(body) }
    );
    const data = await apiRes.json();
    if (!apiRes.ok) {
      res.status(apiRes.status).json(data);
      return;
    }
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json(err.data || { error: err.message });
  }
});

// GET /api/image-proxy?url=<encoded_url> — proxy images to avoid CSP blocks
proxyRouter.get("/image-proxy", async (req: Request, res: Response) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      res.status(400).json({ error: "url parameter required" });
      return;
    }
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      res.status(imageRes.status).json({ error: "Failed to fetch image" });
      return;
    }
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/resource?customerId=X&resourceName=Y
proxyRouter.get("/resource", async (req: Request, res: Response) => {
  try {
    const token = getToken(req);
    const customerId = req.query.customerId as string;
    const resourceName = req.query.resourceName as string;
    if (!customerId || !resourceName) {
      res.status(400).json({ error: "customerId and resourceName required" });
      return;
    }
    const data = await gads.getResource(token, customerId, resourceName, getLcid(req));
    res.json(data);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json(err.data || { error: err.message });
  }
});
