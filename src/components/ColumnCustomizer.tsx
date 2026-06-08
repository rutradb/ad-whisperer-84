import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Columns3 } from "lucide-react";
import type { ColumnDef } from "@/lib/columnConfig";

interface ColumnCustomizerProps {
  allColumns: ColumnDef[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  onReset: () => void;
}

export function ColumnCustomizer({ allColumns, visibleKeys, onToggle, onReset }: ColumnCustomizerProps) {
  const categories = [...new Set(allColumns.map((c) => c.category))];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3 className="mr-2 h-4 w-4" />Colunas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Personalizar Colunas</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{cat}</p>
              <div className="space-y-2">
                {allColumns
                  .filter((c) => c.category === cat)
                  .map((col) => (
                    <div key={col.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`col-${col.key}`}
                        checked={visibleKeys.includes(col.key)}
                        onCheckedChange={() => onToggle(col.key)}
                        disabled={col.key === "name"}
                      />
                      <Label htmlFor={`col-${col.key}`} className="text-sm cursor-pointer">
                        {col.label}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onReset}>Restaurar Padrão</Button>
          <DialogClose asChild><Button size="sm">Fechar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
