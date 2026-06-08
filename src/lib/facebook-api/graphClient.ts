const FB_API_VERSION = "v22.0";
const FB_GRAPH_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

const JSON_STRINGIFY_FIELDS = [
  "filtering", "time_range", "time_ranges", "effective_status",
  "special_ad_categories", "objective", "targeting_spec",
  "lookalike_spec", "promoted_object", "action_attribution_windows"
];

const JOIN_FIELDS = [
  "fields", "action_breakdowns", "breakdowns",
];

// --- Rate Limiting & Retry Infrastructure ---

const RATE_LIMIT = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxConcurrent: 10,
};

const RATE_LIMIT_ERROR_CODES = [4, 17, 32, 613];
const RETRYABLE_HTTP_STATUSES = [429, 500, 502, 503, 504];

let activeRequests = 0;
const pendingQueue: Array<() => void> = [];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function acquireSlot(): Promise<void> {
  if (activeRequests < RATE_LIMIT.maxConcurrent) {
    activeRequests++;
    return;
  }
  return new Promise(resolve => pendingQueue.push(() => { activeRequests++; resolve(); }));
}

function releaseSlot(): void {
  activeRequests--;
  const next = pendingQueue.shift();
  if (next) next();
}

async function rateLimitedFetch(url: string, init?: RequestInit): Promise<Response> {
  await acquireSlot();
  try {
    for (let attempt = 0; attempt <= RATE_LIMIT.maxRetries; attempt++) {
      const res = await fetch(url, init);

      if (RETRYABLE_HTTP_STATUSES.includes(res.status) && attempt < RATE_LIMIT.maxRetries) {
        const delay = RATE_LIMIT.initialDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[GraphAPI] HTTP ${res.status}, retry ${attempt + 1}/${RATE_LIMIT.maxRetries} in ${Math.round(delay)}ms`);
        await sleep(delay);
        continue;
      }

      if (!res.ok && attempt < RATE_LIMIT.maxRetries) {
        try {
          const cloned = res.clone();
          const body = await cloned.json();
          if (RATE_LIMIT_ERROR_CODES.includes(body.error?.code)) {
            const delay = RATE_LIMIT.initialDelayMs * Math.pow(2, attempt) + Math.random() * 500;
            console.warn(`[GraphAPI] Rate limit (code ${body.error.code}), retry ${attempt + 1}/${RATE_LIMIT.maxRetries} in ${Math.round(delay)}ms`);
            await sleep(delay);
            continue;
          }
        } catch {
          // Response isn't JSON — don't retry
        }
      }

      return res;
    }
    // Final attempt without retry
    return fetch(url, init);
  } finally {
    releaseSlot();
  }
}

// --- Error Classes ---

export class GraphAPIError extends Error {
  code: number;
  subcode?: number;
  type: string;
  isRateLimit: boolean;
  isPermission: boolean;
  isValidation: boolean;

  constructor(data: any, status: number) {
    const msg = data.error?.message || `Graph API error ${status}`;
    super(msg);
    this.name = "GraphAPIError";
    this.code = data.error?.code || status;
    this.subcode = data.error?.error_subcode;
    this.type = data.error?.type || "unknown";
    this.isRateLimit = RATE_LIMIT_ERROR_CODES.includes(this.code);
    this.isPermission = [10, 200, 190].includes(this.code);
    this.isValidation = this.code === 100;
  }
}

// --- Core Functions ---

export function getToken(): string {
  const token = localStorage.getItem("fb_access_token");
  if (!token) throw new Error("Token não encontrado. Configure em Configurações > Integrações.");
  return token;
}

export function prepareParams(
  base: Record<string, any>,
  extras: Record<string, any> = {}
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...base, ...extras })) {
    if (value === null || value === undefined) continue;
    if (JSON_STRINGIFY_FIELDS.includes(key) && typeof value === "object") {
      params[key] = JSON.stringify(value);
    } else if (JOIN_FIELDS.includes(key) && Array.isArray(value)) {
      params[key] = value.join(",");
    } else {
      params[key] = String(value);
    }
  }
  return params;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new GraphAPIError(data, res.status);
  }
  return data;
}

export async function graphGet<T>(path: string, params: Record<string, any> = {}): Promise<T> {
  const url = new URL(`${FB_GRAPH_URL}/${path}`);
  const prepared = prepareParams({ access_token: getToken() }, params);
  Object.entries(prepared).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await rateLimitedFetch(url.toString());
  return handleResponse<T>(res);
}

export async function graphPost<T>(path: string, data: Record<string, any> = {}): Promise<T> {
  const body = new URLSearchParams();
  body.set("access_token", getToken());
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    body.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  const res = await rateLimitedFetch(`${FB_GRAPH_URL}/${path}`, { method: "POST", body });
  return handleResponse<T>(res);
}

export async function graphDelete<T>(path: string): Promise<T> {
  const url = `${FB_GRAPH_URL}/${path}?access_token=${getToken()}`;
  const res = await rateLimitedFetch(url, { method: "DELETE" });
  return handleResponse<T>(res);
}

export async function graphSearch<T>(searchType: string, params: Record<string, any> = {}): Promise<T> {
  return graphGet<T>("search", { ...params, type: searchType });
}

export async function fetchNode<T>(nodeId: string, params: Record<string, any> = {}): Promise<T> {
  return graphGet<T>(nodeId, params);
}

export async function fetchEdge<T>(parentId: string, edgeName: string, params: Record<string, any> = {}): Promise<T> {
  return graphGet<T>(`${parentId}/${edgeName}`, params);
}

export async function graphPostMultipart<T>(path: string, formData: FormData): Promise<T> {
  formData.append("access_token", getToken());
  const res = await rateLimitedFetch(`${FB_GRAPH_URL}/${path}`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<T>(res);
}

export async function fetchPaginationUrl<T>(url: string): Promise<T> {
  const res = await rateLimitedFetch(url);
  return handleResponse<T>(res);
}
