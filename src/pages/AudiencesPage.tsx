import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Users, RefreshCw, AlertTriangle } from "lucide-react";

function formatCount(n?: number): string {
  if (n === undefined || n === null || n < 0) return "---";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("pt-BR");
}

type AudienceFilter = "ALL" | "REMARKETING" | "COMBINED" | "CUSTOMER_MATCH";

export default function AudiencesPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filter, setFilter] = useState<AudienceFilter>("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create audience dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [audienceName, setAudienceName] = useState("");
  const [audienceDesc, setAudienceDesc] = useState("");
  const [audienceType, setAudienceType] = useState("REMARKETING");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["audiences", customerId],
    queryFn: async () => {
      const { listAudiences } = await import("@/lib/google-ads/audiences");
      return listAudiences(customerId!);
    },
    enabled: !!customerId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const mod = await import("@/lib/google-ads/audiences");
      return (mod as any).createAudience(customerId!, {
        name: audienceName,
        description: audienceDesc || undefined,
        type: audienceType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audiences"] });
      toast({ title: "Publico criado com sucesso" });
      setAudienceName("");
      setAudienceDesc("");
      setCreateOpen(false);
    },
    onError: (err: Error) => toast({ title: "Erro ao criar publico", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const mod = await import("@/lib/google-ads/audiences");
      return (mod as any).removeAudience(customerId!, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audiences"] });
      toast({ title: "Publico removido" });
    },
    onError: (err: Error) => toast({ title: "Erro ao remover", description: err.message, variant: "destructive" }),
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Publicos</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const rawResults: any[] = (data as any)?.results || (Array.isArray(data) ? data : []);
  const audiences: any[] = rawResults.map((r: any) => {
    const ul = r.userList || r;
    return {
      id: ul.id,
      name: ul.name || "",
      description: ul.description || "",
      type: ul.type || "UNKNOWN",
      membershipStatus: ul.membershipStatus,
      memberCount: Number(ul.sizeForSearch || ul.sizeForDisplay || 0),
      sizeForSearch: Number(ul.sizeForSearch || 0),
      sizeForDisplay: Number(ul.sizeForDisplay || 0),
      eligibleForSearch: ul.eligibleForSearch,
      eligibleForDisplay: ul.eligibleForDisplay,
      membershipLifeSpan: ul.membershipLifeSpan,
      status: ul.membershipStatus === "OPEN" ? "ENABLED" : ul.membershipStatus === "CLOSED" ? "PAUSED" : ul.membershipStatus || "UNKNOWN",
      resourceName: ul.resourceName,
    };
  });
  const filtered = filter === "ALL"
    ? audiences
    : audiences.filter((a: any) => a.type === filter);

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publicos</h1>
          <p className="text-muted-foreground">Gerencie seus publicos-alvo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo Publico</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Publico</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input placeholder="Meu publico" value={audienceName} onChange={(e) => setAudienceName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Textarea placeholder="Descricao opcional" value={audienceDesc} onChange={(e) => setAudienceDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={audienceType} onValueChange={setAudienceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMARKETING">Remarketing</SelectItem>
                      <SelectItem value="CUSTOMER_MATCH">Customer Match</SelectItem>
                      <SelectItem value="COMBINED">Combinado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={() => createMutation.mutate()} disabled={!audienceName || createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar publicos</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              <RefreshCw className="mr-2 h-3 w-3" />Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 items-center">
        {(["ALL", "REMARKETING", "CUSTOMER_MATCH", "COMBINED"] as AudienceFilter[]).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
            {f === "ALL" ? `Todos (${audiences.length})`
              : f === "REMARKETING" ? `Remarketing (${audiences.filter((a: any) => a.type === "REMARKETING").length})`
              : f === "CUSTOMER_MATCH" ? `Customer Match (${audiences.filter((a: any) => a.type === "CUSTOMER_MATCH").length})`
              : `Combinados (${audiences.filter((a: any) => a.type === "COMBINED").length})`}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descricao</TableHead>
                  <TableHead className="text-right">Tamanho</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <Badge variant={a.type === "REMARKETING" ? "default" : a.type === "CUSTOMER_MATCH" ? "secondary" : "outline"}>
                        {a.type === "REMARKETING" ? "Remarketing" : a.type === "CUSTOMER_MATCH" ? "Customer Match" : "Combinado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{a.description || "---"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCount(a.memberCount)}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "ENABLED" ? "default" : "secondary"}>
                        {a.status === "ENABLED" ? "Ativo" : a.status === "PAUSED" ? "Pausado" : a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : !error ? (
            <div className="text-center py-8 space-y-3">
              <Users className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Nenhum publico encontrado nesta conta.</p>
              <p className="text-xs text-muted-foreground">Crie um publico usando o botao acima.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Publico?</AlertDialogTitle>
            <AlertDialogDescription>Esta acao nao pode ser desfeita. O publico sera removido permanentemente da sua conta Google Ads.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
