import { useState, useMemo } from "react";
import { listAudiences } from "@/lib/google-ads/audiences";
import { useQuery } from "@tanstack/react-query";
import { STALE_TIMES } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, X, Users, UserMinus } from "lucide-react";
import { formatCompact } from "@/lib/formatters";

interface AudienceSelectorProps {
  customerId: string;
  selectedInclude: string[];
  selectedExclude: string[];
  onIncludeChange: (ids: string[]) => void;
  onExcludeChange: (ids: string[]) => void;
}

export function AudienceSelector({
  customerId,
  selectedInclude,
  selectedExclude,
  onIncludeChange,
  onExcludeChange,
}: AudienceSelectorProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audiences", customerId],
    queryFn: () => listAudiences(customerId, 200),
    enabled: !!customerId,
    staleTime: STALE_TIMES.SLOW_CHANGING,
  });

  const audiences = data?.results || [];

  const filtered = useMemo(() => {
    if (!search) return audiences;
    const q = search.toLowerCase();
    return audiences.filter((a: any) => {
      const name = a.userList?.name || "";
      return name.toLowerCase().includes(q);
    });
  }, [audiences, search]);

  const includeSet = useMemo(() => new Set(selectedInclude), [selectedInclude]);
  const excludeSet = useMemo(() => new Set(selectedExclude), [selectedExclude]);

  const toggleInclude = (id: string) => {
    if (includeSet.has(id)) {
      onIncludeChange(selectedInclude.filter((x) => x !== id));
    } else {
      onExcludeChange(selectedExclude.filter((x) => x !== id));
      onIncludeChange([...selectedInclude, id]);
    }
  };

  const toggleExclude = (id: string) => {
    if (excludeSet.has(id)) {
      onExcludeChange(selectedExclude.filter((x) => x !== id));
    } else {
      onIncludeChange(selectedInclude.filter((x) => x !== id));
      onExcludeChange([...selectedExclude, id]);
    }
  };

  return (
    <div className="space-y-3">
      <Label>P\u00fablicos</Label>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar p\u00fablicos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
        {isLoading && <p className="text-sm text-muted-foreground p-2">Carregando...</p>}
        {filtered.map((a: any) => {
          const id = a.userList?.resourceName || "";
          const name = a.userList?.name || "Sem nome";
          const size = a.userList?.sizeForSearch || a.userList?.sizeForDisplay;
          const isIncluded = includeSet.has(id);
          const isExcluded = excludeSet.has(id);

          return (
            <div key={id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-accent text-sm">
              <span className="truncate flex-1">{name}</span>
              {size && <span className="text-xs text-muted-foreground mx-2">{formatCompact(size)}</span>}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => toggleInclude(id)}
                  className={`p-1 rounded ${isIncluded ? "bg-green-100 text-green-700" : "text-muted-foreground hover:bg-accent"}`}
                  title="Incluir"
                >
                  <Users className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleExclude(id)}
                  className={`p-1 rounded ${isExcluded ? "bg-red-100 text-red-700" : "text-muted-foreground hover:bg-accent"}`}
                  title="Excluir"
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground p-2">Nenhum p\u00fablico encontrado.</p>
        )}
      </div>

      {(selectedInclude.length > 0 || selectedExclude.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {selectedInclude.map((id) => (
            <Badge key={id} variant="default" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {(audiences as any[]).find((a: any) => a?.userList?.resourceName === id)?.userList?.name || id}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleInclude(id)} />
            </Badge>
          ))}
          {selectedExclude.map((id) => (
            <Badge key={id} variant="destructive" className="text-xs gap-1">
              <UserMinus className="h-3 w-3" />
              {(audiences as any[]).find((a: any) => a?.userList?.resourceName === id)?.userList?.name || id}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleExclude(id)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
