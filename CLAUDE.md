# Google Ads Manager Hub

Plataforma completa de gestao de anuncios Google Ads, substituindo o Google Ads Manager nativo.

## Comandos

```bash
npm run dev          # Dev server na porta 8080
npm run build        # Build de producao (SEMPRE rodar apos mudancas para verificar)
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
```

## Stack

- **Frontend**: React 18 + TypeScript 5.8 + Vite + TailwindCSS + shadcn/ui (Radix)
- **API**: Google Ads REST API v23 (chamadas via `googleAdsClient.ts` + Supabase Edge Function proxy)
- **Data Fetching**: TanStack React Query 5
- **State**: Zustand (auth) com localStorage
- **Backend**: Supabase (auth + profiles + rules + user_tokens + saved_reports + Edge Functions)
- **Charts**: Recharts (LineChart, BarChart, PieChart)
- **Icons**: Lucide React
- **AI**: Anthropic API (geracao de copy RSA, otimizacoes)
- **Idioma UI**: Portugues (pt-BR) -- todo texto visivel ao usuario deve ser em portugues

## Estrutura do Projeto

```
src/
+-- App.tsx                      # Rotas (React Router 6, lazy-loaded)
+-- components/                  # Componentes reutilizaveis (shadcn/ui + custom)
+-- pages/                       # ~38 paginas (CRUD, analytics, AI, settings)
+-- hooks/                       # ~35 hooks (um por dominio)
+-- lib/google-ads/              # 17 modulos da Google Ads API v23
+-- store/useAuthStore.ts        # Zustand: accessToken, selectedCustomer, anthropicApiKey
+-- integrations/supabase/       # Client Supabase + types gerados
+-- config.ts                    # Configuracao geral
```

## REGRA CRITICA: Imports da API

```typescript
// CORRETO -- importar do submodulo especifico
import { getCampaignsByCustomer } from "@/lib/google-ads/campaigns";
import { gaqlSearch, mutate } from "@/lib/google-ads/googleAdsClient";
import { getCustomerMetrics } from "@/lib/google-ads/reporting";
import type { Campaign, MetricsRow } from "@/lib/google-ads/types";

// Ou usar o barrel export
import { getCampaignsByCustomer, gaqlSearch } from "@/lib/google-ads/index";
```

O diretorio `src/lib/facebook-api/` e LEGADO e NAO deve ser usado (sera removido).

## Modulos da API (`src/lib/google-ads/`)

| Arquivo | Responsabilidade |
|---------|------------------|
| `googleAdsClient.ts` | HTTP client base (GAQL search, mutate, rate limiting, OAuth2 refresh) |
| `types.ts` | Tipos TypeScript compartilhados (Campaign, AdGroup, Ad, MetricsRow, etc.) |
| `customers.ts` | listAccessibleCustomers, getCustomerDetails |
| `campaigns.ts` | CRUD de campanhas (com channel types e bidding strategies) |
| `adgroups.ts` | CRUD de grupos de anuncios (substitui ad sets) |
| `ads.ts` | CRUD de anuncios RSA (Responsive Search Ads) |
| `reporting.ts` | Metricas de performance via GAQL (customer/campaign/adgroup/ad level) |
| `mutations.ts` | Criacao/atualizacao/remocao (operations[] + updateMask) |
| `keywords.ts` | CRUD de palavras-chave, termos de pesquisa, negativas |
| `assets.ts` | Assets (imagens, videos, sitelinks, callouts) |
| `targeting.ts` | Location, language, ad schedule targeting |
| `audiences.ts` | Remarketing lists, combined audiences |
| `conversions.ts` | Conversion actions CRUD (substitui pixels) |
| `change-history.ts` | Log de alteracoes da conta |
| `recommendations.ts` | Recomendacoes Google + optimization score |
| `labels.ts` | Labels para campanhas/grupos |
| `index.ts` | Barrel exports (re-exporta tudo) |

## Autenticacao Google Ads

```
Headers obrigatorios:
  Authorization: Bearer {accessToken}
  developer-token: {developerToken}
  login-customer-id: {mccId}  (opcional, para contas MCC)
  Content-Type: application/json
```

Tokens armazenados no Zustand/localStorage:
- `gads_access_token` -- OAuth2 access token (expira em 1h, auto-refresh)
- `gads_refresh_token` -- OAuth2 refresh token
- `gads_developer_token` -- Developer token (fixo)
- `gads_client_id` -- OAuth2 Client ID
- `gads_client_secret` -- OAuth2 Client Secret
- `gads_login_customer_id` -- MCC Customer ID (opcional)
- `gads_customer` -- JSON do customer selecionado
- `gads_token_expiry` -- Timestamp de expiracao do access token

## GAQL (Google Ads Query Language)

Todas as consultas usam GAQL via POST para `/customers/{cid}/googleAds:search`:

