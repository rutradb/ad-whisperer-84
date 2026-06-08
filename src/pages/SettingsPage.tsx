import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuthStore, type GoogleAdsCustomer } from "@/store/useAuthStore";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Plug, Settings2, Sparkles, Building2,
  Check, X, ExternalLink, ShieldCheck, Zap, ChevronRight,
  Sun, Moon, Monitor, Calendar, Globe, Hash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { usePreferencesStore, type DatePreset, type Currency, type NumberFormat } from "@/store/usePreferencesStore";

const spring = { type: "spring" as const, stiffness: 300, damping: 24 };

export default function SettingsPage() {
  const [cloudRunInput, setCloudRunInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<GoogleAdsCustomer[]>([]);
  const {
    accessToken, selectedCustomer, anthropicApiKey, cloudRunUrl,
    setCloudRunUrl, setSelectedCustomer, setAnthropicApiKey, clearAnthropicApiKey, clearGoogleAdsConnection,
  } = useAuthStore();
  const [anthropicInput, setAnthropicInput] = useState("");
  const { toast } = useToast();
  const { saveProfile } = useProfile();

  const isConnected = !!accessToken && !!selectedCustomer;

  const handleConnect = async () => {
    const url = cloudRunInput.trim() || cloudRunUrl || "";
    if (!url) {
      toast({ title: "Cole a URL do Cloud Run", variant: "destructive" });
      return;
    }
    setCloudRunUrl(url);
    const redirect = `${window.location.origin}/settings`;
    window.location.href = `${url}/auth/google?redirect=${encodeURIComponent(redirect)}`;
  };

  // Handle OAuth callback tokens in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const at = params.get("access_token");
    const rt = params.get("refresh_token");
    const ei = params.get("expires_in");
    const lcid = params.get("login_customer_id");
    if (at && rt && ei) {
      const { setOAuthTokens, setLoginCustomerId } = useAuthStore.getState();
      setOAuthTokens({ accessToken: at, refreshToken: rt, expiresIn: Number(ei), loginCustomerId: lcid || undefined });
      if (lcid) setLoginCustomerId(lcid);
      saveProfile({
        cloud_run_url: localStorage.getItem("cloud_run_url") || null,
        google_ads_access_token: at,
        google_ads_refresh_token: rt,
        google_ads_login_customer_id: lcid || null,
      }).catch(console.error);
      window.history.replaceState({}, "", window.location.pathname);
      toast({ title: "Google Ads conectado!" });
    }
  }, []);

  const handleDisconnect = () => {
    clearGoogleAdsConnection();
    setCustomers([]);
    saveProfile({ google_ads_access_token: null, google_ads_refresh_token: null, google_ads_customer_json: null, google_ads_customer_id: null, google_ads_login_customer_id: null }).catch(console.error);
    toast({ title: "Desconectado" });
  };


  const handleAnthropicConnect = () => {
    if (!anthropicInput.trim()) return;
    setAnthropicApiKey(anthropicInput.trim());
    saveProfile({ anthropic_api_key: anthropicInput.trim() }).catch(console.error);
    setAnthropicInput("");
    toast({ title: "API Key Anthropic configurada!" });
  };

  const handleAnthropicDisconnect = () => {
    clearAnthropicApiKey();
    saveProfile({ anthropic_api_key: null }).catch(console.error);
    toast({ title: "API Key removida" });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <h1 className="font-display text-2xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie suas integracoes e preferencias</p>
      </motion.div>

      <Tabs defaultValue="integrations">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="integrations" className="gap-2 data-[state=active]:shadow-sm">
            <Plug className="h-4 w-4" /> Integracoes
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 data-[state=active]:shadow-sm">
            <Settings2 className="h-4 w-4" /> Preferencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          {/* Customer Info */}
          <AnimatePresence>
            {isConnected && selectedCustomer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
              >
                <IntegrationCard
                  icon={Building2}
                  title="Informacoes da Conta"
                  subtitle="Dados do cliente Google Ads"
                  status="connected"
                  index={0}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Nome", selectedCustomer.descriptiveName || "--"],
                      ["ID", selectedCustomer.id],
                      ["Moeda", selectedCustomer.currencyCode || "--"],
                      ["Fuso", selectedCustomer.timeZone || "--"],
                      ["Optimization Score", selectedCustomer.optimizationScore != null ? `${(selectedCustomer.optimizationScore * 100).toFixed(0)}%` : "--"],
                      ["Tipo", selectedCustomer.manager ? "MCC (Gerenciador)" : "Conta de Anuncios"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-muted/40 px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
                        <p className="text-sm font-semibold mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </IntegrationCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Ads API */}
          <IntegrationCard
            icon={Zap}
            title="Google Ads API"
            subtitle="Conecte sua conta do Google Ads"
            status={isConnected ? "connected" : "disconnected"}
            index={1}
          >
            <AnimatePresence mode="wait">
              {!isConnected ? (
                <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL do servidor (Cloud Run)</Label>
                      <Input
                        placeholder="https://google-ads-proxy-xxxxx.run.app"
                        value={cloudRunInput || cloudRunUrl || ""}
                        onChange={(e) => setCloudRunInput(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button onClick={handleConnect} disabled={loading} className="rounded-xl px-6 gap-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                      Conectar com Google Ads
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{selectedCustomer?.descriptiveName || "Conta Google Ads"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{selectedCustomer?.id}</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl gap-2">
                    <X className="h-3.5 w-3.5" /> Desconectar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </IntegrationCard>

          {/* Anthropic */}
          <IntegrationCard
            icon={Sparkles}
            title="Claude AI (Anthropic)"
            subtitle="Gerador de Copy com IA"
            status={anthropicApiKey ? "connected" : "disconnected"}
            index={2}
          >
            <AnimatePresence mode="wait">
              {!anthropicApiKey ? (
                <motion.div key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Key</Label>
                    <Input
                      id="anthropic-key"
                      type="password"
                      placeholder="sk-ant-..."
                      value={anthropicInput}
                      onChange={(e) => setAnthropicInput(e.target.value)}
                      className="font-mono text-xs bg-muted/30 border-border/50 focus:border-primary/40 rounded-xl"
                    />
                    <a
                      href="https://console.anthropic.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Obter key em console.anthropic.com <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Button onClick={handleAnthropicConnect} disabled={!anthropicInput.trim()} className="rounded-xl px-6">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Conectar
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">API Key configurada</p>
                      <p className="font-mono text-xs text-muted-foreground">sk-ant-*****{anthropicApiKey.slice(-6)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleAnthropicDisconnect} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl gap-2">
                    <X className="h-3.5 w-3.5" /> Desconectar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </IntegrationCard>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-4">
          <PreferencesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* Reusable integration card */
function IntegrationCard({
  icon: Icon,
  title,
  subtitle,
  status,
  index,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  status: "connected" | "disconnected" | "neutral";
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.08 }}
    >
      <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-[15px]">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {status !== "neutral" && (
            <Badge
              variant="outline"
              className={
                status === "connected"
                  ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] font-medium"
                  : "border-destructive/30 bg-destructive/10 text-destructive font-medium"
              }
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${status === "connected" ? "bg-[hsl(var(--success))]" : "bg-destructive"}`} />
              {status === "connected" ? "Conectado" : "Desconectado"}
            </Badge>
          )}
        </div>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* Preferences Section */
const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_7d", label: "Ultimos 7 dias" },
  { value: "last_14d", label: "Ultimos 14 dias" },
  { value: "last_30d", label: "Ultimos 30 dias" },
  { value: "last_90d", label: "Ultimos 90 dias" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes passado" },
];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "BRL", label: "R$ — Real Brasileiro" },
  { value: "USD", label: "$ — Dolar Americano" },
  { value: "EUR", label: "EUR — Euro" },
];

const NUMBER_FORMAT_OPTIONS: { value: NumberFormat; label: string }[] = [
  { value: "pt-BR", label: "1.234,56 (Brasil)" },
  { value: "en-US", label: "1,234.56 (EUA)" },
];

function PreferencesSection() {
  const { theme, setTheme } = useTheme();
  const { defaultDatePreset, currency, numberFormat, compactNumbers, setDefaultDatePreset, setCurrency, setNumberFormat, setCompactNumbers } = usePreferencesStore();

  const themeOptions = [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Escuro" },
    { value: "system", icon: Monitor, label: "Sistema" },
  ];

  return (
    <>
      <IntegrationCard icon={Sun} title="Aparencia" subtitle="Tema visual do aplicativo" status="neutral" index={0}>
        <div className="flex gap-2">
          {themeOptions.map((opt) => {
            const isActive = theme === opt.value;
            return (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setTheme(opt.value)}
                className={`flex-1 flex flex-col items-center gap-2 rounded-xl border px-4 py-4 transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/8 text-primary"
                    : "border-border/50 bg-card text-muted-foreground hover:border-border hover:bg-muted/40"
                }`}
              >
                <opt.icon className="h-5 w-5" />
                <span className="text-xs font-semibold">{opt.label}</span>
                {isActive && (
                  <motion.div layoutId="theme-check" className="h-1.5 w-6 rounded-full bg-primary" transition={{ type: "spring" as const, stiffness: 350, damping: 30 }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </IntegrationCard>

      <IntegrationCard icon={Calendar} title="Dados & Metricas" subtitle="Periodo padrao e formatacao de valores" status="neutral" index={1}>
        <div className="space-y-5">
          <PreferenceRow label="Periodo padrao" description="Usado como padrao nos relatorios e dashboards">
            <Select value={defaultDatePreset} onValueChange={(v) => setDefaultDatePreset(v as DatePreset)}>
              <SelectTrigger className="w-[200px] rounded-xl bg-muted/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESET_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow label="Moeda" description="Moeda exibida nos valores monetarios">
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger className="w-[200px] rounded-xl bg-muted/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow label="Formato numerico" description="Como numeros e decimais sao exibidos">
            <Select value={numberFormat} onValueChange={(v) => setNumberFormat(v as NumberFormat)}>
              <SelectTrigger className="w-[200px] rounded-xl bg-muted/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMBER_FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PreferenceRow>

          <PreferenceRow label="Numeros compactos" description="Exibir valores grandes como 1.2K, 3.5M">
            <Switch checked={compactNumbers} onCheckedChange={setCompactNumbers} />
          </PreferenceRow>
        </div>
      </IntegrationCard>
    </>
  );
}

function PreferenceRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
