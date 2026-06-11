import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useActionPlans, useActionOutcomes,
  type ActionItem, type ActionPlan, type PlanStatus, type ActionOutcome,
} from "@/hooks/useActionPlans";
import {
  useApprovePlan, useRejectPlan, useApproveManyPlans, useUpdateItemBudget,
  useExecutePlan, useRollbackPlan, useVerifyPlan,
} from "@/hooks/useActionPlanMutations";
import { getAutonomyConfig, setAutonomyConfig, type RiskTier } from "@/lib/agent/autonomy";
import {
  ListChecks, RefreshCw, Clock, ArrowRight, Pause, Play, Wallet, Info, AlertTriangle,
  Check, Loader2, CheckCircle2, XCircle, Rocket, Undo2, ShieldCheck,
  TrendingUp, TrendingDown, Minus, Bot,
} from "lucide-react";

function brl(v: number | undefined | null): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const RISK_LABEL: Record<string, string> = { low: "Baixo", medium: "Médio", high: "Alto" };
const RISK_VARIANT: Record<string, "secondary" | "default" | "destructive"> = {
  low: "secondary", medium: "default", high: "destructive",
};
const STATUS_LABEL: Record<string, string> = {
  proposed: "Pendente", authorized: "Autorizado", rejected: "Rejeitado",
  executing: "Executando", executed: "Executado", verified: "Verificado",
  rolled_back: "Revertido", failed: "Falhou",
};

