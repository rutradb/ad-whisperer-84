import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useGenerateCopy } from "@/hooks/useGenerateCopy";
import { useCopyHistory } from "@/hooks/useCopyHistory";
import type { CopyFramework, CopyVariation } from "@/lib/anthropic-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PenTool, Copy, Settings, Sparkles, History, Trash2, Eye, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_OPTIONS = [
  { value: "profissional", label: "Profissional" },
  { value: "casual", label: "Casual" },
  { value: "urgente", label: "Urgente" },
  { value: "inspirador", label: "Inspirador" },
  { value: "bem-humorado", label: "Bem-humorado" },
];

const OBJECTIVE_OPTIONS = [
  { value: "vendas", label: "Vendas" },
  { value: "leads", label: "Geracao de Leads" },
  { value: "trafego", label: "Trafego" },
  { value: "engajamento", label: "Engajamento" },
  { value: "reconhecimento", label: "Reconhecimento de Marca" },
];

const FRAMEWORK_OPTIONS: { value: CopyFramework; label: string; desc: string }[] = [
  { value: "PAS", label: "PAS", desc: "Problem / Agitate / Solution" },
  { value: "BAB", label: "BAB", desc: "Before / After / Bridge" },
  { value: "AIDA", label: "AIDA", desc: "Attention / Interest / Desire / Action" },
  { value: "SOCIAL_PROOF", label: "Social Proof", desc: "Prova Social / Depoimentos / Estatisticas" },
];

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atras`;
  if (diffHours < 24) return `${diffHours}h atras`;
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString("pt-BR");
}

// RSA format: headlines (max 30 chars, 3-15) + descriptions (max 90 chars, 2-4)
interface RSAVariation {
  headlines: string[];
  descriptions: string[];
}

export default function AICopyGeneratorPage() {
  const { anthropicApiKey } = useAuthStore();
  const generateCopy = useGenerateCopy();
  const { history, isLoadingHistory, saveCopy, deleteCopy } = useCopyHistory();
  const { toast } = useToast();

  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("profissional");
  const [objective, setObjective] = useState("vendas");
  const [framework, setFramework] = useState<CopyFramework>("PAS");
  const [variations, setVariations] = useState([3]);
  const [results, setResults] = useState<CopyVariation[]>([]);
  const [activeTab, setActiveTab] = useState("generator");

  const hasApiKey = !!anthropicApiKey;
  const canGenerate = hasApiKey && !!productDescription.trim() && !!targetAudience.trim();

  const handleGenerate = async () => {
    const data = await generateCopy.mutateAsync({
      productDescription,
      targetAudience,
      tone,
      objective,
      framework,
      variations: variations[0],
    });
    setResults(data);
    saveCopy({
      productDescription,
      targetAudience,
      tone,
      objective,
      framework,
      variations: data,
    }).catch(console.error);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const copyAllHeadlinesDescriptions = (variation: CopyVariation) => {
    // Extract headlines and descriptions from the variation
    // The variation has primaryText (used as description source), headline, description
    // For RSA we present them as headlines + descriptions
    const headlines = variation.headline ? [variation.headline] : [];
    const descriptions = variation.description ? [variation.description] : [];
    if (variation.primaryText) {
      // Split primary text into potential headlines (max 30 chars each)
      const sentences = variation.primaryText.split(/[.!?\n]+/).filter(s => s.trim().length > 0 && s.trim().length <= 30);
      headlines.push(...sentences.slice(0, 14)); // up to 15 total
    }
    const text = `Headlines (max 30 chars):\n${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\nDescricoes (max 90 chars):\n${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copy RSA completa copiada!" });
  };

  const handleViewHistory = (historyVariations: CopyVariation[]) => {
    setResults(historyVariations);
    setActiveTab("generator");
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteCopy(id);
    toast({ title: "Registro removido do historico" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerador de Copy RSA com IA</h1>
        <p className="text-muted-foreground">Gere headlines e descricoes para Responsive Search Ads usando Claude AI</p>
      </div>

      {!hasApiKey && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Configure sua chave da API Anthropic em{" "}
            <Link to="/settings" className="font-medium underline">Configuracoes &gt; Integracoes</Link>{" "}
            para usar o gerador de copy.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generator" className="gap-2">
            <Sparkles className="h-4 w-4" /> Gerador
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Historico
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{history.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Dados do Anuncio (RSA)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-medium text-primary">Formato: Responsive Search Ad (RSA)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Headlines: max 30 caracteres (3-15 obrigatorios) | Descricoes: max 90 caracteres (2-4 obrigatorias)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Produto / Servico *</Label>
                    <Textarea
                      placeholder="Descreva seu produto ou servico em detalhes: o que e, principais beneficios, diferenciais..."
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Publico-alvo *</Label>
                    <Input
                      placeholder="Ex: Mulheres 25-45, interessadas em fitness e saude"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tom</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Objetivo</Label>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OBJECTIVE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Framework</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={framework} onValueChange={(v) => setFramework(v as CopyFramework)} className="grid grid-cols-2 gap-3">
                    {FRAMEWORK_OPTIONS.map((f) => (
                      <div key={f.value} className={cn("flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors", framework === f.value && "border-primary bg-primary/5")}>
                        <RadioGroupItem value={f.value} id={`fw-${f.value}`} className="mt-0.5" />
                        <Label htmlFor={`fw-${f.value}`} className="cursor-pointer">
                          <span className="font-medium text-sm">{f.label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label>Variacoes: {variations[0]}</Label>
                    <Slider min={1} max={5} step={1} value={variations} onValueChange={setVariations} />
                  </div>

                  <Button onClick={handleGenerate} disabled={!canGenerate || generateCopy.isPending} className="w-full">
                    {generateCopy.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" />Gerar Copy RSA</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Resultados (formato RSA)</h3>
              {generateCopy.isPending ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Gerando copy RSA com Claude AI...</p>
                  </CardContent>
                </Card>
              ) : results.length > 0 ? (
                results.map((variation, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Variacao {index + 1}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => copyAllHeadlinesDescriptions(variation)}>
                          <Copy className="mr-2 h-3 w-3" />Copiar tudo
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Headlines */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Headline (max 30 chars)</Label>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs", variation.headline.length > 30 ? "text-destructive" : "text-muted-foreground")}>{variation.headline.length}/30</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard(variation.headline, "Headline")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="rounded-lg border p-3 text-sm font-semibold">{variation.headline}</div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Descricao (max 90 chars)</Label>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs", variation.description.length > 90 ? "text-destructive" : "text-muted-foreground")}>{variation.description.length}/90</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard(variation.description, "Descricao")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="rounded-lg border p-3 text-sm text-muted-foreground">{variation.description}</div>
                      </div>

                      {/* Additional copy from primaryText */}
                      {variation.primaryText && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Texto adicional (headlines/descricoes extras)</Label>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard(variation.primaryText, "Texto")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap text-muted-foreground">{variation.primaryText}</div>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="border rounded-lg overflow-hidden mt-3">
                        <div className="p-2 text-xs border-b bg-muted/50 font-medium">Preview RSA</div>
                        <div className="p-3 space-y-1">
                          <p className="font-semibold text-sm text-primary">{variation.headline}</p>
                          <p className="text-xs text-green-700">www.exemplo.com.br</p>
                          <p className="text-sm text-muted-foreground">{variation.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <PenTool className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Nenhuma copy gerada</p>
                    <p className="text-sm text-muted-foreground mt-1">Preencha os dados e clique em "Gerar Copy RSA"</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : history.length > 0 ? (
              history.map((row) => (
                <Card key={row.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{row.framework}</Badge>
                          <Badge variant="secondary">{row.tone}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeDate(row.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{row.product_description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {row.variation_count} variacao(oes) &middot; {row.objective} &middot; {row.target_audience.length > 50 ? row.target_audience.slice(0, 50) + "..." : row.target_audience}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHistory(row.variations as unknown as CopyVariation[])}
                        >
                          <Eye className="mr-1 h-3 w-3" />Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteHistory(row.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Nenhum historico</p>
                  <p className="text-sm text-muted-foreground mt-1">As copies geradas serao salvas automaticamente</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
