import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdGroups } from "@/hooks/useAdGroups";
import { useEntityInsights } from "@/hooks/useEntityInsights";
import { useUpdateAdGroup } from "@/hooks/useAdGroupMutations";
import { useRemoveResource } from "@/hooks/useCampaignMutations";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { CrudConfirmDialog } from "@/components/CrudConfirmDialog";
import { BulkActionBar } from "@/components/BulkActionBar";
import { ExportButton } from "@/components/ExportButton";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { MoreHorizontal, Plus, Play, Pause, Pencil, Trash2, Copy } from "lucide-react";
import { formatMicros, formatNumber, formatPercent, formatCurrency } from "@/lib/formatters";
import { computeRoas, computeCpa, microsToUnits, normalizeMetricsRow, type MetricsRow, type AdGroupAdStatus } from "@/lib/google-ads/types";

const EXPORT_COLUMNS = [
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "type", label: "Tipo" },
  { key: "costMicros", label: "Custo" },
  { key: "roas", label: "ROAS" },
  { key: "conversions", label: "Conversões" },
];

type StatusFilter = "ALL" | "ENABLED" | "PAUSED" | "REMOVED";
const STATUS_OPTIONS: StatusFilter[] = ["ALL", "ENABLED", "PAUSED", "REMOVED"];