function ItemStatus({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto shrink-0" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-destructive ml-auto shrink-0" />;
  return null;
}

function OutcomeBanner({ outcome }: { outcome: ActionOutcome }) {
  const verdictCfg: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    improved: { icon: <TrendingUp className="h-4 w-4" />, label: "Melhorou", cls: "text-emerald-600 border-emerald-500/40 bg-emerald-500/5" },
    worsened: { icon: <TrendingDown className="h-4 w-4" />, label: "Piorou", cls: "text-destructive border-destructive/40 bg-destructive/5" },
    neutral: { icon: <Minus className="h-4 w-4" />, label: "Neutro", cls: "text-muted-foreground border-border bg-muted/30" },
  };
  const cfg = verdictCfg[outcome.verdict ?? "neutral"];
  const before = outcome.metric_before ?? {};
  const after = outcome.metric_after ?? {};
  const fmt = (v: number | undefined) => (v == null ? "—" : Number(v).toFixed(2));

  return (
    <div className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${cfg.cls}`}>
      {cfg.icon}
      <span className="font-medium">{cfg.label}</span>
      <span className="opacity-80">
        · ROAS {fmt(before.roas)} → {fmt(after.roas)} · CPA {fmt(before.cpa)} → {fmt(after.cpa)}
        {outcome.window_days ? ` · janela ${outcome.window_days}d` : ""}
      </span>
    </div>
  );
}

function ItemRow({
  item, editable, draft, onDraftChange,
}: {
  item: ActionItem;
  editable: boolean;
  draft?: string;
  onDraftChange?: (v: string) => void;
}) {
  const tool = item.tool_name;
  let icon: React.ReactNode = <Info className="h-4 w-4 text-muted-foreground shrink-0" />;
  let body: React.ReactNode = tool;

  if (tool === "update_campaign_budget") {
    icon = <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />;
    body = (
      <span className="flex items-center gap-1.5 flex-wrap">
        Budget da campanha <span className="font-mono text-xs">{item.entity_id}</span>:
        <span className="font-medium">{brl(item.before_state?.daily_budget)}</span>
        <ArrowRight className="h-3.5 w-3.5" />
        {editable ? (
          <span className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">R$</span>
            <Input type="number" className="h-7 w-24" value={draft ?? ""} onChange={(e) => onDraftChange?.(e.target.value)} />
          </span>
        ) : (
          <span className="font-medium">{brl(item.after_state?.daily_budget)}</span>
        )}
      </span>
    );
  } else {
    const map: Record<string, { icon: React.ReactNode; text: string }> = {
      pause_campaigns: { icon: <Pause className="h-4 w-4 text-muted-foreground shrink-0" />, text: "Pausar campanha" },
      activate_campaigns: { icon: <Play className="h-4 w-4 text-muted-foreground shrink-0" />, text: "Ativar campanha" },
      pause_ads: { icon: <Pause className="h-4 w-4 text-muted-foreground shrink-0" />, text: "Pausar anúncio" },
    };
    const cfg = map[tool];
    if (cfg) {
      icon = cfg.icon;
      body = <>{cfg.text} <span className="font-mono text-xs">{item.entity_id}</span></>;
    }
  }

  return (
    <div className="flex items-center gap-2.5 py-2 text-sm border-b last:border-0">
      {icon}
      <div className="flex-1 min-w-0">{body}</div>
      <ItemStatus status={item.execution_status} />
    </div>
  );
}

function PlanCard({ plan, outcome }: { plan: ActionPlan; outcome?: ActionOutcome }) {
  const { toast } = useToast();
  const approve = useApprovePlan();
  const reject = useRejectPlan();
  const execute = useExecutePlan();
  const rollback = useRollbackPlan();
  const verify = useVerifyPlan();
  const updateBudget = useUpdateItemBudget();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [riskAck, setRiskAck] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const isProposed = plan.status === "proposed";
  const isHigh = plan.risk_tier === "high";
  const canExecute = plan.status === "authorized" || plan.status === "failed";
  const isExecuting = plan.status === "executing" || execute.isPending;
  const isExecuted = plan.status === "executed" || plan.status === "verified";
  const canRollback = (isExecuted || plan.status === "failed") && plan.items.some((i) => i.execution_status === "success");
  const hasItemErrors = plan.items.some((i) => i.execution_status === "error");

  const budgetItems = plan.items.filter((i) => i.tool_name === "update_campaign_budget");
  const hasDrafts = Object.values(drafts).some((v) => v !== "");

  const execToast = (res: { executed: number; failed: number }) =>
    toast({
      title: res.failed ? "Execução com falhas" : "Execução concluída",
      description: `${res.executed} ação(ões) aplicada(s)${res.failed ? `, ${res.failed} com falha` : ""}.`,
      variant: res.failed ? "destructive" : undefined,
    });

  const handleSaveBudgets = async () => {
    const edits = budgetItems.filter((i) => drafts[i.id] != null && drafts[i.id] !== "");
    for (const it of edits) {
      const val = parseFloat(drafts[it.id]);
      if (!Number.isFinite(val) || val <= 0) {
        toast({ title: "Valor inválido", description: "Informe um budget maior que zero.", variant: "destructive" });
        return;
      }
      await updateBudget.mutateAsync({ itemId: it.id, dailyBudget: val });
    }
    setDrafts({});
    toast({ title: "Budget atualizado", description: "Os valores da proposta foram ajustados." });
  };

  const handleApprove = () => {
    approve.mutate(plan.id, {
      onSuccess: () => {
        setApproveOpen(false);
        setRiskAck(false);
        toast({ title: "Plano aprovado", description: "Aplicando as ações no Google Ads…" });
        execute.mutate(plan.id, {
          onSuccess: execToast,
          onError: (e: any) => toast({ title: "Aprovado, mas a execução falhou", description: e.message, variant: "destructive" }),
        });
      },
      onError: (e: any) => toast({ title: "Erro ao aprovar", description: e.message, variant: "destructive" }),
    });
  };

  const handleExecute = () => {
    execute.mutate(plan.id, {
      onSuccess: execToast,
      onError: (e: any) => toast({ title: "Erro na execução", description: e.message, variant: "destructive" }),
    });
  };

  const handleReject = () => {
    reject.mutate(plan.id, {
      onSuccess: () => { toast({ title: "Plano rejeitado" }); setRejectOpen(false); },
      onError: (e: any) => toast({ title: "Erro ao rejeitar", description: e.message, variant: "destructive" }),
    });
  };

  const handleVerify = () => {
    verify.mutate({ planId: plan.id, windowDays: 7 }, {
      onSuccess: (r) => toast({
        title: "Verificação concluída",
        description: `Veredito: ${r.verdict === "improved" ? "melhorou" : r.verdict === "worsened" ? "piorou" : "neutro"}.`,
      }),
      onError: (e: any) => toast({ title: "Erro ao verificar", description: e.message, variant: "destructive" }),
    });
  };

  const handleRollback = () => {
    rollback.mutate(plan.id, {
      onSuccess: (r) => {
        toast({ title: "Plano revertido", description: `${r.restored} ação(ões) restaurada(s)${r.failed ? `, ${r.failed} com falha` : ""}.` });
        setRollbackOpen(false);
      },
      onError: (e: any) => toast({ title: "Erro ao reverter", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{plan.title}</CardTitle>
            {plan.rationale && <p className="text-sm text-muted-foreground mt-1">{plan.rationale}</p>}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={RISK_VARIANT[plan.risk_tier] ?? "default"}>Risco {RISK_LABEL[plan.risk_tier] ?? plan.risk_tier}</Badge>
            <Badge variant="outline" className="text-xs">{STATUS_LABEL[plan.status] ?? plan.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border px-3">
          {plan.items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              editable={isProposed && it.tool_name === "update_campaign_budget"}
              draft={drafts[it.id] ?? (it.after_state?.daily_budget != null ? String(it.after_state.daily_budget) : "")}
              onDraftChange={(v) => setDrafts((d) => ({ ...d, [it.id]: v }))}
            />
          ))}
        </div>

        {hasItemErrors && plan.status !== "proposed" && (
          <p className="flex items-center gap-1.5 text-xs text-destructive mt-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Algumas ações falharam. Veja o status por item; você pode tentar novamente.
          </p>
        )}

        {outcome && plan.status !== "proposed" && <OutcomeBanner outcome={outcome} />}

        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(plan.created_at).toLocaleString("pt-BR")}
            {plan.executed_at
              ? <> · executado {new Date(plan.executed_at).toLocaleString("pt-BR")}</>
              : plan.decided_at ? <> · decidido {new Date(plan.decided_at).toLocaleString("pt-BR")}</> : null}
          </span>

          <div className="flex gap-2">
            {isProposed && budgetItems.length > 0 && hasDrafts && (
              <Button size="sm" variant="outline" onClick={handleSaveBudgets} disabled={updateBudget.isPending}>
                Salvar edição
              </Button>
            )}
            {isProposed && (
              <>
                <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>Rejeitar</Button>
                <Button size="sm" onClick={() => setApproveOpen(true)}>Aprovar</Button>
              </>
            )}
            {isExecuting && (
              <Button size="sm" disabled>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Executando…
              </Button>
            )}
            {!isExecuting && canExecute && (
              <Button size="sm" onClick={handleExecute}>
                <Rocket className="h-4 w-4 mr-1.5" />
                {plan.status === "failed" ? "Tentar novamente" : "Executar"}
              </Button>
            )}
            {isExecuted && (
              <Button size="sm" variant="outline" onClick={handleVerify} disabled={verify.isPending}>
                {verify.isPending
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <ShieldCheck className="h-4 w-4 mr-1.5" />}
                {outcome ? "Re-verificar" : "Verificar"}
              </Button>
            )}
            {canRollback && (
              <Button size="sm" variant="outline" onClick={() => setRollbackOpen(true)} disabled={rollback.isPending}>
                <Undo2 className="h-4 w-4 mr-1.5" /> Reverter
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Dialog de aprovação (confirmação dupla p/ risco alto) */}
      <AlertDialog open={approveOpen} onOpenChange={(o) => { setApproveOpen(o); if (!o) setRiskAck(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar e executar?</AlertDialogTitle>
            <AlertDialogDescription>
              {plan.items.length} ação(ões) serão <strong>aplicadas no Google Ads</strong> após a confirmação. Risco{" "}
              <strong>{RISK_LABEL[plan.risk_tier] ?? plan.risk_tier}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isHigh && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-destructive font-medium">Plano de risco alto</p>
                <div className="flex items-center gap-2">
                  <Checkbox id={`ack-${plan.id}`} checked={riskAck} onCheckedChange={(c) => setRiskAck(!!c)} />
                  <Label htmlFor={`ack-${plan.id}`} className="text-sm">Estou ciente do risco e autorizo a execução.</Label>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button onClick={handleApprove} disabled={(isHigh && !riskAck) || approve.isPending}>
              <Check className="h-4 w-4 mr-1.5" /> Aprovar e executar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de rejeição */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar plano?</AlertDialogTitle>
            <AlertDialogDescription>A proposta será marcada como rejeitada e não será executada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>Rejeitar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de rollback */}
      <AlertDialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter plano?</AlertDialogTitle>
            <AlertDialogDescription>
              As ações aplicadas serão desfeitas, restaurando o estado anterior capturado
              (budget e status). Itens sem snapshot anterior não podem ser revertidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleRollback} disabled={rollback.isPending}>
              <Undo2 className="h-4 w-4 mr-1.5" /> Reverter
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function AutonomyCard() {
  const [cfg, setCfg] = useState(() => getAutonomyConfig());
  const update = (next: typeof cfg) => { setCfg(next); setAutonomyConfig(next); };
  const toggleTier = (t: RiskTier) => {
    const has = cfg.tiers.includes(t);
    update({ ...cfg, tiers: has ? cfg.tiers.filter((x) => x !== t) : [...cfg.tiers, t] });
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex gap-2.5">
            <Bot className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Autonomia (auto-aprovação)</p>
              <p className="text-xs text-muted-foreground max-w-xl">
                Quando ativa, propostas dos tiers marcados são <strong>aprovadas e executadas
                automaticamente</strong>, sem o gate manual. Risco <strong>alto nunca</strong> é automático.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={cfg.enabled} onCheckedChange={(v) => update({ ...cfg, enabled: !!v })} />
            <span className="text-sm font-medium">{cfg.enabled ? "Ativada" : "Desativada"}</span>
          </label>
        </div>

        {cfg.enabled && (
          <div className="mt-3 flex items-center gap-4 pl-8">
            <span className="text-xs text-muted-foreground">Tiers automáticos:</span>
            {(["low", "medium"] as RiskTier[]).map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox checked={cfg.tiers.includes(t)} onCheckedChange={() => toggleTier(t)} />
                <span className="text-sm">{t === "low" ? "Baixo" : "Médio"}</span>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const EXECUTED_STATUSES: PlanStatus[] = ["executing", "executed", "verified", "failed", "rolled_back"];

const TABS: { value: PlanStatus | "all" | "executed_group"; label: string }[] = [
  { value: "proposed", label: "Pendentes" },
  { value: "authorized", label: "Aprovadas" },
  { value: "executed_group", label: "Executadas" },
  { value: "rejected", label: "Rejeitadas" },
  { value: "all", label: "Todas" },
];

export default function ActionsPage() {
  const { toast } = useToast();
  const { selectedCustomer } = useAuthStore();
  const { data, isLoading, refetch, isFetching } = useActionPlans();
  const { data: outcomes } = useActionOutcomes();
  const approveMany = useApproveManyPlans();
  const [tab, setTab] = useState<PlanStatus | "all" | "executed_group">("proposed");

  const plans = data ?? [];
  const visible =
    tab === "all" ? plans
    : tab === "executed_group" ? plans.filter((p) => EXECUTED_STATUSES.includes(p.status))
    : plans.filter((p) => p.status === tab);

  const proposed = plans.filter((p) => p.status === "proposed");
  const batchable = proposed.filter((p) => p.risk_tier !== "high").map((p) => p.id);

  const handleBatchApprove = () => {
    approveMany.mutate(batchable, {
      onSuccess: () => toast({ title: "Planos aprovados", description: `${batchable.length} plano(s) de baixo/médio risco autorizados. Execute cada um na aba Aprovadas.` }),
      onError: (e: any) => toast({ title: "Erro no lote", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ações da IA</h1>
          <p className="text-muted-foreground">
            Aprove, edite ou rejeite as ações propostas pela IA. Nada é aplicado sem sua autorização.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {!selectedCustomer && <ConnectionBanner />}

      <AutonomyCard />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={tab} onValueChange={(v) => setTab(v as PlanStatus | "all" | "executed_group")}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {t.value === "proposed" && proposed.length > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({proposed.length})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "proposed" && batchable.length > 1 && (
          <Button size="sm" variant="outline" onClick={handleBatchApprove} disabled={approveMany.isPending}>
            <Check className="h-4 w-4 mr-1.5" />
            Aprovar {batchable.length} de baixo/médio risco
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ListChecks className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {tab === "proposed"
                ? <>Nenhuma proposta pendente. Peça ao <strong>Assistente IA</strong> para propor ações (pausar bleeders, escalar winners, realocar budget).</>
                : "Nada por aqui."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visible.map((plan) => <PlanCard key={plan.id} plan={plan} outcome={outcomes?.[plan.id]} />)}
        </div>
      )}
    </div>
  );
}
