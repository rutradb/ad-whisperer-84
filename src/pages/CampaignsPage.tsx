import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useEntityInsights } from "@/hooks/useEntityInsights";
import { useUpdateCampaign, useRemoveResource } from "@/hooks/useCampaignMutations";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { BulkActionBar } from "@/components/BulkActionBar";
import { ExportButton } from "@/components/ExportButton";
import { MoreHorizontal, Plus, Play, Pause, Pencil, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { formatMicros, formatNumber, formatPercent, formatCurrency } from "@/lib/formatters";
import { computeRoas, computeCpa, microsToUnits, normalizeMetricsRow, type MetricsRow, type CampaignStatus } from "@/lib/google-ads/types";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { CrudConfirmDialog } from "@/components/CrudConfirmDialog";

type StatusFilter = "ALL" | "ENABLED" | "PAUSED" | "REMOVED";
const STATUS_OPTIONS: StatusFilter[] = ["ALL", "ENABLED", "PAUSED", "REMOVED"];

type SortKey = "name" | "costMicros" | "roas" | "cpa" | "conversions";
type SortDir = "asc" | "desc";

const EXPORT_COLUMNS = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "advertisingChannelType", label: "Canal" },
  { key: "costMicros", label: "Custo" },
  { key: "roas", label: "ROAS" },
  { key: "cpa", label: "CPA" },
  { key: "conversions", label: "Conversões" },
];

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const isConnected = !!customerId;
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [pendingAction, setPendingAction] = useState<{
    type: "pause" | "activate" | "archive";
    id: string; name: string; resourceName: string; spend?: string;
  } | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("costMicros");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const updateMutation = useUpdateCampaign();
  const removeMutation = useRemoveResource();
  const { selectedIds, isSelected, toggleOne, toggleAll, clearSelection } = useBulkSelection();

  const statusParam = filter === "ALL" ? undefined : filter as CampaignStatus;
  const { data: campaignsData, isLoading } = useCampaigns(customerId ?? undefined, {
    status: statusParam,
  });

  // Campaign-level metrics for the list
  const { data: insightsData } = useEntityInsights(
    customerId ?? undefined,
    undefined,
    "campaign",
    { dateRange: "LAST_30_DAYS" }
  );

  const insightsMap = useMemo(() => {
    const map = new Map<string, MetricsRow>();
    (insightsData?.results || []).forEach((raw: any) => {
      const row = normalizeMetricsRow(raw);
      if (row.campaignId) map.set(row.campaignId, row);
    });
    return map;
  }, [insightsData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleFilterChange = (s: StatusFilter) => { setFilter(s); clearSelection(); };

  const handleCrudConfirm = () => {
    if (!pendingAction || !customerId) return;
    if (pendingAction.type === "pause") {
      updateMutation.mutate({ customerId, resourceName: pendingAction.resourceName, data: { status: "PAUSED" } });
    } else if (pendingAction.type === "activate") {
      updateMutation.mutate({ customerId, resourceName: pendingAction.resourceName, data: { status: "ENABLED" } });
    } else if (pendingAction.type === "archive") {
      removeMutation.mutate({ customerId, resource: "campaigns", resourceName: pendingAction.resourceName });
    }
    setPendingAction(null);
  };

  const openAction = (type: "pause" | "activate" | "archive", c: { id: string; name: string; resourceName: string }) => {
    const ins = insightsMap.get(c.id);
    const spend = ins ? formatMicros(ins.costMicros) : undefined;
    setPendingAction({ type, id: c.id, name: c.name, resourceName: c.resourceName, spend });
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold tracking-tight">Campanhas</h1><p className="text-muted-foreground">Gerencie suas campanhas de anúncios</p></div>
        <ConnectionBanner />
      </div>
    );
  }

  const allCampaigns = campaignsData || [];

  const campaigns = useMemo(() => {
    const list = [...allCampaigns];
    list.sort((a: any, b: any) => {
      const insA = insightsMap.get(a.id);
      const insB = insightsMap.get(b.id);
      let valA = 0, valB = 0;
      if (sortKey === "name") {
        return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortKey === "costMicros") { valA = insA?.costMicros || 0; valB = insB?.costMicros || 0; }
      else if (sortKey === "roas") { valA = insA ? computeRoas(insA) : 0; valB = insB ? computeRoas(insB) : 0; }
      else if (sortKey === "cpa") { valA = insA ? computeCpa(insA) : 0; valB = insB ? computeCpa(insB) : 0; }
      else if (sortKey === "conversions") { valA = insA?.conversions || 0; valB = insB?.conversions || 0; }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return list;
  }, [allCampaigns, insightsMap, sortKey, sortDir]);

  const allIds = campaigns.map((c: any) => c.id);

  const insightPrompt = useMemo(() => {
    if (campaigns.length === 0) return null;

    const ativos = campaigns.filter((c: any) => c.status === "ENABLED").length;
    const pausados = campaigns.filter((c: any) => c.status === "PAUSED").length;

    const withData = campaigns.slice(0, 10).map((c: any) => {
      const ins = insightsMap.get(c.id);
      const roas = ins ? computeRoas(ins) : 0;
      const cpa = ins ? computeCpa(ins) : 0;
      const conv = ins?.conversions || 0;
      const spend = ins ? microsToUnits(ins.costMicros) : 0;

      return {
        campanha: c.name,
        canal: c.advertisingChannelType || "desconhecido",
        status: c.status === "ENABLED" ? "ativa" : c.status === "PAUSED" ? "pausada" : c.status,
        performance: roas >= 2 ? "winner (ROAS positivo)" : roas >= 1 ? "neutro (cobrindo custo)" : spend > 0 ? "bleeder (sem retorno)" : "sem dados de performance",
        cpa: cpa > 0 ? `CPA R$${cpa.toFixed(0)}` : "sem conversões",
        conversoes: conv > 0 ? `${conv} conversões` : "nenhuma",
      };
    });

    return `Conta Google Ads com ${campaigns.length} campanhas: ${ativos} ativas, ${pausados} pausadas. Dados dos últimos 30 dias.

CAMPANHAS:
${withData.map(c => `- [${c.status}] ${c.campanha} / ${c.canal} → ${c.performance} | ${c.cpa} | ${c.conversoes}`).join("\n")}

Interprete o portfólio de campanhas desta conta e escreva 3 insights para o gestor decidir onde agir agora.`;
  }, [campaigns, insightsMap]);

  const exportData = campaigns.map((c: any) => {
    const ins = insightsMap.get(c.id);
    return {
      ...c,
      costMicros: ins ? formatMicros(ins.costMicros) : "",
      roas: ins ? computeRoas(ins).toFixed(2) : "",
      cpa: ins ? computeCpa(ins).toFixed(2) : "",
      conversions: ins ? String(ins.conversions) : "",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Campanhas</h1>
          <p className="page-subtitle">Gerencie suas campanhas de anúncios</p>
        </div>
        <div className="flex gap-2 items-center">
          <ExportButton data={exportData} columns={EXPORT_COLUMNS} filename="campanhas" />
          <Button onClick={() => navigate("/campaigns/new")}><Plus className="mr-2 h-4 w-4" /> Nova Campanha</Button>
        </div>
      </div>

      <AIInsightsPanel prompt={insightPrompt} context="Campanhas" />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => handleFilterChange(s)}>
            {s === "ALL" ? "Todas" : s === "ENABLED" ? "Ativas" : s === "PAUSED" ? "Pausadas" : "Removidas"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : campaigns.length > 0 ? (
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
                    <SortableHead label="Nome" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <TableHead>Status</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Estratégia</TableHead>
                    <SortableHead label="Custo" sortKey="costMicros" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                    <SortableHead label="ROAS" sortKey="roas" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                    <SortableHead label="CPA" sortKey="cpa" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                    <SortableHead label="Conv." sortKey="conversions" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c: any) => {
                    const ins = insightsMap.get(c.id);
                    const roas = ins ? computeRoas(ins) : 0;
                    const cpa = ins ? computeCpa(ins) : 0;
                    const conv = ins?.conversions || 0;
                    return (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell><ChannelBadge channel={c.advertisingChannelType} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{c.biddingStrategyType?.replace(/_/g, " ") || "--"}</TableCell>
                      <TableCell className="text-right text-sm">{ins ? formatMicros(ins.costMicros) : "--"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {roas > 0 ? <span className={`font-mono tabular-nums ${roas >= 2 ? "text-success" : roas >= 1 ? "text-foreground" : "text-destructive"}`}>{roas.toFixed(2)}x</span> : "--"}
                      </TableCell>
                      <TableCell className="text-right text-sm">{cpa > 0 ? formatCurrency(cpa) : "--"}</TableCell>
                      <TableCell className="text-right text-sm">{conv > 0 ? formatNumber(conv) : "--"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {c.status === "PAUSED" && (
                              <DropdownMenuItem onClick={() => openAction("activate", c)}>
                                <Play className="mr-2 h-4 w-4" /> Ativar campanha
                              </DropdownMenuItem>
                            )}
                            {c.status === "ENABLED" && (
                              <DropdownMenuItem onClick={() => openAction("pause", c)}>
                                <Pause className="mr-2 h-4 w-4" /> Pausar campanha
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => navigate(`/campaigns/${c.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar configurações
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/campaigns/new?duplicate=${c.id}`)}>
                              <Copy className="mr-2 h-4 w-4" /> Duplicar campanha
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => openAction("archive", c)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Remover
                            </DropdownMenuItem>
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
            <p className="text-center text-muted-foreground py-8">Nenhuma campanha encontrada.</p>
          )}
        </CardContent>
      </Card>

      <BulkActionBar selectedIds={selectedIds} onClear={clearSelection} />

      <CrudConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => { if (!o) setPendingAction(null); }}
        action={pendingAction?.type ?? "pause"}
        entityType="campanha"
        entityName={pendingAction?.name ?? ""}
        spend={pendingAction?.spend}
        onConfirm={handleCrudConfirm}
      />
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
  if (!channel) return <span className="text-muted-foreground">--</span>;
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

function SortableHead({ label, sortKey: sk, currentKey, dir, onSort, className = "" }: {
  label: string; sortKey: SortKey; currentKey: SortKey; dir: SortDir; onSort: (k: SortKey) => void; className?: string;
}) {
  const active = sk === currentKey;
  return (
    <TableHead className={`cursor-pointer select-none ${className}`} onClick={() => onSort(sk)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </span>
    </TableHead>
  );
}
