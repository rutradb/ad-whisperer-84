import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { proxyRouter } from "./routes/proxy.js";

const app = express();

// Trust proxy (Cloud Run runs behind Google's load balancer)
app.set("trust proxy", true);

// Security
app.use(helmet());

// CORS — allow the frontend origin (including Lovable preview subdomain)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = config.allowedOrigin;
      // Allow: exact match, preview-- prefix, or no origin (server-to-server)
      if (
        !origin ||
        origin === allowed ||
        origin === allowed.replace("https://", "https://preview--") ||
        origin.endsWith(".lovable.app")
      ) {
        callback(null, true);
      } else {
        callback(null, true); // permissive for now — tighten in production
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "x-login-customer-id"],
  })
);

// Parse JSON bodies
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Routes
app.use("/auth", authRouter);
app.use("/api", proxyRouter);

// Start
app.listen(config.port, () => {
  console.log(`Google Ads Proxy running on port ${config.port}`);
  console.log(`Allowed origin: ${config.allowedOrigin}`);
  console.log(`Login Customer ID: ${config.loginCustomerId || "(not set)"}`);
});
