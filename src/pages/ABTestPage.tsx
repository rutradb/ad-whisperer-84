import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfile } from "@/hooks/useProfile";
import { useAdGroups } from "@/hooks/useAdGroups";
import { useABTests, useCreateABTest, useUpdateABTest, type ABTestRecord } from "@/hooks/useABTests";
import { getAdGroupMetrics } from "@/lib/google-ads/reporting";
import { createAdGroup, bulkUpdateStatus } from "@/lib/google-ads/mutations";
import { normalizeMetricsRow, microsToUnits } from "@/lib/google-ads/types";
import type { CreateAdGroupData } from "@/lib/google-ads/mutations";
import { zTestTwoProportions, minSampleSize } from "@/lib/statistics";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Loader2, Plus, Trophy, Pause, TrendingUp } from "lucide-react";

type VariableType = "creative" | "audience" | "placement" | "bidding";

const METRIC_OPTIONS = [
  { value: "cpa", label: "CPA (Custo por Conversao)" },
  { value: "averageCpc", label: "CPC Medio" },
  { value: "ctr", label: "CTR (%)" },
  { value: "roas", label: "ROAS" },
];

export default function ABTestPage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const { profile } = useProfile();
  const userId = profile?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedAdGroupId, setSelectedAdGroupId] = useState("");
  const [variable, setVariable] = useState<VariableType>("creative");
  const [testName, setTestName] = useState("");
  const [variants, setVariants] = useState(2);
  const [primaryMetric, setPrimaryMetric] = useState("cpa");

  const { data: adGroupsData, isLoading: adGroupsLoading } = useAdGroups(customerId ?? undefined, {
    limit: 100,
  } as any);

  const { data: abTests, isLoading: testsLoading } = useABTests(userId);
  const createABTest = useCreateABTest();
  const updateABTest = useUpdateABTest();

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const sourceAdGroup = (adGroupsData as any)?.find?.((a: any) => a.id === selectedAdGroupId) || (adGroupsData as any)?.data?.find?.((a: any) => a.id === selectedAdGroupId);
      if (!sourceAdGroup || !customerId) throw new Error("Grupo de Anuncios nao encontrado");

      const campaignResourceName = sourceAdGroup.campaign || `customers/${customerId}/campaigns/${sourceAdGroup.campaignId}`;

      const promises = Array.from({ length: variants }, (_, i) => {
        const data: CreateAdGroupData = {
          name: `${testName || sourceAdGroup.name} - Variante ${String.fromCharCode(65 + i)}`,
          campaign: campaignResourceName,
          type: sourceAdGroup.type || "SEARCH_STANDARD",
          cpcBidMicros: sourceAdGroup.cpcBidMicros ? parseInt(sourceAdGroup.cpcBidMicros) : undefined,
          status: "PAUSED",
        };
        return createAdGroup(customerId, data);
      });

      return Promise.all(promises);
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["adgroups"] });

      // Save to Supabase
      if (userId) {
        createABTest.mutate({
          user_id: userId,
          test_name: testName || "Teste A/B",
          variable_type: variable,
          base_adset_id: selectedAdGroupId,
          variant_adset_ids: results.map((r) => r.results?.[0]?.resourceName || ""),
          status: "running",
          primary_metric: primaryMetric,
          snapshots: [],
        });
      }

      toast({ title: `${results.length} variantes criadas com sucesso!` });
      setStep(1);
      setSelectedAdGroupId("");
      setTestName("");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar teste", description: err.message, variant: "destructive" });
    },
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Testes A/B</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const adGroups = (adGroupsData as any) || [];
  const runningTests = abTests?.filter((t) => t.status === "running") || [];
  const completedTests = abTests?.filter((t) => t.status !== "running") || [];

  const insightPrompt = useMemo(() => {
    if (!runningTests.length && !completedTests.length) return null;
    const running = runningTests.map((t) =>
      `- [ativo] "${t.test_name}" | variavel: ${t.variable_type} | metrica: ${t.primary_metric} | ${t.variant_adset_ids?.length || 0} variantes`
    );
    const completed = completedTests.slice(0, 5).map((t) =>
      `- [encerrado] "${t.test_name}" | variavel: ${t.variable_type} | metrica: ${t.primary_metric}`
    );
    const variaveis = [...new Set([...runningTests, ...completedTests].map(t => t.variable_type))];
    return `Programa de testes A/B da conta Google Ads.
${runningTests.length} testes em andamento, ${completedTests.length} encerrados. Variaveis testadas: ${variaveis.join(", ") || "nenhuma ainda"}.
${running.length ? `Testes ativos:\n${running.join("\n")}` : ""}
${completed.length ? `Testes recentes encerrados:\n${completed.join("\n")}` : ""}
Analise a maturidade do programa de testes, cobertura de variaveis, e sugira proximas hipoteses prioritarias para maximizar aprendizado e performance.`;
  }, [runningTests, completedTests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Testes A/B</h1>
        <p className="text-muted-foreground">Crie testes e analise resultados com significancia estatistica</p>
      </div>

      <AIInsightsPanel prompt={insightPrompt} context="Testes A/B" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Create test */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Novo Teste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Grupo de Anuncios Base</Label>
                {adGroupsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedAdGroupId} onValueChange={(v) => { setSelectedAdGroupId(v); setStep(2); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione um Grupo de Anuncios..." /></SelectTrigger>
                    <SelectContent>
                      {adGroups.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {step >= 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Nome do Teste</Label>
                    <Input placeholder="Ex: Teste criativo Q1" value={testName} onChange={(e) => setTestName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Variavel</Label>
                      <Select value={variable} onValueChange={(v) => setVariable(v as VariableType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="creative">Criativo</SelectItem>
                          <SelectItem value="audience">Publico</SelectItem>
                          <SelectItem value="placement">Posicionamento</SelectItem>
                          <SelectItem value="bidding">Lance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Metrica Principal</Label>
                      <Select value={primaryMetric} onValueChange={setPrimaryMetric}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {METRIC_OPTIONS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Variantes</Label>
                    <Select value={String(variants)} onValueChange={(v) => setVariants(parseInt(v, 10))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 variantes (A/B)</SelectItem>
                        <SelectItem value="3">3 variantes (A/B/C)</SelectItem>
                        <SelectItem value="4">4 variantes (A/B/C/D)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      As variantes serao criadas como PAUSED. Altere o {variable === "creative" ? "criativo" : variable === "audience" ? "publico" : variable === "placement" ? "posicionamento" : "lance"} em cada variante antes de ativar.
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => duplicateMutation.mutate()}
                    disabled={!selectedAdGroupId || duplicateMutation.isPending}
                  >
                    {duplicateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FlaskConical className="mr-2 h-4 w-4" />
                    )}
                    Criar {variants} Variantes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sample size calculator */}
          <SampleSizeCalculator />
        </div>

        {/* Right: Running tests */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Testes em Andamento</h2>
          {testsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : runningTests.length > 0 ? (
            runningTests.map((test) => (
              <ABTestCard
                key={test.id}
                test={test}
                customerId={customerId}
                onComplete={(winnerId, confidence) => {
                  updateABTest.mutate({
                    id: test.id,
                    status: "completed",
                    winner_adset_id: winnerId,
                    confidence_level: confidence,
                    ended_at: new Date().toISOString(),
                  });
                }}
                onStop={() => {
                  updateABTest.mutate({ id: test.id, status: "stopped", ended_at: new Date().toISOString() });
                }}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum teste em andamento
              </CardContent>
            </Card>
          )}

          {completedTests.length > 0 && (
            <>
              <h2 className="text-lg font-semibold">Concluidos</h2>
              {completedTests.map((test) => (
                <Card key={test.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{test.test_name}</p>
                        <p className="text-xs text-muted-foreground">{test.variable_type} - {test.variant_adset_ids.length} variantes</p>
                      </div>
                      <Badge variant={test.status === "completed" ? "default" : "secondary"}>
                        {test.status === "completed" ? "Concluido" : "Parado"}
                      </Badge>
                    </div>
                    {test.winner_adset_id && (
                      <p className="text-sm mt-2">
                        <Trophy className="inline h-3.5 w-3.5 text-yellow-500 mr-1" />
                        Vencedor: {test.winner_adset_id} ({test.confidence_level?.toFixed(1)}% confianca)
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ABTestCard({
  test,
  customerId,
  onComplete,
  onStop,
}: {
  test: ABTestRecord;
  customerId: string;
  onComplete: (winnerId: string, confidence: number) => void;
  onStop: () => void;
}) {
  const allIds = [test.base_adset_id, ...test.variant_adset_ids];
  const { toast } = useToast();

  // Fetch metrics for all ad groups
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ["ab-test-metrics", customerId, allIds],
    queryFn: async () => {
      const results: Array<{ id: string; metrics: any }> = [];
      for (const id of allIds) {
        try {
          const response = await getAdGroupMetrics(customerId, id, undefined, "LAST_7_DAYS");
          const rows = (response.results || []).map((r: any) => normalizeMetricsRow(r));
          if (rows.length > 0) {
            results.push({ id, metrics: rows[0] });
          }
        } catch {
          // skip
        }
      }
      return results;
    },
    enabled: allIds.length > 0,
  });

  const variantData = allIds.map((id, idx) => {
    const entry = metricsData?.find((m) => m.id === id);
    const row = entry?.metrics;
    const impressions = row?.impressions || 0;
    const clicks = row?.clicks || 0;
    const spend = row ? microsToUnits(row.costMicros) : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    return { id, impressions, clicks, spend, ctr, cpc, label: idx === 0 ? "Base" : `Var ${String.fromCharCode(64 + idx)}` };
  });

  // Statistical analysis (base vs first variant)
  const base = variantData[0];
  const bestVariant = variantData.length > 1 ? variantData.slice(1).sort((a, b) => b.ctr - a.ctr)[0] : null;

  let analysis: { zScore: number; pValue: number; confidence: number } | null = null;
  if (base && bestVariant && base.impressions > 0 && bestVariant.impressions > 0) {
    analysis = zTestTwoProportions(
      base.clicks,
      base.impressions,
      bestVariant.clicks,
      bestVariant.impressions
    );
  }

  const hasWinner = analysis && analysis.confidence >= 95;
  const winnerId = hasWinner && bestVariant ? (bestVariant.ctr > base.ctr ? bestVariant.id : base.id) : null;

  const handleScaleWinner = async () => {
    if (!winnerId) return;
    const losers = allIds.filter((id) => id !== winnerId);
    const loserResourceNames = losers.map((id) => `customers/${customerId}/adGroups/${id}`);
    try {
      await bulkUpdateStatus(customerId, "adGroups", loserResourceNames, "PAUSED");
      toast({ title: "Variantes perdedoras pausadas" });
      if (analysis) onComplete(winnerId, analysis.confidence);
    } catch {
      toast({ title: "Erro ao escalar vencedor", variant: "destructive" });
    }
  };

  const minN = minSampleSize(0.02, 0.005);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{test.test_name}</CardTitle>
          <div className="flex gap-1">
            {hasWinner && (
              <Button size="sm" variant="default" onClick={handleScaleWinner}>
                <TrendingUp className="mr-1 h-3 w-3" /> Escalar Vencedor
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onStop}>
              <Pause className="mr-1 h-3 w-3" /> Parar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            {/* Variant metrics table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-1.5 font-medium">Variante</th>
                    <th className="text-right py-1.5 font-medium">Impressoes</th>
                    <th className="text-right py-1.5 font-medium">Cliques</th>
                    <th className="text-right py-1.5 font-medium">CTR</th>
                    <th className="text-right py-1.5 font-medium">CPC</th>
                    <th className="text-right py-1.5 font-medium">Gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {variantData.map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">
                        {v.label}
                        {winnerId === v.id && <Trophy className="inline h-3 w-3 text-yellow-500 ml-1" />}
                      </td>
                      <td className="text-right py-1.5">{v.impressions.toLocaleString("pt-BR")}</td>
                      <td className="text-right py-1.5">{v.clicks.toLocaleString("pt-BR")}</td>
                      <td className="text-right py-1.5">{v.ctr.toFixed(2)}%</td>
                      <td className="text-right py-1.5">R$ {v.cpc.toFixed(2)}</td>
                      <td className="text-right py-1.5">R$ {v.spend.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statistical analysis */}
            {analysis && (
              <div className="rounded border p-3 space-y-1 bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confianca Estatistica</span>
                  <Badge variant={analysis.confidence >= 95 ? "default" : analysis.confidence >= 80 ? "secondary" : "outline"}>
                    {analysis.confidence.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Z-Score: {analysis.zScore}</span>
                  <span>P-Value: {analysis.pValue.toFixed(4)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Amostra minima recomendada: {minN.toLocaleString("pt-BR")} impressoes/variante
                </div>
                {analysis.confidence >= 95 && (
                  <p className="text-xs font-medium text-green-600">
                    Resultado estatisticamente significativo! Vencedor identificado.
                  </p>
                )}
                {analysis.confidence < 95 && analysis.confidence >= 80 && (
                  <p className="text-xs text-yellow-600">
                    Tendencia observada, mas ainda sem significancia estatistica. Continue coletando dados.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SampleSizeCalculator() {
  const [baseline, setBaseline] = useState("2");
  const [mde, setMde] = useState("0.5");

  const baselineRate = parseFloat(baseline) / 100 || 0.02;
  const mdeRate = parseFloat(mde) / 100 || 0.005;
  const n = baselineRate > 0 && mdeRate > 0 ? minSampleSize(baselineRate, mdeRate) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Calculadora de Tamanho Amostral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Taxa de conversao baseline (%)</Label>
            <Input type="number" min="0.1" step="0.1" value={baseline} onChange={(e) => setBaseline(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Minimo detectavel (pp)</Label>
            <Input type="number" min="0.1" step="0.1" value={mde} onChange={(e) => setMde(e.target.value)} />
          </div>
        </div>
        {n > 0 && (
          <div className="rounded border p-2 bg-muted/30 text-center">
            <p className="text-sm">Amostra minima por variante:</p>
            <p className="text-lg font-bold">{n.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">80% poder - 95% confianca</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
