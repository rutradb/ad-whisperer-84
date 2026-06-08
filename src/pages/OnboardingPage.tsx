import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2, Loader2, ChevronRight, SkipForward,
  Users, ShoppingBag, Sparkles, Target, Rocket,
  Eye, EyeOff, Link2, BarChart3, Brain,
} from "lucide-react";
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
import { listAccessibleCustomers, getCustomerDetails, getCustomerClients } from "@/lib/google-ads/customers";
import { cn } from "@/lib/utils";

// --- SecretInput ---

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

// --- Step definitions ---

const STEPS = [
  { id: "google-ads", icon: BarChart3, label: "Google Ads", required: true },
  { id: "ai",         icon: Brain,     label: "Claude AI",  required: false },
  { id: "pipedrive",  icon: Users,     label: "Pipedrive",  required: false },
  { id: "shopify",    icon: ShoppingBag, label: "Shopify",  required: false },
  { id: "hubspot",    icon: Link2,     label: "HubSpot",    required: false },
  { id: "context",    icon: Target,    label: "Contexto",   required: false },
] as const;

type StepId = typeof STEPS[number]["id"];

// --- Progress bar ---

function StepProgress({ current, completed }: { current: number; completed: Set<number> }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = completed.has(i);
        const active = i === current;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
              done ? "bg-primary text-primary-foreground" :
              active ? "bg-primary/15 text-primary border-2 border-primary" :
              "bg-muted text-muted-foreground"
            )}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-6 transition-colors", done ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Step: Google Ads (via Cloud Run proxy) ---

