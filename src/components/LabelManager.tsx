import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LabelBadge } from "@/components/LabelBadge";
import { useCreateLabel, useDeleteLabel, type CampaignLabel } from "@/hooks/useCampaignLabels";
import { Plus, Trash2 } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#f97316",
];

interface LabelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: CampaignLabel[];
}

export function LabelManager({ open, onOpenChange, labels }: LabelManagerProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const createLabel = useCreateLabel();
  const deleteLabel = useDeleteLabel();

  const handleCreate = () => {
    if (!name.trim()) return;
    createLabel.mutate({ name: name.trim(), color });
    setName("");
    setColor(PRESET_COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Labels</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Label</Label>
            <div className="flex gap-2">
              <Input placeholder="Nome da label" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
              <Button onClick={handleCreate} disabled={!name.trim() || createLabel.isPending} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: c === color ? "#000" : "transparent" }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Labels existentes ({labels.length})</Label>
            {labels.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {labels.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-1">
                    <LabelBadge name={l.name} color={l.color} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteLabel.mutate(l.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma label criada.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
