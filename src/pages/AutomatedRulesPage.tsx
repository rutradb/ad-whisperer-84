import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfile } from "@/hooks/useProfile";
import { useAutomatedRules, useCreateRule, useToggleRule, useDeleteRule } from "@/hooks/useAutomatedRules";
import { useRuleExecutionLog, type RuleExecutionLogEntry } from "@/hooks/useRuleExecutionLog";
import { AVAILABLE_METRICS, OPERATORS, ACTION_TYPES, SCHEDULE_PRESETS, type CompoundCondition } from "@/lib/rulesEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Zap, Trash2, Loader2, History, X } from "lucide-react";

export default function AutomatedRulesPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const { profile } = useProfile();
  const userId = profile?.id;

  const { data: rules, isLoading } = useAutomatedRules(userId);
  const createRule = useCreateRule();
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logRuleId, setLogRuleId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState<"campaign" | "ad_group" | "ad" | "keyword">("campaign");
  const [action, setAction] = useState<string>("pause");
  const [actionValue, setActionValue] = useState("");
  const [datePreset, setDatePreset] = useState("LAST_7_DAYS");
  const [compoundLogic, setCompoundLogic] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<CompoundCondition[]>([
    { metric: "costMicros", operator: ">", value: 0 },
  ]);
  const [scheduleCron, setScheduleCron] = useState("0 8 * * *");

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Regras Automatizadas</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const resetForm = () => {
    setName("");
    setEntityType("campaign");
    setAction("pause");
    setActionValue("");
    setDatePreset("LAST_7_DAYS");
    setCompoundLogic("AND");
    setConditions([{ metric: "costMicros", operator: ">", value: 0 }]);
    setScheduleCron("0 8 * * *");
  };

  const handleCreate = () => {
    if (!userId || conditions.length === 0) return;
    const firstCondition = conditions[0];
    createRule.mutate(
      {
        user_id: userId,
        name: name || `Regra - ${firstCondition.metric} ${firstCondition.operator} ${firstCondition.value}`,
        entity_type: entityType,
        condition_metric: firstCondition.metric,
        condition_operator: firstCondition.operator,
        condition_value: firstCondition.value,
        action_type: action,
        date_preset: datePreset,
        is_active: true,
      },
      {
        onSuccess: () => { setShowCreate(false); resetForm(); },
      }
    );
  };

  const addCondition = () => {
    setConditions([...conditions, { metric: "averageCpc", operator: ">", value: 0 }]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof CompoundCondition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const actionLabels: Record<string, string> = {};
  ACTION_TYPES.forEach((a) => { actionLabels[a.value] = a.label; });
  const entityLabels: Record<string, string> = { campaign: "Campanhas", ad_group: "Grupos de Anuncios", ad: "Anuncios", keyword: "Palavras-chave" };
  const needsValue = action === "increase_budget" || action === "decrease_budget";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regras Automatizadas</h1>
          <p className="text-muted-foreground">Automatize acoes baseadas em metricas de performance</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />Nova Regra
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : rules && rules.length > 0 ? (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{rule.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Se <strong>{AVAILABLE_METRICS.find((m) => m.value === rule.condition_metric)?.label || rule.condition_metric}</strong>{" "}
                      {rule.condition_operator} {rule.condition_value} &rarr; <strong>{actionLabels[rule.action_type] || rule.action_type}</strong>
                      {rule.action_value ? ` (${rule.action_value}%)` : ""}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{entityLabels[rule.entity_type] || rule.entity_type}</Badge>
                      <Badge variant="outline" className="text-xs">{rule.date_preset}</Badge>
                      {rule.compound_logic && rule.conditions && rule.conditions.length > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          {rule.conditions.length} condicoes ({rule.compound_logic})
                        </Badge>
                      )}
                      {rule.last_run_at && (
                        <Badge variant="secondary" className="text-xs">
                          Ultima: {new Date(rule.last_run_at).toLocaleString("pt-BR")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setLogRuleId(rule.id)} title="Ver log de execucao">
                    <History className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma regra criada</p>
            <p className="text-sm text-muted-foreground mt-1">Crie regras para automatizar acoes na sua conta.</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />Nova Regra
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Regra Automatizada</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Step 1: Name & Entity */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">1. Configuracao</p>
              <div className="space-y-2">
                <Label>Nome da Regra</Label>
                <Input placeholder="Ex: Pausar se CPA alto" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Aplicar a</Label>
                  <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campanhas</SelectItem>
                      <SelectItem value="ad_group">Grupos de Anuncios</SelectItem>
                      <SelectItem value="ad">Anuncios</SelectItem>
                      <SelectItem value="keyword">Palavras-chave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Periodo</Label>
                  <Select value={datePreset} onValueChange={setDatePreset}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAY">Hoje</SelectItem>
                      <SelectItem value="LAST_7_DAYS">Ultimos 7 dias</SelectItem>
                      <SelectItem value="LAST_14_DAYS">Ultimos 14 dias</SelectItem>
                      <SelectItem value="LAST_30_DAYS">Ultimos 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Step 2: Conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">2. Condicoes</p>
                {conditions.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Logica:</span>
                    <Select value={compoundLogic} onValueChange={(v) => setCompoundLogic(v as "AND" | "OR")}>
                      <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">E (AND)</SelectItem>
                        <SelectItem value="OR">OU (OR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  {idx > 0 && (
                    <Badge variant="outline" className="mb-2 text-xs shrink-0">{compoundLogic}</Badge>
                  )}
                  <div className="space-y-1 flex-1">
                    {idx === 0 && <Label className="text-xs">Metrica</Label>}
                    <Select value={cond.metric} onValueChange={(v) => updateCondition(idx, "metric", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_METRICS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-28">
                    {idx === 0 && <Label className="text-xs">Operador</Label>}
                    <Select value={cond.operator} onValueChange={(v) => updateCondition(idx, "operator", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-24">
                    {idx === 0 && <Label className="text-xs">Valor</Label>}
                    <Input
                      type="number"
                      className="h-9"
                      value={cond.value || ""}
                      onChange={(e) => updateCondition(idx, "value", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  {conditions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeCondition(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="mr-1 h-3 w-3" /> Adicionar Condicao
              </Button>
            </div>

            {/* Step 3: Action */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">3. Acao</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo de Acao</Label>
                  <Select value={action} onValueChange={(v) => { setAction(v); setActionValue(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {needsValue && (
                  <div className="space-y-2">
                    <Label>Percentual (%)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      placeholder="20"
                      value={actionValue}
                      onChange={(e) => setActionValue(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Schedule */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">4. Agendamento</p>
              <Select value={scheduleCron} onValueChange={setScheduleCron}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_PRESETS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              onClick={handleCreate}
              disabled={conditions.every((c) => !c.value) || createRule.isPending}
            >
              {createRule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Log Dialog */}
      <ExecutionLogDialog ruleId={logRuleId} onClose={() => setLogRuleId(null)} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>Essa acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteRule.mutate(deleteId); setDeleteId(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExecutionLogDialog({ ruleId, onClose }: { ruleId: string | null; onClose: () => void }) {
  const { data: logs, isLoading } = useRuleExecutionLog(ruleId || undefined);

  return (
    <Dialog open={!!ruleId} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Log de Execucao</DialogTitle></DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {new Date(log.executed_at).toLocaleString("pt-BR")}
                  </span>
                  <Badge
                    variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {log.status === "success" ? "Sucesso" : log.status === "error" ? "Erro" : "Parcial"}
                  </Badge>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Avaliados: {log.entities_evaluated}</span>
                  <span>Correspondidos: {log.entities_matched}</span>
                  <span>Acionados: {log.entities_actioned}</span>
                </div>
                {log.error_message && (
                  <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma execucao registrada</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
