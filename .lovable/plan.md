
## Objetivo

Sincronizar o backend Lovable Cloud com os últimos commits: aplicar a migration pendente, fazer redeploy de todas as Edge Functions, e validar que a UI já reflete as mudanças. Entregar um checklist de conformidade ao final.

## Diagnóstico atual

**Banco de dados** — comparei `supabase/migrations/` com as tabelas existentes em `public`:

Tabelas já presentes (migrations antigas OK): `profiles`, `user_tokens`, `automated_rules`, `campaign_labels`, `campaign_label_assignments`, `copy_history`, `report_schedules`, `saved_reports`, `targeting_templates`.

Migration **NÃO aplicada** (commit recente, 2026-06-10):
- `20260610120000_ai_active_actions_foundation.sql` — cria 4 tabelas do ciclo "IA Ativa": `ai_action_plans`, `ai_action_items`, `mcp_endpoint_invocations`, `ai_action_outcomes` (com RLS por `auth.uid()`, grants para `authenticated` + `service_role`, triggers `updated_at`).

Código que já consome essas tabelas (vai destravar quando a migration rodar):
- `src/hooks/useActionPlans.ts`, `useActionPlanMutations.ts`, `useMcpInvocations.ts`
- `src/lib/agent/{proposals,execution,verification,expanded-executor}.ts`
- `src/lib/agent/mcp/{gateway,invocationLog}.ts`

**Edge Functions presentes em disco:** `agent-run`, `evaluate-rules`, `google-ads-auth`, `google-ads-proxy`, `shopify-proxy`, `strategic-scan`.

**UI** — já contempla as novidades:
- Rota `/ai/actions` registrada em `src/App.tsx` (lazy `ActionsPage`)
- Item "Ações da IA" no `AppSidebar.tsx`

Não é necessária nova UI; basta confirmar que carrega sem erro após a migration.

## Plano de execução (modo build)

### 1. Aplicar migration pendente
Reaplicar `20260610120000_ai_active_actions_foundation.sql` via `supabase--migration` (cria as 4 tabelas, RLS, grants, triggers). Migrations anteriores já estão no banco — não serão duplicadas pois o arquivo usa `CREATE TABLE IF NOT EXISTS`.

### 2. Redeploy de todas as Edge Functions
Uma chamada `supabase--deploy_edge_functions` com:
`["agent-run", "evaluate-rules", "google-ads-auth", "google-ads-proxy", "shopify-proxy", "strategic-scan"]`

### 3. Smoke test
- `supabase--read_query` para confirmar as 4 novas tabelas e suas policies.
- `supabase--curl_edge_functions` em `google-ads-proxy` (OPTIONS) e `agent-run` (POST sem payload válido → 400 esperado) para confirmar que respondem.
- Verificar logs do dev-server / preview em `/ai/actions` para garantir que `useActionPlans` consulta sem erro 42P01.

### 4. Reflexo na UI
Nenhuma alteração de código necessária — a página `ActionsPage` e o item de sidebar "Ações da IA" já estão prontos. Após a migration, a página deixa de mostrar erro "relation does not exist" e passa a renderizar a lista (vazia) de planos.

### 5. Checklist de conformidade (entregue ao usuário no final)

```
[ ] Migration 20260610120000_ai_active_actions_foundation aplicada
[ ] Tabelas criadas: ai_action_plans, ai_action_items,
    mcp_endpoint_invocations, ai_action_outcomes
[ ] RLS habilitada nas 4 tabelas
[ ] GRANTs para authenticated + service_role nas 4 tabelas
[ ] Edge Function agent-run deployada
[ ] Edge Function evaluate-rules deployada
[ ] Edge Function google-ads-auth deployada
[ ] Edge Function google-ads-proxy deployada
[ ] Edge Function shopify-proxy deployada
[ ] Edge Function strategic-scan deployada
[ ] Rota /ai/actions carrega sem erro de schema
[ ] Sidebar exibe "Ações da IA"
[ ] Tipos Supabase regenerados (automático após migration)
```

## Fora do escopo

- Não vou criar UI nova nem alterar lógica de negócios.
- Não vou rotacionar secrets nem mexer em config OAuth.
- Não vou rodar `npm run build` manualmente (a harness faz).
