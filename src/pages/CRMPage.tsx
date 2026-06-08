import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, ShoppingBag, TrendingUp, TrendingDown, Package,
  AlertCircle, RefreshCw, Plug, Building2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useIntegrationsStore } from "@/store/useIntegrationsStore";
import { executePipedriveTool } from "@/lib/agent/pipedrive-executor";
import { executeShopifyTool } from "@/lib/agent/shopify-executor";
import { executeHubSpotTool } from "@/lib/agent/hubspot-executor";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function dateRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

function formatCurrency(value: string | number, currency = "BRL") {
  return parseFloat(String(value)).toLocaleString("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
}

// ─── Shared components ────────────────────────────────────────────────────────

function DateFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
      {PRESETS.map((p) => (
        <button
          key={p.days}
          onClick={() => onChange(p.days)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            value === p.days
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold font-mono mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function NotConnected({ name, href }: { name: string; href: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
      <Plug className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <p className="font-medium">{name} não conectado</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Configure as credenciais para visualizar os dados
      </p>
      <Button asChild size="sm" variant="outline">
        <Link to={href}>Conectar agora</Link>
      </Button>
    </div>
  );
}

function LoadingCards({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: n }).map((_, i) => (
        <Card key={i}><CardContent className="pt-4 pb-3 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
        </CardContent></Card>
      ))}
    </div>
  );
}

// ─── Pipedrive tab ────────────────────────────────────────────────────────────

type PipedriveRow = {
  campaign: string;
  source: string | null;
  deal_count: number;
  won_count: number;
  lost_count: number;
  open_count: number;
  total_value: string;
  won_value: string;
  conversion_rate: string;
  currency: string;
};

type PipedriveResult = {
  total_deals_analyzed: number;
  period: { from: string; to: string };
  by_campaign: PipedriveRow[];
};

function PipedriveTab() {
  const { pipedrive } = useIntegrationsStore();
  const [days, setDays] = useState(30);

  const { from, to } = dateRange(days);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<PipedriveResult | null>({
    queryKey: ["crm-pipedrive", days],
    queryFn: async () => {
      const raw = await executePipedriveTool("correlate_pipedrive_with_meta", {
        start_date: from,
        end_date: to,
      });
      const parsed = JSON.parse(raw);
      if (parsed.error) return null;
      return parsed as PipedriveResult;
    },
    enabled: pipedrive.isConnected,
    staleTime: 5 * 60 * 1000,
  });

  if (!pipedrive.isConnected) {
    return <NotConnected name="Pipedrive" href="/integrations" />;
  }

  const rows = data?.by_campaign ?? [];
  const totalDeals = data?.total_deals_analyzed ?? 0;
  const wonCount = rows.reduce((s, r) => s + r.won_count, 0);
  const openCount = rows.reduce((s, r) => s + r.open_count, 0);
  const lostCount = rows.reduce((s, r) => s + r.lost_count, 0);
  const totalWonValue = rows.reduce((s, r) => s + parseFloat(r.won_value), 0);
  const currency = rows[0]?.currency ?? "BRL";

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <DateFilter value={days} onChange={setDays} />
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 text-muted-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <LoadingCards n={5} />
      ) : isError ? (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Erro ao carregar dados do Pipedrive. Verifique o API Token.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Total de deals" value={String(totalDeals)} />
            <StatCard label="Ganhos" value={String(wonCount)} />
            <StatCard label="Abertos" value={String(openCount)} />
            <StatCard label="Perdidos" value={String(lostCount)} />
            <StatCard
              label="Receita ganha"
              value={formatCurrency(totalWonValue, currency)}
              sub={wonCount > 0 ? `Ticket médio: ${formatCurrency(totalWonValue / wonCount, currency)}` : undefined}
            />
          </div>

          {/* Table */}
          {rows.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Deals por campanha / origem</CardTitle>
                <CardDescription className="text-xs">
                  Baseado nos campos UTM ou na origem nativa do Pipedrive
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        {["Campanha / Origem", "Fonte", "Deals", "Ganhos", "Perdidos", "Conv.", "Receita Ganha"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium max-w-[200px] truncate">
                            {row.campaign}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {row.source || "—"}
                          </td>
                          <td className="px-4 py-2.5 font-mono">{row.deal_count}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 font-mono text-success">
                              <TrendingUp className="h-3 w-3" /> {row.won_count}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 font-mono text-destructive">
                              <TrendingDown className="h-3 w-3" /> {row.lost_count}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="font-mono text-xs">
                              {row.conversion_rate}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 font-mono font-medium">
                            {formatCurrency(row.won_value, row.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum deal encontrado no período.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Shopify tab ──────────────────────────────────────────────────────────────

type ShopifyRevenueResult = {
  period: { from: string; to: string };
  order_count: number;
  total_revenue: string;
  aov: string;
  currency: string;
  top_products: Array<{ title: string; qty: number; revenue: string }>;
};

type ShopifyCorrelationRow = {
  campaign: string;
  source: string | null;
  order_count: number;
  revenue: string;
  currency: string;
};

type ShopifyCorrelationResult = {
  total_orders: number;
  by_campaign: ShopifyCorrelationRow[];
};

function ShopifyTab() {
  const { shopify } = useIntegrationsStore();
  const [days, setDays] = useState(30);
  const { from, to } = dateRange(days);

  const fromISO = from + "T00:00:00-03:00";
  const toISO = to + "T23:59:59-03:00";

  const revenueQuery = useQuery<ShopifyRevenueResult | null>({
    queryKey: ["crm-shopify-revenue", days],
    queryFn: async () => {
      const raw = await executeShopifyTool("get_shopify_revenue_summary", {
        created_at_min: fromISO,
        created_at_max: toISO,
        financial_status: "paid",
      });
      const parsed = JSON.parse(raw);
      if (parsed.error) return null;
      return parsed as ShopifyRevenueResult;
    },
    enabled: shopify.isConnected,
    staleTime: 5 * 60 * 1000,
  });

  const correlationQuery = useQuery<ShopifyCorrelationResult | null>({
    queryKey: ["crm-shopify-correlation", days],
    queryFn: async () => {
      const raw = await executeShopifyTool("correlate_shopify_with_meta", {
        created_at_min: fromISO,
        created_at_max: toISO,
        financial_status: "paid",
      });
      const parsed = JSON.parse(raw);
      if (parsed.error) return null;
      return parsed as ShopifyCorrelationResult;
    },
    enabled: shopify.isConnected,
    staleTime: 5 * 60 * 1000,
  });

  const refetchAll = () => { revenueQuery.refetch(); correlationQuery.refetch(); };
  const isLoading = revenueQuery.isLoading || correlationQuery.isLoading;
  const isFetching = revenueQuery.isFetching || correlationQuery.isFetching;
  const isError = revenueQuery.isError || correlationQuery.isError;

  if (!shopify.isConnected) {
    return <NotConnected name="Shopify" href="/integrations" />;
  }

  const revenue = revenueQuery.data;
  const correlation = correlationQuery.data;
  const currency = revenue?.currency ?? "BRL";
  const rows = correlation?.by_campaign ?? [];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <DateFilter value={days} onChange={setDays} />
        <Button variant="ghost" size="sm" onClick={refetchAll} disabled={isFetching} className="gap-1.5 text-muted-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <LoadingCards n={4} />
      ) : isError ? (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Erro ao carregar dados do Shopify. Verifique as credenciais.
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Pedidos" value={String(revenue?.order_count ?? 0)} />
            <StatCard label="Receita total" value={formatCurrency(revenue?.total_revenue ?? "0", currency)} />
            <StatCard label="Ticket médio" value={formatCurrency(revenue?.aov ?? "0", currency)} />
            <StatCard
              label="Produto top"
              value={revenue?.top_products?.[0]?.title?.split(" ").slice(0, 2).join(" ") ?? "—"}
              sub={revenue?.top_products?.[0] ? formatCurrency(revenue.top_products[0].revenue, currency) : undefined}
            />
          </div>

          {/* Top products */}
          {(revenue?.top_products?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Top produtos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        {["Produto", "Qtd vendida", "Receita"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {revenue!.top_products.map((p, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{p.title}</td>
                          <td className="px-4 py-2.5 font-mono">{p.qty}</td>
                          <td className="px-4 py-2.5 font-mono">{formatCurrency(p.revenue, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* By campaign */}
          {rows.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pedidos por campanha UTM</CardTitle>
                <CardDescription className="text-xs">
                  Compare a receita de cada campanha com o gasto no Google Ads para calcular o ROAS real
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        {["Campanha", "Fonte", "Pedidos", "Receita"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium max-w-[220px] truncate">{row.campaign}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.source || "—"}</td>
                          <td className="px-4 py-2.5 font-mono">{row.order_count}</td>
                          <td className="px-4 py-2.5 font-mono font-medium">
                            {formatCurrency(row.revenue, row.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum pedido encontrado no período.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── HubSpot tab ──────────────────────────────────────────────────────────────

type HsOverviewResult = {
  period: { from: string; to: string };
  total_deals: number;
  won_deals: number;
  open_deals: number;
  lost_deals: number;
  total_deal_value: string;
  won_value: string;
  avg_deal_value: string;
  conversion_rate: string;
};

type HsSourceRow = {
  source: string;
  campaign: string | null;
  deal_count: number;
  won_count: number;
  lost_count: number;
  open_count: number;
  total_value: string;
  won_value: string;
  conversion_rate: string;
};

type HsCorrelationResult = {
  total_deals_analyzed: number;
  by_source: HsSourceRow[];
};

function HubSpotTab() {
  const { hubspot } = useIntegrationsStore();
  const [days, setDays] = useState(30);
  const { from, to } = dateRange(days);

  const overviewQuery = useQuery<HsOverviewResult | null>({
    queryKey: ["crm-hubspot-overview", days],
    queryFn: async () => {
      const raw = await executeHubSpotTool("get_hubspot_overview", { start_date: from, end_date: to });
      const parsed = JSON.parse(raw);
      if (parsed.error) return null;
      return parsed as HsOverviewResult;
    },
    enabled: hubspot.isConnected,
    staleTime: 5 * 60 * 1000,
  });

  const correlationQuery = useQuery<HsCorrelationResult | null>({
    queryKey: ["crm-hubspot-correlation", days],
    queryFn: async () => {
      const raw = await executeHubSpotTool("correlate_hubspot_with_meta", { start_date: from, end_date: to });
      const parsed = JSON.parse(raw);
      if (parsed.error) return null;
      return parsed as HsCorrelationResult;
    },
    enabled: hubspot.isConnected,
    staleTime: 5 * 60 * 1000,
  });

  const refetchAll = () => { overviewQuery.refetch(); correlationQuery.refetch(); };
  const isLoading = overviewQuery.isLoading || correlationQuery.isLoading;
  const isFetching = overviewQuery.isFetching || correlationQuery.isFetching;
  const isError = overviewQuery.isError || correlationQuery.isError;

  if (!hubspot.isConnected) {
    return <NotConnected name="HubSpot" href="/integrations" />;
  }

  const ov = overviewQuery.data;
  const rows = correlationQuery.data?.by_source ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <DateFilter value={days} onChange={setDays} />
        <Button variant="ghost" size="sm" onClick={refetchAll} disabled={isFetching} className="gap-1.5 text-muted-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <LoadingCards n={5} />
      ) : isError ? (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Erro ao carregar dados do HubSpot. Verifique o Access Token.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Total de deals" value={String(ov?.total_deals ?? 0)} />
            <StatCard label="Ganhos" value={String(ov?.won_deals ?? 0)} />
            <StatCard label="Abertos" value={String(ov?.open_deals ?? 0)} />
            <StatCard label="Perdidos" value={String(ov?.lost_deals ?? 0)} />
            <StatCard
              label="Receita ganha"
              value={formatCurrency(ov?.won_value ?? "0")}
              sub={ov ? `Conversão: ${ov.conversion_rate}` : undefined}
            />
          </div>

          {rows.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Deals por fonte de tráfego</CardTitle>
                <CardDescription className="text-xs">
                  PAID_SOCIAL = Google Ads. source_data_1 = campanha. Correlacione won_value com gasto Meta para o CPA real.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        {["Fonte", "Campanha", "Deals", "Ganhos", "Perdidos", "Conv.", "Receita Ganha"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium">
                            {row.source === "PAID_SOCIAL" ? (
                              <span className="text-primary font-semibold">{row.source}</span>
                            ) : row.source}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground max-w-[160px] truncate">
                            {row.campaign ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 font-mono">{row.deal_count}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 font-mono text-success">
                              <TrendingUp className="h-3 w-3" /> {row.won_count}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 font-mono text-destructive">
                              <TrendingDown className="h-3 w-3" /> {row.lost_count}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className="font-mono text-xs">{row.conversion_rate}</Badge>
                          </td>
                          <td className="px-4 py-2.5 font-mono font-medium">
                            {formatCurrency(row.won_value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum deal encontrado no período.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const { pipedrive, shopify, hubspot } = useIntegrationsStore();

  const defaultTab = pipedrive.isConnected ? "pipedrive" : hubspot.isConnected ? "hubspot" : "shopify";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight">CRM & E-commerce</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Dados reais de Pipedrive, HubSpot e Shopify para comparar com suas campanhas Google Ads
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="pipedrive" className="gap-2 data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Pipedrive
            {pipedrive.isConnected && <span className="h-1.5 w-1.5 rounded-full bg-success ml-0.5" />}
          </TabsTrigger>
          <TabsTrigger value="hubspot" className="gap-2 data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4" />
            HubSpot
            {hubspot.isConnected && <span className="h-1.5 w-1.5 rounded-full bg-success ml-0.5" />}
          </TabsTrigger>
          <TabsTrigger value="shopify" className="gap-2 data-[state=active]:shadow-sm">
            <ShoppingBag className="h-4 w-4" />
            Shopify
            {shopify.isConnected && <span className="h-1.5 w-1.5 rounded-full bg-success ml-0.5" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipedrive" className="mt-5">
          <PipedriveTab />
        </TabsContent>

        <TabsContent value="hubspot" className="mt-5">
          <HubSpotTab />
        </TabsContent>

        <TabsContent value="shopify" className="mt-5">
          <ShopifyTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
