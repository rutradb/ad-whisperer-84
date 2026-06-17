import { useState, type MouseEvent } from "react";
import { useStrategicScan } from "@/hooks/useStrategicScan";
import { useStrategicScanHistory } from "@/hooks/useStrategicScanHistory";
import type { DateRange } from "@/lib/google-ads/types";
import type { Recommendation } from "@/lib/strategic-scan";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { cn } from "@/lib/utils";
import {
  Radar, Sparkles, AlertTriangle, TrendingUp, Target, Gauge,
  Cpu, ListChecks, ShieldAlert, KeyRound, History, Trash2,
} from "lucide-react";

const PERIODS: { label: string; value: DateRange }[] = [
  { label: "7 dias", value: "LAST_7_DAYS" },
  { label: "14 dias", value: "LAST_14_DAYS" },
  { label: "30 dias", value: "LAST_30_DAYS" },
];

const COMPLEXITY_LABEL: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };

function modelLabel(id: string): string {
  if (id.includes("opus")) return "Opus";
  if (id.includes("sonnet")) return "Sonnet";
  if (id.includes("haiku")) return "Haiku";
  return id;
}

const PRIORITY_CLASS: Record<Recommendation["priority"], string> = {
  alta: "bg-destructive text-destructive-foreground",
  media: "bg-yellow-500 text-white",
  baixa: "bg-muted text-muted-foreground",
};

const LEVEL_CLASS: Record<string, string> = {
  alto: "bg-green-600 text-white",
  medio: "bg-yellow-500 text-white",
  baixo: "bg-muted text-muted-foreground",
};

const SEVERITY_CLASS: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-yellow-500 text-white",
  low: "bg-muted text-muted-foreground",
};

export default function StrategicScanPage() {
  const { result, currentScanId, isLoading, error, hasApiKey, isConnected, run, loadScan } = useStrategicScan();
  const { scans, deleteScan } = useStrategicScanHistory();
  const [period, setPeriod] = useState<DateRange>("LAST_30_DAYS");

  const handleDeleteScan = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    await deleteScan(id);
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Header />
        <ConnectionBanner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {!hasApiKey && (
        <Alert>
          <KeyRound className="h-4 w-4" />
          <AlertTitle>Chave da API Anthropic não configurada</AlertTitle>
          <AlertDescription>
            Configure sua chave em <strong>Configurações &gt; Integrações</strong> para rodar a varredura.
          </AlertDescription>
        </Alert>
      )}

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <Label>Período de análise</Label>
              <div className="flex gap-2">
                {PERIODS.map((p) => (
                  <Button
                    key={p.value}
                    variant={period === p.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriod(p.value)}
                    disabled={isLoading}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={() => run(period)} disabled={isLoading || !hasApiKey}>
              <Radar className={isLoading ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
              {isLoading ? "Analisando conta…" : "Rodar varredura estratégica"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Triagem com Haiku → análise estatística e estratégica com modelo adaptativo
            (Haiku / Sonnet / Opus) conforme a complexidade da conta.
          </p>
        </CardContent>
      </Card>

      {/* Histórico de varreduras */}
      {scans.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Histórico de varreduras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {scans.map((s) => (
              <div
                key={s.id}
                onClick={() => loadScan(s.id)}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  currentScanId === s.id ? "border-primary bg-accent" : "hover:bg-muted",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {s.date_range ? ` · ${s.date_range}` : ""}
                  </p>
                </div>
                {s.complexity && (
                  <Badge variant="outline" className="shrink-0">
                    {COMPLEXITY_LABEL[s.complexity] ?? s.complexity}
                  </Badge>
                )}
                <button
                  onClick={(e) => handleDeleteScan(e, s.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Excluir varredura"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {result && !isLoading && <ScanReport result={result} />}
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Radar className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Varredura Estratégica</h1>
        <p className="text-muted-foreground">
          Avaliação matemática, estatística e estratégica das suas campanhas, de ponta a ponta
        </p>
      </div>
    </div>
  );
}

function ScanReport({ result }: { result: import("@/lib/strategic-scan").ScanResult }) {
  const { analysis, triage } = result;

  return (
    <div className="space-y-6">
      {/* Resumo executivo + score */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Resumo Executivo
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Gauge className="h-3 w-3" /> Complexidade: {COMPLEXITY_LABEL[result.complexity]}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Cpu className="h-3 w-3" /> {modelLabel(result.models.strategy)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10">
              <span className="text-2xl font-bold text-primary">{analysis.healthScore}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">saúde</span>
            </div>
            <p className="text-sm leading-relaxed">{analysis.executiveSummary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ações priorizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" /> Ações Recomendadas
          </CardTitle>
          <CardDescription>Priorizadas por impacto e esforço</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold">{rec.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={PRIORITY_CLASS[rec.priority]}>Prioridade {rec.priority}</Badge>
                  <Badge className={LEVEL_CLASS[rec.impact]}>Impacto {rec.impact}</Badge>
                  <Badge className={LEVEL_CLASS[rec.effort]} variant="outline">Esforço {rec.effort}</Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{rec.rationale}</p>
              <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-3">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="space-y-1 text-sm">
                  <p><strong>Ação:</strong> {rec.action}</p>
                  <p className="text-muted-foreground"><strong>Resultado esperado:</strong> {rec.expectedOutcome}</p>
                  {rec.targetCampaigns.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Campanhas: {rec.targetCampaigns.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achados estatísticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Achados Estatísticos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.statisticalFindings.map((f, i) => (
            <div key={i} className="rounded-lg border p-3">
              <p className="font-medium">{f.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">Evidência: {f.evidence}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Anomalias da triagem */}
      {triage.anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" /> Anomalias Detectadas
            </CardTitle>
            <CardDescription>Triagem automática (Haiku)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {triage.anomalies.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge className={SEVERITY_CLASS[a.severity]}>{a.severity}</Badge>
                <span>
                  <strong>{a.campaign}</strong> — {a.metric}: {a.note}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projeção + riscos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-green-600" /> Projeção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.projection}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Riscos a Vigiar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {analysis.risks.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Triagem: {modelLabel(result.models.triage)} · Estratégia: {modelLabel(result.models.strategy)} ·
        Complexidade {COMPLEXITY_LABEL[result.complexity]} (heurística {COMPLEXITY_LABEL[result.complexitySignals.heuristic]} / triagem {COMPLEXITY_LABEL[result.complexitySignals.triage]})
      </p>
    </div>
  );
}
