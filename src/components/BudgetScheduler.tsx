import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

interface BudgetSchedulerProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** Budget multiplier per day (0.5 = 50%, 1.0 = 100%, 1.5 = 150%) */
  multipliers: number[];
  onMultipliersChange: (multipliers: number[]) => void;
}

export function BudgetScheduler({ enabled, onEnabledChange, multipliers, onMultipliersChange }: BudgetSchedulerProps) {
  const updateDay = (index: number, value: number) => {
    const next = [...multipliers];
    next[index] = Math.max(0, Math.min(3, value));
    onMultipliersChange(next);
  };

  const maxMultiplier = Math.max(...multipliers);

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        <div>
          <Label className="font-medium">Budget por Dia da Semana</Label>
          <p className="text-xs text-muted-foreground">Ajuste o multiplicador de orcamento para cada dia (valores em micros: R$ 1,00 = 1.000.000 micros)</p>
        </div>
      </div>

      {enabled && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Multiplicadores: 1.0 = orcamento normal, 0.5 = metade, 1.5 = 50% a mais.
            Requer regra automatizada para ajustar diariamente.
          </p>
          <div className="space-y-2">
            {DAYS.map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm w-10 font-medium">{day}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(multipliers[i] / (maxMultiplier || 1)) * 100}%` }}
                  />
                </div>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  step={0.1}
                  className="w-20 text-center"
                  value={multipliers[i]}
                  onChange={(e) => updateDay(i, parseFloat(e.target.value) || 0)}
                />
                <span className="text-xs text-muted-foreground w-8">{(multipliers[i] * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const DEFAULT_MULTIPLIERS = [1, 1, 1, 1, 1, 1, 1];
