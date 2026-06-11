import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, Gauge, AlertTriangle, ShieldCheck, RefreshCw, Radio } from "lucide-react";
import {
  useMcpInvocations,
  computeAdherenceStats,
  computeEndpointCoverage,
} from "@/hooks/useMcpInvocations";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function AuditPage() {
  const { data, isLoading, refetch, isFetching } = useMcpInvocations(200);
  const rows = data ?? [];
  const stats = computeAdherenceStats(rows);
  const coverage = computeEndpointCoverage(rows);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditoria do MCP</h1>
          <p className="text-muted-foreground">
            Rastreamento de todos os endpoints chamados pela IA — garante a aderência das ações.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Activity} label="Chamadas rastreadas" value={stats.total.toLocaleString("pt-BR")} hint={`${stats.reads} leituras · ${stats.writes} escritas`} />
          <StatCard icon={AlertTriangle} label="Taxa de erro" value={`${stats.errorRatePct}%`} hint={`${stats.errors} com falha`} />
          <StatCard icon={Gauge} label="Latência média" value={`${stats.avgLatencyMs} ms`} />
          <StatCard icon={ShieldCheck} label="Aderência de escrita" value={`${stats.writeAdherencePct}%`} hint="Escritas vinculadas a um plano (Fase 3+)" />
        </div>
      )}

      {/* Cobertura por endpoint */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="h-4 w-4" /> Cobertura por endpoint
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : coverage.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Nenhuma chamada registrada ainda. Use o Assistente IA para gerar telemetria.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Endpoint</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 font-medium">Tools</th>
                    <th className="py-2 pr-4 font-medium text-right">Chamadas</th>
                    <th className="py-2 font-medium text-right">Erros</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.map((c) => (
                    <tr key={c.endpoint} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{c.endpoint}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={c.operationType === "write" ? "default" : "secondary"}>
                          {c.operationType === "write" ? "escrita" : "leitura"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground truncate max-w-[220px]">
                        {c.toolNames.join(", ")}
                      </td>
                      <td className="py-2 pr-4 text-right">{c.count}</td>
                      <td className="py-2 text-right">
                        {c.errors > 0 ? (
                          <span className="text-destructive font-medium">{c.errors}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invocações recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" /> Invocações recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Sem registros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Quando</th>
                    <th className="py-2 pr-4 font-medium">Tool</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 font-medium text-right">Status</th>
                    <th className="py-2 font-medium text-right">Latência</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r) => {
                    const isErr = (r.response_status ?? 200) >= 400;
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{r.tool_name}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={r.operation_type === "write" ? "default" : "secondary"}>
                            {r.operation_type === "write" ? "escrita" : "leitura"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <span className={isErr ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {r.response_status ?? "—"}
                            {r.error_code ? ` · ${r.error_code}` : ""}
                          </span>
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {r.latency_ms != null ? `${r.latency_ms} ms` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
