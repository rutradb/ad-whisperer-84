import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCreateAdGroup } from "@/hooks/useAdGroupMutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { unitsToMicros } from "@/lib/google-ads/types";
import type { AdGroupType } from "@/lib/google-ads/types";

const AD_GROUP_TYPES: Array<{ value: AdGroupType; label: string }> = [
  { value: "SEARCH_STANDARD", label: "Pesquisa (Padrão)" },
  { value: "DISPLAY_STANDARD", label: "Display (Padrão)" },
  { value: "SHOPPING_PRODUCT_ADS", label: "Shopping" },
  { value: "VIDEO_BUMPER", label: "Vídeo Bumper" },
  { value: "VIDEO_TRUE_VIEW_IN_STREAM", label: "Vídeo TrueView In-stream" },
];

export default function AdSetCreatePage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const createAdGroup = useCreateAdGroup();

  const [step, setStep] = useState(1);

  // Step 1 - Campaign selection
  const [campaignId, setCampaignId] = useState("");
  const { data: campaignsData } = useCampaigns(customerId ?? undefined, {
    status: "ENABLED",
  });
  const campaigns = campaignsData || [];
  const selectedCampaign = campaigns.find((c: any) => c.id === campaignId);

  // Step 2 - Ad Group config
  const [name, setName] = useState("");
  const [adGroupType, setAdGroupType] = useState<AdGroupType | "">("");
  const [cpcBid, setCpcBid] = useState("");
  const [targetCpa, setTargetCpa] = useState("");

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Novo Grupo de Anúncios</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const handleCreate = async () => {
    if (!selectedCampaign || !customerId) return;

    const data: any = {
      name: name || `${selectedCampaign.name} - Grupo`,
      campaign: selectedCampaign.resourceName,
      status: "PAUSED",
    };

    if (adGroupType) data.type = adGroupType;
    if (cpcBid) data.cpcBidMicros = String(unitsToMicros(parseFloat(cpcBid)));
    if (targetCpa) data.targetCpaMicros = String(unitsToMicros(parseFloat(targetCpa)));

    const result = await createAdGroup.mutateAsync({ customerId, data });
    navigate("/adsets");
  };

  const canProceedStep1 = !!campaignId;
  const canProceedStep2 = !!name;

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/adsets">Grupos de Anúncios</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Novo Grupo de Anúncios</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">Novo Grupo de Anúncios</h1>

      {/* Step indicators */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-2 flex-1 rounded-full", s <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      {/* Step 1: Campaign */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>1. Selecione a Campanha</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campanha</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma campanha" /></SelectTrigger>
                <SelectContent>
                  {campaigns.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCampaign && (
              <div className="text-sm text-muted-foreground">
                Canal: <span className="font-medium">{selectedCampaign.advertisingChannelType}</span> · Status: <span className="font-medium">{selectedCampaign.status}</span>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>Próximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Config */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>2. Configurações do Grupo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Grupo de Anúncios</Label>
              <Input placeholder="Ex: Grupo - Palavras Marca" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Grupo</Label>
              <Select value={adGroupType} onValueChange={(v) => setAdGroupType(v as AdGroupType)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {AD_GROUP_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CPC Bid (R$, opcional)</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="2.50" value={cpcBid} onChange={(e) => setCpcBid(e.target.value)} />
              <p className="text-xs text-muted-foreground">Lance máximo por clique. Deixe vazio para usar a estratégia da campanha.</p>
            </div>
            <div className="space-y-2">
              <Label>CPA Desejado (R$, opcional)</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="25.00" value={targetCpa} onChange={(e) => setTargetCpa(e.target.value)} />
              <p className="text-xs text-muted-foreground">Disponível apenas quando a campanha usa estratégia TARGET_CPA.</p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>Próximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>3. Revisão</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div><span className="text-muted-foreground">Campanha:</span> <strong>{selectedCampaign?.name}</strong> ({selectedCampaign?.advertisingChannelType})</div>
              <div><span className="text-muted-foreground">Nome do Grupo:</span> <strong>{name}</strong></div>
              {adGroupType && <div><span className="text-muted-foreground">Tipo:</span> {AD_GROUP_TYPES.find(t => t.value === adGroupType)?.label}</div>}
              {cpcBid && <div><span className="text-muted-foreground">CPC Bid:</span> R$ {cpcBid}</div>}
              {targetCpa && <div><span className="text-muted-foreground">CPA Desejado:</span> R$ {targetCpa}</div>}
            </div>
            <Alert>
              <AlertDescription>O grupo de anúncios será criado com status <strong>PAUSADO</strong> por segurança.</AlertDescription>
            </Alert>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={handleCreate} disabled={createAdGroup.isPending}>
                {createAdGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Grupo de Anúncios
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