```sql
SELECT
  campaign.id,
  campaign.name,
  metrics.impressions,
  metrics.cost_micros
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY metrics.cost_micros DESC
LIMIT 100
```

## Rotas

### Core
- `/dashboard` -- KPIs, grafico diario, top campanhas, optimization score
- `/campaigns` `/campaigns/:id` `/campaigns/new` `/campaigns/:id/edit`
- `/adsets` (redireciona para ad groups) `/adsets/:id` `/adsets/new` `/adsets/:id/edit`
- `/ads` `/ads/:id` `/ads/new` `/ads/:id/edit`
- `/keywords` -- Gestao de palavras-chave e termos de pesquisa

### Ferramentas
- `/assets` -- Upload de imagens/videos, sitelinks, callouts
- `/audiences` -- Remarketing lists, combined audiences
- `/targeting` -- Explorador de targeting (geo, schedule)
- `/conversions` -- Acoes de conversao (substitui pixels)
- `/recommendations` -- Recomendacoes Google + optimization score
- `/reports` -- Relatorios salvos
- `/notifications` -- Alertas de revisao/rejeicao
- `/activity` -- Log de alteracoes
- `/settings` -- Integracoes (Google Ads OAuth, Anthropic) + billing

### IA & Automacao
- `/ai/optimizer` -- Otimizador (baseado em optimization score)
- `/ai/diagnostic` -- Diagnostico (Quality Score, Impression Share)
- `/ai/scale-calculator` -- Calculadora de escala
- `/ai/copy-generator` -- Gerador de copy RSA com Claude
- `/ai/rules` -- Regras automatizadas
- `/ai/ab-test` -- Testes A/B (experiments)

## Padroes de Codigo

### Hooks
- Um hook por dominio: `useAds.ts`, `useCampaigns.ts`, `useKeywords.ts`, etc.
- Query keys: `["entity", customerId]` ou `["entity-detail", customerId, entityId]`
- Mutations invalidam queries relacionadas via `queryClient.invalidateQueries`

### Valores monetarios
- Google Ads API usa **micros**: `amountMicros: "50000000"` = R$ 50,00
- Sempre multiplicar input do usuario por 1.000.000 antes de enviar (`unitsToMicros`)
- Sempre dividir por 1.000.000 ao exibir (`microsToUnits` ou `formatMicros`)
- Helper: `formatMicros(micros)` em `@/lib/formatters.ts`

### Mutations Google Ads
```typescript
// Padrao operations[] + updateMask
mutate(customerId, "campaigns", [{
  update: {
    resourceName: "customers/123/campaigns/456",
    name: "Novo Nome",
    status: "PAUSED",
  },
  updateMask: "name,status"
}]);
```

### Supabase -- tabelas fora dos types gerados
```typescript
await (supabase as any).from("user_tokens").upsert({...});
await (supabase as any).from("saved_reports").select("*");
```

### Componentes importantes
- `AdReviewBadge` -- prop e `approvalStatus` (APPROVED/DISAPPROVED/APPROVED_LIMITED)
- `DaypartingGrid` -- Google Ads usa MONDAY..SUNDAY
- `PlacementSelector` -- agora e NetworkSettingsSelector (Search/Display/Partners)
- `AttributionSelector` -- retorna modelo unico (LAST_CLICK, DATA_DRIVEN, etc.)
- `BreakdownCharts` -- segments: device, adNetworkType, dayOfWeek, hour

### Pages
- Todas lazy-loaded via `React.lazy` em App.tsx
- Padrao de ConnectionBanner quando nao conectado
- Formatacao: `formatMicros()`, `formatCurrency()`, `formatNumber()`, `formatPercent()` de `@/lib/formatters`

## Variaveis de Ambiente

```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Tokens Google Ads e API key Anthropic sao armazenados no Zustand (localStorage) e no Supabase (profiles).

## Pendencias Conhecidas

1. **Migration Supabase `saved_reports`** -- tabela necessaria para a pagina de Relatorios
2. **Migration Supabase profiles** -- renomear colunas fb_* para google_ads_*:
```sql
ALTER TABLE profiles RENAME COLUMN fb_access_token TO google_ads_access_token;
ALTER TABLE profiles RENAME COLUMN fb_account_id TO google_ads_customer_id;
ALTER TABLE profiles RENAME COLUMN fb_account_json TO google_ads_customer_json;
ALTER TABLE profiles ADD COLUMN google_ads_refresh_token TEXT;
ALTER TABLE profiles ADD COLUMN google_ads_developer_token TEXT;
ALTER TABLE profiles ADD COLUMN google_ads_client_id TEXT;
ALTER TABLE profiles ADD COLUMN google_ads_client_secret TEXT;
ALTER TABLE profiles ADD COLUMN google_ads_login_customer_id TEXT;
```

## Git

- Branch principal: `main`
- Deploy via Lovable (auto-deploy on push)
- Sempre rodar `npm run build` antes de commitar para garantir 0 erros
- Commit messages em ingles
