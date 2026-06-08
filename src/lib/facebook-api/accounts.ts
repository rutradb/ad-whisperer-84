import { graphGet, fetchNode } from "./graphClient";

interface AdAccountsResponse {
  data: any[];
  paging?: any;
}

const DEFAULT_FIELDS = [
  "name", "account_id", "id", "account_status",
  "currency", "timezone_name", "balance", "amount_spent",
];

export async function listAdAccounts(): Promise<any[]> {
  const res = await graphGet<AdAccountsResponse>("me/adaccounts", {
    fields: DEFAULT_FIELDS,
  });
  return res.data;
}

export async function getAdAccountDetails(actId: string, fields?: string[]): Promise<any> {
  return fetchNode(actId, {
    fields: fields || DEFAULT_FIELDS,
  });
}

const BILLING_FIELDS = [
  "name", "account_id", "account_status", "disable_reason",
  "funding_source_details", "spend_cap", "amount_spent", "balance",
  "currency", "timezone_name", "business_name", "min_daily_budget",
];

export async function getAccountBilling(actId: string): Promise<any> {
  return fetchNode(actId, { fields: BILLING_FIELDS });
}
