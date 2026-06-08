import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAds } from "@/hooks/useAds";
import { useEntityInsights } from "@/hooks/useEntityInsights";
import { useUpdateAdStatus } from "@/hooks/useAdMutations";
import { useRemoveResource } from "@/hooks/useCampaignMutations";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { BulkActionBar } from "@/components/BulkActionBar";
import { ExportButton } from "@/components/ExportButton";
import { MoreHorizontal, Plus, Play, Pause, Pencil, Trash2, Search } from "lucide-react";
import { formatMicros, formatNumber, formatPercent } from "@/lib/formatters";
import { computeRoas, normalizeMetricsRow, type MetricsRow, type AdGroupAdStatus } from "@/lib/google-ads/types";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { CrudConfirmDialog } from "@/components/CrudConfirmDialog";

const EXPORT_COLUMNS = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "costMicros", label: "Custo" },
  { key: "impressions", label: "Impressões" },
  { key: "clicks", label: "Cliques" },
  { key: "ctr", label: "CTR" },
  { key: "conversions", label: "Conversões" },
  { key: "adStrength", label: "Ad Strength" },
];

type StatusFilter = "ALL" | "ENABLED" | "PAUSED" | "REMOVED";
const STATUS_OPTIONS: StatusFilter[] = ["ALL", "ENABLED", "PAUSED", "REMOVED"];

