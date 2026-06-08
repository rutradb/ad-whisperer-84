import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useCreateCampaign } from "@/hooks/useCampaignMutations";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { unitsToMicros } from "@/lib/google-ads/types";
import type { AdvertisingChannelType, BiddingStrategyType } from "@/lib/google-ads/types";

const CHANNEL_TYPES: Array<{ value: AdvertisingChannelType; label: string }> = [
  { value: "SEARCH", label: "Pesquisa (Search)" },
  { value: "DISPLAY", label: "Display" },
  { value: "VIDEO", label: "Vídeo (YouTube)" },
  { value: "SHOPPING", label: "Shopping" },
  { value: "PERFORMANCE_MAX", label: "Performance Max" },
  { value: "DEMAND_GEN", label: "Demand Gen" },
];

const BIDDING_STRATEGIES: Array<{ value: BiddingStrategyType; label: string }> = [
  { value: "MAXIMIZE_CONVERSIONS", label: "Maximizar Conversões" },
  { value: "MAXIMIZE_CONVERSION_VALUE", label: "Maximizar Valor de Conversão" },
  { value: "TARGET_CPA", label: "CPA Desejado" },
  { value: "TARGET_ROAS", label: "ROAS Desejado" },
  { value: "MANUAL_CPC", label: "CPC Manual" },
  { value: "TARGET_SPEND", label: "Maximizar Cliques" },
  { value: "TARGET_IMPRESSION_SHARE", label: "Parcela de Impressões" },
];

interface FormState {
  name: string;
  channelType: AdvertisingChannelType | "";
  biddingStrategy: BiddingStrategyType | "";
  budgetValue: string;
  targetCpa: string;
  targetRoas: string;
  startDate: string;
  endDate: string;
  targetGoogleSearch: boolean;
  targetSearchNetwork: boolean;
  targetContentNetwork: boolean;
}

const initialState: FormState = {
  name: "",
  channelType: "",
  biddingStrategy: "",
  budgetValue: "",
  targetCpa: "",
  targetRoas: "",
  startDate: "",
  endDate: "",
  targetGoogleSearch: true,
  targetSearchNetwork: false,
  targetContentNetwork: false,
};

function validate(form: FormState, step: number): string | null {
  if (step >= 0) {
    if (!form.name.trim() || form.name.length > 100) return "Nome é obrigatório (1-100 caracteres).";
    if (!form.channelType) return "Selecione um tipo de canal.";
  }
  if (step >= 1) {
    const val = parseFloat(form.budgetValue);
    if (isNaN(val) || val < 1) return "Orçamento diário mínimo é R$ 1,00.";
    if (!form.biddingStrategy) return "Selecione uma estratégia de lances.";
    if (form.biddingStrategy === "TARGET_CPA" && form.targetCpa) {
      const cpa = parseFloat(form.targetCpa);
      if (isNaN(cpa) || cpa <= 0) return "CPA desejado inválido.";
    }
    if (form.biddingStrategy === "TARGET_ROAS" && form.targetRoas) {
      const roas = parseFloat(form.targetRoas);
      if (isNaN(roas) || roas <= 0) return "ROAS desejado inválido.";
    }
  }
  return null;
}

