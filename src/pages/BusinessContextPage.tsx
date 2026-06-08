import { useState } from "react";
import {
  Target, TrendingUp, Building2, BookOpen, Plus, Trash2,
  ChevronDown, RotateCcw, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useBusinessContextStore,
  BUSINESS_CONTEXT_DEFAULTS,
  type BusinessObjective,
} from "@/store/useBusinessContextStore";
import { buildBusinessContextBlock } from "@/lib/agent/buildBusinessContextBlock";
import { cn } from "@/lib/utils";

// ─── NumberField ─────────────────────────────────────────────────────────────
interface NumberFieldProps {
  label: string;
  description?: string;
  value: number;
  min?: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  onSave: (v: number) => void;
}

function NumberField({ label, description, value, min = 0, step = 1, suffix, prefix, onSave }: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const handleBlur = () => {
    const n = parseFloat(draft);
    if (isNaN(n) || n < min) {
      setDraft(String(value));
      return;
    }
    onSave(n);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    toast({ description: "Configuração salva", duration: 1500 });
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
        <Input
          type="number"
          min={min}
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          className="w-32 tabular-nums"
        />
        {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
        {saved && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
      </div>
    </div>
  );
}

// ─── NullableNumberField ──────────────────────────────────────────────────────
interface NullableNumberFieldProps {
  label: string;
  description?: string;
  value: number | null;
  min?: number;
  step?: number;
  defaultValue?: number;
  prefix?: string;
  suffix?: string;
  onSave: (v: number | null) => void;
}

function NullableNumberField({
  label, description, value, min = 0, step = 1, defaultValue = 0, prefix, suffix, onSave,
}: NullableNumberFieldProps) {
  const enabled = value !== null;
  const [draft, setDraft] = useState(value !== null ? String(value) : String(defaultValue));
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const handleToggle = (on: boolean) => {
    if (!on) {
      onSave(null);
    } else {
      const n = parseFloat(draft);
      onSave(isNaN(n) ? defaultValue : n);
    }
    toast({ description: on ? "Meta ativada" : "Meta desativada", duration: 1200 });
  };

  const handleBlur = () => {
    if (!enabled) return;
    const n = parseFloat(draft);
    if (isNaN(n) || n < min) {
      setDraft(String(value ?? defaultValue));
      return;
    }
    onSave(n);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    toast({ description: "Configuração salva", duration: 1500 });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className={cn("text-sm font-medium", !enabled && "text-muted-foreground")}>{label}</Label>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {enabled && (
        <div className="flex items-center gap-2">
          {prefix && <span className="text-sm text-muted-foreground shrink-0">{prefix}</span>}
          <Input
            type="number"
            min={min}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            className="w-32 tabular-nums"
          />
          {suffix && <span className="text-sm text-muted-foreground shrink-0">{suffix}</span>}
          {saved && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
        </div>
      )}
      {!enabled && (
        <p className="text-xs text-muted-foreground/60 italic">não configurado</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BusinessContextPage() {
  const ctx = useBusinessContextStore();
  const [newRule, setNewRule] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    ctx.addCustomRule(newRule);
    setNewRule("");
    toast({ description: "Regra adicionada", duration: 1200 });
  };

  const previewText = buildBusinessContextBlock({
    minDaysBeforeScale: ctx.minDaysBeforeScale,
    minRoasToScale: ctx.minRoasToScale,
    minSpendToEvaluate: ctx.minSpendToEvaluate,
    maxFrequency: ctx.maxFrequency,
    targetRoas: ctx.targetRoas,
    maxCpa: ctx.maxCpa,
    maxCpc: ctx.maxCpc,
    averageTicket: ctx.averageTicket,
    businessObjective: ctx.businessObjective,
    businessSegment: ctx.businessSegment,
    customRules: ctx.customRules,
  });

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contexto Estratégico</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Defina as regras de negócio que a IA usa ao analisar sua conta e recomendar ações
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground shrink-0">
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar padrões
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar configurações padrão?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os critérios e regras customizadas serão apagados e substituídos pelos valores padrão do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                ctx.reset();
                toast({ description: "Configurações restauradas" });
              }}>
                Restaurar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Card 1 — Critérios de Escala */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Critérios de Escala</CardTitle>
              <CardDescription className="text-xs">
                Quando a IA pode recomendar aumentar investimento em um criativo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <NumberField
            label="Dias mínimos de performance"
            description="Tempo mínimo rodando antes de recomendar escala"
            value={ctx.minDaysBeforeScale}
            min={1}
            step={1}
            suffix="dias"
            onSave={ctx.setMinDaysBeforeScale}
          />
          <NumberField
            label="ROAS mínimo para escalar"
            description="Retorno sobre gasto mínimo para considerar escala"
            value={ctx.minRoasToScale}
            min={0.1}
            step={0.1}
            suffix="x"
            onSave={ctx.setMinRoasToScale}
          />
          <NumberField
            label="Gasto mínimo para avaliar"
            description="Investimento mínimo para ter dados significativos"
            value={ctx.minSpendToEvaluate}
            min={1}
            step={10}
            prefix="R$"
            onSave={ctx.setMinSpendToEvaluate}
          />
          <NumberField
            label="Frequência máxima tolerada"
            description="Acima desse valor, sinalizar fadiga criativa"
            value={ctx.maxFrequency}
            min={1}
            step={0.1}
            suffix="×/usuário"
            onSave={ctx.setMaxFrequency}
          />
        </CardContent>
      </Card>

      {/* Card 2 — Metas de Custo */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <Target className="h-4 w-4 text-warning" />
            </div>
            <div>
              <CardTitle className="text-base">Metas de Custo</CardTitle>
              <CardDescription className="text-xs">
                Tetos e referências que a IA usa para avaliar eficiência
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <NullableNumberField
            label="ROAS alvo"
            description="Retorno sobre gasto que você quer atingir"
            value={ctx.targetRoas}
            min={0.1}
            step={0.1}
            defaultValue={3.0}
            suffix="x"
            onSave={ctx.setTargetRoas}
          />
          <NullableNumberField
            label="CPA máximo aceitável"
            description="Custo por aquisição limite"
            value={ctx.maxCpa}
            min={1}
            step={5}
            defaultValue={100}
            prefix="R$"
            onSave={ctx.setMaxCpa}
          />
          <NullableNumberField
            label="CPC máximo aceitável"
            description="Custo por clique limite"
            value={ctx.maxCpc}
            min={0.01}
            step={0.5}
            defaultValue={5}
            prefix="R$"
            onSave={ctx.setMaxCpc}
          />
          <NullableNumberField
            label="Ticket médio"
            description="Valor médio de compra (contexto para avaliar CPA)"
            value={ctx.averageTicket}
            min={1}
            step={10}
            defaultValue={150}
            prefix="R$"
            onSave={ctx.setAverageTicket}
          />
        </CardContent>
      </Card>

      {/* Card 3 — Contexto do Negócio */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <Building2 className="h-4 w-4 text-success" />
            </div>
            <div>
              <CardTitle className="text-base">Contexto do Negócio</CardTitle>
              <CardDescription className="text-xs">
                Ajuda a IA a entender o seu tipo de negócio e prioridades
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Objetivo principal</Label>
            <p className="text-xs text-muted-foreground">O que você quer otimizar nas campanhas</p>
            <Select
              value={ctx.businessObjective}
              onValueChange={(v) => {
                ctx.setBusinessObjective(v as BusinessObjective);
                toast({ description: "Configuração salva", duration: 1200 });
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversions">Conversões</SelectItem>
                <SelectItem value="traffic">Tráfego</SelectItem>
                <SelectItem value="leads">Geração de leads</SelectItem>
                <SelectItem value="awareness">Reconhecimento de marca</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Segmento de negócio</Label>
            <p className="text-xs text-muted-foreground">Ex: e-commerce de moda, clínica odontológica</p>
            <Input
              placeholder="Descreva seu segmento..."
              value={ctx.businessSegment}
              onChange={(e) => ctx.setBusinessSegment(e.target.value)}
              onBlur={() => toast({ description: "Configuração salva", duration: 1200 })}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Card 4 — Regras da Estratégia */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Regras da Estratégia</CardTitle>
              <CardDescription className="text-xs">
                Instruções em texto livre que a IA deve seguir em todas as análises
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de regras */}
          {ctx.customRules.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 italic py-2">
              Nenhuma regra configurada. Adicione abaixo.
            </p>
          ) : (
            <ul className="space-y-2">
              {ctx.customRules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 group">
                  <span className="text-xs text-muted-foreground font-mono mt-2.5 shrink-0 w-5 text-right">
                    {i + 1}.
                  </span>
                  <Input
                    value={rule}
                    onChange={(e) => ctx.updateCustomRule(i, e.target.value)}
                    onBlur={() => toast({ description: "Regra atualizada", duration: 1200 })}
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => {
                      ctx.removeCustomRule(i);
                      toast({ description: "Regra removida", duration: 1200 });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Adicionar nova regra */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Ex: Só recomendar escala se o criativo tiver pelo menos 3 compras..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddRule}
              disabled={!newRule.trim()}
              className="gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>

          {/* Preview */}
          <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", previewOpen && "rotate-180")} />
                Como a IA verá essas regras
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-3 rounded-lg bg-muted/50 border border-border/60 p-4 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-auto max-h-72">
                {previewText}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