export default function AdsPage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const isConnected = !!customerId;
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    type: "pause" | "activate" | "archive";
    id: string; name: string; resourceName: string; spend?: string;
  } | null>(null);

  const updateAdStatus = useUpdateAdStatus();
  const removeResource = useRemoveResource();
  const { selectedIds, isSelected, toggleOne, toggleAll, clearSelection } = useBulkSelection();

  const statusParam = filter === "ALL" ? undefined : filter as AdGroupAdStatus;
  const { data: adsData, isLoading } = useAds(customerId ?? undefined, {
    status: statusParam,
  });

  const { data: insightsData } = useEntityInsights(
    customerId ?? undefined,
    undefined,
    "ad",
    { dateRange: "LAST_30_DAYS" }
  );

  const insightsMap = useMemo(() => {
    const map = new Map<string, MetricsRow>();
    (insightsData?.results || []).forEach((raw: any) => {
      const row = normalizeMetricsRow(raw);
      if (row.adId) map.set(row.adId, row);
    });
    return map;
  }, [insightsData]);

  const ads = useMemo(() => {
    const raw = adsData || [];
    return raw.filter((a: any) => {
      const adName = a.ad?.name || a.ad?.finalUrls?.[0] || "";
      return !search || adName.toLowerCase().includes(search.toLowerCase());
    });
  }, [adsData, search]);

  const insightPrompt = useMemo(() => {
    if (ads.length === 0) return null;

    const ativos = ads.filter((a: any) => a.status === "ENABLED").length;

    const adsSummary = ads.slice(0, 12).map((a: any) => {
      const adId = a.ad?.id;
      const ins = adId ? insightsMap.get(adId) : undefined;
      const roas = ins ? computeRoas(ins) : 0;
      const conv = ins?.conversions || 0;
      const ctr = ins ? ins.ctr * 100 : 0;
      const adStrength = a.ad?.adStrength || "desconhecido";
      const headlineCount = a.ad?.responsiveSearchAd?.headlines?.length || 0;

      const sinalCriativo = !ins ? "sem dados"
        : ctr < 0.5 ? "baixo engajamento"
        : ctr > 2 ? "criativo forte"
        : roas >= 2 ? "convertendo bem"
        : "performance mediana";

      return `[${a.status === "ENABLED" ? "ativo" : "pausado"}] ${a.ad?.name || "RSA"} | strength: ${adStrength} | ${headlineCount} headlines → ${sinalCriativo}${conv > 0 ? `, ${conv} conv` : ""}`;
    });

    return `Conta com ${ads.length} anúncios (${ativos} ativos). Dados dos últimos 30 dias.

ANÚNCIOS:
${adsSummary.join("\n")}

Interprete a saúde do mix de anúncios RSA e escreva 3 insights sobre o que precisa de atenção.`;
  }, [ads, insightsMap]);

  const handleFilterChange = (s: StatusFilter) => { setFilter(s); clearSelection(); };

  const handleCrudConfirm = () => {
    if (!pendingAction || !customerId) return;
    if (pendingAction.type === "pause") {
      updateAdStatus.mutate({ customerId, resourceName: pendingAction.resourceName, status: "PAUSED" });
    } else if (pendingAction.type === "activate") {
      updateAdStatus.mutate({ customerId, resourceName: pendingAction.resourceName, status: "ENABLED" });
    } else if (pendingAction.type === "archive") {
      removeResource.mutate({ customerId, resource: "adGroupAds", resourceName: pendingAction.resourceName });
    }
    setPendingAction(null);
  };

  const openAction = (type: "pause" | "activate" | "archive", a: any) => {
    const adId = a.ad?.id;
    const ins = adId ? insightsMap.get(adId) : undefined;
    const spend = ins ? formatMicros(ins.costMicros) : undefined;
    setPendingAction({
      type,
      id: adId || a.resourceName,
      name: a.ad?.name || a.ad?.finalUrls?.[0] || "Anúncio",
      resourceName: a.resourceName,
      spend,
    });
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anúncios</h1>
          <p className="text-muted-foreground">Gerencie seus anúncios</p>
        </div>
        <ConnectionBanner />
      </div>
    );
  }

  const allIds = ads.map((a: any) => a.ad?.id || a.resourceName);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Anúncios</h1>
          <p className="page-subtitle">Gerencie seus anúncios</p>
        </div>
        <div className="flex gap-2 items-center">
          <ExportButton data={ads} columns={EXPORT_COLUMNS} filename="anuncios" />
          <Button asChild><Link to="/ads/new"><Plus className="mr-2 h-4 w-4" />Novo Anúncio</Link></Button>
        </div>
      </div>

      <AIInsightsPanel prompt={insightPrompt} context="Anúncios" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => handleFilterChange(s)}>
              {s === "ALL" ? "Todos" : s === "ENABLED" ? "Ativos" : s === "PAUSED" ? "Pausados" : "Removidos"}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : ads.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allIds.length > 0 && allIds.every((id: string) => isSelected(id))}
                          onCheckedChange={() => toggleAll(allIds)}
                        />
                      </TableHead>
                      <TableHead>Nome / URL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ad Strength</TableHead>
                      <TableHead>Headlines</TableHead>
                      <TableHead>Aprovação</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Cliques</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Conv.</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((a: any) => {
                      const adId = a.ad?.id;
                      const ins = adId ? insightsMap.get(adId) : undefined;
                      const headlineCount = a.ad?.responsiveSearchAd?.headlines?.length || 0;
                      const descCount = a.ad?.responsiveSearchAd?.descriptions?.length || 0;
                      const approvalStatus = a.ad?.policySummary?.approvalStatus || a.policySummary?.approvalStatus;
                      return (
                        <TableRow key={adId || a.resourceName} className="cursor-pointer" onClick={() => adId && navigate(`/ads/${adId}`)}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected(adId || a.resourceName)} onCheckedChange={() => toggleOne(adId || a.resourceName)} />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <div>{a.ad?.name || "RSA"}</div>
                              {a.ad?.finalUrls?.[0] && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{a.ad.finalUrls[0]}</div>}
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                          <TableCell>{a.ad?.adStrength ? <AdStrengthBadge strength={a.ad.adStrength} /> : "--"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{headlineCount}h / {descCount}d</TableCell>
                          <TableCell>{approvalStatus ? <ApprovalBadge status={approvalStatus} /> : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins ? formatMicros(ins.costMicros) : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins ? formatNumber(ins.clicks) : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins ? formatPercent(ins.ctr * 100) : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins && ins.conversions > 0 ? formatNumber(ins.conversions) : "--"}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {a.status === "ENABLED" ? (
                                  <DropdownMenuItem onClick={() => openAction("pause", a)}><Pause className="mr-2 h-4 w-4" />Pausar anúncio</DropdownMenuItem>
                                ) : a.status === "PAUSED" ? (
                                  <DropdownMenuItem onClick={() => openAction("activate", a)}><Play className="mr-2 h-4 w-4" />Ativar anúncio</DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => adId && navigate(`/ads/${adId}/edit`)}><Pencil className="mr-2 h-4 w-4" />Editar anúncio</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => openAction("archive", a)}><Trash2 className="mr-2 h-4 w-4" />Remover</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum anúncio encontrado.</p>
          )}
        </CardContent>
      </Card>

      <BulkActionBar selectedIds={selectedIds} onClear={clearSelection} />

      <CrudConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => { if (!o) setPendingAction(null); }}
        action={pendingAction?.type ?? "pause"}
        entityType="anúncio"
        entityName={pendingAction?.name ?? ""}
        spend={pendingAction?.spend}
        onConfirm={handleCrudConfirm}
      />
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

function ApprovalBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED": return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Aprovado</Badge>;
    case "APPROVED_LIMITED": return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Aprovado (limitado)</Badge>;
    case "DISAPPROVED": return <Badge variant="destructive">Reprovado</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}
