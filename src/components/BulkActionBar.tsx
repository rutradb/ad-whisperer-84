import { Button } from "@/components/ui/button";
import { useBulkUpdateStatus } from "@/hooks/useBulkMutations";
import { Play, Pause, Archive, X, Loader2 } from "lucide-react";

interface BulkActionBarProps {
  selectedIds: Set<string>;
  onClear: () => void;
}

export function BulkActionBar({ selectedIds, onClear }: BulkActionBarProps) {
  const bulkUpdate = useBulkUpdateStatus();
  const ids = Array.from(selectedIds);
  const count = ids.length;

  if (count === 0) return null;

  const handleAction = (status: "ENABLED" | "PAUSED" | "REMOVED") => {
    bulkUpdate.mutate({ ids, status } as any, { onSuccess: onClear });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="flex items-center gap-3 rounded-xl border bg-background/95 backdrop-blur-sm shadow-purple-lg px-5 py-3">
        <span className="text-sm font-medium">{count} selecionado(s)</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleAction("ENABLED")} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
            Ativar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAction("PAUSED")} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Pause className="mr-1 h-3 w-3" />}
            Pausar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction("REMOVED")} disabled={bulkUpdate.isPending}>
            {bulkUpdate.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Archive className="mr-1 h-3 w-3" />}
            Remover
          </Button>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 ml-1" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
