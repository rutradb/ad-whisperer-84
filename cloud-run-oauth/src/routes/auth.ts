import { Router, type Request, type Response } from "express";
import { getAuthUrl, exchangeCode, refreshAccessToken } from "../lib/oauth.js";
import { config } from "../config.js";

export const authRouter = Router();

// GET /auth/google?redirect=https://app.lovable.app/onboarding
authRouter.get("/google", (req: Request, res: Response) => {
  const appRedirect = (req.query.redirect as string) || config.allowedOrigin;
  // Cloud Run is behind a proxy — always use https
  const protocol = req.get("x-forwarded-proto") || req.protocol;
  const callbackUrl = `${protocol === "http" && req.get("host")?.includes("run.app") ? "https" : protocol}://${req.get("host")}/auth/callback`;
  const state = Buffer.from(JSON.stringify({ redirect: appRedirect })).toString(
    "base64url"
  );
  const url = getAuthUrl(callbackUrl, state);
  res.redirect(url);
});

// GET /auth/callback?code=XXX&state=XXX
authRouter.get("/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const stateRaw = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      const redirect = config.allowedOrigin;
      res.redirect(`${redirect}?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    let appRedirect = config.allowedOrigin;
    try {
      const state = JSON.parse(
        Buffer.from(stateRaw, "base64url").toString("utf-8")
      );
      appRedirect = state.redirect || appRedirect;
    } catch {
      // use default
    }

    const cbProtocol = req.get("x-forwarded-proto") || req.protocol;
    const callbackUrl = `${cbProtocol === "http" && req.get("host")?.includes("run.app") ? "https" : cbProtocol}://${req.get("host")}/auth/callback`;
    const tokens = await exchangeCode(code, callbackUrl);

    // Redirect back to app with tokens as URL params
    const params = new URLSearchParams({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: String(tokens.expires_in),
      developer_token: config.developerToken,
      login_customer_id: config.loginCustomerId || "",
    });

    const separator = appRedirect.includes("?") ? "&" : "?";
    res.redirect(`${appRedirect}${separator}${params.toString()}`);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/refresh { refresh_token }
authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      res.status(400).json({ error: "Missing refresh_token" });
      return;
    }

    const tokens = await refreshAccessToken(refresh_token);
    res.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      developer_token: config.developerToken,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/config — returns non-sensitive config for frontend
authRouter.get("/config", (_req: Request, res: Response) => {
  res.json({
    login_customer_id: config.loginCustomerId || null,
  });
});
