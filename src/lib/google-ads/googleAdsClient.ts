import type { GAQLResponse, MutateOperation, MutateResponse } from "./types";

// --- Cloud Run Proxy URL ---

function getProxyUrl(): string {
  const url = localStorage.getItem("cloud_run_url");
  if (!url) {
    throw new GoogleAdsAPIError(
      "URL do proxy não configurada. Configure em Configurações > Integrações.",
      401
    );
  }
  return url.replace(/\/$/, ""); // remove trailing slash
}

// --- Rate Limiting & Retry ---

const RATE_LIMIT = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxConcurrent: 10,
};

const RETRYABLE_HTTP_STATUSES = [429, 500, 502, 503, 504];

let activeRequests = 0;
const pendingQueue: Array<() => void> = [];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireSlot(): Promise<void> {
  if (activeRequests < RATE_LIMIT.maxConcurrent) {
    activeRequests++;
    return;
  }
  return new Promise((resolve) =>
    pendingQueue.push(() => {
      activeRequests++;
      resolve();
    })
  );
}

function releaseSlot(): void {
  activeRequests--;
  const next = pendingQueue.shift();
  if (next) next();
}

// --- Error Class ---

export class GoogleAdsAPIError extends Error {
  status: number;
  errorCode?: string;
  isQuotaError: boolean;
  isAuthError: boolean;
  isValidationError: boolean;

  constructor(message: string, status: number, errorData?: any) {
    super(message);
    this.name = "GoogleAdsAPIError";
    this.status = status;
    this.errorCode = errorData?.error?.status;
    this.isQuotaError = status === 429 || this.errorCode === "RESOURCE_EXHAUSTED";
    this.isAuthError = status === 401 || status === 403;
    this.isValidationError = status === 400;
  }
}

// --- Token Management (via Cloud Run) ---

function getAccessToken(): string {
  const token = localStorage.getItem("gads_access_token");
  if (!token) {
    throw new GoogleAdsAPIError(
      "Token Google Ads não encontrado. Conecte sua conta em Configurações.",
      401
    );
  }
  return token;
}

async function buildProxyHeaders(): Promise<Record<string, string>> {
  // Always ensure token is valid before building headers
  await ensureValidToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
  const lcid = localStorage.getItem("gads_login_customer_id");
  if (lcid) {
    headers["x-login-customer-id"] = lcid.replace(/-/g, "");
  }
  return headers;
}

// --- OAuth2 Token Refresh (via Cloud Run) with dedup lock ---

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  // Dedup: if a refresh is already in flight, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const proxyUrl = getProxyUrl();
      const refreshToken = localStorage.getItem("gads_refresh_token");

      if (!refreshToken) {
        throw new GoogleAdsAPIError(
          "Refresh token não encontrado. Reconecte o Google Ads.",
          401
        );
      }

      const response = await fetch(`${proxyUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GoogleAdsAPIError(
          errorData.error || "Falha ao renovar token.",
          response.status
        );
      }

      const data = await response.json();
      localStorage.setItem("gads_access_token", data.access_token);
      localStorage.setItem(
        "gads_token_expiry",
        String(Date.now() + data.expires_in * 1000)
      );
      return data.access_token;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function isTokenExpired(): boolean {
  const expiry = localStorage.getItem("gads_token_expiry");
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10) - 60_000;
}

async function ensureValidToken(): Promise<void> {
  if (isTokenExpired()) {
    await refreshAccessToken();
  }
}

// --- Rate-Limited Fetch ---

async function rateLimitedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  await acquireSlot();
  try {
    for (let attempt = 0; attempt <= RATE_LIMIT.maxRetries; attempt++) {
      const res = await fetch(url, init);

      if (
        RETRYABLE_HTTP_STATUSES.includes(res.status) &&
        attempt < RATE_LIMIT.maxRetries
      ) {
        const delay =
          RATE_LIMIT.initialDelayMs * Math.pow(2, attempt) +
          Math.random() * 500;
        console.warn(
          `[GoogleAds] HTTP ${res.status}, retry ${attempt + 1}/${RATE_LIMIT.maxRetries} in ${Math.round(delay)}ms`
        );
        await sleep(delay);
        continue;
      }

      // Handle 401 with token refresh on first attempt only
      if (res.status === 401 && attempt === 0) {
        try {
          const newToken = await refreshAccessToken();
          if (init?.headers) {
            const h = { ...(init.headers as Record<string, string>) };
            h["Authorization"] = `Bearer ${newToken}`;
            init = { ...init, headers: h };
          }
          continue;
        } catch {
          // If refresh fails, throw the original error
        }
      }

      return res;
    }
    return fetch(url, init);
  } finally {
    releaseSlot();
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      `Google Ads API error (${res.status})`;
    throw new GoogleAdsAPIError(msg, res.status, data);
  }
  return data;
}

// --- Core API Functions (all via Cloud Run proxy) ---

export function cleanCustomerId(customerId: string): string {
  return customerId.replace(/-/g, "");
}

/**
 * Execute a GAQL query via the Cloud Run proxy.
 */
export async function gaqlSearch<T = unknown>(
  customerId: string,
  query: string,
  pageSize?: number,
  pageToken?: string
): Promise<GAQLResponse<T>> {
  const proxyUrl = getProxyUrl();
  const headers = await buildProxyHeaders();
  const body: Record<string, unknown> = {
    customerId: cleanCustomerId(customerId),
    query,
  };
  if (pageSize && pageSize > 0) body.pageSize = pageSize;
  if (pageToken) body.pageToken = pageToken;

  const res = await rateLimitedFetch(`${proxyUrl}/api/search`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return handleResponse<GAQLResponse<T>>(res);
}

/**
 * Execute a GAQL query using searchStream via the Cloud Run proxy.
 */
export async function gaqlSearchStream<T = unknown>(
  customerId: string,
  query: string
): Promise<T[]> {
  const proxyUrl = getProxyUrl();
  const headers = await buildProxyHeaders();

  const res = await rateLimitedFetch(`${proxyUrl}/api/search-stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customerId: cleanCustomerId(customerId),
      query,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `searchStream failed (${res.status})`;
    throw new GoogleAdsAPIError(msg, res.status, data);
  }

  if (Array.isArray(data)) {
    return data.flatMap((batch: GAQLResponse<T>) => batch.results || []);
  }
  return (data as GAQLResponse<T>).results || [];
}

