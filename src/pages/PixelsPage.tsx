import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

function typeBadge(type: string) {
  switch (type) {
    case "WEBPAGE":
      return <Badge variant="default">Pagina Web</Badge>;
    case "PHONE_CALL":
      return <Badge variant="secondary">Chamada</Badge>;
    case "IMPORT":
      return <Badge variant="outline">Importacao</Badge>;
    case "AD_CALL":
      return <Badge variant="secondary">Chamada de Anuncio</Badge>;
    default:
      return <Badge variant="outline">{type || "—"}</Badge>;
  }
}

export default function ConversionsPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("WEBPAGE");
  const [category, setCategory] = useState("PURCHASE");
  const [countingType, setCountingType] = useState("MANY_PER_CLICK");
  const [attributionModel, setAttributionModel] = useState("LAST_CLICK");
  const [defaultValue, setDefaultValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["conversion-actions", customerId],
    queryFn: async () => {
      const { listConversionActions } = await import("@/lib/google-ads/conversions");
      return listConversionActions(customerId!);
    },
    enabled: !!customerId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { createConversionAction } = await import("@/lib/google-ads/conversions");
      return createConversionAction(customerId!, {
        name,
        type: type as any,
        category: category as any,
        countingType: countingType as any,
        attributionModel,
        defaultValue: defaultValue ? parseFloat(defaultValue) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversion-actions"] });
      toast({ title: "Acao de conversao criada com sucesso" });
      setDialogOpen(false);
      setName("");
      setType("WEBPAGE");
      setCategory("PURCHASE");
      setDefaultValue("");
    },
    onError: (err: Error) => toast({ title: "Erro ao criar", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { removeConversionAction } = await import("@/lib/google-ads/conversions");
      return removeConversionAction(customerId!, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversion-actions"] });
      toast({ title: "Acao de conversao removida" });
    },
    onError: (err: Error) => toast({ title: "Erro ao remover", description: err.message, variant: "destructive" }),
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Acoes de Conversao</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const rawConversions: any[] = (data as any)?.results || (Array.isArray(data) ? data : []);
  const conversions: any[] = rawConversions.map((r: any) => {
    const ca = r.conversionAction || r;
    return {
      id: ca.id,
      name: ca.name || "",
      type: ca.type || "UNKNOWN",
      category: ca.category || "",
      status: ca.status || "UNKNOWN",
      countingType: ca.countingType,
      attributionModel: ca.attributionModelSettings?.attributionModel || ca.attributionModel,
      defaultValue: ca.valueSettings?.defaultValue,
      defaultCurrency: ca.valueSettings?.defaultCurrencyCode,
      alwaysUseDefaultValue: ca.valueSettings?.alwaysUseDefaultValue,
      clickThroughLookbackDays: ca.clickThroughLookbackWindowDays,
      viewThroughLookbackDays: ca.viewThroughLookbackWindowDays,
      includeInConversions: ca.includeInConversionsMetric,
      resourceName: ca.resourceName,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Acoes de Conversao</h1>
        <p className="text-muted-foreground">Gerencie suas acoes de conversao do Google Ads</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar conversoes</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error instanceof Error ? error.message : "Falha ao buscar acoes de conversao."}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-3 w-3" />Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />Acoes de Conversao
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />Nova Conversao</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Acao de Conversao</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input placeholder="Ex: Compra no Site" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEBPAGE">Pagina Web</SelectItem>
                      <SelectItem value="PHONE_CALL">Chamada Telefonica</SelectItem>
                      <SelectItem value="IMPORT">Importacao</SelectItem>
                      <SelectItem value="AD_CALL">Chamada de Anuncio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PURCHASE">Compra</SelectItem>
                      <SelectItem value="SIGNUP">Cadastro</SelectItem>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="PAGE_VIEW">Visualizacao de Pagina</SelectItem>
                      <SelectItem value="ADD_TO_CART">Adicionar ao Carrinho</SelectItem>
                      <SelectItem value="BEGIN_CHECKOUT">Iniciar Checkout</SelectItem>
                      <SelectItem value="CONTACT">Contato</SelectItem>
                      <SelectItem value="DOWNLOAD">Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contagem</Label>
                  <Select value={countingType} onValueChange={setCountingType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANY_PER_CLICK">Todas as conversoes</SelectItem>
                      <SelectItem value="ONE_PER_CLICK">Uma por clique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modelo de Atribuicao</Label>
                  <Select value={attributionModel} onValueChange={setAttributionModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAST_CLICK">Ultimo Clique</SelectItem>
                      <SelectItem value="FIRST_CLICK">Primeiro Clique</SelectItem>
                      <SelectItem value="LINEAR">Linear</SelectItem>
                      <SelectItem value="TIME_DECAY">Reducao de Tempo</SelectItem>
                      <SelectItem value="POSITION_BASED">Baseado em Posicao</SelectItem>
                      <SelectItem value="DATA_DRIVEN">Baseado em Dados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Padrao (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending}>
                  Criar Conversao
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : conversions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atribuicao</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{typeBadge(c.type)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.category || "—"}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.attributionModel?.replace(/_/g, " ") || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-6">Nenhuma acao de conversao encontrada.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Acao de Conversao?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao sera removida. Dados historicos serao mantidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { removeMutation.mutate(deleteId); setDeleteId(null); } }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
