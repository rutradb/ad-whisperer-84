import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useCampaignDetail } from "@/hooks/useCampaignDetail";
import { useUpdateCampaign } from "@/hooks/useCampaignMutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save } from "lucide-react";
import { microsToUnits, unitsToMicros } from "@/lib/google-ads/types";
import type { BiddingStrategyType } from "@/lib/google-ads/types";

const BIDDING_STRATEGIES: Array<{ value: BiddingStrategyType; label: string }> = [
  { value: "MAXIMIZE_CONVERSIONS", label: "Maximizar Conversões" },
  { value: "MAXIMIZE_CONVERSION_VALUE", label: "Maximizar Valor de Conversão" },
  { value: "TARGET_CPA", label: "CPA Desejado" },
  { value: "TARGET_ROAS", label: "ROAS Desejado" },
  { value: "MANUAL_CPC", label: "CPC Manual" },
  { value: "TARGET_SPEND", label: "Maximizar Cliques" },
  { value: "TARGET_IMPRESSION_SHARE", label: "Parcela de Impressões" },
];

export default function CampaignEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const { data: campaign, isLoading } = useCampaignDetail(customerId, id);
  const updateMutation = useUpdateCampaign();

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [biddingStrategy, setBiddingStrategy] = useState<BiddingStrategyType | "">("");
  const [targetCpa, setTargetCpa] = useState("");
  const [targetRoas, setTargetRoas] = useState("");
  const [targetGoogleSearch, setTargetGoogleSearch] = useState(true);
  const [targetSearchNetwork, setTargetSearchNetwork] = useState(false);
  const [targetContentNetwork, setTargetContentNetwork] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaign) return;
    setName(campaign.name || "");
    setIsActive(campaign.status === "ENABLED");
    setBiddingStrategy(campaign.biddingStrategyType || "");
    if (campaign.targetCpa?.targetCpaMicros) {
      setTargetCpa(String(microsToUnits(campaign.targetCpa.targetCpaMicros)));
    }
    if (campaign.targetRoas?.targetRoas) {
      setTargetRoas(String(campaign.targetRoas.targetRoas));
    }
    if (campaign.networkSettings) {
      setTargetGoogleSearch(campaign.networkSettings.targetGoogleSearch ?? true);
      setTargetSearchNetwork(campaign.networkSettings.targetSearchNetwork ?? false);
      setTargetContentNetwork(campaign.networkSettings.targetContentNetwork ?? false);
    }
    if (campaign.startDate) {
      // Google Ads date: YYYYMMDD → YYYY-MM-DD
      const d = campaign.startDate;
      setStartDate(d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d);
    }
    if (campaign.endDate) {
      const d = campaign.endDate;
      setEndDate(d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d);
    }
  }, [campaign]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Skeleton className="h-8 w-64" /></div>;
  if (!campaign) return <p className="text-center text-muted-foreground py-12">Campanha não encontrada.</p>;

  const handleSave = () => {
    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    if (!customerId) return;
    setError(null);

    const data: Record<string, any> = {
      name: name.trim(),
      status: isActive ? "ENABLED" : "PAUSED",
      networkSettings: {
        targetGoogleSearch,
        targetSearchNetwork,
        targetContentNetwork,
      },
    };

    if (biddingStrategy) data.biddingStrategyType = biddingStrategy;
    if (biddingStrategy === "TARGET_CPA" && targetCpa) {
      data.targetCpa = { targetCpaMicros: String(unitsToMicros(parseFloat(targetCpa))) };
    }
    if (biddingStrategy === "TARGET_ROAS" && targetRoas) {
      data.targetRoas = { targetRoas: parseFloat(targetRoas) };
    }
    if (startDate) data.startDate = startDate.replace(/-/g, "");
    if (endDate) data.endDate = endDate.replace(/-/g, "");

    // Update budget separately if changed
    if (dailyBudget && campaign.campaignBudget) {
      import("@/lib/google-ads/mutations").then(({ updateBudgetAmount }) => {
        updateBudgetAmount(customerId, campaign.campaignBudget, unitsToMicros(parseFloat(dailyBudget)));
      }).catch(console.error);
    }

    updateMutation.mutate(
      { customerId, resourceName: campaign.resourceName, data },
      { onSuccess: () => navigate(`/campaigns/${id}`) }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/campaigns">Campanhas</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/campaigns/${id}`}>{campaign.name}</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Editar</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">Editar Campanha</h1>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle>Configurações</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="status">Status (Ativa)</Label>
            <Switch id="status" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget Diario (R$)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 50.00"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Deixe vazio para manter o budget atual.</p>
          </div>

          <div className="space-y-2">
            <Label>Canal</Label>
            <Input value={campaign.advertisingChannelType || "--"} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">O tipo de canal não pode ser alterado após a criação.</p>
          </div>

          <div className="space-y-2">
            <Label>Estratégia de Lances</Label>
            <Select value={biddingStrategy} onValueChange={(v) => setBiddingStrategy(v as BiddingStrategyType)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {BIDDING_STRATEGIES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {biddingStrategy === "TARGET_CPA" && (
            <div className="space-y-2">
              <Label htmlFor="targetCpa">CPA Desejado (R$)</Label>
              <Input id="targetCpa" type="number" min="0.01" step="0.01" value={targetCpa} onChange={(e) => setTargetCpa(e.target.value)} />
            </div>
          )}

          {(biddingStrategy === "TARGET_ROAS" || biddingStrategy === "MAXIMIZE_CONVERSION_VALUE") && (
            <div className="space-y-2">
              <Label htmlFor="targetRoas">ROAS Desejado</Label>
              <Input id="targetRoas" type="number" min="0.01" step="0.01" value={targetRoas} onChange={(e) => setTargetRoas(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Configurações de Rede</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={targetGoogleSearch} onCheckedChange={(v) => setTargetGoogleSearch(!!v)} />
                <span className="text-sm">Pesquisa Google</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={targetSearchNetwork} onCheckedChange={(v) => setTargetSearchNetwork(!!v)} />
                <span className="text-sm">Rede de Pesquisa (parceiros)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={targetContentNetwork} onCheckedChange={(v) => setTargetContentNetwork(!!v)} />
                <span className="text-sm">Rede de Display</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Data de Início</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Data de Fim</Label>
              <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(`/campaigns/${id}`)}>Cancelar</Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}
        </Button>
      </div>
    </div>
  );
}
