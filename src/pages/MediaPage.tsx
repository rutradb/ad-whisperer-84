import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Type, Link as LinkIcon, Loader2, Search, ExternalLink, MessageSquare, Video } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AssetsPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");

  // Create text asset state
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [textType, setTextType] = useState<"TEXT" | "CALLOUT" | "SITELINK">("TEXT");

  // Create sitelink state
  const [sitelinkDialogOpen, setSitelinkDialogOpen] = useState(false);
  const [sitelinkText, setSitelinkText] = useState("");
  const [sitelinkDesc1, setSitelinkDesc1] = useState("");
  const [sitelinkDesc2, setSitelinkDesc2] = useState("");
  const [sitelinkUrl, setSitelinkUrl] = useState("");

  // Image upload state
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["assets", customerId],
    queryFn: async () => {
      const { listAssets } = await import("@/lib/google-ads/assets");
      return listAssets(customerId!);
    },
    enabled: !!customerId,
  });

  const createTextAssetMutation = useMutation({
    mutationFn: async () => {
      const { createTextAsset } = await import("@/lib/google-ads/assets");
      return createTextAsset(customerId!, textContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({ title: "Asset de texto criado" });
      setTextDialogOpen(false);
      setTextContent("");
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const createSitelinkMutation = useMutation({
    mutationFn: async () => {
      const { createSitelinkAsset } = await import("@/lib/google-ads/assets");
      return createSitelinkAsset(customerId!, {
        linkText: sitelinkText,
        description1: sitelinkDesc1,
        description2: sitelinkDesc2,
        finalUrls: [sitelinkUrl],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({ title: "Sitelink criado" });
      setSitelinkDialogOpen(false);
      setSitelinkText("");
      setSitelinkDesc1("");
      setSitelinkDesc2("");
      setSitelinkUrl("");
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const uploadImageMutation = useMutation({
    mutationFn: async () => {
      const mod = await import("@/lib/google-ads/assets");
      return (mod as any).createImageAsset(customerId!, imageFile!, imageName || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({ title: "Imagem enviada com sucesso" });
      setImageDialogOpen(false);
      setImageFile(null);
      setImageName("");
    },
    onError: (err: Error) => toast({ title: "Erro no upload", description: err.message, variant: "destructive" }),
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Recursos</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const rawAssets = (assetsData as any)?.results || [];
  const assets = rawAssets.map((r: any) => {
    const a = r.asset || r;
    return {
      id: a.id,
      name: a.name || "",
      type: a.type || "UNKNOWN",
      resourceName: a.resourceName,
      text: a.textAsset?.text || a.calloutAsset?.calloutText || "",
      imageUrlRaw: a.imageAsset?.fullSize?.url || "",
      imageUrl: a.imageAsset?.fullSize?.url
        ? `${localStorage.getItem("cloud_run_url") || ""}/api/image-proxy?url=${encodeURIComponent(a.imageAsset.fullSize.url)}`
        : "",
      imageWidth: a.imageAsset?.fullSize?.widthPixels,
      imageHeight: a.imageAsset?.fullSize?.heightPixels,
      fileSize: a.imageAsset?.fileSize,
      youtubeVideoId: a.youtubeVideoAsset?.youtubeVideoId || "",
      youtubeVideoTitle: a.youtubeVideoAsset?.youtubeVideoTitle || "",
      thumbnailUrl: a.youtubeVideoAsset?.youtubeVideoId ? `https://img.youtube.com/vi/${a.youtubeVideoAsset.youtubeVideoId}/default.jpg` : "",
      sitelinkText: a.sitelinkAsset?.linkText || "",
      sitelinkDescription1: a.sitelinkAsset?.description1 || "",
      sitelinkDescription2: a.sitelinkAsset?.description2 || "",
      sitelinkFinalUrls: a.sitelinkAsset?.finalUrls || a.finalUrls || [],
      approvalStatus: a.policySummary?.approvalStatus || "",
      reviewStatus: a.policySummary?.reviewStatus || "",
    };
  });

  const textAssets = assets.filter((a: any) => a.type === "TEXT" || a.type === "CALLOUT" || a.type === "STRUCTURED_SNIPPET");
  const imageAssets = assets.filter((a: any) => a.type === "IMAGE");
  const videoAssets = assets.filter((a: any) => a.type === "YOUTUBE_VIDEO");
  const sitelinkAssets = assets.filter((a: any) => a.type === "SITELINK");

  const filterAssets = (list: any[]) =>
    searchQuery
      ? list.filter((a) => (a.name || a.text || "").toLowerCase().includes(searchQuery.toLowerCase()))
      : list;

  function assetTypeBadge(type: string) {
    switch (type) {
      case "TEXT":
        return <Badge variant="secondary">Texto</Badge>;
      case "IMAGE":
        return <Badge variant="default">Imagem</Badge>;
      case "YOUTUBE_VIDEO":
        return <Badge className="bg-red-100 text-red-800">YouTube</Badge>;
      case "SITELINK":
        return <Badge className="bg-blue-100 text-blue-800">Sitelink</Badge>;
      case "CALLOUT":
        return <Badge className="bg-purple-100 text-purple-800">Callout</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recursos</h1>
          <p className="text-muted-foreground">Gerencie assets de texto, imagem, sitelinks e callouts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Type className="mr-2 h-4 w-4" />Novo Texto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Asset de Texto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Texto *</Label>
                  <Textarea placeholder="Texto do asset" value={textContent} onChange={(e) => setTextContent(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={() => createTextAssetMutation.mutate()} disabled={!textContent || createTextAssetMutation.isPending}>
                  {createTextAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={sitelinkDialogOpen} onOpenChange={setSitelinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><LinkIcon className="mr-2 h-4 w-4" />Novo Sitelink</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Sitelink</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Texto do Link *</Label>
                  <Input placeholder="Ex: Ver Produtos" value={sitelinkText} onChange={(e) => setSitelinkText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Descricao 1</Label>
                  <Input placeholder="Descricao opcional" value={sitelinkDesc1} onChange={(e) => setSitelinkDesc1(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Descricao 2</Label>
                  <Input placeholder="Descricao opcional" value={sitelinkDesc2} onChange={(e) => setSitelinkDesc2(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>URL Final *</Label>
                  <Input placeholder="https://..." value={sitelinkUrl} onChange={(e) => setSitelinkUrl(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={() => createSitelinkMutation.mutate()} disabled={!sitelinkText || !sitelinkUrl || createSitelinkMutation.isPending}>
                  {createSitelinkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="mr-2 h-4 w-4" />Upload Imagem</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload de Imagem</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) setImageFile(f);
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  {imageFile ? (
                    <p className="text-sm font-medium">{imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Arraste um arquivo ou clique para selecionar</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF</p>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nome (opcional)</Label>
                  <Input placeholder="Nome do asset" value={imageName} onChange={(e) => setImageName(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={() => uploadImageMutation.mutate()} disabled={!imageFile || uploadImageMutation.isPending}>
                  {uploadImageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Fazer Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="text">
        <TabsList>
          <TabsTrigger value="text"><Type className="mr-2 h-4 w-4" />Texto ({textAssets.length})</TabsTrigger>
          <TabsTrigger value="images"><ImageIcon className="mr-2 h-4 w-4" />Imagens ({imageAssets.length})</TabsTrigger>
          <TabsTrigger value="videos"><Video className="mr-2 h-4 w-4" />Videos ({videoAssets.length})</TabsTrigger>
          <TabsTrigger value="sitelinks"><LinkIcon className="mr-2 h-4 w-4" />Sitelinks ({sitelinkAssets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filterAssets(textAssets).length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Texto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterAssets(textAssets).map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium max-w-md truncate">{a.text || a.name}</TableCell>
                        <TableCell>{assetTypeBadge(a.type)}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === "ENABLED" ? "default" : "secondary"}>{a.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum asset de texto encontrado.</p>
          )}
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : filterAssets(imageAssets).length > 0 ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filterAssets(imageAssets).map((a: any) => (
                <Card key={a.id} className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <div className="aspect-square bg-muted flex items-center justify-center relative">
                    {a.imageUrl ? (
                      <img
                        src={a.imageUrl}
                        alt={a.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    {a.imageWidth && a.imageHeight && (
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                        {a.imageWidth}x{a.imageHeight}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{a.name || "Sem nome"}</p>
                    {a.dimensions && <p className="text-xs text-muted-foreground">{a.dimensions}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhuma imagem encontrada.</p>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-lg" />)}
            </div>
          ) : filterAssets(videoAssets).length > 0 ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filterAssets(videoAssets).map((a: any) => (
                <Card key={a.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {a.thumbnailUrl ? (
                      <img src={a.thumbnailUrl} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{a.name || a.youtubeVideoId || "Sem titulo"}</p>
                    {a.youtubeVideoId && (
                      <a href={`https://youtube.com/watch?v=${a.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />Ver no YouTube
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum video encontrado.</p>
          )}
        </TabsContent>

        <TabsContent value="sitelinks" className="mt-4">
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filterAssets(sitelinkAssets).length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Texto do Link</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterAssets(sitelinkAssets).map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.sitelinkText || a.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{a.sitelinkDescription1 || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {a.sitelinkFinalUrls?.[0] ? (
                            <a href={a.sitelinkFinalUrls[0]} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />{a.sitelinkFinalUrls[0]?.substring(0, 40)}...
                            </a>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={a.approvalStatus === "APPROVED" ? "default" : "secondary"}>{a.approvalStatus || "—"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum sitelink encontrado.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