function StepGoogleAds({ onNext }: { onNext: () => void }) {
  const { cloudRunUrl, accessToken, setCloudRunUrl, setOAuthTokens, setLoginCustomerId: storeSetLcid, setSelectedCustomer } = useAuthStore();
  const [urlInput, setUrlInput] = useState(cloudRunUrl || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<GoogleAdsCustomer[]>([]);
  const [selectedCid, setSelectedCid] = useState<string>("");
  const { saveProfile } = useProfile();
  const { toast } = useToast();

  // Check if returning from OAuth callback with tokens in URL
  const params = new URLSearchParams(window.location.search);
  const urlAccessToken = params.get("access_token");
  const urlRefreshToken = params.get("refresh_token");
  const urlExpiresIn = params.get("expires_in");
  const urlLcid = params.get("login_customer_id");

  // Process OAuth callback tokens on mount
  useState(() => {
    if (urlAccessToken && urlRefreshToken && urlExpiresIn) {
      setOAuthTokens({
        accessToken: urlAccessToken,
        refreshToken: urlRefreshToken,
        expiresIn: Number(urlExpiresIn),
        loginCustomerId: urlLcid || undefined,
      });
      if (urlLcid) storeSetLcid(urlLcid);

      // Save tokens + cloud_run_url to Supabase
      const savedUrl = localStorage.getItem("cloud_run_url") || "";
      saveProfile({
        cloud_run_url: savedUrl,
        google_ads_access_token: urlAccessToken,
        google_ads_refresh_token: urlRefreshToken,
        google_ads_login_customer_id: urlLcid || null,
      }).catch(console.error);

      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Auto-load accounts
      loadAccounts();
    }
  });

  const hasTokens = !!(accessToken || urlAccessToken);
  const canConnect = urlInput.trim().length > 10;

  const handleConnect = () => {
    if (!canConnect) return;
    setCloudRunUrl(urlInput.trim());
    // Redirect to Cloud Run OAuth
    const redirect = `${window.location.origin}/onboarding`;
    window.location.href = `${urlInput.trim()}/auth/google?redirect=${encodeURIComponent(redirect)}`;
  };

  async function loadAccounts() {
    setLoading(true);
    try {
      // Try MCC child accounts first
      const lcid = localStorage.getItem("gads_login_customer_id");
      let adAccounts: GoogleAdsCustomer[] = [];

      if (lcid) {
        adAccounts = await getCustomerClients(lcid.replace(/-/g, ""));
        adAccounts = adAccounts.filter((c) => !c.manager);
      }

      if (adAccounts.length === 0) {
        const resourceNames = await listAccessibleCustomers();
        for (const rn of resourceNames.slice(0, 20)) {
          const rawId = rn.replace("customers/", "");
          if (rawId) {
            try {
              const detail = await getCustomerDetails(rawId);
              if (detail && !detail.manager) {
                detail.id = rawId;
                adAccounts.push(detail);
              }
            } catch { /* skip */ }
          }
        }
      }

      setCustomers(adAccounts);
      if (adAccounts.length === 0) {
        toast({ description: "Nenhuma conta de anuncios encontrada.", variant: "destructive" });
      } else {
        toast({ description: `${adAccounts.length} conta(s) encontrada(s).` });
      }
    } catch (err: any) {
      toast({ description: err.message || "Erro ao buscar contas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleSaveCustomer = async () => {
    const cust = customers.find((c) => c.id === selectedCid);
    if (!cust) return;
    setSaving(true);
    setSelectedCustomer(cust);
    await saveProfile({
      cloud_run_url: localStorage.getItem("cloud_run_url") || null,
      google_ads_access_token: localStorage.getItem("gads_access_token") || null,
      google_ads_refresh_token: localStorage.getItem("gads_refresh_token") || null,
      google_ads_login_customer_id: localStorage.getItem("gads_login_customer_id") || null,
      google_ads_customer_json: cust as any,
      google_ads_customer_id: cust.id,
    }).catch(console.error);
    setSaving(false);
    onNext();
  };

  // Already has tokens — show account selection
  if (hasTokens && customers.length > 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" /> Google Ads conectado
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Selecione a conta de anuncios.</p>
        </div>
        <div className="space-y-3">
          <Label>Conta de anuncios</Label>
          <Select value={selectedCid} onValueChange={setSelectedCid}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma conta..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((cust) => (
                <SelectItem key={cust.id} value={cust.id}>
                  {cust.descriptiveName || "Sem nome"} ({cust.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSaveCustomer} disabled={!selectedCid || saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Usar esta conta
          </Button>
        </div>
      </div>
    );
  }

  // Loading accounts after OAuth callback
  if (hasTokens && loading) {
    return (
      <div className="space-y-5 text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Buscando contas...</p>
      </div>
    );
  }

  // Show Cloud Run URL + connect button
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Conecte o Google Ads</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cole a URL do seu servidor Google Ads (Cloud Run) e clique em conectar.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>URL do servidor (Cloud Run)</Label>
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://google-ads-proxy-xxxxx-uc.a.run.app"
          disabled={loading}
          className="font-mono text-sm"
        />
      </div>

      <Button onClick={handleConnect} disabled={!canConnect || loading} size="lg" className="gap-2 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-8.1 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Conectar com Google Ads
      </Button>

      {customers.length > 0 && (
        <div className="space-y-3">
          <Label>Selecione a conta de anuncios</Label>
          <Select value={selectedCid} onValueChange={setSelectedCid}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma conta..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((cust) => (
                <SelectItem key={cust.id} value={cust.id}>
                  {cust.descriptiveName || "Sem nome"} ({cust.id}){cust.manager ? " [MCC]" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSaveCustomer} disabled={!selectedCid || saving} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Usar esta conta
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Step: Claude AI ---

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
      toast({ description: "Erro ao salvar. Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">Claude AI</h2>
          <Badge variant="outline" className="text-xs">Recomendado</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Habilita o Agente de Gestao, diagnosticos e geracao de copy com IA.
          Obtenha sua chave em{" "}
          <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">console.anthropic.com</span>.
        </p>
      </div>
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

// --- Step: Pipedrive ---

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
        toast({ description: "Pipedrive conectado!" });
        onNext();
      } else {
        store.setPipedriveConnected(false);
        toast({ description: "Token invalido. Verifique o API Token.", variant: "destructive" });
      }
    } catch {
      toast({ description: "Erro ao conectar. Verifique o token.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">Pipedrive CRM</h2>
          <Badge variant="outline" className="text-xs">Opcional</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Correlacione deals e leads com campanhas Google Ads.
        </p>
      </div>
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

// --- Step: Shopify ---

function StepShopify({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const store = useIntegrationsStore();
  const { toast } = useToast();

  const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-proxy`;

  const handleConnect = async () => {
    if (!storeUrl.trim() || !accessToken.trim()) return;
    setLoading(true);
    const cleanUrl = storeUrl.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: cleanUrl, token: accessToken.trim(), path: "/shop.json" }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json() as { shop?: { name?: string } };
      if (!data.shop?.name) throw new Error("Token invalido.");
      store.setShopifyStoreUrl(cleanUrl);
      store.setShopifyAccessToken(accessToken.trim());
      store.setShopifyConnected(true);
      toast({ description: `Shopify conectado: ${data.shop.name}` });
      onNext();
    } catch {
      store.setShopifyConnected(false);
      toast({ description: "Falha ao validar Shopify.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">Shopify</h2>
          <Badge variant="outline" className="text-xs">Opcional</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Receita real, ROAS verdadeiro e pedidos por campanha.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>URL da loja</Label>
          <Input value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="minhaloja.myshopify.com" className="font-mono text-sm" disabled={loading} />
        </div>
        <div className="space-y-1.5">
          <Label>Admin Access Token</Label>
          <SecretInput value={accessToken} onChange={setAccessToken} placeholder="shpat_..." disabled={loading} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleConnect} disabled={!storeUrl.trim() || !accessToken.trim() || loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          Validar e conectar
        </Button>
        <Button variant="ghost" onClick={onSkip} className="gap-1.5 text-muted-foreground">
          <SkipForward className="h-3.5 w-3.5" /> Pular
        </Button>
      </div>
    </div>
  );
}

// --- Step: HubSpot ---

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
        headers: { Authorization: `Bearer ${accessToken.trim()}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      store.setHubSpotAccessToken(accessToken.trim());
      store.setHubSpotConnected(true);
      toast({ description: "HubSpot conectado!" });
      onNext();
    } catch {
      store.setHubSpotConnected(false);
      toast({ description: "Token invalido ou sem permissao.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">HubSpot CRM</h2>
          <Badge variant="outline" className="text-xs">Opcional</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Correlacione deals e contatos com campanhas Google Ads.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Access Token</Label>
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

// --- Step: Business context ---

const OBJECTIVES: { value: BusinessObjective; label: string }[] = [
  { value: "conversions", label: "Conversoes" },
  { value: "leads",       label: "Geracao de leads" },
  { value: "traffic",     label: "Trafego" },
  { value: "awareness",   label: "Reconhecimento de marca" },
];

function StepContext({ onNext }: { onNext: () => void }) {
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
    toast({ description: "Contexto salvo!" });
    setSaving(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Contexto do negocio</h2>
        <p className="text-sm text-muted-foreground mt-1">Personaliza as recomendacoes do Agente de Gestao e diagnosticos de IA.</p>
      </div>
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
          <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="ex: e-commerce moda feminina" />
        </div>
        <div className="space-y-1.5">
          <Label>ROAS minimo alvo</Label>
          <Input type="number" step="0.1" min="0" value={targetRoas} onChange={(e) => setTargetRoas(e.target.value)} placeholder="ex: 3.0" />
        </div>
        <div className="space-y-1.5">
          <Label>CPA maximo (R$)</Label>
          <Input type="number" step="1" min="0" value={maxCpa} onChange={(e) => setMaxCpa(e.target.value)} placeholder="ex: 80" />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} className="gap-1.5">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Salvar e continuar
      </Button>
    </div>
  );
}

// --- Step: Done ---

function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="space-y-6 text-center py-4">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Rocket className="h-10 w-10 text-primary" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Tudo pronto!</h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
          Sua plataforma esta configurada. Voce pode ajustar qualquer configuracao a qualquer momento em Configuracoes.
        </p>
      </div>
      <Button onClick={onFinish} size="lg" className="gap-2">
        Ir para o Dashboard <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// --- Page ---

const STEP_COUNT = STEPS.length;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const { saveProfile } = useProfile();
  const { toast } = useToast();

  const markCompleted = (idx: number) =>
    setCompleted((prev) => new Set([...prev, idx]));

  const goNext = () => {
    markCompleted(currentStep);
    if (currentStep < STEP_COUNT - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      await saveProfile({ onboarding_completed: true });
    } catch {
      toast({ description: "Erro ao finalizar. Tente novamente.", variant: "destructive" });
      return;
    }
    setDone(true);
  };

  const navigateToDashboard = () => navigate("/dashboard", { replace: true });

  const handleSkipAll = async () => {
    try {
      await saveProfile({ onboarding_completed: true });
      navigate("/dashboard", { replace: true });
    } catch {
      toast({ description: "Erro ao pular. Tente novamente.", variant: "destructive" });
    }
  };

  const spring = { type: "spring" as const, stiffness: 320, damping: 28 };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Configuracao inicial
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Google Ads Manager Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Vamos configurar sua plataforma em poucos minutos</p>
        </div>

        {!done && (
          <div className="flex justify-center mb-8">
            <StepProgress current={currentStep} completed={completed} />
          </div>
        )}

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <StepDone onFinish={navigateToDashboard} />
              </motion.div>
            ) : (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={spring}
              >
                {currentStep === 0 && <StepGoogleAds onNext={goNext} />}
                {currentStep === 1 && <StepAI onNext={goNext} onSkip={goNext} />}
                {currentStep === 2 && <StepPipedrive onNext={goNext} onSkip={goNext} />}
                {currentStep === 3 && <StepShopify onNext={goNext} onSkip={goNext} />}
                {currentStep === 4 && <StepHubSpot onNext={goNext} onSkip={goNext} />}
                {currentStep === 5 && <StepContext onNext={goNext} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!done && (
          <div className="text-center mt-4 space-y-1">
            <p className="text-xs text-muted-foreground">
              Passo {currentStep + 1} de {STEP_COUNT}
            </p>
            <button
              onClick={handleSkipAll}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Pular configuração e ir para o Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