export default function AdSetsPage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const isConnected = !!customerId;
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [pendingAction, setPendingAction] = useState<{
    type: "pause" | "activate" | "archive";
    id: string; name: string; resourceName: string; spend?: string;
  } | null>(null);

  const updateAdGroup = useUpdateAdGroup();
  const removeResource = useRemoveResource();
  const { selectedIds, isSelected, toggleOne, toggleAll, clearSelection } = useBulkSelection();

  const statusParam = filter === "ALL" ? undefined : filter as AdGroupAdStatus;
  const { data: adGroupsData, isLoading } = useAdGroups(customerId ?? undefined, {
    status: statusParam,
  });

  const { data: insightsData } = useEntityInsights(
    customerId ?? undefined,
    undefined,
    "ad_group",
    { dateRange: "LAST_30_DAYS" }
  );

  const insightsMap = useMemo(() => {
    const map = new Map<string, MetricsRow>();
    (insightsData?.results || []).forEach((raw: any) => {
      const row = normalizeMetricsRow(raw);
      if (row.adGroupId) map.set(row.adGroupId, row);
    });
    return map;
  }, [insightsData]);

  const insightPrompt = useMemo(() => {
    const adGroups = adGroupsData || [];
    if (!adGroups.length) return null;
    const lines = adGroups.slice(0, 20).map((a: any) => {
      const ins = insightsMap.get(a.id);
      const roas = ins ? computeRoas(ins).toFixed(2) + "x" : "sem ROAS";
      const spend = ins ? formatMicros(ins.costMicros) : "sem gasto";
      const tipo = a.type || "?";
      const cpcBid = a.cpcBidMicros ? formatMicros(a.cpcBidMicros) : "auto";
      return `- [${a.status}] ${a.name} | tipo: ${tipo} | bid CPC: ${cpcBid} | gasto: ${spend} | ROAS: ${roas}`;
    });
    const ativos = adGroups.filter((a: any) => a.status === "ENABLED").length;
    return `Conta Google Ads — visão de grupos de anúncios (últimos 30 dias).
${ativos} de ${adGroups.length} grupos ativos.
Detalhes por grupo:
${lines.join("\n")}
Analise o mix de tipos de grupos, eficiência de lances e oportunidades de otimização.`;
  }, [adGroupsData, insightsMap]);

  const handleFilterChange = (s: StatusFilter) => { setFilter(s); clearSelection(); };

  const handleCrudConfirm = () => {
    if (!pendingAction || !customerId) return;
    if (pendingAction.type === "pause") {
      updateAdGroup.mutate({ customerId, resourceName: pendingAction.resourceName, data: { status: "PAUSED" } });
    } else if (pendingAction.type === "activate") {
      updateAdGroup.mutate({ customerId, resourceName: pendingAction.resourceName, data: { status: "ENABLED" } });
    } else if (pendingAction.type === "archive") {
      removeResource.mutate({ customerId, resource: "adGroups", resourceName: pendingAction.resourceName });
    }
    setPendingAction(null);
  };

  const openAction = (type: "pause" | "activate" | "archive", a: { id: string; name: string; resourceName: string }) => {
    const ins = insightsMap.get(a.id);
    const spend = ins ? formatMicros(ins.costMicros) : undefined;
    setPendingAction({ type, id: a.id, name: a.name, resourceName: a.resourceName, spend });
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grupos de Anúncios</h1>
          <p className="text-muted-foreground">Gerencie seus grupos de anúncios</p>
        </div>
        <ConnectionBanner />
      </div>
    );
  }

  const adGroups = adGroupsData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grupos de Anúncios</h1>
          <p className="text-muted-foreground">Gerencie seus grupos de anúncios</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={adGroups} columns={EXPORT_COLUMNS} filename="grupos-anuncios" />
          <Button asChild><Link to="/adsets/new"><Plus className="mr-2 h-4 w-4" />Novo Grupo</Link></Button>
        </div>
      </div>
      <AIInsightsPanel prompt={insightPrompt} context="Grupos de Anúncios" />

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => handleFilterChange(s)}>
            {s === "ALL" ? "Todos" : s === "ENABLED" ? "Ativos" : s === "PAUSED" ? "Pausados" : "Removidos"}
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : adGroups.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={adGroups.length > 0 && adGroups.every((a: any) => isSelected(a.id))}
                          onCheckedChange={() => toggleAll(adGroups.map((a: any) => a.id))}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>CPC Bid</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Impressões</TableHead>
                      <TableHead className="text-right">Cliques</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                      <TableHead className="text-right">Conv.</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adGroups.map((a: any) => {
                      const ins = insightsMap.get(a.id);
                      return (
                        <TableRow key={a.id} className="cursor-pointer" onClick={() => navigate(`/adsets/${a.id}`)}>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected(a.id)} onCheckedChange={() => toggleOne(a.id)} />
                          </TableCell>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{a.type?.replace(/_/g, " ") || "--"}</TableCell>
                          <TableCell className="text-sm">{a.cpcBidMicros ? formatMicros(a.cpcBidMicros) : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins ? formatMicros(ins.costMicros) : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins ? formatNumber(ins.impressions) : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins ? formatNumber(ins.clicks) : "--"}</TableCell>
                          <TableCell className="text-right text-sm">{ins ? formatPercent(ins.ctr * 100) : "--"}</TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {ins ? (() => { const r = computeRoas(ins); return r > 0 ? <span className={r >= 2 ? "text-green-600" : r >= 1 ? "text-foreground" : "text-red-600"}>{r.toFixed(2)}x</span> : "--"; })() : "--"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {ins && ins.conversions > 0 ? formatNumber(ins.conversions) : "--"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {a.status === "ENABLED" ? (
                                  <DropdownMenuItem onClick={() => openAction("pause", a)}><Pause className="mr-2 h-4 w-4" />Pausar grupo</DropdownMenuItem>
                                ) : a.status === "PAUSED" ? (
                                  <DropdownMenuItem onClick={() => openAction("activate", a)}><Play className="mr-2 h-4 w-4" />Ativar grupo</DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => navigate(`/adsets/${a.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Editar configurações</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/adsets/new?duplicate=${a.id}`)}><Copy className="mr-2 h-4 w-4" />Duplicar grupo</DropdownMenuItem>
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
            <p className="text-center text-muted-foreground py-8">Nenhum grupo de anúncios encontrado.</p>
          )}
        </CardContent>
      </Card>

      <BulkActionBar selectedIds={selectedIds} onClear={clearSelection} />

      <CrudConfirmDialog
        open={!!pendingAction}
        onOpenChange={(o) => { if (!o) setPendingAction(null); }}
        action={pendingAction?.type ?? "pause"}
        entityType={"conjunto de anúncios" as any}
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
