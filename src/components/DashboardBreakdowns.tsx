import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardBreakdownsProps {
  accountId: string;
  datePreset: string;
  dateParams: Record<string, any>;
}

const BREAKDOWN_TABS = [
  { key: "device", label: "Dispositivo" },
  { key: "adNetworkType", label: "Rede" },
  { key: "dayOfWeek", label: "Dia da Semana" },
  { key: "hour", label: "Hora" },
];

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

const chartConfig = {
  spend: { label: "Custo", color: "#6366f1" },
  clicks: { label: "Cliques", color: "#22c55e" },
  impressions: { label: "Impressoes", color: "#f59e0b" },
};

const DEVICE_LABELS: Record<string, string> = {
  DESKTOP: "Desktop",
  MOBILE: "Celular",
  TABLET: "Tablet",
  CONNECTED_TV: "TV Conectada",
  OTHER: "Outro",
};

const NETWORK_LABELS: Record<string, string> = {
  SEARCH: "Pesquisa",
  SEARCH_PARTNERS: "Parceiros",
  CONTENT: "Display",
  YOUTUBE_SEARCH: "YouTube Pesquisa",
  YOUTUBE_WATCH: "YouTube Video",
  MIXED: "Misto",
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terca",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sabado",
  SUNDAY: "Domingo",
};

function formatCurrency(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? "R$ 0" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatNumber(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? "0" : n.toLocaleString("pt-BR");
}

function getLabelMap(breakdown: string): Record<string, string> {
  switch (breakdown) {
    case "device": return DEVICE_LABELS;
    case "adNetworkType": return NETWORK_LABELS;
    case "dayOfWeek": return DAY_LABELS;
    default: return {};
  }
}

export function DashboardBreakdowns({ accountId, dateParams }: DashboardBreakdownsProps) {
  const [activeTab, setActiveTab] = useState("device");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segmentos de Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {BREAKDOWN_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <BreakdownPanel key={activeTab} accountId={accountId} breakdown={activeTab} dateParams={dateParams} />
      </CardContent>
    </Card>
  );
}

function BreakdownPanel({
  accountId,
  breakdown,
  dateParams,
}: {
  accountId: string;
  breakdown: string;
  dateParams: Record<string, any>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["account-segment", accountId, breakdown, dateParams],
    queryFn: async () => {
      const { getAccountPerformanceBySegment } = await import("@/lib/google-ads/reporting");
      return getAccountPerformanceBySegment(accountId, breakdown, dateParams);
    },
    enabled: !!accountId,
  });

  const labelMap = getLabelMap(breakdown);

  if (isLoading) return <Skeleton className="h-64 w-full mt-4" />;

  const rows = (data as any)?.results || [];
  if (rows.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Sem dados para este segmento.</p>;

  const chartData = rows.map((r: any) => ({
    name: labelMap[r.segment] || r.segment || "Desconhecido",
    spend: r.costMicros ? r.costMicros / 1_000_000 : 0,
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
  }));

  const pieData = chartData.map((d: any, i: number) => ({ ...d, fill: COLORS[i % COLORS.length] }));

  return (
    <div className="space-y-4 mt-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartContainer config={chartConfig} className="h-56">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="spend" fill="var(--color-spend)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <ChartContainer config={chartConfig} className="h-56">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="spend"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry: any) => entry.name}
            >
              {pieData.map((entry: any, idx: number) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </div>

      <BreakdownTable rows={rows} breakdown={breakdown} labelMap={labelMap} />
    </div>
  );
}

function BreakdownTable({ rows, breakdown, labelMap }: { rows: any[]; breakdown: string; labelMap: Record<string, string> }) {
  const enriched = useMemo(() => {
    return rows.map((r: any) => ({
      raw: r,
      label: labelMap[r.segment] || r.segment || "Desconhecido",
      spend: r.costMicros ? r.costMicros / 1_000_000 : 0,
      roas: r.conversionsValue && r.costMicros ? (r.conversionsValue / (r.costMicros / 1_000_000)) : 0,
      conversions: r.conversions || 0,
    }));
  }, [rows, labelMap]);

  const bestRoasIdx = useMemo(() => {
    let best = -1, bestVal = 0;
    enriched.forEach((e, i) => { if (e.roas > bestVal) { bestVal = e.roas; best = i; } });
    return bestVal > 0 ? best : -1;
  }, [enriched]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{BREAKDOWN_TABS.find((t) => t.key === breakdown)?.label}</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Impressoes</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">CPC</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
            <TableHead className="text-right">Conv.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enriched.map((e, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">
                {e.label}
                {i === bestRoasIdx && <Badge className="ml-2 bg-green-600 text-white text-[10px] px-1.5 py-0">Melhor</Badge>}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(e.spend)}</TableCell>
              <TableCell className="text-right">{formatNumber(e.raw.impressions)}</TableCell>
              <TableCell className="text-right">{formatNumber(e.raw.clicks)}</TableCell>
              <TableCell className="text-right">{e.raw.impressions > 0 ? `${((e.raw.clicks / e.raw.impressions) * 100).toFixed(2)}%` : "---"}</TableCell>
              <TableCell className="text-right">{e.raw.clicks > 0 ? formatCurrency(e.spend / e.raw.clicks) : "---"}</TableCell>
              <TableCell className="text-right font-medium">
                {e.roas > 0 ? <span className={e.roas >= 2 ? "text-green-600" : e.roas >= 1 ? "" : "text-red-600"}>{e.roas.toFixed(2)}x</span> : "---"}
              </TableCell>
              <TableCell className="text-right">{e.conversions > 0 ? formatNumber(e.conversions) : "---"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