export default function CampaignCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateCampaign();

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Nova Campanha</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const next = () => {
    const err = validate(form, step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    const err = validate(form, 1);
    if (err) { setError(err); return; }
    setError(null);
    const budgetMicros = unitsToMicros(parseFloat(form.budgetValue));

    const campaignData: any = {
      name: form.name.trim(),
      advertisingChannelType: form.channelType,
      status: "PAUSED",
      biddingStrategyType: form.biddingStrategy,
      networkSettings: {
        targetGoogleSearch: form.targetGoogleSearch,
        targetSearchNetwork: form.targetSearchNetwork,
        targetContentNetwork: form.targetContentNetwork,
      },
    };

    if (form.biddingStrategy === "TARGET_CPA" && form.targetCpa) {
      campaignData.targetCpa = { targetCpaMicros: String(unitsToMicros(parseFloat(form.targetCpa))) };
    }
    if (form.biddingStrategy === "TARGET_ROAS" && form.targetRoas) {
      campaignData.targetRoas = { targetRoas: parseFloat(form.targetRoas) };
    }
    if (form.startDate) campaignData.startDate = form.startDate.replace(/-/g, "");
    if (form.endDate) campaignData.endDate = form.endDate.replace(/-/g, "");

    createMutation.mutate(
      {
        customerId,
        budgetData: {
          name: `Budget - ${form.name.trim()}`,
          amountMicros: String(budgetMicros),
          deliveryMethod: "STANDARD",
        },
        campaignData,
      },
      { onSuccess: () => navigate("/campaigns") }
    );
  };

  const channelLabel = CHANNEL_TYPES.find((o) => o.value === form.channelType)?.label || "--";
  const bidLabel = BIDDING_STRATEGIES.find((b) => b.value === form.biddingStrategy)?.label || "--";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/campaigns">Campanhas</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Nova Campanha</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">Nova Campanha</h1>

      <div className="flex gap-2 mb-4">
        {["Info Básica", "Orçamento e Lances", "Revisão"].map((label, i) => (
          <div key={label} className={`flex-1 text-center text-sm py-2 rounded-md font-medium ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-muted text-foreground" : "bg-muted/50 text-muted-foreground"}`}>
            {label}
          </div>
        ))}
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da campanha</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Campanha Search - Marca 2026" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Canal</Label>
              <Select value={form.channelType} onValueChange={(v) => set("channelType", v as AdvertisingChannelType)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo de canal" /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Configurações de Rede</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.targetGoogleSearch} onCheckedChange={(v) => set("targetGoogleSearch", !!v)} />
                  <span className="text-sm">Pesquisa Google</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.targetSearchNetwork} onCheckedChange={(v) => set("targetSearchNetwork", !!v)} />
                  <span className="text-sm">Rede de Pesquisa (parceiros)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.targetContentNetwork} onCheckedChange={(v) => set("targetContentNetwork", !!v)} />
                  <span className="text-sm">Rede de Display</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Orçamento e Lances</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento diário (R$)</Label>
              <Input id="budget" type="number" min="1" step="0.01" value={form.budgetValue} onChange={(e) => set("budgetValue", e.target.value)} placeholder="50.00" />
              <p className="text-xs text-muted-foreground">Mínimo R$ 1,00. O valor será convertido para micros automaticamente.</p>
            </div>
            <div className="space-y-2">
              <Label>Estratégia de Lances</Label>
              <Select value={form.biddingStrategy} onValueChange={(v) => set("biddingStrategy", v as BiddingStrategyType)}>
                <SelectTrigger><SelectValue placeholder="Selecione a estratégia" /></SelectTrigger>
                <SelectContent>
                  {BIDDING_STRATEGIES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.biddingStrategy === "TARGET_CPA" && (
              <div className="space-y-2">
                <Label htmlFor="targetCpa">CPA Desejado (R$)</Label>
                <Input id="targetCpa" type="number" min="0.01" step="0.01" value={form.targetCpa} onChange={(e) => set("targetCpa", e.target.value)} placeholder="25.00" />
              </div>
            )}
            {(form.biddingStrategy === "TARGET_ROAS" || form.biddingStrategy === "MAXIMIZE_CONVERSION_VALUE") && (
              <div className="space-y-2">
                <Label htmlFor="targetRoas">ROAS Desejado</Label>
                <Input id="targetRoas" type="number" min="0.01" step="0.01" value={form.targetRoas} onChange={(e) => set("targetRoas", e.target.value)} placeholder="3.00" />
                <p className="text-xs text-muted-foreground">Ex: 3.00 = R$3 de receita para cada R$1 gasto</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Data de início (opcional)</Label>
                <Input id="start" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Data de fim (opcional)</Label>
                <Input id="end" type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Revisão</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <span className="text-muted-foreground">Nome</span><span className="font-medium">{form.name}</span>
              <span className="text-muted-foreground">Canal</span><span className="font-medium">{channelLabel}</span>
              <span className="text-muted-foreground">Orçamento diário</span><span className="font-medium">R$ {form.budgetValue}</span>
              <span className="text-muted-foreground">Estratégia de Lances</span><span className="font-medium">{bidLabel}</span>
              {form.targetCpa && <><span className="text-muted-foreground">CPA Desejado</span><span className="font-medium">R$ {form.targetCpa}</span></>}
              {form.targetRoas && <><span className="text-muted-foreground">ROAS Desejado</span><span className="font-medium">{form.targetRoas}x</span></>}
              {form.startDate && <><span className="text-muted-foreground">Início</span><span className="font-medium">{form.startDate}</span></>}
              {form.endDate && <><span className="text-muted-foreground">Fim</span><span className="font-medium">{form.endDate}</span></>}
              <span className="text-muted-foreground">Redes</span>
              <span className="font-medium">
                {[form.targetGoogleSearch && "Google Search", form.targetSearchNetwork && "Parceiros de Pesquisa", form.targetContentNetwork && "Display"].filter(Boolean).join(", ") || "Nenhuma"}
              </span>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>A campanha será criada <strong>PAUSADA</strong> por segurança.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step === 0 ? navigate("/campaigns") : setStep((s) => s - 1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {step === 0 ? "Voltar" : "Anterior"}
        </Button>
        {step < 2 ? (
          <Button onClick={next}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : <><Check className="mr-2 h-4 w-4" /> Criar Campanha</>}
          </Button>
        )}
      </div>
    </div>
  );
}
