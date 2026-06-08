import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { Clock, User, FileText } from "lucide-react";

const RESOURCE_TYPES = [
  { label: "Todas", value: "" },
  { label: "Campanhas", value: "CAMPAIGN" },
  { label: "Grupos de Anuncios", value: "AD_GROUP" },
  { label: "Anuncios", value: "AD_GROUP_AD" },
  { label: "Palavras-chave", value: "AD_GROUP_CRITERION" },
  { label: "Conta", value: "CUSTOMER" },
];

const CHANGE_TYPES: Record<string, string> = {
  CREATE: "Criado",
  UPDATE: "Atualizado",
  REMOVE: "Removido",
};

export default function ActivityLogPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["change-events", customerId, resourceType, page],
    queryFn: async () => {
      const { getChangeEvents: listChangeEvents } = await import("@/lib/google-ads/change-history");
      return listChangeEvents(customerId!, {
        limit: 50,
        offset: page * 50,
        ...(resourceType ? { resourceType } : {}),
      });
    },
    enabled: !!customerId,
  });

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Historico de Atividades</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const events = (data as any)?.results || (data as any)?.data || [];
  const hasMore = events.length >= 50;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historico de Atividades</h1>
        <p className="text-muted-foreground">Log de mudancas na conta de anuncios</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {RESOURCE_TYPES.map((cat) => (
          <Button
            key={cat.value}
            variant={resourceType === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setResourceType(cat.value); setPage(0); }}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {events.map((evt: any, i: number) => (
                  <div key={`${evt.changeDateTime}-${i}`} className="relative flex gap-4 pl-2">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={
                          evt.changeType === "CREATE" ? "default"
                          : evt.changeType === "REMOVE" ? "destructive"
                          : "secondary"
                        }>
                          {CHANGE_TYPES[evt.changeType] || evt.changeType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {evt.resourceType?.replace(/_/g, " ") || "Recurso"}
                        </Badge>
                      </div>
                      {evt.resourceName && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {evt.resourceName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{evt.userEmail || "Sistema"}</span>
                        <span className="text-xs text-muted-foreground">-</span>
                        <span className="text-xs text-muted-foreground">
                          {evt.changeDateTime ? new Date(evt.changeDateTime).toLocaleString("pt-BR") : "---"}
                        </span>
                      </div>
                      {evt.changedFields && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Campos alterados: {evt.changedFields}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhuma atividade encontrada.</p>
          )}

          {/* Pagination */}
          <div className="flex justify-center gap-2 pt-6">
            {page > 0 && (
              <Button variant="outline" onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            )}
            {hasMore && (
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Proxima</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
