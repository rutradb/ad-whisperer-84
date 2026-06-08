import { useState, useMemo } from "react";
import { useCreatives } from "@/hooks/useCreatives";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Image, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreativePickerProps {
  accountId: string;
  value: string;
  onChange: (creativeId: string) => void;
}

export function CreativePicker({ accountId, value, onChange }: CreativePickerProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useCreatives(accountId);
  const creatives = (data as any)?.results || [];

  const filtered = useMemo(() => {
    if (!search) return creatives;
    const q = search.toLowerCase();
    return creatives.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.body?.toLowerCase().includes(q)
    );
  }, [creatives, search]);

  return (
    <div className="space-y-3">
      <Label>Selecionar Criativo Existente</Label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar criativos por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Manual ID fallback */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Ou insira o ID diretamente:</Label>
        <Input
          placeholder="Ex: 123456789"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* Creative grid */}
      <div className="border rounded-md max-h-64 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-3">Carregando criativos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">
            {creatives.length === 0 ? "Nenhum criativo encontrado" : "Sem resultados para a busca"}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-0">
            {filtered.map((c) => {
              const isSelected = c.id === value;
              const thumbUrl = c.thumbnail_url || c.image_url;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    "flex flex-col items-start p-2 border-b border-r text-left hover:bg-muted/50 transition-colors relative",
                    isSelected && "bg-primary/5 ring-2 ring-primary ring-inset"
                  )}
                  onClick={() => onChange(c.id)}
                >
                  {isSelected && (
                    <CheckCircle2 className="absolute top-1.5 right-1.5 h-4 w-4 text-primary" />
                  )}
                  <div className="w-full aspect-video bg-muted rounded-sm overflow-hidden mb-1.5 flex items-center justify-center">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Image className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs font-medium truncate w-full">{c.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {c.status && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {c.status}
                      </Badge>
                    )}
                    {c.call_to_action_type && (
                      <span className="text-[10px] text-muted-foreground">{c.call_to_action_type}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
