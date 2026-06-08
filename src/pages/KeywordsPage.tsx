import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { formatMicros } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Loader2, MinusCircle } from "lucide-react";

function matchTypeBadge(matchType: string) {
  switch (matchType) {
    case "EXACT":
      return <Badge variant="default">Exata</Badge>;
    case "PHRASE":
      return <Badge variant="secondary">Frase</Badge>;
    case "BROAD":
      return <Badge variant="outline">Ampla</Badge>;
    default:
      return <Badge variant="outline">{matchType}</Badge>;
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "ENABLED":
      return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Ativo</Badge>;
    case "PAUSED":
      return <Badge variant="secondary">Pausado</Badge>;
    case "REMOVED":
      return <Badge variant="destructive">Removido</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function KeywordsPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Add keywords form state
  const [newKeyword, setNewKeyword] = useState("");
  const [newMatchType, setNewMatchType] = useState("BROAD");
  const [newBid, setNewBid] = useState("");
  const [selectedAdGroup, setSelectedAdGroup] = useState("");
  const [adGroups, setAdGroups] = useState<any[]>([]);

  // Load ad groups for keyword creation
  useEffect(() => {
    if (!customerId) return;
    import("@/lib/google-ads/adgroups").then(({ getAdGroupsByCustomer }) => {
      getAdGroupsByCustomer(customerId).then((res) => {
        const groups = (res.results || []).map((r: any) => {
          const ag = r.adGroup || r;
          return { id: ag.id, name: ag.name, resourceName: ag.resourceName };
        });
        setAdGroups(groups);
      }).catch(() => {});
    });
  }, [customerId]);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hooks for keywords data
  const { data: keywordsData, isLoading: keywordsLoading } = useQuery({
    queryKey: ["keywords", customerId],
    queryFn: async () => {
      const { getKeywordsByCustomer } = await import("@/lib/google-ads/keywords");
      return getKeywordsByCustomer(customerId!).then(r => r.results || []);
    },
    enabled: !!customerId,
  });

  const { data: searchTermsData, isLoading: searchTermsLoading } = useQuery({
    queryKey: ["search-terms", customerId],
    queryFn: async () => {
      const { getSearchTerms } = await import("@/lib/google-ads/keywords");
      return getSearchTerms(customerId!).then(r => r.results || []);
    },
    enabled: !!customerId,
  });

  const { data: negativeData, isLoading: negativeLoading } = useQuery({
    queryKey: ["negative-keywords", customerId],
    queryFn: async () => {
      const { getNegativeKeywords } = await import("@/lib/google-ads/keywords");
      return getNegativeKeywords(customerId!).then(r => r.results || []);
    },
    enabled: !!customerId,
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (params: { text: string; matchType: string; bidMicros?: number }) => {
      if (!selectedAdGroup) throw new Error("Selecione um grupo de anuncios");
      const { addKeywords } = await import("@/lib/google-ads/keywords");
      return addKeywords(customerId!, selectedAdGroup, [params as any]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast({ title: "Palavra-chave adicionada" });
      setNewKeyword("");
      setNewBid("");
    },
    onError: (err: Error) => toast({ title: "Erro ao adicionar", description: err.message, variant: "destructive" }),
  });

  const removeKeywordMutation = useMutation({
    mutationFn: async (keywordId: string) => {
      const { removeKeyword } = await import("@/lib/google-ads/keywords");
      return removeKeyword(customerId!, keywordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      queryClient.invalidateQueries({ queryKey: ["negative-keywords"] });
      toast({ title: "Palavra-chave removida" });
    },
    onError: (err: Error) => toast({ title: "Erro ao remover", description: err.message, variant: "destructive" }),
  });

  const addAsKeywordMutation = useMutation({
    mutationFn: async (params: { text: string; matchType: string }) => {
      const { addKeywords } = await import("@/lib/google-ads/keywords");
      return addKeywords(customerId!, "" as any, [{ text: params.text, matchType: params.matchType } as any]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast({ title: "Termo adicionado como palavra-chave" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const addAsNegativeMutation = useMutation({
    mutationFn: async (params: { text: string; matchType: string }) => {
      const { addNegativeKeywords } = await import("@/lib/google-ads/keywords");
      return addNegativeKeywords(customerId!, "" as any, [{ text: params.text, matchType: params.matchType } as any]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negative-keywords"] });
      toast({ title: "Termo adicionado como negativa" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Palavras-chave</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const keywords = (keywordsData || []).map((r: any) => {
    const kw = r.adGroupCriterion || r;
    return {
      id: kw.criterionId || kw.id,
      text: kw.keyword?.text || kw.text || "",
      matchType: kw.keyword?.matchType || kw.matchType || "",
      status: kw.status || "",
      cpcBidMicros: kw.cpcBidMicros || kw.effectiveCpcBidMicros,
      qualityScore: kw.qualityInfo?.qualityScore ?? kw.qualityScore,
      expectedCtr: kw.qualityInfo?.searchPredictedCtr,
      adRelevance: kw.qualityInfo?.creativeQualityScore,
      landingPageExp: kw.qualityInfo?.postClickQualityScore,
      resourceName: kw.resourceName,
      impressions: Number(r.metrics?.impressions || 0),
      clicks: Number(r.metrics?.clicks || 0),
      costMicros: Number(r.metrics?.costMicros || 0),
      conversions: Number(r.metrics?.conversions || 0),
    };
  });
  const searchTerms = (searchTermsData || []).map((r: any) => {
    const stv = r.searchTermView || r;
    const m = r.metrics || {};
    return {
      searchTerm: stv.searchTerm || "",
      status: stv.status || "",
      impressions: Number(m.impressions || 0),
      clicks: Number(m.clicks || 0),
      costMicros: Number(m.costMicros || 0),
      conversions: Number(m.conversions || 0),
      ctr: Number(m.ctr || 0),
    };
  });
  const negativeKeywords = (negativeData || []).map((r: any) => {
    const kw = r.campaignCriterion || r;
    return {
      id: kw.criterionId || kw.id,
      text: kw.keyword?.text || kw.text || "",
      matchType: kw.keyword?.matchType || kw.matchType || "",
      campaignName: r.campaign?.name || "",
      resourceName: kw.resourceName,
    };
  });

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const bidMicros = newBid ? Math.round(parseFloat(newBid) * 1_000_000) : undefined;
    addKeywordMutation.mutate({ text: newKeyword.trim(), matchType: newMatchType, bidMicros });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Palavras-chave</h1>
        <p className="text-muted-foreground">Gerencie palavras-chave, termos de pesquisa e negativas</p>
      </div>

      <Tabs defaultValue="keywords">
        <TabsList>
          <TabsTrigger value="keywords">
            <Search className="mr-2 h-4 w-4" />
            Palavras-chave
          </TabsTrigger>
          <TabsTrigger value="search-terms">Termos de Pesquisa</TabsTrigger>
          <TabsTrigger value="negatives">
            <MinusCircle className="mr-2 h-4 w-4" />
            Negativas
          </TabsTrigger>
        </TabsList>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          {/* Add keyword form */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="w-56 space-y-2">
                    <Label>Grupo de anuncios</Label>
                    <Select value={selectedAdGroup} onValueChange={setSelectedAdGroup}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {adGroups.map((ag) => (
                          <SelectItem key={ag.resourceName} value={ag.resourceName}>
                            {ag.name || `Grupo ${ag.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Palavra-chave</Label>
                    <Input
                      placeholder="Ex: comprar tenis online"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                    />
                  </div>
                  <div className="w-40 space-y-2">
                    <Label>Correspondencia</Label>
                    <Select value={newMatchType} onValueChange={setNewMatchType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BROAD">Ampla</SelectItem>
                        <SelectItem value="PHRASE">Frase</SelectItem>
                        <SelectItem value="EXACT">Exata</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>CPC Max (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newBid}
                      onChange={(e) => setNewBid(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddKeyword} disabled={!newKeyword.trim() || !selectedAdGroup || addKeywordMutation.isPending}>
                    {addKeywordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keywords table */}
          <Card>
            <CardContent className="pt-6">
              {keywordsLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : keywords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Palavra-chave</TableHead>
                      <TableHead>Correspondencia</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">CPC Max</TableHead>
                      <TableHead className="text-right">Indice de Qualidade</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((kw: any) => (
                      <TableRow key={kw.id}>
                        <TableCell className="font-medium">{kw.text}</TableCell>
                        <TableCell>{matchTypeBadge(kw.matchType)}</TableCell>
                        <TableCell>{statusBadge(kw.status)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {kw.cpcBidMicros ? formatMicros(kw.cpcBidMicros) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {kw.qualityScore != null ? (
                            <span className={kw.qualityScore >= 7 ? "text-green-600 font-medium" : kw.qualityScore >= 4 ? "text-yellow-600" : "text-red-600"}>
                              {kw.qualityScore}/10
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(kw.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma palavra-chave encontrada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Terms Tab */}
        <TabsContent value="search-terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Termos de Pesquisa</CardTitle>
            </CardHeader>
            <CardContent>
              {searchTermsLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : searchTerms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Termo de Pesquisa</TableHead>
                      <TableHead className="text-right">Impressoes</TableHead>
                      <TableHead className="text-right">Cliques</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Conversoes</TableHead>
                      <TableHead>Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchTerms.map((term: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{term.searchTerm}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(term.impressions || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(term.clicks || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{term.costMicros ? formatMicros(term.costMicros) : "—"}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{(term.conversions || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addAsKeywordMutation.mutate({ text: term.searchTerm, matchType: "EXACT" })}
                              disabled={addAsKeywordMutation.isPending}
                            >
                              <Plus className="mr-1 h-3 w-3" />Palavra-chave
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addAsNegativeMutation.mutate({ text: term.searchTerm, matchType: "EXACT" })}
                              disabled={addAsNegativeMutation.isPending}
                            >
                              <MinusCircle className="mr-1 h-3 w-3" />Negativa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum termo de pesquisa encontrado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Negative Keywords Tab */}
        <TabsContent value="negatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Palavras-chave Negativas</CardTitle>
            </CardHeader>
            <CardContent>
              {negativeLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : negativeKeywords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Palavra-chave</TableHead>
                      <TableHead>Correspondencia</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {negativeKeywords.map((nk: any) => (
                      <TableRow key={nk.id}>
                        <TableCell className="font-medium">{nk.text}</TableCell>
                        <TableCell>{matchTypeBadge(nk.matchType)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{nk.campaignName || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeKeywordMutation.mutate(nk.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma palavra-chave negativa.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Palavra-chave?</AlertDialogTitle>
            <AlertDialogDescription>A palavra-chave sera marcada como REMOVED e nao podera ser reativada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { removeKeywordMutation.mutate(deleteId); setDeleteId(null); } }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
