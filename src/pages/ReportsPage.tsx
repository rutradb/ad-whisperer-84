import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSavedReports } from "@/hooks/useSavedReports";
import type { ReportConfig } from "@/hooks/useSavedReports";
import { getCampaignMetrics, getAdGroupMetrics, getAdMetrics, getCustomerMetrics } from "@/lib/google-ads/reporting";
import { normalizeMetricsRow, microsToUnits } from "@/lib/google-ads/types";
import type { MetricsRow, DateRange } from "@/lib/google-ads/types";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { ExportButton } from "@/components/ExportButton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Play, Trash2, Plus, Save, BarChart3, TableIcon, Clock, Pause } from "lucide-react";
import { useReportSchedules, useCreateReportSchedule, useToggleReportSchedule, useDeleteReportSchedule } from "@/hooks/useReportSchedules";

const METRIC_OPTIONS = [
  { key: "impressions", label: "Impressoes" },
  { key: "clicks", label: "Cliques" },
  { key: "costMicros", label: "Gasto" },
  { key: "ctr", label: "CTR" },
  { key: "averageCpc", label: "CPC Medio" },
  { key: "averageCpm", label: "CPM Medio" },
  { key: "conversions", label: "Conversoes" },
  { key: "conversionsValue", label: "Valor de Conversoes" },
  { key: "costPerConversion", label: "Custo/Conversao" },
  { key: "conversionRate", label: "Taxa de Conversao" },
  { key: "searchImpressionShare", label: "Search Impression Share" },
];

const SEGMENT_OPTIONS = [
  { key: "device", label: "Dispositivo" },
  { key: "adNetworkType", label: "Rede" },
  { key: "dayOfWeek", label: "Dia da Semana" },
];

const DATE_PRESETS: { value: string; label: string }[] = [
  { value: "LAST_7_DAYS", label: "Ultimos 7 dias" },
  { value: "LAST_14_DAYS", label: "Ultimos 14 dias" },
  { value: "LAST_30_DAYS", label: "Ultimos 30 dias" },
  { value: "THIS_MONTH", label: "Este mes" },
  { value: "LAST_MONTH", label: "Mes passado" },
  { value: "THIS_QUARTER", label: "Este trimestre" },
];

const LEVEL_OPTIONS = [
  { value: "account", label: "Conta" },
  { value: "campaign", label: "Campanha" },
  { value: "ad_group", label: "Grupo de Anuncios" },
  { value: "ad", label: "Anuncio" },
];

const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

