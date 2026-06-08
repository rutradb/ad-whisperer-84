import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdDetail } from "@/hooks/useAdDetail";
import { useUpdateAdStatus } from "@/hooks/useAdMutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";

export default function AdEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;

  // Note: Google Ads AdDetail needs adGroupId. We pass undefined and let the hook
  // figure it out, or we need the adGroupId from the route/context.
  // For now we use a simplified approach.
  const { data: adGroupAd, isLoading } = useAdDetail(customerId, undefined, id);
  const updateAdStatus = useUpdateAdStatus();

  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (adGroupAd) {
      setIsActive(adGroupAd.status === "ENABLED");
    }
  }, [adGroupAd]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!adGroupAd) return <p className="text-center text-muted-foreground py-12">Anúncio não encontrado.</p>;

  const ad = adGroupAd.ad;
  const adName = ad?.name || ad?.finalUrls?.[0] || "Anúncio";
  const rsa = ad?.responsiveSearchAd;

  const handleSave = async () => {
    if (!customerId) return;
    await updateAdStatus.mutateAsync({
      customerId,
      resourceName: adGroupAd.resourceName,
      status: isActive ? "ENABLED" : "PAUSED",
    });
    navigate(`/ads/${id}`);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/ads">Anúncios</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/ads/${id}`}>{adName}</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Editar</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">Editar Anúncio</h1>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <Label>Status</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm text-muted-foreground">{isActive ? "Ativo" : "Pausado"}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            No Google Ads, o conteúdo de um anúncio RSA (títulos, descrições, URLs) não pode ser editado diretamente.
            Para alterar o conteúdo, crie um novo anúncio e remova o antigo.
          </p>
        </CardContent>
      </Card>

      {/* Current RSA Content (read-only) */}
      {rsa && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Conteúdo Atual (somente leitura)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {ad?.finalUrls && (
              <div>
                <Label className="text-xs text-muted-foreground">URL Final</Label>
                <p className="text-sm">{ad.finalUrls[0]}</p>
              </div>
            )}
            {(ad?.responsiveSearchAd?.path1 || ad?.responsiveSearchAd?.path2) && (
              <div>
                <Label className="text-xs text-muted-foreground">Caminhos</Label>
                <p className="text-sm">/{rsa.path1}{rsa.path2 ? `/${rsa.path2}` : ""}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Títulos ({rsa.headlines?.length || 0})</Label>
              <div className="space-y-1 mt-1">
                {rsa.headlines?.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{i + 1}</Badge>
                    <span className="text-sm">{h.text}</span>
                    {h.pinnedField && <Badge variant="secondary" className="text-xs">{h.pinnedField}</Badge>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descrições ({rsa.descriptions?.length || 0})</Label>
              <div className="space-y-1 mt-1">
                {rsa.descriptions?.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{i + 1}</Badge>
                    <span className="text-sm">{d.text}</span>
                    {d.pinnedField && <Badge variant="secondary" className="text-xs">{d.pinnedField}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(`/ads/${id}`)}>Cancelar</Button>
        <Button onClick={handleSave} disabled={updateAdStatus.isPending}>
          {updateAdStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
