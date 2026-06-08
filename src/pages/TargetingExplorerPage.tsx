import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Search, Loader2, Users, Layers, Languages,
  Plus, X, Copy, CheckCircle2, BarChart3, TrendingUp,
} from "lucide-react";
import { formatMicros, formatNumber, formatPercent } from "@/lib/formatters";
import { microsToUnits, normalizeMetricsRow, computeRoas, computeCpa } from "@/lib/google-ads/types";

// Quick countries
const QUICK_COUNTRIES = [
  { name: "Brasil", code: "BR", id: "2076" },
  { name: "Estados Unidos", code: "US", id: "2840" },
  { name: "Portugal", code: "PT", id: "2620" },
  { name: "Argentina", code: "AR", id: "2032" },
  { name: "Mexico", code: "MX", id: "2484" },
  { name: "Colombia", code: "CO", id: "2170" },
  { name: "Espanha", code: "ES", id: "2724" },
  { name: "Chile", code: "CL", id: "2152" },
];

type CartItem = { id: string; name: string; type: string; resourceName?: string; extra?: string };

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function competitionBadge(comp: string) {
  switch (comp) {
    case "HIGH": return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
    case "MEDIUM": return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
    case "LOW": return <Badge className="bg-green-100 text-green-800">Baixa</Badge>;
    default: return <Badge variant="outline">{comp || "?"}</Badge>;
  }
}