function formatValue(key: string, value: any): string {
  if (value === undefined || value === null) return "--";
  const v = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(v)) return String(value);
  if (key === "costMicros") return microsToUnits(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (key === "averageCpc" || key === "averageCpm" || key === "costPerConversion" || key === "conversionsValue") return microsToUnits(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (key === "ctr" || key === "conversionRate" || key === "searchImpressionShare") return `${(v * 100).toFixed(2)}%`;
  return v.toLocaleString("pt-BR");
}

export default function ReportsPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const { reports, isLoading: reportsLoading, saveReport, deleteReport } = useSavedReports();

  const [showBuilder, setShowBuilder] = useState(false);
  const [reportName, setReportName] = useState("");
  const [level, setLevel] = useState("campaign");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["impressions", "clicks", "costMicros", "ctr", "conversions"]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState("LAST_30_DAYS");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [runConfig, setRunConfig] = useState<ReportConfig | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [displayMetrics, setDisplayMetrics] = useState<string[]>([]);

  // Scheduler
  const [scheduleReportId, setScheduleReportId] = useState<string | null>(null);
  const [schedFreq, setSchedFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [schedDay, setSchedDay] = useState(1);
  const [schedTime, setSchedTime] = useState("08:00");
  const [schedEmail, setSchedEmail] = useState("");
  const { data: schedules } = useReportSchedules();
  const createSchedule = useCreateReportSchedule();
  const toggleSchedule = useToggleReportSchedule();
  const deleteSchedule = useDeleteReportSchedule();

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["report-data", customerId, runConfig],
    queryFn: async () => {
      if (!customerId || !runConfig) return [];
      let response;
      switch (runConfig.level) {
        case "account":
          response = await getCustomerMetrics(customerId, runConfig.date_preset as DateRange);
          break;
        case "campaign":
          response = await getCampaignMetrics(customerId, undefined, runConfig.date_preset as DateRange);
          break;
        case "ad_group":
          response = await getAdGroupMetrics(customerId, undefined, undefined, runConfig.date_preset as DateRange);
          break;
        case "ad":
          response = await getAdMetrics(customerId, undefined, undefined, runConfig.date_preset as DateRange);
          break;
        default:
          response = await getCampaignMetrics(customerId, undefined, runConfig.date_preset as DateRange);
      }
      return (response.results || []).map((r: any) => normalizeMetricsRow(r));
    },
    enabled: !!customerId && !!runConfig,
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Relatorios</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) => prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]);
  };

  const toggleSegment = (key: string) => {
    setSelectedSegments((prev) => prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]);
  };

  const buildConfig = (): ReportConfig => ({
    level,
    fields: selectedMetrics,
    date_preset: datePreset,
    breakdowns: selectedSegments.length > 0 ? selectedSegments : undefined,
  });

  const handleRun = (config?: ReportConfig) => {
    setDisplayMetrics(config ? config.fields : selectedMetrics);
    setRunConfig(config || buildConfig());
  };

  const handleSave = () => {
    if (!reportName) return;
    saveReport.mutate({ name: reportName, config: buildConfig() });
    setReportName("");
  };

  const resultRows = reportData || [];
  const metricsForDisplay = displayMetrics.length > 0 ? displayMetrics : (runConfig?.fields || []);

  const nameKey = runConfig?.level === "campaign" ? "campaignName"
    : runConfig?.level === "ad_group" ? "adGroupName"
    : runConfig?.level === "ad" ? "adId"
    : "date";

  const resultColumns = runConfig ? [
    ...(runConfig.level !== "account" ? [{ key: nameKey, label: "Nome" }] : []),
    ...metricsForDisplay.map((f) => ({ key: f, label: METRIC_OPTIONS.find((o) => o.key === f)?.label || f })),
  ] : [];

  const chartConfig = Object.fromEntries(
    metricsForDisplay.map((f, i) => [f, { label: METRIC_OPTIONS.find((o) => o.key === f)?.label || f, color: CHART_COLORS[i % CHART_COLORS.length] }])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground">Crie e execute relatorios personalizados</p>
        </div>
        <Button onClick={() => setShowBuilder(!showBuilder)}>
          <Plus className="mr-2 h-4 w-4" />{showBuilder ? "Fechar" : "Novo Relatorio"}
        </Button>
      </div>

      {/* Saved Reports */}
      {!showBuilder && (
        <Card>
          <CardHeader><CardTitle className="text-base">Relatorios Salvos</CardTitle></CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="w-24">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-sm">{LEVEL_OPTIONS.find((l) => l.value === r.config.level)?.label || r.config.level}</TableCell>
                      <TableCell className="text-sm">{DATE_PRESETS.find((d) => d.value === r.config.date_preset)?.label || r.config.date_preset}</TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleRun(r.config)}><Play className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setScheduleReportId(r.id)}><Clock className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-6">Nenhum relatorio salvo. Crie um novo acima.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Builder */}
      {showBuilder && (
        <Card>
          <CardHeader><CardTitle className="text-base">Construtor de Relatorio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVEL_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Periodo</Label>
                <Select value={datePreset} onValueChange={setDatePreset}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Metricas</Label>
              <div className="grid grid-cols-4 gap-2">
                {METRIC_OPTIONS.map((m) => (
                  <div key={m.key} className="flex items-center gap-2">
                    <Checkbox checked={selectedMetrics.includes(m.key)} onCheckedChange={() => toggleMetric(m.key)} />
                    <Label className="text-sm font-normal">{m.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Segmentacao (opcional)</Label>
              <div className="grid grid-cols-5 gap-2">
                {SEGMENT_OPTIONS.map((b) => (
                  <div key={b.key} className="flex items-center gap-2">
                    <Checkbox checked={selectedSegments.includes(b.key)} onCheckedChange={() => toggleSegment(b.key)} />
                    <Label className="text-sm font-normal">{b.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleRun()} disabled={selectedMetrics.length === 0}>
                <Play className="mr-2 h-4 w-4" />Executar
              </Button>
              <div className="flex gap-2 ml-auto">
                <Input placeholder="Nome do relatorio" value={reportName} onChange={(e) => setReportName(e.target.value)} className="w-48" />
                <Button variant="outline" onClick={handleSave} disabled={!reportName || saveReport.isPending}>
                  <Save className="mr-2 h-4 w-4" />Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {runConfig && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Resultados</CardTitle>
            <div className="flex gap-2">
              <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
                <TableIcon className="mr-1 h-4 w-4" />Tabela
              </Button>
              <Button variant={viewMode === "chart" ? "default" : "outline"} size="sm" onClick={() => setViewMode("chart")}>
                <BarChart3 className="mr-1 h-4 w-4" />Grafico
              </Button>
              {resultRows.length > 0 && (
                <ExportButton data={resultRows} columns={resultColumns} filename="relatorio" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reportLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : resultRows.length > 0 ? (
              viewMode === "chart" ? (
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <BarChart data={resultRows.slice(0, 30)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey={nameKey} className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {metricsForDisplay.map((m, i) => (
                      <Bar key={m} dataKey={m} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {resultColumns.map((c) => (
                          <TableHead key={c.key}>{c.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultRows.map((row: any, i: number) => (
                        <TableRow key={i}>
                          {resultColumns.map((c) => (
                            <TableCell key={c.key} className="text-sm">{formatValue(c.key, row[c.key])}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (
              <p className="text-center text-muted-foreground py-6">Sem dados para os filtros selecionados.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Schedules */}
      {schedules && schedules.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Agendamentos Ativos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Relatorio</TableHead>
                  <TableHead>Frequencia</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">{reports.find((r) => r.id === s.report_id)?.name || s.report_id}</TableCell>
                    <TableCell className="text-sm">{s.frequency === "daily" ? "Diario" : s.frequency === "weekly" ? "Semanal" : "Mensal"} as {s.time_of_day}</TableCell>
                    <TableCell className="text-sm">{s.delivery_target}</TableCell>
                    <TableCell>
                      <Switch checked={s.is_active} onCheckedChange={(v) => toggleSchedule.mutate({ id: s.id, is_active: v })} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteSchedule.mutate(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-2">Nota: envio automatico requer Edge Function no Supabase (fase futura).</p>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={!!scheduleReportId} onOpenChange={() => setScheduleReportId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Relatorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Frequencia</Label>
              <Select value={schedFreq} onValueChange={(v) => setSchedFreq(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {schedFreq === "weekly" && (
              <div className="space-y-2">
                <Label>Dia da Semana (0=Dom, 1=Seg...)</Label>
                <Input type="number" min={0} max={6} value={schedDay} onChange={(e) => setSchedDay(parseInt(e.target.value, 10) || 0)} />
              </div>
            )}
            {schedFreq === "monthly" && (
              <div className="space-y-2">
                <Label>Dia do Mes</Label>
                <Input type="number" min={1} max={28} value={schedDay} onChange={(e) => setSchedDay(parseInt(e.target.value, 10) || 1)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Horario</Label>
              <Input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Destino</Label>
              <Input type="email" placeholder="seuemail@exemplo.com" value={schedEmail} onChange={(e) => setSchedEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleReportId(null)}>Cancelar</Button>
            <Button
              disabled={!schedEmail || createSchedule.isPending}
              onClick={() => {
                if (scheduleReportId) {
                  createSchedule.mutate({
                    report_id: scheduleReportId,
                    frequency: schedFreq,
                    day_of_week: schedFreq === "weekly" ? schedDay : undefined,
                    day_of_month: schedFreq === "monthly" ? schedDay : undefined,
                    time_of_day: schedTime,
                    delivery_target: schedEmail,
                  });
                  setScheduleReportId(null);
                }
              }}
            >
              <Clock className="mr-2 h-4 w-4" />Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatorio?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteReport.mutate(deleteId); setDeleteId(null); } }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
