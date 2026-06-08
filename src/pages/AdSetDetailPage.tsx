import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdGroupDetail } from "@/hooks/useAdGroupDetail";
import { useEntityInsights } from "@/hooks/useEntityInsights";
import { useAdsByAdGroup } from "@/hooks/useAds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DollarSign, Eye, MousePointerClick, Percent, TrendingUp, ShoppingCart, Loader2, Pencil, Copy, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMicros, formatNumber, formatPercent } from "@/lib/formatters";
import { normalizeMetricsRow, microsToUnits, type MetricsRow, type DateRange } from "@/lib/google-ads/types";

const chartConfig = {
  spend: { label: "Custo", color: "hsl(214 89% 52%)" },
  clicks: { label: "Cliques", color: "hsl(142 71% 45%)" },
};

const DATE_PRESETS: Array<{ value: DateRange; label: string }> = [
  { value: "LAST_7_DAYS", label: "Últimos 7 dias" },
  { value: "LAST_14_DAYS", label: "Últimos 14 dias" },
  { value: "LAST_30_DAYS", label: "Últimos 30 dias" },
];

export default function AdSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const [dateRange, setDateRange] = useState<DateRange>("LAST_7_DAYS");
  const { data: adGroup, isLoading } = useAdGroupDetail(customerId, id);

  const { data: kpiData, isLoading: kpiLoading, isError: kpiError, error: kpiErrorObj, refetch: refetchKpi } = useEntityInsights(
    customerId, id, "ad_group", { dateRange }
  );

  const { data: ads } = useAdsByAdGroup(customerId, id);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!adGroup) return <p className="text-center text-muted-foreground py-12">Grupo de anúncios não encontrado.</p>;

  const kpiRow: MetricsRow | undefined = kpiData?.results?.[0] ? normalizeMetricsRow(kpiData.results[0]) : undefined;

  const metrics = [
    { title: "Custo", value: kpiRow ? formatMicros(kpiRow.costMicros) : "--", icon: DollarSign },
    { title: "Impressões", value: kpiRow ? formatNumber(kpiRow.impressions) : "--", icon: Eye },
    { title: "Cliques", value: kpiRow ? formatNumber(kpiRow.clicks) : "--", icon: MousePointerClick },
    { title: "CTR", value: kpiRow ? formatPercent(kpiRow.ctr * 100) : "--", icon: Percent },
    { title: "CPC Médio", value: kpiRow ? formatMicros(kpiRow.averageCpc) : "--", icon: TrendingUp },
    { title: "Conversões", value: kpiRow && kpiRow.conversions > 0 ? formatNumber(kpiRow.conversions) : "--", icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/adsets">Grupos de Anúncios</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{adGroup.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">{adGroup.name}</h1>
        <StatusBadge status={adGroup.status} />
        <span className="text-sm text-muted-foreground">{adGroup.type?.replace(/_/g, " ")}</span>
        {adGroup.cpcBidMicros && (
          <Badge variant="outline">CPC Bid: {formatMicros(adGroup.cpcBidMicros)}</Badge>
        )}
        <div className="ml-auto flex gap-2 items-center">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" asChild><Link to={`/adsets/new?duplicate=${id}`}><Copy className="mr-2 h-4 w-4" />Duplicar</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to={`/adsets/${id}/edit`}><Pencil className="mr-2 h-4 w-4" />Editar</Link></Button>
        </div>
      </div>

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
        <CardHeader><CardTitle>Anúncios</CardTitle></CardHeader>
        <CardContent>
          {ads && ads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ad Strength</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((adGroupAd: any) => (
                  <TableRow key={adGroupAd.ad?.id || adGroupAd.resourceName} className="cursor-pointer" onClick={() => adGroupAd.ad?.id && navigate(`/ads/${adGroupAd.ad.id}`)}>
                    <TableCell className="font-medium">{adGroupAd.ad?.name || adGroupAd.ad?.finalUrls?.[0] || "RSA"}</TableCell>
                    <TableCell><StatusBadge status={adGroupAd.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{adGroupAd.ad?.type || "--"}</TableCell>
                    <TableCell>{adGroupAd.ad?.adStrength ? <AdStrengthBadge strength={adGroupAd.ad.adStrength} /> : "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-center text-muted-foreground py-8">Nenhum anúncio encontrado.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ENABLED": return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Ativo</Badge>;
    case "PAUSED": return <Badge variant="secondary">Pausado</Badge>;
    case "REMOVED": return <Badge variant="outline">Removido</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function AdStrengthBadge({ strength }: { strength: string }) {
  const colors: Record<string, string> = {
    EXCELLENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    GOOD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    AVERAGE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    POOR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  const labels: Record<string, string> = {
    EXCELLENT: "Excelente",
    GOOD: "Bom",
    AVERAGE: "Médio",
    POOR: "Fraco",
  };
  return <Badge variant="outline" className={colors[strength] || ""}>{labels[strength] || strength}</Badge>;
}
