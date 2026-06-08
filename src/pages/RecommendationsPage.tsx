import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Check, X, Loader2, TrendingUp, RefreshCw } from "lucide-react";

const RECOMMENDATION_TYPES = [
  { value: "ALL", label: "Todas" },
  { value: "CAMPAIGN_BUDGET", label: "Orcamento de Campanha" },
  { value: "KEYWORD", label: "Palavras-chave" },
  { value: "TEXT_AD", label: "Anuncios de Texto" },
  { value: "TARGET_CPA_OPT_IN", label: "CPA Desejado" },
  { value: "MAXIMIZE_CONVERSIONS_OPT_IN", label: "Maximizar Conversoes" },
  { value: "RESPONSIVE_SEARCH_AD", label: "Anuncio Responsivo" },
  { value: "SITELINK_EXTENSION", label: "Sitelinks" },
  { value: "CALLOUT_EXTENSION", label: "Callouts" },
];

function typeBadge(type: string) {
  const colors: Record<string, string> = {
    CAMPAIGN_BUDGET: "bg-blue-100 text-blue-800",
    KEYWORD: "bg-green-100 text-green-800",
    TEXT_AD: "bg-purple-100 text-purple-800",
    TARGET_CPA_OPT_IN: "bg-orange-100 text-orange-800",
    MAXIMIZE_CONVERSIONS_OPT_IN: "bg-yellow-100 text-yellow-800",
    RESPONSIVE_SEARCH_AD: "bg-indigo-100 text-indigo-800",
    SITELINK_EXTENSION: "bg-pink-100 text-pink-800",
    CALLOUT_EXTENSION: "bg-teal-100 text-teal-800",
  };
  return (
    <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
      {RECOMMENDATION_TYPES.find((t) => t.value === type)?.label || type.replace(/_/g, " ")}
    </Badge>
  );
}

function impactBadge(impact: string) {
  switch (impact) {
    case "HIGH":
      return <Badge variant="default" className="bg-green-600">Alto</Badge>;
    case "MEDIUM":
      return <Badge variant="secondary">Medio</Badge>;
    case "LOW":
      return <Badge variant="outline">Baixo</Badge>;
    default:
      return <Badge variant="outline">{impact || "—"}</Badge>;
  }
}

export default function RecommendationsPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("ALL");

  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ["optimization-score", customerId],
    queryFn: async () => {
      const { getOptimizationScore } = await import("@/lib/google-ads/recommendations");
      return getOptimizationScore(customerId!);
    },
    enabled: !!customerId,
  });

  const { data: recsData, isLoading: recsLoading, refetch, isFetching } = useQuery({
    queryKey: ["recommendations", customerId],
    queryFn: async () => {
      const { listRecommendations } = await import("@/lib/google-ads/recommendations");
      return listRecommendations(customerId!);
    },
    enabled: !!customerId,
  });

  const applyMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { applyRecommendation } = await import("@/lib/google-ads/recommendations");
      return applyRecommendation(customerId!, recommendationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["optimization-score"] });
      toast({ title: "Recomendacao aplicada com sucesso" });
    },
    onError: (err: Error) => toast({ title: "Erro ao aplicar", description: err.message, variant: "destructive" }),
  });

  const dismissMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { dismissRecommendation } = await import("@/lib/google-ads/recommendations");
      return dismissRecommendation(customerId!, recommendationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast({ title: "Recomendacao descartada" });
    },
    onError: (err: Error) => toast({ title: "Erro ao descartar", description: err.message, variant: "destructive" }),
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Recomendacoes</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const scoreResults = (scoreData as any)?.results || [];
  const scoreRow = scoreResults[0]?.customer || scoreResults[0];
  const score = scoreRow?.optimizationScore != null ? Math.round(scoreRow.optimizationScore * 100) : null;

  const rawRecs = (recsData as any)?.results || [];
  const recommendations = rawRecs.map((r: any) => {
    const rec = r.recommendation || r;
    return {
      resourceName: rec.resourceName,
      type: rec.type || "UNKNOWN",
      impact: rec.impact?.baseMetrics ? "HIGH" : rec.impact ? "MEDIUM" : "LOW",
      campaignId: rec.campaignBudget || rec.campaign,
      description: rec.type?.replace(/_/g, " ") || "",
    };
  });
  const filtered = typeFilter === "ALL" ? recommendations : recommendations.filter((r: any) => r.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recomendacoes</h1>
          <p className="text-muted-foreground">Otimize sua conta com as sugestoes do Google Ads</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Optimization Score */}
      <Card>
        <CardContent className="pt-6">
          {scoreLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={score !== null && score >= 80 ? "#22c55e" : score !== null && score >= 50 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(score || 0) * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{score !== null ? `${Math.round(score)}%` : "—"}</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">Indice de Otimizacao</span>
              </div>
              <div className="flex-1 space-y-2">
                <Progress value={score || 0} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {score !== null && score >= 80
                    ? "Sua conta esta bem otimizada! Continue assim."
                    : score !== null && score >= 50
                    ? "Ha oportunidades de melhoria. Revise as recomendacoes abaixo."
                    : "Sua conta precisa de atencao. Aplique as recomendacoes para melhorar."}
                </p>
                <p className="text-sm font-medium">
                  {recommendations.length} {recommendations.length === 1 ? "recomendacao disponivel" : "recomendacoes disponiveis"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Filtrar por tipo:</span>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RECOMMENDATION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations List */}
      {recsLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((rec: any) => (
            <Card key={rec.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {typeBadge(rec.type)}
                        {impactBadge(rec.impact)}
                      </div>
                      <p className="text-sm font-medium">{rec.description || rec.type.replace(/_/g, " ")}</p>
                      {rec.estimatedImpact && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span>{rec.estimatedImpact}</span>
                        </div>
                      )}
                      {rec.campaignName && (
                        <p className="text-xs text-muted-foreground">Campanha: {rec.campaignName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dismissMutation.mutate(rec.id)}
                      disabled={dismissMutation.isPending}
                    >
                      {dismissMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => applyMutation.mutate(rec.id)}
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                      Aplicar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma recomendacao disponivel no momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
