export type AdFormat = string;

const FB_API_BASE = 'https://graph.facebook.com/v21.0';

export async function validateToken(token: string) {
  const res = await fetch(`${FB_API_BASE}/me?access_token=${token}`);
  if (!res.ok) throw new Error('Token inválido');
  return res.json();
}

export async function fetchAdAccounts(token: string) {
  const res = await fetch(
    `${FB_API_BASE}/me/adaccounts?fields=id,name,account_id,currency,timezone_name,account_status&access_token=${token}`
  );
  if (!res.ok) throw new Error('Erro ao buscar contas');
  const data = await res.json();
  return data.data;
}

export async function fetchAdSets(token: string, accountId: string) {
  const res = await fetch(
    `${FB_API_BASE}/${accountId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,targeting,created_time,campaign_id&access_token=${token}`
  );
  if (!res.ok) throw new Error('Erro ao buscar ad sets');
  const data = await res.json();
  return data.data;
}

export async function fetchAds(token: string, accountId: string) {
  const res = await fetch(
    `${FB_API_BASE}/${accountId}/ads?fields=id,name,status,adset_id,campaign_id,created_time&access_token=${token}`
  );
  if (!res.ok) throw new Error('Erro ao buscar anúncios');
  const data = await res.json();
  return data.data;
}
