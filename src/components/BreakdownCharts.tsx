import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatMicros } from "@/lib/formatters";

const COLORS = ["hsl(214, 89%, 52%)", "hsl(142, 71%, 45%)", "hsl(47, 100%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 70%, 55%)", "hsl(190, 80%, 45%)"];

function formatCurrency(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? "R$ 0,00" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatNumber(v: string | number): string {
  const n = typeof v === "string" ? parseInt(String(v), 10) : v;
  return isNaN(n) ? "0" : n.toLocaleString("pt-BR");
}
function formatPercent(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? "0,00%" : `${n.toFixed(2)}%`;
}

const DEVICE_LABELS: Record<string, string> = {
  DESKTOP: "Desktop",
  MOBILE: "Celular",
  TABLET: "Tablet",
  CONNECTED_TV: "TV Conectada",
  OTHER: "Outro",
};

const NETWORK_LABELS: Record<string, string> = {
  SEARCH: "Pesquisa",
  SEARCH_PARTNERS: "Parceiros de Pesquisa",
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

interface BreakdownChartsProps {
  entityId: string;
  entityType: "campaign" | "adGroup" | "ad";
  datePreset?: string;
}

function BreakdownTab({
  entityId,
  entityType,
  datePreset,
  segment,
  labelMap,
}: BreakdownChartsProps & { segment: string; labelMap?: Record<string, string> }) {
  const { data, isLoading } = useQuery({
    queryKey: ["performance-segment", entityId, entityType, segment, datePreset],
    queryFn: async () => {
      const { getPerformanceBySegment } = await import("@/lib/google-ads/reporting");
      return getPerformanceBySegment(entityId, entityType, segment, datePreset || "LAST_7_DAYS");
    },
    enabled: !!entityId,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const rows = (data as any)?.results || [];
  if (rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Sem dados para este segmento.</p>;

  const chartData = rows.map((r: any) => ({
    name: labelMap?.[r.segment] || r.segment || "N/A",
    spend: r.costMicros ? r.costMicros / 1_000_000 : 0,
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
  }));

  const isBarChart = segment === "device" || segment === "dayOfWeek";

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {isBarChart ? (
            <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => `R$${v}`} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="spend" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={chartData} dataKey="spend" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Segmento</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Impressoes</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">CPC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r: any, i: number) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{labelMap?.[r.segment] || r.segment}</TableCell>
              <TableCell className="text-right">{r.costMicros ? formatCurrency(r.costMicros / 1_000_000) : "---"}</TableCell>
              <TableCell className="text-right">{formatNumber(r.impressions)}</TableCell>
              <TableCell className="text-right">{formatNumber(r.clicks)}</TableCell>
              <TableCell className="text-right">{r.impressions > 0 ? formatPercent((r.clicks / r.impressions) * 100) : "---"}</TableCell>
              <TableCell className="text-right">{r.clicks > 0 ? formatCurrency((r.costMicros || 0) / 1_000_000 / r.clicks) : "---"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function BreakdownCharts({ entityId, entityType, datePreset }: BreakdownChartsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance por Segmento</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="device">
          <TabsList>
            <TabsTrigger value="device">Dispositivo</TabsTrigger>
            <TabsTrigger value="adNetworkType">Rede</TabsTrigger>
            <TabsTrigger value="dayOfWeek">Dia da Semana</TabsTrigger>
            <TabsTrigger value="hour">Hora</TabsTrigger>
          </TabsList>
          <TabsContent value="device" className="mt-4">
            <BreakdownTab entityId={entityId} entityType={entityType} datePreset={datePreset} segment="device" labelMap={DEVICE_LABELS} />
          </TabsContent>
          <TabsContent value="adNetworkType" className="mt-4">
            <BreakdownTab entityId={entityId} entityType={entityType} datePreset={datePreset} segment="adNetworkType" labelMap={NETWORK_LABELS} />
          </TabsContent>
          <TabsContent value="dayOfWeek" className="mt-4">
            <BreakdownTab entityId={entityId} entityType={entityType} datePreset={datePreset} segment="dayOfWeek" labelMap={DAY_LABELS} />
          </TabsContent>
          <TabsContent value="hour" className="mt-4">
            <BreakdownTab entityId={entityId} entityType={entityType} datePreset={datePreset} segment="hour" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
