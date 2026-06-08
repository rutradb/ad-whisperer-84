import { useState, useMemo, useRef } from "react";
import { SetupProgressCard } from "@/components/SetupProgressCard";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAccountInsights } from "@/hooks/useAccountInsights";
import { useEntityInsights } from "@/hooks/useEntityInsights";
import { useUpdateCampaign } from "@/hooks/useCampaignMutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Eye, MousePointerClick, Percent, TrendingUp, Loader2, AlertTriangle, Bug, ShoppingCart, BarChart3, Pause, Rocket, Heart, Wallet, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { Button } from "@/components/ui/button";
import { KpiCardWithDelta } from "@/components/KpiCardWithDelta";
import { ExportButton } from "@/components/ExportButton";
import { formatMicros, formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { computeRoas, computeCpa, microsToUnits, parseNumeric, normalizeMetricsRow, type MetricsRow } from "@/lib/google-ads/types";
import type { DateRange } from "@/lib/google-ads/types";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";

const DATE_PRESETS: Array<{ label: string; value: DateRange }> = [
  { label: "7d", value: "LAST_7_DAYS" },
  { label: "14d", value: "LAST_14_DAYS" },
  { label: "30d", value: "LAST_30_DAYS" },
  { label: "Este mês", value: "THIS_MONTH" },
  { label: "Mês anterior", value: "LAST_MONTH" },
];

const chartConfig = {
  spend: { label: "Custo", color: "hsl(247 100% 71%)" },
  clicks: { label: "Cliques", color: "hsl(75 99% 45%)" },
};

const EXPORT_COLUMNS = [
  { key: "campaignName", label: "Campanha" },
  { key: "costMicros", label: "Custo" },
  { key: "clicks", label: "Cliques" },
  { key: "ctr", label: "CTR" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const isConnected = !!customerId;
  const [dateRange, setDateRange] = useState<DateRange>("LAST_7_DAYS");
  const [showDebug, setShowDebug] = useState(false);
  const [tableBodyRef] = useAutoAnimate<HTMLTableSectionElement>();

  const updateCampaign = useUpdateCampaign();

  // Account-level KPI
  const { data: kpiData, isLoading: kpiLoading, error: kpiError } = useAccountInsights(
    customerId ?? undefined,
    { dateRange }
  );

  // Campaign-level metrics (for top campaigns table)
  const { data: campaignInsightsData, isLoading: topLoading, error: topError } = useEntityInsights(
    customerId ?? undefined,
    undefined,
    "campaign",
    { dateRange }
  );

  // Daily trend (campaign-level segmented by date)
  const { data: dailyData, isLoading: dailyLoading, error: dailyError } = useEntityInsights(
    customerId ?? undefined,
    undefined,
    "campaign",
    { dateRange, segmentByDate: true }
  );

  const apiErrors = [
    kpiError && { source: "KPI (métricas da conta)", message: (kpiError as Error).message },
    dailyError && { source: "Dados diários (tendência)", message: (dailyError as Error).message },
    topError && { source: "Campanhas", message: (topError as Error).message },
  ].filter(Boolean) as { source: string; message: string }[];

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da performance</p>
        </div>
        <ConnectionBanner />
      </div>
    );
  }

  // Normalize KPI data
  const kpiRow: MetricsRow | undefined = useMemo(() => {
    const raw = kpiData?.results?.[0];
    return raw ? normalizeMetricsRow(raw) : undefined;
  }, [kpiData]);

  // Normalize campaign rows
  const campaignRows: MetricsRow[] = useMemo(() => {
    return (campaignInsightsData?.results || []).map((r: any) => normalizeMetricsRow(r));
  }, [campaignInsightsData]);

  // Normalize daily rows (segmented by date)
  const chartData = useMemo(() => {
    return (dailyData?.results || []).map((r: any) => {
      const row = normalizeMetricsRow(r);
      return {
        date: row.date?.slice(5) || "",
        spend: microsToUnits(row.costMicros),
        clicks: row.clicks,
      };
    });
  }, [dailyData]);

  const roas = kpiRow ? computeRoas(kpiRow) : 0;
  const conversions = kpiRow?.conversions || 0;
  const revenue = kpiRow?.conversionsValue || 0;

  // Classify campaigns
  const winners = useMemo(() => campaignRows.filter(c => computeRoas(c) >= 2).slice(0, 3), [campaignRows]);
  const bleeders = useMemo(() => campaignRows.filter(c => {
    const r = computeRoas(c);
    return c.costMicros > 0 && r < 1 && r !== 0;
  }).slice(0, 3), [campaignRows]);

  const insightPrompt = useMemo(() => {
    if (!kpiRow) return null;

    const ctr = kpiRow.ctr * 100;
    const cpc = microsToUnits(kpiRow.averageCpc);
    const totalSpend = microsToUnits(kpiRow.costMicros);
    const campaignCount = campaignRows.length;

    const topCampaigns = campaignRows.slice(0, 6).map((c) => {
      const cr = computeRoas(c);
      const cpaVal = computeCpa(c);
      return {
        campanha: c.campaignName || "Sem nome",
        status: cr >= 2 ? "winner" : cr >= 1 ? "neutro" : totalSpend > 0 ? "bleeder" : "sem dados",
        roas: cr > 0 ? `${cr.toFixed(2)}x` : "sem conversão",
        participacao_budget: totalSpend > 0 ? `${((microsToUnits(c.costMicros) / totalSpend) * 100).toFixed(0)}% do gasto` : "--",
        cpa: cpaVal > 0 ? `R$${cpaVal.toFixed(0)}` : "--",
      };
    });

    const hasLowCtr = ctr < 1.0;
    const hasMultipleWinners = topCampaigns.filter(c => c.status === "winner").length > 1;
    const hasBleeders = topCampaigns.filter(c => c.status === "bleeder").length > 0;

    return `Contexto: conta Google Ads com ${campaignCount} campanhas. Período: ${dateRange}.

SITUAÇÃO ATUAL:
- CTR médio: ${ctr.toFixed(2)}% ${hasLowCtr ? "(abaixo de 1% — possível problema de relevância)" : "(razoável)"}
- CPC médio: R$${cpc.toFixed(2)}
- ROAS consolidado: ${roas > 0 ? `${roas.toFixed(2)}x` : "sem dados de conversão"}
- Conversões totais: ${conversions > 0 ? conversions : "nenhuma rastreada"}
- Valor de conversões: ${revenue > 0 ? `R$${revenue.toFixed(2)}` : "nenhum"}

DISTRIBUIÇÃO DAS CAMPANHAS:
${topCampaigns.map(c => `- ${c.campanha}: ${c.status}, ROAS ${c.roas}, ${c.participacao_budget}, CPA ${c.cpa}`).join("\n")}

${hasMultipleWinners ? "Multiplas campanhas com ROAS positivo." : ""}
${hasBleeders ? "Ha campanhas consumindo budget sem retorno." : ""}

Interprete o momento desta conta e escreva 3 insights para o gestor.`;
  }, [kpiRow, campaignRows, dateRange, roas, conversions, revenue]);

  const metrics = [
    { title: "Custo", value: kpiRow ? formatMicros(kpiRow.costMicros) : "--", icon: DollarSign, metric: "costMicros" },
    { title: "Impressões", value: kpiRow ? formatNumber(kpiRow.impressions) : "--", icon: Eye, metric: "impressions" },
    { title: "Cliques", value: kpiRow ? formatNumber(kpiRow.clicks) : "--", icon: MousePointerClick, metric: "clicks" },
    { title: "CTR", value: kpiRow ? formatPercent(kpiRow.ctr * 100) : "--", icon: Percent, metric: "ctr" },
    { title: "CPC Médio", value: kpiRow ? formatMicros(kpiRow.averageCpc) : "--", icon: TrendingUp, metric: "averageCpc" },
    { title: "ROAS", value: roas > 0 ? `${roas.toFixed(2)}x` : "--", icon: BarChart3, metric: "roas" },
    { title: "Conversões", value: conversions > 0 ? formatNumber(conversions) : "--", icon: ShoppingCart, metric: "conversions" },
    { title: "Valor Conv.", value: revenue > 0 ? formatCurrency(revenue) : "--", icon: DollarSign, metric: "conversionsValue" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral da performance</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {DATE_PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={dateRange === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <SetupProgressCard />

      {/* Error Alerts */}
      {apiErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na API do Google Ads ({apiErrors.length} requisição(ões) falharam)</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              {apiErrors.map((err, i) => (
                <li key={i}>
                  <strong>{err.source}:</strong>{" "}
                  <code className="bg-destructive/10 px-1 py-0.5 rounded text-xs break-all">{err.message}</code>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowDebug((v) => !v)}
            >
              <Bug className="mr-2 h-3 w-3" />
              {showDebug ? "Ocultar" : "Mostrar"} Debug Info
            </Button>
            {showDebug && (
              <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
{JSON.stringify({
  customerId,
  dateRange,
  kpiDataRaw: kpiData ?? "null",
  dailyDataRaw: dailyData ?? "null",
  campaignInsightsRaw: campaignInsightsData ?? "null",
}, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {metrics.map((m) => (
          <motion.div
            key={m.title}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
            }}
          >
            <KpiCardWithDelta
              title={m.title}
              value={m.value}
              icon={m.icon}
              isLoading={kpiLoading}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* AI Insights */}
      <AIInsightsPanel prompt={insightPrompt} context="Dashboard" />

      {/* Winners vs Bleeders */}
      {(winners.length > 0 || bleeders.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <CampaignClassTable
            title="Winners"
            icon={<Rocket className="h-4 w-4 text-success" />}
            items={winners}
            badgeVariant="success"
            emptyText="Nenhuma campanha com ROAS >= 2x"
            onNavigate={(id) => navigate(`/campaigns/${id}`)}
          />
          <CampaignClassTable
            title="Bleeders"
            icon={<TrendingDown className="h-4 w-4 text-destructive" />}
            items={bleeders}
            badgeVariant="destructive"
            emptyText="Nenhuma campanha com prejuízo"
            onNavigate={(id) => navigate(`/campaigns/${id}`)}
            onPause={(id) => {
              const c = campaignRows.find(r => r.campaignId === id);
              if (c && customerId) {
                updateCampaign.mutate({
                  customerId,
                  resourceName: `customers/${customerId}/campaigns/${id}`,
                  data: { status: "PAUSED" },
                });
              }
            }}
          />
        </div>
      )}

      {/* Daily chart */}
      <Card>
        <CardHeader><CardTitle>Performance diária</CardTitle></CardHeader>
        <CardContent>
          {dailyLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="spend" stroke="var(--color-spend)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">Sem dados para o período.</p>
          )}
        </CardContent>
      </Card>

      {/* Top campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Campanhas por Custo</CardTitle>
          <ExportButton data={campaignRows} columns={EXPORT_COLUMNS} filename="top-campanhas" />
        </CardHeader>
        <CardContent>
          {topLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : campaignRows.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">CPA</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={tableBodyRef}>
                {campaignRows.slice(0, 10).map((c) => {
                  const rr = computeRoas(c);
                  const cpa = computeCpa(c);
                  return (
                    <TableRow key={c.campaignId || c.date} className="cursor-pointer" onClick={() => c.campaignId && navigate(`/campaigns/${c.campaignId}`)}>
                      <TableCell className="font-medium">{c.campaignName || "--"}</TableCell>
                      <TableCell className="text-right">{formatMicros(c.costMicros)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {rr > 0 ? <span className={`font-mono tabular-nums ${rr >= 2 ? "text-success" : rr >= 1 ? "text-foreground" : "text-destructive"}`}>{rr.toFixed(2)}x</span> : "--"}
                      </TableCell>
                      <TableCell className="text-right">{cpa > 0 ? formatCurrency(cpa) : "--"}</TableCell>
                      <TableCell className="text-right">{c.conversions > 0 ? formatNumber(c.conversions) : "--"}</TableCell>
                      <TableCell className="text-right">{formatPercent(c.ctr * 100)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma campanha encontrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignClassTable({
  title, icon, items, badgeVariant, emptyText, onNavigate, onPause,
}: {
  title: string;
  icon: React.ReactNode;
  items: MetricsRow[];
  badgeVariant: "success" | "destructive";
  emptyText: string;
  onNavigate: (id: string) => void;
  onPause?: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Campanha</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right pr-6">Conv.</TableHead>
                {onPause && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.campaignId} className="cursor-pointer" onClick={() => c.campaignId && onNavigate(c.campaignId)}>
                  <TableCell className="font-medium text-sm max-w-[180px] truncate pl-6">{c.campaignName}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={badgeVariant} className="font-mono tabular-nums">{computeRoas(c).toFixed(2)}x</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono tabular-nums">{formatMicros(c.costMicros)}</TableCell>
                  <TableCell className="text-right text-sm font-mono tabular-nums pr-6">{c.conversions > 0 ? formatNumber(c.conversions) : "0"}</TableCell>
                  {onPause && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => c.campaignId && onPause(c.campaignId)} title="Pausar">
                        <Pause className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}
