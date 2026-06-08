import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdGroupDetail } from "@/hooks/useAdGroupDetail";
import { useUpdateAdGroup } from "@/hooks/useAdGroupMutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";
import { microsToUnits, unitsToMicros } from "@/lib/google-ads/types";
import type { AdGroupType } from "@/lib/google-ads/types";

const AD_GROUP_TYPES: Array<{ value: AdGroupType; label: string }> = [
  { value: "SEARCH_STANDARD", label: "Pesquisa (Padrão)" },
  { value: "DISPLAY_STANDARD", label: "Display (Padrão)" },
  { value: "SHOPPING_PRODUCT_ADS", label: "Shopping" },
  { value: "VIDEO_BUMPER", label: "Vídeo Bumper" },
  { value: "VIDEO_TRUE_VIEW_IN_STREAM", label: "Vídeo TrueView In-stream" },
];

export default function AdSetEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const { data: adGroup, isLoading } = useAdGroupDetail(customerId, id);
  const updateAdGroup = useUpdateAdGroup();

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [adGroupType, setAdGroupType] = useState<AdGroupType | "">("");
  const [cpcBid, setCpcBid] = useState("");
  const [targetCpa, setTargetCpa] = useState("");

  useEffect(() => {
    if (adGroup) {
      setName(adGroup.name || "");
      setIsActive(adGroup.status === "ENABLED");
      setAdGroupType(adGroup.type || "");
      if (adGroup.cpcBidMicros) setCpcBid(String(microsToUnits(adGroup.cpcBidMicros)));
      if (adGroup.targetCpaMicros) setTargetCpa(String(microsToUnits(adGroup.targetCpaMicros)));
    }
  }, [adGroup]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!adGroup) return <p className="text-center text-muted-foreground py-12">Grupo de anúncios não encontrado.</p>;

  const handleSave = async () => {
    if (!customerId) return;
    const data: any = {
      name,
      status: isActive ? "ENABLED" : "PAUSED",
    };
    if (cpcBid) data.cpcBidMicros = String(unitsToMicros(parseFloat(cpcBid)));
    if (targetCpa) data.targetCpaMicros = String(unitsToMicros(parseFloat(targetCpa)));

    await updateAdGroup.mutateAsync({ customerId, resourceName: adGroup.resourceName, data });
    navigate(`/adsets/${id}`);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/adsets">Grupos de Anúncios</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/adsets/${id}`}>{adGroup.name}</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Editar</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">Editar Grupo de Anúncios</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Label>Status</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm text-muted-foreground">{isActive ? "Ativo" : "Pausado"}</span>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Grupo</Label>
            <Input value={adGroupType.replace(/_/g, " ") || "--"} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">O tipo não pode ser alterado após criação.</p>
          </div>
          <div className="space-y-2">
            <Label>CPC Bid (R$)</Label>
            <Input type="number" min="0.01" step="0.01" value={cpcBid} onChange={(e) => setCpcBid(e.target.value)} placeholder="Lance por clique" />
          </div>
          <div className="space-y-2">
            <Label>CPA Desejado (R$, opcional)</Label>
            <Input type="number" min="0.01" step="0.01" value={targetCpa} onChange={(e) => setTargetCpa(e.target.value)} placeholder="CPA desejado" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate(`/adsets/${id}`)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={updateAdGroup.isPending}>
              {updateAdGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
