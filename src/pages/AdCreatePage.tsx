import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdGroups } from "@/hooks/useAdGroups";
import { useCreateAd } from "@/hooks/useAdMutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeadlineItem {
  text: string;
  pinnedField?: "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3";
}

interface DescriptionItem {
  text: string;
  pinnedField?: "DESCRIPTION_1" | "DESCRIPTION_2";
}

export default function AdCreatePage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const createAd = useCreateAd();

  const [step, setStep] = useState(1);

  // Step 1 - Ad Group
  const [adGroupId, setAdGroupId] = useState("");
  const { data: adGroupsData } = useAdGroups(customerId ?? undefined, {
    status: "ENABLED",
  });
  const adGroups = adGroupsData || [];
  const selectedAdGroup = adGroups.find((a: any) => a.id === adGroupId);

  // Step 2 - RSA Content
  const [finalUrls, setFinalUrls] = useState<string[]>([""]);
  const [headlines, setHeadlines] = useState<HeadlineItem[]>([
    { text: "" }, { text: "" }, { text: "" },
  ]);
  const [descriptions, setDescriptions] = useState<DescriptionItem[]>([
    { text: "" }, { text: "" },
  ]);
  const [path1, setPath1] = useState("");
  const [path2, setPath2] = useState("");

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Novo Anúncio</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const updateHeadline = (index: number, text: string) => {
    setHeadlines(prev => prev.map((h, i) => i === index ? { ...h, text } : h));
  };

  const updateDescription = (index: number, text: string) => {
    setDescriptions(prev => prev.map((d, i) => i === index ? { ...d, text } : d));
  };

  const addHeadline = () => {
    if (headlines.length < 15) setHeadlines([...headlines, { text: "" }]);
  };

  const removeHeadline = (index: number) => {
    if (headlines.length > 3) setHeadlines(headlines.filter((_, i) => i !== index));
  };

  const addDescription = () => {
    if (descriptions.length < 4) setDescriptions([...descriptions, { text: "" }]);
  };

  const removeDescription = (index: number) => {
    if (descriptions.length > 2) setDescriptions(descriptions.filter((_, i) => i !== index));
  };

  const validHeadlines = headlines.filter(h => h.text.trim().length > 0);
  const validDescriptions = descriptions.filter(d => d.text.trim().length > 0);
  const validFinalUrls = finalUrls.filter(u => u.trim().length > 0);

  const canProceedStep1 = !!adGroupId;
  const canProceedStep2 = validFinalUrls.length >= 1 && validHeadlines.length >= 3 && validDescriptions.length >= 2;

  const handleCreate = async () => {
    if (!selectedAdGroup || !customerId) return;

    await createAd.mutateAsync({
      customerId,
      data: {
        adGroup: selectedAdGroup.resourceName,
        finalUrls: validFinalUrls,
        headlines: validHeadlines.map(h => ({ text: h.text.trim(), pinnedField: h.pinnedField })),
        descriptions: validDescriptions.map(d => ({ text: d.text.trim(), pinnedField: d.pinnedField })),
        path1: path1 || undefined,
        path2: path2 || undefined,
        status: "PAUSED",
      },
    });
    navigate("/ads");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/ads">Anúncios</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Novo Anúncio RSA</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight">Novo Anúncio RSA</h1>
      <p className="text-muted-foreground">Responsive Search Ad — o Google combina automaticamente títulos e descrições para melhor performance.</p>

      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-2 flex-1 rounded-full", s <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      {/* Step 1: Ad Group */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>1. Selecione o Grupo de Anúncios</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Grupo de Anúncios</Label>
              <Select value={adGroupId} onValueChange={setAdGroupId}>
                <SelectTrigger><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
                <SelectContent>
                  {adGroups.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedAdGroup && (
              <div className="text-sm text-muted-foreground">
                Tipo: <span className="font-medium">{selectedAdGroup.type?.replace(/_/g, " ")}</span> · Status: <span className="font-medium">{selectedAdGroup.status}</span>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>Próximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: RSA Content */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>2. Conteúdo do Anúncio RSA</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Final URLs */}
            <div className="space-y-2">
              <Label>URL Final (obrigatório)</Label>
              <Input
                placeholder="https://seusite.com/pagina"
                value={finalUrls[0]}
                onChange={(e) => setFinalUrls([e.target.value])}
              />
            </div>

            {/* Path fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Caminho 1</Label>
                  <span className="text-xs text-muted-foreground">{path1.length}/15</span>
                </div>
                <Input maxLength={15} placeholder="Ex: produtos" value={path1} onChange={(e) => setPath1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Caminho 2</Label>
                  <span className="text-xs text-muted-foreground">{path2.length}/15</span>
                </div>
                <Input maxLength={15} placeholder="Ex: ofertas" value={path2} onChange={(e) => setPath2(e.target.value)} />
              </div>
            </div>

            {/* Headlines */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Títulos ({validHeadlines.length}/15, mín. 3)</Label>
                {headlines.length < 15 && (
                  <Button type="button" variant="outline" size="sm" onClick={addHeadline}>
                    <Plus className="mr-1 h-3 w-3" /> Título
                  </Button>
                )}
              </div>
              {headlines.map((h, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Título {idx + 1}</span>
                      <span className={cn("text-xs", h.text.length > 30 ? "text-destructive" : "text-muted-foreground")}>{h.text.length}/30</span>
                    </div>
                    <Input
                      maxLength={30}
                      placeholder={`Título ${idx + 1}`}
                      value={h.text}
                      onChange={(e) => updateHeadline(idx, e.target.value)}
                    />
                  </div>
                  {headlines.length > 3 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeHeadline(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Descriptions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Descrições ({validDescriptions.length}/4, mín. 2)</Label>
                {descriptions.length < 4 && (
                  <Button type="button" variant="outline" size="sm" onClick={addDescription}>
                    <Plus className="mr-1 h-3 w-3" /> Descrição
                  </Button>
                )}
              </div>
              {descriptions.map((d, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Descrição {idx + 1}</span>
                      <span className={cn("text-xs", d.text.length > 90 ? "text-destructive" : "text-muted-foreground")}>{d.text.length}/90</span>
                    </div>
                    <Input
                      maxLength={90}
                      placeholder={`Descrição ${idx + 1}`}
                      value={d.text}
                      onChange={(e) => updateDescription(idx, e.target.value)}
                    />
                  </div>
                  {descriptions.length > 2 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeDescription(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* RSA Preview */}
            {(validHeadlines.length >= 1 || validDescriptions.length >= 1) && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-3 text-sm border-b bg-muted/50">Preview (exemplo de combinação)</div>
                <div className="p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Anúncio · {finalUrls[0] || "seusite.com"}{path1 ? `/${path1}` : ""}{path2 ? `/${path2}` : ""}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {validHeadlines.slice(0, 3).map(h => h.text).join(" | ") || "Título do anúncio"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {validDescriptions.slice(0, 2).map(d => d.text).join(" ") || "Descrição do anúncio"}
                  </p>
                </div>
              </div>
            )}

            {!canProceedStep2 && (
              <Alert>
                <AlertDescription>
                  Preencha pelo menos 1 URL final, 3 títulos e 2 descrições para continuar.
                </AlertDescription>
              </Alert>
            )}

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
              <div><span className="text-muted-foreground">Grupo de Anúncios:</span> <strong>{selectedAdGroup?.name}</strong></div>
              <div><span className="text-muted-foreground">URL Final:</span> <strong>{validFinalUrls[0]}</strong></div>
              {(path1 || path2) && <div><span className="text-muted-foreground">Caminhos:</span> /{path1}{path2 ? `/${path2}` : ""}</div>}
              <div><span className="text-muted-foreground">Títulos:</span> {validHeadlines.length} título(s)</div>
              <div className="pl-4 space-y-1">
                {validHeadlines.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
              <div><span className="text-muted-foreground">Descrições:</span> {validDescriptions.length} descrição(ões)</div>
              <div className="pl-4 space-y-1">
                {validDescriptions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                    <span>{d.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <Alert>
              <AlertDescription>O anúncio será criado com status <strong>PAUSADO</strong> por segurança.</AlertDescription>
            </Alert>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={handleCreate} disabled={createAd.isPending}>
                {createAd.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Anúncio RSA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