export default function TargetingExplorerPage() {
  const { selectedCustomer } = useAuthStore();
  const customerId = selectedCustomer?.id;
  const { toast } = useToast();

  // === KEYWORD RESEARCH ===
  const [kwInput, setKwInput] = useState("");
  const [kwResults, setKwResults] = useState<any[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwGeo, setKwGeo] = useState("2076");
  const [kwLang, setKwLang] = useState("1014");

  const handleKeywordSearch = async () => {
    if (!kwInput.trim() || !customerId) return;
    setKwLoading(true);
    try {
      const { generateKeywordIdeas } = await import("@/lib/google-ads/targeting");
      const keywords = kwInput.split(",").map((k) => k.trim()).filter(Boolean);
      const res = await generateKeywordIdeas(customerId, keywords, {
        language: `languageConstants/${kwLang}`,
        geoTargets: [`geoTargetConstants/${kwGeo}`],
        pageSize: 30,
      });
      setKwResults((res.results || []).map((r: any) => {
        const m = r.keywordIdeaMetrics || {};
        return {
          keyword: r.text || "",
          volume: Number(m.avgMonthlySearches || 0),
          competition: m.competition || "UNKNOWN",
          cpcLow: m.lowTopOfPageBidMicros ? microsToUnits(Number(m.lowTopOfPageBidMicros)) : 0,
          cpcHigh: m.highTopOfPageBidMicros ? microsToUnits(Number(m.highTopOfPageBidMicros)) : 0,
          trend: (m.monthlySearchVolumes || []).slice(-3).map((v: any) => Number(v.monthlySearches || 0)),
        };
      }));
    } catch (err: any) {
      toast({ description: err.message, variant: "destructive" });
    } finally {
      setKwLoading(false);
    }
  };

  // === SEGMENTATION CART ===
  const [cart, setCart] = useState<CartItem[]>([]);
  const addToCart = (item: CartItem) => {
    if (cart.some((c) => c.id === item.id && c.type === item.type)) return;
    setCart((prev) => [...prev, item]);
  };
  const removeFromCart = (id: string, type: string) => {
    setCart((prev) => prev.filter((c) => !(c.id === id && c.type === type)));
  };

  // Geo search
  const [geoQuery, setGeoQuery] = useState("");
  const [geoResults, setGeoResults] = useState<any[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const debouncedGeo = useDebounce(geoQuery, 400);

  // Full lists
  const [allInterests, setAllInterests] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [allLanguages, setAllLanguages] = useState<any[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [audQuery, setAudQuery] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [langQuery, setLangQuery] = useState("");

  // Demographics
  const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Desconhecido"];
  const GENDERS = ["Masculino", "Feminino", "Desconhecido"];

  // === PERFORMANCE ===
  const [perfData, setPerfData] = useState<{ device: any[]; hour: any[]; day: any[]; geo: any[] }>({ device: [], hour: [], day: [], geo: [] });
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfSort, setPerfSort] = useState<{ table: string; key: string; dir: "asc" | "desc" }>({ table: "", key: "", dir: "desc" });

  // Aggregate rows by key and sort
  function aggregate(rows: any[], key: string): any[] {
    const map = new Map<string, any>();
    for (const r of rows) {
      const k = r[key] || "?";
      if (map.has(k)) {
        const existing = map.get(k);
        existing.clicks += r.clicks || 0;
        existing.cost += r.cost || 0;
        existing.conversions += r.conversions || 0;
        existing.impressions = (existing.impressions || 0) + (r.impressions || 0);
      } else {
        map.set(k, { ...r, [key]: k });
      }
    }
    return Array.from(map.values());
  }

  function sortPerf(rows: any[], table: string): any[] {
    if (perfSort.table !== table) return rows;
    const k = perfSort.key;
    const dir = perfSort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => ((a[k] ?? 0) > (b[k] ?? 0) ? dir : -dir));
  }

  function toggleSort(table: string, key: string) {
    setPerfSort((prev) => ({
      table,
      key,
      dir: prev.table === table && prev.key === key && prev.dir === "desc" ? "asc" : "desc",
    }));
  }

  function SortHeader({ table, field, label }: { table: string; field: string; label: string }) {
    const active = perfSort.table === table && perfSort.key === field;
    return (
      <TableHead
        className="text-right cursor-pointer hover:text-foreground select-none"
        onClick={() => toggleSort(table, field)}
      >
        {label} {active ? (perfSort.dir === "asc" ? "↑" : "↓") : ""}
      </TableHead>
    );
  }

  // Geo search
  useEffect(() => {
    if (!debouncedGeo || debouncedGeo.length < 2 || !customerId) { setGeoResults([]); return; }
    setGeoLoading(true);
    import("@/lib/google-ads/targeting").then(({ searchGeoTargetConstants }) => {
      searchGeoTargetConstants(customerId, debouncedGeo, 15).then((res) => {
        setGeoResults((res.results || []).map((r: any) => {
          const g = r.geoTargetConstant || r;
          return { id: g.id, name: g.canonicalName || g.name, countryCode: g.countryCode, targetType: g.targetType, resourceName: g.resourceName };
        }));
      }).catch(() => setGeoResults([]));
    }).finally(() => setGeoLoading(false));
  }, [debouncedGeo, customerId]);

  // Load all lists
  useEffect(() => {
    if (!customerId) return;
    setListsLoading(true);
    Promise.all([
      import("@/lib/google-ads/targeting").then(({ listUserInterests }) =>
        listUserInterests(customerId).then((res) =>
          (res.results || []).map((r: any) => {
            const ui = r.userInterest || r;
            return { id: ui.userInterestId || ui.id, name: ui.name || "", type: ui.taxonomyType || "", resourceName: ui.resourceName };
          })
        ).catch(() => [])
      ),
      import("@/lib/google-ads/targeting").then(({ listTopicConstants }) =>
        listTopicConstants(customerId).then((res) =>
          (res.results || []).map((r: any) => {
            const tc = r.topicConstant || r;
            const pathArr = Array.isArray(tc.path) ? tc.path.filter(Boolean) : [];
            return { id: tc.id, name: pathArr.join(" > ") || "", resourceName: tc.resourceName };
          }).filter((t: any) => t.name)
        ).catch(() => [])
      ),
      import("@/lib/google-ads/targeting").then(({ listLanguageConstants }) =>
        listLanguageConstants(customerId).then((res) =>
          (res.results || []).map((r: any) => {
            const l = r.languageConstant || r;
            return { id: l.id, name: l.name || "", code: l.code || "", resourceName: l.resourceName };
          })
        ).catch(() => [])
      ),
    ]).then(([interests, topics, languages]) => {
      setAllInterests(interests);
      setAllTopics(topics);
      setAllLanguages(languages);
    }).finally(() => setListsLoading(false));
  }, [customerId]);

  // Load performance data
  useEffect(() => {
    if (!customerId) return;
    setPerfLoading(true);
    Promise.all([
      import("@/lib/google-ads/reporting").then(({ getPerformanceByDevice }) =>
        getPerformanceByDevice(customerId).then((r) => (r.results || []).map((row: any) => {
          const m = normalizeMetricsRow(row);
          return { device: row.segments?.device, impressions: m.impressions, clicks: m.clicks, cost: microsToUnits(m.costMicros), conversions: m.conversions, roas: computeRoas(m), cpa: computeCpa(m) };
        })).catch(() => [])
      ),
      import("@/lib/google-ads/reporting").then(({ getPerformanceByHour }) =>
        getPerformanceByHour(customerId).then((r) => (r.results || []).map((row: any) => {
          const m = normalizeMetricsRow(row);
          return { hour: row.segments?.hour, clicks: m.clicks, cost: microsToUnits(m.costMicros), conversions: m.conversions };
        })).catch(() => [])
      ),
      import("@/lib/google-ads/reporting").then(({ getPerformanceByDayOfWeek }) =>
        getPerformanceByDayOfWeek(customerId).then((r) => (r.results || []).map((row: any) => {
          const m = normalizeMetricsRow(row);
          return { day: row.segments?.dayOfWeek, clicks: m.clicks, cost: microsToUnits(m.costMicros), conversions: m.conversions, roas: computeRoas(m) };
        })).catch(() => [])
      ),
      import("@/lib/google-ads/reporting").then(({ getGeographicPerformance }) =>
        getGeographicPerformance(customerId).then((r) => (r.results || []).slice(0, 15).map((row: any) => {
          const m = normalizeMetricsRow(row);
          return { location: row.geoTargetConstant?.name || "?", clicks: m.clicks, cost: microsToUnits(m.costMicros), conversions: m.conversions, roas: computeRoas(m) };
        })).catch(() => [])
      ),
    ]).then(([device, hour, day, geo]) => {
      setPerfData({ device, hour, day, geo });
    }).finally(() => setPerfLoading(false));
  }, [customerId]);

  // Client-side filtering
  const audResults = audQuery.length >= 2
    ? allInterests.filter((i) => i.name.toLowerCase().includes(audQuery.toLowerCase())).slice(0, 20)
    : allInterests.slice(0, 20);
  const topicResults = topicQuery.length >= 2
    ? allTopics.filter((t) => t.name.toLowerCase().includes(topicQuery.toLowerCase())).slice(0, 20)
    : allTopics.slice(0, 20);
  const langResults = langQuery.length >= 1
    ? allLanguages.filter((l) => l.name.toLowerCase().includes(langQuery.toLowerCase()))
    : allLanguages.slice(0, 20);

  const copySpec = () => {
    const spec = {
      geoTargets: cart.filter((c) => c.type === "geo").map((c) => ({ id: c.id, name: c.name })),
      audiences: cart.filter((c) => c.type === "audience").map((c) => ({ id: c.id, name: c.name })),
      topics: cart.filter((c) => c.type === "topic").map((c) => ({ id: c.id, name: c.name })),
      languages: cart.filter((c) => c.type === "language").map((c) => ({ id: c.id, name: c.name })),
      demographics: cart.filter((c) => c.type === "demographic").map((c) => ({ name: c.name, extra: c.extra })),
    };
    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    toast({ description: "Especificacao copiada!" });
  };

  if (!customerId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Segmentacao</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const cartCount = cart.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Segmentacao e Pesquisa</h1>
        <p className="text-muted-foreground">Pesquise keywords, explore performance e monte segmentacao</p>
      </div>

      <Tabs defaultValue="research">
        <TabsList>
          <TabsTrigger value="research" className="gap-1.5"><Search className="h-3.5 w-3.5" />Pesquisa de Keywords</TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Performance</TabsTrigger>
          <TabsTrigger value="targeting" className="gap-1.5"><Users className="h-3.5 w-3.5" />Segmentacao{cartCount > 0 && ` (${cartCount})`}</TabsTrigger>
        </TabsList>

        {/* ===== KEYWORD RESEARCH TAB ===== */}
        <TabsContent value="research" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Digite keywords separadas por virgula (ex: curso de ia, inteligencia artificial)"
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleKeywordSearch()}
                  />
                </div>
                <Select value={kwGeo} onValueChange={setKwGeo}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUICK_COUNTRIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={kwLang} onValueChange={setKwLang}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1014">Portugues</SelectItem>
                    <SelectItem value="1000">Ingles</SelectItem>
                    <SelectItem value="1003">Espanhol</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleKeywordSearch} disabled={kwLoading || !kwInput.trim()} className="gap-2">
                  {kwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Pesquisar
                </Button>
              </div>
            </CardContent>
          </Card>

          {kwResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{kwResults.length} ideias de keywords</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead className="text-right">Volume/mes</TableHead>
                      <TableHead>Competicao</TableHead>
                      <TableHead className="text-right">CPC Estimado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kwResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.keyword}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {r.volume > 0 ? r.volume.toLocaleString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>{competitionBadge(r.competition)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {r.cpcLow > 0 ? `R$ ${r.cpcLow.toFixed(2)} - ${r.cpcHigh.toFixed(2)}` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== PERFORMANCE TAB ===== */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          {perfLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {[1,2,3,4].map((i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Device */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Dispositivo</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("device","device")}>Device</TableHead>
                      <SortHeader table="device" field="clicks" label="Cliques" />
                      <SortHeader table="device" field="cost" label="Custo" />
                      <SortHeader table="device" field="conversions" label="Conv." />
                    </TableRow></TableHeader>
                    <TableBody>
                      {sortPerf(aggregate(perfData.device, "device"), "device").map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{r.device === "MOBILE" ? "📱 Mobile" : r.device === "DESKTOP" ? "🖥️ Desktop" : r.device === "TABLET" ? "📱 Tablet" : r.device}</TableCell>
                          <TableCell className="text-right text-sm">{formatNumber(r.clicks)}</TableCell>
                          <TableCell className="text-right text-sm">R$ {r.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm">{r.conversions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Day of week */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Dia da Semana</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("day","day")}>Dia</TableHead>
                      <SortHeader table="day" field="clicks" label="Cliques" />
                      <SortHeader table="day" field="cost" label="Custo" />
                      <SortHeader table="day" field="conversions" label="Conv." />
                    </TableRow></TableHeader>
                    <TableBody>
                      {sortPerf(aggregate(perfData.day, "day"), "day").map((r, i) => {
                        const dayNames: Record<string, string> = { MONDAY: "Segunda", TUESDAY: "Terca", WEDNESDAY: "Quarta", THURSDAY: "Quinta", FRIDAY: "Sexta", SATURDAY: "Sabado", SUNDAY: "Domingo" };
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">{dayNames[r.day] || r.day}</TableCell>
                            <TableCell className="text-right text-sm">{formatNumber(r.clicks)}</TableCell>
                            <TableCell className="text-right text-sm">R$ {r.cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm">{r.conversions}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Hour */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Hora do Dia</CardTitle></CardHeader>
                <CardContent className="p-0 max-h-64 overflow-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("hour","hour")}>Hora</TableHead>
                      <SortHeader table="hour" field="clicks" label="Cliques" />
                      <SortHeader table="hour" field="cost" label="Custo" />
                      <SortHeader table="hour" field="conversions" label="Conv." />
                    </TableRow></TableHeader>
                    <TableBody>
                      {sortPerf(aggregate(perfData.hour, "hour"), "hour").map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{String(r.hour).padStart(2, "0")}:00</TableCell>
                          <TableCell className="text-right text-sm">{formatNumber(r.clicks)}</TableCell>
                          <TableCell className="text-right text-sm">R$ {r.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm">{r.conversions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Geographic */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Por Regiao</CardTitle></CardHeader>
                <CardContent className="p-0 max-h-64 overflow-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("geo","location")}>Local</TableHead>
                      <SortHeader table="geo" field="clicks" label="Cliques" />
                      <SortHeader table="geo" field="cost" label="Custo" />
                      <SortHeader table="geo" field="conversions" label="Conv." />
                    </TableRow></TableHeader>
                    <TableBody>
                      {sortPerf(aggregate(perfData.geo, "location"), "geo").map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{r.location}</TableCell>
                          <TableCell className="text-right text-sm">{formatNumber(r.clicks)}</TableCell>
                          <TableCell className="text-right text-sm">R$ {r.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm">{r.conversions}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ===== TARGETING/SEGMENTATION TAB ===== */}
        <TabsContent value="targeting" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Geo */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />Localizacao</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {QUICK_COUNTRIES.map((c) => (
                      <Button key={c.id} variant={cart.some((ci) => ci.id === c.id && ci.type === "geo") ? "default" : "outline"} size="sm"
                        onClick={() => addToCart({ id: c.id, name: c.name, type: "geo", extra: c.code })}>{c.name}</Button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar cidade, estado ou pais..." value={geoQuery} onChange={(e) => setGeoQuery(e.target.value)} className="pl-10" />
                  </div>
                  {geoResults.length > 0 && (
                    <div className="border rounded-lg max-h-40 overflow-auto">
                      {geoResults.map((r) => (
                        <button key={r.id} className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent text-sm" onClick={() => { addToCart({ id: r.id, name: r.name, type: "geo", resourceName: r.resourceName }); setGeoQuery(""); setGeoResults([]); }}>
                          <span>{r.name}</span><Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Publicos */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Publicos ({allInterests.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Input placeholder="Filtrar publicos..." value={audQuery} onChange={(e) => setAudQuery(e.target.value)} />
                  <div className="border rounded-lg max-h-48 overflow-auto">
                    {listsLoading ? <div className="p-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div> :
                      audResults.map((r) => (
                        <button key={r.id} className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent text-sm border-b last:border-0" onClick={() => addToCart({ id: r.id, name: r.name, type: "audience" })}>
                          <span>{r.name}</span><Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Topicos */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" />Topicos ({allTopics.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Input placeholder="Filtrar topicos (ex: auto, finance, travel)..." value={topicQuery} onChange={(e) => setTopicQuery(e.target.value)} />
                  <div className="border rounded-lg max-h-48 overflow-auto">
                    {topicResults.map((r) => (
                      <button key={r.id} className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent text-sm border-b last:border-0" onClick={() => addToCart({ id: r.id, name: r.name, type: "topic" })}>
                        <span className="text-left">{r.name}</span><Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Idiomas */}
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Languages className="h-4 w-4" />Idiomas</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Input placeholder="Filtrar idioma..." value={langQuery} onChange={(e) => setLangQuery(e.target.value)} />
                  <div className="flex gap-2 flex-wrap">
                    {langResults.map((r) => (
                      <Button key={r.id} variant={cart.some((c) => c.id === r.id && c.type === "language") ? "default" : "outline"} size="sm"
                        onClick={() => addToCart({ id: r.id, name: r.name, type: "language", extra: r.code })}>{r.name} ({r.code})</Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Demografia */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Demografia</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Faixa Etaria</p>
                    <div className="flex gap-2 flex-wrap">
                      {AGE_RANGES.map((age) => (
                        <Button key={age} variant={cart.some((c) => c.id === `age-${age}`) ? "default" : "outline"} size="sm"
                          onClick={() => addToCart({ id: `age-${age}`, name: age, type: "demographic", extra: "age" })}>{age}</Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Genero</p>
                    <div className="flex gap-2 flex-wrap">
                      {GENDERS.map((g) => (
                        <Button key={g} variant={cart.some((c) => c.id === `gender-${g}`) ? "default" : "outline"} size="sm"
                          onClick={() => addToCart({ id: `gender-${g}`, name: g, type: "demographic", extra: "gender" })}>{g}</Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cart */}
            <div>
              <Card className="sticky top-20">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Segmentacao ({cart.length})</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Clique nos itens para adicionar</p>
                  ) : (
                    <>
                      {["geo", "audience", "topic", "language", "demographic"].map((type) => {
                        const items = cart.filter((c) => c.type === type);
                        if (items.length === 0) return null;
                        const labels: Record<string, string> = { geo: "Localizacao", audience: "Publicos", topic: "Topicos", language: "Idiomas", demographic: "Demografia" };
                        return (
                          <div key={type}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{labels[type]}</p>
                            <div className="flex flex-wrap gap-1">
                              {items.map((item) => (
                                <Badge key={item.id} variant="secondary" className="gap-1 pr-1">
                                  <span className="text-xs">{item.name}</span>
                                  <button onClick={() => removeFromCart(item.id, item.type)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <Button onClick={copySpec} className="w-full gap-2 mt-2" size="sm"><Copy className="h-3.5 w-3.5" />Exportar JSON</Button>
                      <Button onClick={() => setCart([])} variant="ghost" className="w-full text-destructive" size="sm">Limpar tudo</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
