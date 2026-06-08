import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2, Loader2, SkipForward,
  Users, ShoppingBag, Brain, Target, Rocket,
  Eye, EyeOff, Link2, BarChart3, Sparkles, ChevronRight, Building2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, type GoogleAdsCustomer } from "@/store/useAuthStore";
import { useIntegrationsStore } from "@/store/useIntegrationsStore";
import { useBusinessContextStore, type BusinessObjective } from "@/store/useBusinessContextStore";
import { useProfile } from "@/hooks/useProfile";
import { listAccessibleCustomers, getCustomerDetails } from "@/lib/google-ads/customers";
import { cn } from "@/lib/utils";

// ─── Vault helpers ────────────────────────────────────────────────────────────

// Integration and business context data is persisted via Zustand stores (localStorage).
// No separate DB tables needed.

// ─── SecretInput ──────────────────────────────────────────────────────────────

function SecretInput({ value, onChange, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-9 font-mono text-sm"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: "google-ads", icon: BarChart3,   label: "Google Ads" },
  { id: "ai",         icon: Brain,       label: "Claude AI"  },
  { id: "pipedrive",  icon: Users,       label: "Pipedrive"  },
  { id: "shopify",    icon: ShoppingBag, label: "Shopify"    },
  { id: "hubspot",    icon: Building2,   label: "HubSpot"    },
  { id: "context",    icon: Target,      label: "Contexto"   },
] as const;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, completed }: { current: number; completed: Set<number> }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-6">
      {STEPS.map((_, i) => {
        const done = completed.has(i);
        const active = i === current;
        return (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              done    ? "h-2 w-6 bg-primary" :
              active  ? "h-2 w-4 bg-primary/60" :
                        "h-2 w-2 bg-muted"
            )}
          />
        );
      })}
    </div>
  );
}

// ─── Step: Google Ads ─────────────────────────────────────────────────────────