/**
 * Execute a mutation via the Cloud Run proxy.
 */
export async function mutate<T = Record<string, unknown>>(
  customerId: string,
  resource: string,
  operations: MutateOperation<T>[]
): Promise<MutateResponse> {
  const proxyUrl = getProxyUrl();
  const headers = await buildProxyHeaders();

  const res = await rateLimitedFetch(`${proxyUrl}/api/mutate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customerId: cleanCustomerId(customerId),
      resource,
      operations,
      partialFailure: false,
      validateOnly: false,
    }),
  });

  return handleResponse<MutateResponse>(res);
}

/**
 * GET a specific resource via the Cloud Run proxy.
 */
export async function getResource<T = Record<string, unknown>>(
  customerId: string,
  resourceName: string
): Promise<T> {
  const proxyUrl = getProxyUrl();
  const headers = await buildProxyHeaders();

  const res = await rateLimitedFetch(
    `${proxyUrl}/api/resource?customerId=${cleanCustomerId(customerId)}&resourceName=${encodeURIComponent(resourceName)}`,
    {
      method: "GET",
      headers,
    }
  );

  return handleResponse<T>(res);
}

/**
 * List all accessible Google Ads customers via the Cloud Run proxy.
 */
export async function listAccessibleCustomers(): Promise<string[]> {
  const proxyUrl = getProxyUrl();
  const headers = await buildProxyHeaders();

  const res = await rateLimitedFetch(`${proxyUrl}/api/customers`, {
    method: "GET",
    headers,
  });

  const data = await handleResponse<{ resourceNames: string[] }>(res);
  return data.resourceNames || [];
}

// --- Helper Functions (pure utilities — unchanged) ---

export function buildFieldMask(
  obj: Record<string, unknown>,
  prefix = ""
): string[] {
  const fields: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key === "resourceName") continue;
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      fields.push(
        ...buildFieldMask(value as Record<string, unknown>, fieldPath)
      );
    } else {
      fields.push(fieldPath);
    }
  }
  return fields;
}

export function buildDateFilter(
  dateRange?: string,
  startDate?: string,
  endDate?: string
): string {
  if (startDate && endDate) {
    return `segments.date BETWEEN '${startDate}' AND '${endDate}'`;
  }
  return `segments.date DURING ${dateRange || "LAST_30_DAYS"}`;
}

export function extractIdFromResourceName(resourceName: string): string {
  const parts = resourceName.split("/");
  return parts[parts.length - 1];
}

export function buildResourceName(
  customerId: string,
  resource: string,
  resourceId: string
): string {
  return `customers/${cleanCustomerId(customerId)}/${resource}/${resourceId}`;
}

// Legacy export for backward compat
export function getTokens() {
  return {
    accessToken: getAccessToken(),
    developerToken: "",
    loginCustomerId: localStorage.getItem("gads_login_customer_id"),
  };
}
