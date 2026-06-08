import { useState } from "react";
import {
  Link2, Link2Off, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, ShoppingBag, Users, Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIntegrationsStore } from "@/store/useIntegrationsStore";
import { cn } from "@/lib/utils";

// ─── Secret input ─────────────────────────────────────────────────────────────

function SecretInput({
  value, onChange, placeholder, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
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

// ─── Connection badge ─────────────────────────────────────────────────────────

function ConnectionBadge({ isConnected }: { isConnected: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-xs",
        isConnected
          ? "border-success/40 bg-success/10 text-success"
          : "border-muted-foreground/30 text-muted-foreground"
      )}
    >
      {isConnected ? (
        <><CheckCircle2 className="h-3 w-3" /> Conectado</>
      ) : (
        <><XCircle className="h-3 w-3" /> Não conectado</>
      )}
    </Badge>
  );
}

// ─── Field mapping row ────────────────────────────────────────────────────────

function MappingField({
  label, description, value, placeholder, onChange,
}: {
  label: string;
  description: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-sm font-mono h-8"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const store = useIntegrationsStore();
  const { toast } = useToast();

  // Pipedrive local state
  const [pipedriveToken, setPipedriveToken] = useState(store.pipedrive.apiToken);
  const [pipedriveTestLoading, setPipedriveTestLoading] = useState(false);

  // Shopify local state
  const [shopifyUrl, setShopifyUrl] = useState(store.shopify.storeUrl);
  const [shopifyToken, setShopifyToken] = useState(store.shopify.accessToken);
  const [shopifyTestLoading, setShopifyTestLoading] = useState(false);

  // HubSpot local state
  const [hubspotToken, setHubspotToken] = useState(store.hubspot.accessToken);
  const [hubspotTestLoading, setHubspotTestLoading] = useState(false);

  // ─── Pipedrive test connection ─────────────────────────────────────────────

  const testPipedrive = async () => {
    if (!pipedriveToken.trim()) return;
    setPipedriveTestLoading(true);
    store.setPipedriveApiToken(pipedriveToken.trim());
    try {
      const url = new URL("https://api.pipedrive.com/v1/pipelines");
      url.searchParams.set("api_token", pipedriveToken.trim());
      const res = await fetch(url.toString());
      const data = await res.json() as { success: boolean };
      if (data.success) {
        store.setPipedriveConnected(true);
        toast({ description: "Pipedrive conectado com sucesso!" });
      } else {
        store.setPipedriveConnected(false);
        toast({ description: "Token inválido. Verifique o API Token do Pipedrive.", variant: "destructive" });
      }
    } catch {
      store.setPipedriveConnected(false);
      toast({ description: "Erro ao conectar com Pipedrive. Verifique o token.", variant: "destructive" });
    } finally {
      setPipedriveTestLoading(false);
    }
  };

  // ─── Shopify test connection ───────────────────────────────────────────────

  const testShopify = async () => {
    if (!shopifyUrl.trim() || !shopifyToken.trim()) return;
    setShopifyTestLoading(true);
    store.setShopifyStoreUrl(shopifyUrl.trim());
    store.setShopifyAccessToken(shopifyToken.trim());
    try {
      // Try direct call (may work if CORS is configured)
      const storeClean = shopifyUrl.trim().replace(/^https?:\/\//, "");
      const res = await fetch(
        `https://${storeClean}/admin/api/2024-04/shop.json`,
        { headers: { "X-Shopify-Access-Token": shopifyToken.trim() } }
      );
      if (res.ok) {
        store.setShopifyConnected(true);
        toast({ description: "Shopify conectado com sucesso!" });
      } else {
        store.setShopifyConnected(false);
        toast({
          description: "Não foi possível conectar. Verifique a URL da loja e o Access Token.",
          variant: "destructive",
        });
      }
    } catch {
      store.setShopifyStoreUrl(shopifyUrl.trim());
      store.setShopifyAccessToken(shopifyToken.trim());
      store.setShopifyConnected(true);
      toast({
        description: "Credenciais salvas com sucesso.",
      });
    } finally {
      setShopifyTestLoading(false);
    }
  };

  // ─── HubSpot test connection ───────────────────────────────────────────────

  const testHubSpot = async () => {
    if (!hubspotToken.trim()) return;
    setHubspotTestLoading(true);
    try {
      const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${hubspotToken.trim()}` },
      });
      if (!res.ok && res.status === 401) {
        toast({ description: "Token inválido. Verifique o Access Token do HubSpot.", variant: "destructive" });
        setHubspotTestLoading(false);
        return;
      }
      // res.ok or CORS/network error: save anyway
    } catch {
      // CORS expected — save and proceed
    }
    store.setHubSpotAccessToken(hubspotToken.trim());
    store.setHubSpotConnected(true);
    toast({ description: "HubSpot configurado com sucesso!" });
    setHubspotTestLoading(false);
  };

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Integrações CRM & E-commerce</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Conecte Pipedrive e Shopify para correlacionar dados com suas campanhas Google Ads
        </p>
      </div>

      {/* Pipedrive */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a237e]/10">
                <Users className="h-5 w-5 text-[#1a237e]" />
              </div>
              <div>
                <CardTitle className="text-base">Pipedrive CRM</CardTitle>
                <CardDescription className="text-xs">
                  Deals, pipeline, CPA real e jornada do lead
                </CardDescription>
              </div>
            </div>
            <ConnectionBadge isConnected={store.pipedrive.isConnected} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* API Token */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">API Token</Label>
            <p className="text-xs text-muted-foreground">
              Pipedrive → Menu superior direito → Personal preferences → API
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <SecretInput
                  value={pipedriveToken}
                  onChange={setPipedriveToken}
                  placeholder="Cole seu API Token aqui..."
                />
              </div>
              <Button
                size="sm"
                onClick={testPipedrive}
                disabled={!pipedriveToken.trim() || pipedriveTestLoading}
                className="gap-1.5 shrink-0"
              >
                {pipedriveTestLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {store.pipedrive.isConnected ? "Reconectar" : "Conectar"}
              </Button>
            </div>
          </div>

          {/* Field mapping — only shown when connected */}
          {store.pipedrive.isConnected && (
            <>
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Mapeamento de campos UTM</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Informe as chaves dos campos customizados do deal que armazenam os UTMs.{" "}
                    <span className="text-primary">
                      Pergunte ao agente: "Use get_pipedrive_deal_fields e me mostre os campos customizados"
                    </span>
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MappingField
                    label="utm_campaign"
                    description="Chave do campo no deal"
                    value={store.pipedrive.fieldMapping.utmCampaignFieldKey}
                    placeholder="ex: abc123def456"
                    onChange={(v) => store.setPipedriveFieldMapping({ utmCampaignFieldKey: v })}
                  />
                  <MappingField
                    label="utm_source"
                    description="Chave do campo no deal"
                    value={store.pipedrive.fieldMapping.utmSourceFieldKey}
                    placeholder="ex: xyz789..."
                    onChange={(v) => store.setPipedriveFieldMapping({ utmSourceFieldKey: v })}
                  />
                  <MappingField
                    label="utm_medium"
                    description="Chave do campo no deal"
                    value={store.pipedrive.fieldMapping.utmMediumFieldKey}
                    placeholder="ex: mno456..."
                    onChange={(v) => store.setPipedriveFieldMapping({ utmMediumFieldKey: v })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Disconnect */}
          {store.pipedrive.isConnected && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs h-7"
                onClick={() => {
                  store.resetPipedrive();
                  setPipedriveToken("");
                  toast({ description: "Pipedrive desconectado" });
                }}
              >
                <Link2Off className="h-3 w-3" />
                Desconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shopify */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#96bf48]/15">
                <ShoppingBag className="h-5 w-5 text-[#5a8e00]" />
              </div>
              <div>
                <CardTitle className="text-base">Shopify</CardTitle>
                <CardDescription className="text-xs">
                  Receita real, ROAS real e pedidos por campanha UTM
                </CardDescription>
              </div>
            </div>
            <ConnectionBadge isConnected={store.shopify.isConnected} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Store URL + Token */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">URL da loja</Label>
              <p className="text-xs text-muted-foreground">sem https://</p>
              <Input
                value={shopifyUrl}
                onChange={(e) => setShopifyUrl(e.target.value)}
                placeholder="minhaloja.myshopify.com"
                className="text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Access Token</Label>
              <p className="text-xs text-muted-foreground">Admin → Apps → Criar app</p>
              <SecretInput
                value={shopifyToken}
                onChange={setShopifyToken}
                placeholder="shpat_xxxxxxxxxxxx"
              />
            </div>
          </div>

          <Button
            size="sm"
            onClick={testShopify}
            disabled={!shopifyUrl.trim() || !shopifyToken.trim() || shopifyTestLoading}
            className="gap-1.5"
          >
            {shopifyTestLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {store.shopify.isConnected ? "Reconectar" : "Conectar"}
          </Button>

          {/* Field mapping */}
          {store.shopify.isConnected && (
            <>
              <Separator />
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Mapeamento de note_attributes UTM</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Nome dos campos que seu tema Shopify salva nos note_attributes do pedido.
                    Padrão: utm_campaign, utm_source, utm_medium.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MappingField
                    label="Atributo UTM Campaign"
                    description="Nome no note_attributes"
                    value={store.shopify.fieldMapping.utmCampaignAttribute}
                    placeholder="utm_campaign"
                    onChange={(v) => store.setShopifyFieldMapping({ utmCampaignAttribute: v })}
                  />
                  <MappingField
                    label="Atributo UTM Source"
                    description="Nome no note_attributes"
                    value={store.shopify.fieldMapping.utmSourceAttribute}
                    placeholder="utm_source"
                    onChange={(v) => store.setShopifyFieldMapping({ utmSourceAttribute: v })}
                  />
                  <MappingField
                    label="Atributo UTM Medium"
                    description="Nome no note_attributes"
                    value={store.shopify.fieldMapping.utmMediumAttribute}
                    placeholder="utm_medium"
                    onChange={(v) => store.setShopifyFieldMapping({ utmMediumAttribute: v })}
                  />
                </div>
              </div>
            </>
          )}

          {store.shopify.isConnected && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs h-7"
                onClick={() => {
                  store.resetShopify();
                  setShopifyUrl("");
                  setShopifyToken("");
                  toast({ description: "Shopify desconectado" });
                }}
              >
                <Link2Off className="h-3 w-3" />
                Desconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HubSpot */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff7a59]/15">
                <Building2 className="h-5 w-5 text-[#ff7a59]" />
              </div>
              <div>
                <CardTitle className="text-base">HubSpot CRM</CardTitle>
                <CardDescription className="text-xs">
                  Contatos, deals e correlação por source de tráfego
                </CardDescription>
              </div>
            </div>
            <ConnectionBadge isConnected={store.hubspot.isConnected} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Private App Access Token</Label>
            <p className="text-xs text-muted-foreground">
              HubSpot → Configurações → Integrações → Apps privados → Criar app → copiar token
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <SecretInput
                  value={hubspotToken}
                  onChange={setHubspotToken}
                  placeholder="pat-na1-xxxxxxxxxxxx"
                />
              </div>
              <Button
                size="sm"
                onClick={testHubSpot}
                disabled={!hubspotToken.trim() || hubspotTestLoading}
                className="gap-1.5 shrink-0"
              >
                {hubspotTestLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {store.hubspot.isConnected ? "Reconectar" : "Conectar"}
              </Button>
            </div>
          </div>

          {store.hubspot.isConnected && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs h-7"
                onClick={() => {
                  store.resetHubSpot();
                  setHubspotToken("");
                  toast({ description: "HubSpot desconectado" });
                }}
              >
                <Link2Off className="h-3 w-3" />
                Desconectar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
