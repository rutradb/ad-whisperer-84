import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useCampaignDetail } from "@/hooks/useCampaignDetail";
import { useEntityInsights } from "@/hooks/useEntityInsights";
import { useAdGroupsByCampaign } from "@/hooks/useAdGroups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DollarSign, Eye, MousePointerClick, Percent, TrendingUp, ShoppingCart, Loader2, Copy, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMicros, formatNumber, formatPercent } from "@/lib/formatters";
import { normalizeMetricsRow, microsToUnits, computeRoas, type MetricsRow, type DateRange } from "@/lib/google-ads/types";

const chartConfig = {
  spend: { label: "Custo", color: "hsl(214 89% 52%)" },
  clicks: { label: "Cliques", color: "hsl(142 71% 45%)" },
};

const DATE_PRESETS: Array<{ value: DateRange; label: string }> = [
  { value: "LAST_7_DAYS", label: "Últimos 7 dias" },
  { value: "LAST_14_DAYS", label: "Últimos 14 dias" },
  { value: "LAST_30_DAYS", label: "Últimos 30 dias" },
];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const [dateRange, setDateRange] = useState<DateRange>("LAST_7_DAYS");
  const { data: campaign, isLoading } = useCampaignDetail(customerId, id);

  const { data: kpiData, isLoading: kpiLoading, isError: kpiError, error: kpiErrorObj, refetch: refetchKpi } = useEntityInsights(
    customerId, id, "campaign", { dateRange }
  );

  const { data: dailyData, isLoading: dailyLoading } = useEntityInsights(
    customerId, id, "campaign", { dateRange, segmentByDate: true }
  );

  const { data: adGroups } = useAdGroupsByCampaign(customerId, id);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!campaign) return <p className="text-center text-muted-foreground py-12">Campanha não encontrada.</p>;

  const kpiRow: MetricsRow | undefined = kpiData?.results?.[0] ? normalizeMetricsRow(kpiData.results[0]) : undefined;
  const roas = kpiRow ? computeRoas(kpiRow) : 0;

  const metrics = [
    { title: "Custo", value: kpiRow ? formatMicros(kpiRow.costMicros) : "--", icon: DollarSign },
    { title: "Impressões", value: kpiRow ? formatNumber(kpiRow.impressions) : "--", icon: Eye },
    { title: "Cliques", value: kpiRow ? formatNumber(kpiRow.clicks) : "--", icon: MousePointerClick },
    { title: "CTR", value: kpiRow ? formatPercent(kpiRow.ctr * 100) : "--", icon: Percent },
    { title: "CPC Médio", value: kpiRow ? formatMicros(kpiRow.averageCpc) : "--", icon: TrendingUp },
    { title: "Conversões", value: kpiRow && kpiRow.conversions > 0 ? formatNumber(kpiRow.conversions) : "--", icon: ShoppingCart },
  ];

  const chartData = (dailyData?.results || []).map((r: any) => {
    const row = normalizeMetricsRow(r);
    return {
      date: row.date?.slice(5) || "",
      spend: microsToUnits(row.costMicros),
      clicks: row.clicks,
    };
  });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/campaigns">Campanhas</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{campaign.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <StatusBadge status={campaign.status} />
          <ChannelBadge channel={campaign.advertisingChannelType} />
          <span className="text-sm text-muted-foreground">{campaign.biddingStrategyType?.replace(/_/g, " ")}</span>
          {campaign.optimizationScore != null && (
            <Badge variant="outline" className="font-mono">{(campaign.optimizationScore * 100).toFixed(0)}% otimização</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate(`/campaigns/new?duplicate=${id}`)}><Copy className="mr-2 h-4 w-4" />Duplicar</Button>
          <Button variant="outline" onClick={() => navigate(`/campaigns/${id}/edit`)}>Editar</Button>
        </div>
      </div>

      {/* Network settings info */}
      {campaign.networkSettings && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Configurações de Rede</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {campaign.networkSettings.targetGoogleSearch && <span>Pesquisa Google</span>}
              {campaign.networkSettings.targetSearchNetwork && <span>Parceiros de Pesquisa</span>}
              {campaign.networkSettings.targetContentNetwork && <span>Rede de Display</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {kpiError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Erro ao carregar métricas</p>
              <p className="text-xs text-muted-foreground">{(kpiErrorObj as Error)?.message || "Tente novamente ou altere o período."}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchKpi()}>
              <RefreshCw className="mr-2 h-3 w-3" />Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle>
              <m.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpiLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{m.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

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
          ) : <p className="text-center text-muted-foreground py-12">Sem dados para o período.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Grupos de Anúncios</CardTitle></CardHeader>
        <CardContent>
          {adGroups && adGroups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CPC Bid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adGroups.map((ag: any) => (
                  <TableRow key={ag.id} className="cursor-pointer" onClick={() => navigate(`/adsets/${ag.id}`)}>
                    <TableCell className="font-medium">{ag.name}</TableCell>
                    <TableCell><StatusBadge status={ag.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{ag.type?.replace(/_/g, " ") || "--"}</TableCell>
                    <TableCell className="text-sm">{ag.cpcBidMicros ? formatMicros(ag.cpcBidMicros) : "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-center text-muted-foreground py-8">Nenhum grupo de anúncios encontrado.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ENABLED": return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Ativa</Badge>;
    case "PAUSED": return <Badge variant="secondary">Pausada</Badge>;
    case "REMOVED": return <Badge variant="outline">Removida</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function ChannelBadge({ channel }: { channel?: string }) {
  if (!channel) return null;
  const colors: Record<string, string> = {
    SEARCH: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    DISPLAY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    VIDEO: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    SHOPPING: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    PERFORMANCE_MAX: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    DEMAND_GEN: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  };
  return <Badge variant="outline" className={colors[channel] || ""}>{channel.replace(/_/g, " ")}</Badge>;
}
