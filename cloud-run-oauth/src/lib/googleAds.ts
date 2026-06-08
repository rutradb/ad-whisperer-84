import { config } from "../config.js";

function buildHeaders(
  accessToken: string,
  loginCustomerId?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "developer-token": config.developerToken,
  };
  const lcid = loginCustomerId || config.loginCustomerId;
  if (lcid) {
    headers["login-customer-id"] = lcid.replace(/-/g, "");
  }
  return headers;
}

export async function gaqlSearch(
  accessToken: string,
  customerId: string,
  query: string,
  pageSize?: number,
  pageToken?: string,
  loginCustomerId?: string
) {
  const cid = customerId.replace(/-/g, "");
  const body: Record<string, unknown> = { query };
  if (pageSize && pageSize > 0) body.pageSize = pageSize;
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(
    `${config.googleAdsBaseUrl}/customers/${cid}/googleAds:search`,
    {
      method: "POST",
      headers: buildHeaders(accessToken, loginCustomerId),
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function gaqlSearchStream(
  accessToken: string,
  customerId: string,
  query: string,
  loginCustomerId?: string
) {
  const cid = customerId.replace(/-/g, "");
  const res = await fetch(
    `${config.googleAdsBaseUrl}/customers/${cid}/googleAds:searchStream`,
    {
      method: "POST",
      headers: buildHeaders(accessToken, loginCustomerId),
      body: JSON.stringify({ query }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function mutate(
  accessToken: string,
  customerId: string,
  resource: string,
  operations: unknown[],
  loginCustomerId?: string,
  partialFailure = false,
  validateOnly = false
) {
  const cid = customerId.replace(/-/g, "");
  const res = await fetch(
    `${config.googleAdsBaseUrl}/customers/${cid}/${resource}:mutate`,
    {
      method: "POST",
      headers: buildHeaders(accessToken, loginCustomerId),
      body: JSON.stringify({ operations, partialFailure, validateOnly }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function listAccessibleCustomers(
  accessToken: string,
  loginCustomerId?: string
) {
  const res = await fetch(
    `${config.googleAdsBaseUrl}/customers:listAccessibleCustomers`,
    {
      method: "GET",
      headers: buildHeaders(accessToken, loginCustomerId),
    }
  );
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function getResource(
  accessToken: string,
  customerId: string,
  resourceName: string,
  loginCustomerId?: string
) {
  const url = resourceName.startsWith("customers/")
    ? `${config.googleAdsBaseUrl}/${resourceName}`
    : `${config.googleAdsBaseUrl}/customers/${customerId.replace(/-/g, "")}/${resourceName}`;

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(accessToken, loginCustomerId),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}