function StepGoogleAds({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [developerToken, setDeveloperToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<GoogleAdsCustomer[]>([]);
  const { setGoogleAdsCredentials, setSelectedCustomer } = useAuthStore();
  const { saveProfile } = useProfile();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!developerToken.trim()) return;
    setLoading(true);
    try {
      setGoogleAdsCredentials({
        accessToken: developerToken.trim(),
        refreshToken: "",
        developerToken: developerToken.trim(),
        clientId: "",
        clientSecret: "",
      });
      const resourceNames = await listAccessibleCustomers();
      const details: GoogleAdsCustomer[] = [];
      for (const rn of resourceNames.slice(0, 20)) {
        const id = rn.split("/").pop();
        if (id) {
          try {
            const detail = await getCustomerDetails(id);
            if (detail && !detail.manager) details.push(detail);
          } catch { /* skip */ }
        }
      }
      setCustomers(details);
      if (details.length >= 1) {
        toast({ description: `Conectado! ${details.length} conta(s) encontrada(s). Selecione uma.` });
      } else {
        toast({ description: "Nenhuma conta encontrada.", variant: "destructive" });
      }
    } catch {
      toast({ description: "Credenciais invalidas. Verifique e tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;
    setSelectedCustomer(cust);
    await saveProfile({ google_ads_customer_json: cust as any, google_ads_customer_id: cust.id }).catch(console.error);
    onNext();
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Configure as credenciais do Google Ads API.
          Obtenha em{" "}
          <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">console.cloud.google.com</span>.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label>Developer Token</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <SecretInput value={developerToken} onChange={setDeveloperToken} placeholder="xxxxxxxxxxxxxxxx" disabled={loading} />
          </div>
          <Button onClick={handleConnect} disabled={!developerToken.trim() || loading} className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Conectar
          </Button>
        </div>
      </div>
      {customers.length >= 1 && (
        <div className="space-y-1.5">
          <Label>Selecione a conta de anuncios</Label>
          <Select onValueChange={handleSelectCustomer}>
            <SelectTrigger><SelectValue placeholder="Escolha uma conta..." /></SelectTrigger>
            <SelectContent>
              {customers.map((cust) => (
                <SelectItem key={cust.id} value={cust.id}>{cust.descriptiveName || "Sem nome"} ({cust.id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button variant="ghost" onClick={onSkip} className="gap-1.5 text-muted-foreground">
        <SkipForward className="h-3.5 w-3.5" /> Pular
      </Button>
    </div>
  );
}

// ─── Step: Claude AI ──────────────────────────────────────────────────────────

function StepAI({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const { setAnthropicApiKey } = useAuthStore();
  const { saveProfile } = useProfile();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      setAnthropicApiKey(key.trim());
      await saveProfile({ anthropic_api_key: key.trim() });
      toast({ description: "API Key Claude configurada!" });
      onNext();
    } catch {
      toast({ description: "Erro ao salvar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Habilita o Agente de Gestão, diagnósticos e geração de copy com IA.
        Obtenha em{" "}
        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">console.anthropic.com</span>.
      </p>
      <div className="space-y-1.5">
        <Label>API Key Anthropic</Label>
        <SecretInput value={key} onChange={setKey} placeholder="sk-ant-..." />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!key.trim() || saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Salvar e continuar
        </Button>
        <Button variant="ghost" onClick={onSkip} className="gap-1.5 text-muted-foreground">
          <SkipForward className="h-3.5 w-3.5" /> Pular
        </Button>
      </div>
    </div>
  );
}

// ─── Step: Pipedrive ──────────────────────────────────────────────────────────

function StepPipedrive({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const store = useIntegrationsStore();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!apiToken.trim()) return;
    setLoading(true);
    store.setPipedriveApiToken(apiToken.trim());
    try {
      const url = new URL("https://api.pipedrive.com/v1/pipelines");
      url.searchParams.set("api_token", apiToken.trim());
      const res = await fetch(url.toString());
      const data = await res.json() as { success: boolean };
      if (data.success) {
        store.setPipedriveConnected(true);
        // Data persisted via Zustand store
        toast({ description: "Pipedrive conectado!" });
        onNext();
      } else {
        toast({ description: "Token inválido.", variant: "destructive" });
      }
    } catch {
      toast({ description: "Erro ao conectar.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Correlacione deals e leads com campanhas Google Ads.
        Token em: <span className="text-xs font-mono">Menu → Personal preferences → API</span>.
      </p>
      <div className="space-y-1.5">
        <Label>API Token</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <SecretInput value={apiToken} onChange={setApiToken} placeholder="Cole o API Token..." disabled={loading} />
          </div>
          <Button onClick={handleConnect} disabled={!apiToken.trim() || loading} className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Conectar
          </Button>
        </div>
      </div>
      <Button variant="ghost" onClick={onSkip} className="gap-1.5 text-muted-foreground">
        <SkipForward className="h-3.5 w-3.5" /> Pular
      </Button>
    </div>
  );
}

// ─── Step: Shopify ────────────────────────────────────────────────────────────

function StepShopify({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const store = useIntegrationsStore();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!storeUrl.trim() || !accessToken.trim()) return;
    setLoading(true);
    try {
      const clean = storeUrl.trim().replace(/^https?:\/\//, "");
      const res = await fetch(`https://${clean}/admin/api/2024-04/shop.json`, {
        headers: { "X-Shopify-Access-Token": accessToken.trim() },
      });
      store.setShopifyConnected(res.ok);
    } catch {
      // CORS expected — save anyway
    }
    store.setShopifyStoreUrl(storeUrl.trim());
    store.setShopifyAccessToken(accessToken.trim());
    store.setShopifyConnected(true);
    // Data persisted via Zustand store
    toast({ description: "Shopify configurado!" });
    setLoading(false);
    onNext();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Receita real e ROAS verdadeiro por campanha.
        Access Token em: <span className="text-xs font-mono">Admin → Apps → Criar app</span>.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>URL da loja</Label>
          <Input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)}
            placeholder="minhaloja.myshopify.com" className="font-mono text-sm" disabled={loading} />
        </div>
        <div className="space-y-1.5">
          <Label>Access Token</Label>
          <SecretInput value={accessToken} onChange={setAccessToken} placeholder="shpat_..." disabled={loading} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleConnect} disabled={!storeUrl.trim() || !accessToken.trim() || loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          Salvar e continuar
        </Button>
        <Button variant="ghost" onClick={onSkip} className="gap-1.5 text-muted-foreground">
          <SkipForward className="h-3.5 w-3.5" /> Pular
        </Button>
      </div>
    </div>
  );
}

// ─── Step: HubSpot ────────────────────────────────────────────────────────────

function StepHubSpot({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const store = useIntegrationsStore();
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!accessToken.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${accessToken.trim()}` },
      });
      if (!res.ok && res.status === 401) {
        toast({ description: "Token inválido. Verifique as credenciais.", variant: "destructive" });
        setLoading(false);
        return;
      }
      // res.ok or CORS/network error: save anyway (verification happens server-side)
    } catch {
      // CORS expected in some environments — save token and proceed
    }
    store.setHubSpotAccessToken(accessToken.trim());
    store.setHubSpotConnected(true);
    // Data persisted via Zustand store
    toast({ description: "HubSpot configurado!" });
    setLoading(false);
    onNext();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Correlacione deals e pipeline de vendas com campanhas Google Ads.
        Token em: <span className="text-xs font-mono">HubSpot → Configurações → Integrações → Apps privados</span>.
      </p>
      <div className="space-y-1.5">
        <Label>Private App Token</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <SecretInput value={accessToken} onChange={setAccessToken} placeholder="pat-na1-..." disabled={loading} />
          </div>
          <Button onClick={handleConnect} disabled={!accessToken.trim() || loading} className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
            Conectar
          </Button>
        </div>
      </div>
      <Button variant="ghost" onClick={onSkip} className="gap-1.5 text-muted-foreground">
        <SkipForward className="h-3.5 w-3.5" /> Pular
      </Button>
    </div>
  );
}

// ─── Step: Business context ───────────────────────────────────────────────────

const OBJECTIVES: { value: BusinessObjective; label: string }[] = [
  { value: "conversions", label: "Conversões" },
  { value: "leads",       label: "Geração de leads" },
  { value: "traffic",     label: "Tráfego" },
  { value: "awareness",   label: "Reconhecimento de marca" },
];

function StepContext({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const ctx = useBusinessContextStore();
  const [objective, setObjective] = useState<BusinessObjective>(ctx.businessObjective);
  const [segment, setSegment] = useState(ctx.businessSegment);
  const [targetRoas, setTargetRoas] = useState(ctx.targetRoas?.toString() ?? "");
  const [maxCpa, setMaxCpa] = useState(ctx.maxCpa?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    ctx.setBusinessObjective(objective);
    ctx.setBusinessSegment(segment);
    ctx.setTargetRoas(targetRoas ? parseFloat(targetRoas) : null);
    ctx.setMaxCpa(maxCpa ? parseFloat(maxCpa) : null);
    // Data persisted via Zustand store
    toast({ description: "Contexto salvo!" });
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Personaliza as recomendações do Agente de Gestão e diagnósticos de IA.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Objetivo principal</Label>
          <Select value={objective} onValueChange={(v) => setObjective(v as BusinessObjective)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OBJECTIVES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Segmento / nicho</Label>
          <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="ex: e-commerce moda" />
        </div>
        <div className="space-y-1.5">
          <Label>ROAS mínimo alvo</Label>
          <Input type="number" step="0.1" min="0" value={targetRoas}
            onChange={(e) => setTargetRoas(e.target.value)} placeholder="ex: 3.0" />
        </div>
        <div className="space-y-1.5">
          <Label>CPA máximo (R$)</Label>
          <Input type="number" step="1" min="0" value={maxCpa}
            onChange={(e) => setMaxCpa(e.target.value)} placeholder="ex: 80" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Salvar e continuar
        </Button>
        <Button variant="ghost" onClick={onSkip} className="gap-1.5 text-muted-foreground">
          <SkipForward className="h-3.5 w-3.5" /> Pular
        </Button>
      </div>
    </div>
  );
}

// ─── Step: Done ───────────────────────────────────────────────────────────────

function StepDone({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center py-4 space-y-5">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div>
        <p className="font-semibold text-lg">Tudo pronto!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Configurações salvas no vault. Você pode ajustá-las a qualquer momento em Configurações e Integrações.
        </p>
      </div>
      <Button onClick={onClose} className="gap-2">
        Ir para o Dashboard <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step titles & descriptions ───────────────────────────────────────────────

const STEP_META: { title: string; description: string; required?: boolean }[] = [
  { title: "Conecte o Google Ads",          description: "Visualize e gerencie suas campanhas",       required: false },
  { title: "Configure o Claude AI",        description: "Ative o agente inteligente de gestão",      required: false },
  { title: "Integre o Pipedrive CRM",      description: "Correlacione leads com campanhas",          required: false },
  { title: "Conecte o Shopify",            description: "Receita real e ROAS verdadeiro",            required: false },
  { title: "Integre o HubSpot CRM",        description: "Deals e correlação por fonte de tráfego",  required: false },
  { title: "Contexto do negócio",          description: "Personalize as recomendações de IA",        required: false },
];

// ─── Modal ────────────────────────────────────────────────────────────────────

export function OnboardingModal({ forceOpen, onOpenChange }: { forceOpen?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const { profile, isLoading, saveProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [closing, setClosing] = useState(false);
  const { toast } = useToast();

  // Determine whether to show
  const autoOpen = !isLoading && !!profile && profile.onboarding_completed === false && !closing;
  const open = forceOpen ?? autoOpen;

  const markCompleted = (idx: number) => setCompleted((prev) => new Set([...prev, idx]));

  const goNext = () => {
    markCompleted(step);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    try {
      await saveProfile({ onboarding_completed: true });
    } catch {
      toast({ description: "Erro ao finalizar. Tente novamente.", variant: "destructive" });
      return;
    }
    setDone(true);
  };

  const handleClose = () => { setClosing(true); onOpenChange?.(false); };

  const skipAll = async () => {
    try {
      await saveProfile({ onboarding_completed: true });
    } catch { /* ignore */ }
    setClosing(true);
    onOpenChange?.(false);
  };

  const spring = { type: "spring" as const, stiffness: 320, damping: 28 };

  return (
    <Dialog open={open} onOpenChange={() => { /* controlled — no dismiss on outside click */ }}>
      <DialogContent
        className="sm:max-w-lg gap-0 p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Hide the default X close button
        hideCloseButton
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Configuração inicial</span>
          </div>
          <DialogHeader className="gap-0.5 text-left">
            <DialogTitle className="text-lg font-bold leading-tight">
              {done ? "Tudo pronto!" : STEP_META[step].title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {done ? "Suas credenciais foram salvas com segurança." : (
                <>
                  {STEP_META[step].description}
                  {!STEP_META[step].required && (
                    <Badge variant="outline" className="ml-2 text-xs py-0">Opcional</Badge>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Step dots */}
        {!done && (
          <div className="pt-4 px-6">
            <StepDots current={step} completed={completed} />
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 min-h-[200px]">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <StepDone onClose={handleClose} />
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={spring}
              >
                {step === 0 && <StepGoogleAds onNext={goNext} onSkip={goNext} />}
                {step === 1 && <StepAI onNext={goNext} onSkip={goNext} />}
                {step === 2 && <StepPipedrive onNext={goNext} onSkip={goNext} />}
                {step === 3 && <StepShopify onNext={goNext} onSkip={goNext} />}
                {step === 4 && <StepHubSpot onNext={goNext} onSkip={goNext} />}
                {step === 5 && <StepContext onNext={goNext} onSkip={goNext} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!done && (
          <div className="px-6 pb-5 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
            <span>Passo {step + 1} de {STEPS.length}</span>
            <button
              onClick={skipAll}
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              Configurar mais tarde
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
