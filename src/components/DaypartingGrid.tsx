import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Google Ads uses day of week names: MONDAY=0 in our grid, SUNDAY=6
const DAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export interface AdScheduleEntry {
  startHour: number;
  endHour: number;
  startMinute: number;
  endMinute: number;
  dayOfWeek: string;
}

export function createEmptyGrid(): boolean[][] {
  return Array.from({ length: 7 }, () => Array(24).fill(false));
}

export function createFullGrid(): boolean[][] {
  return Array.from({ length: 7 }, () => Array(24).fill(true));
}

export function toAdSchedule(grid: boolean[][]): AdScheduleEntry[] {
  const entries: AdScheduleEntry[] = [];
  for (let d = 0; d < 7; d++) {
    let start: number | null = null;
    for (let h = 0; h <= 24; h++) {
      const active = h < 24 && grid[d][h];
      if (active && start === null) {
        start = h;
      } else if (!active && start !== null) {
        entries.push({
          startHour: start,
          endHour: h,
          startMinute: 0,
          endMinute: 0,
          dayOfWeek: DAY_NAMES[d],
        });
        start = null;
      }
    }
  }
  return entries;
}

export function fromAdSchedule(entries: AdScheduleEntry[]): boolean[][] {
  const grid = createEmptyGrid();
  for (const entry of entries) {
    const gridDay = DAY_NAMES.indexOf(entry.dayOfWeek);
    if (gridDay === -1) continue;
    for (let h = entry.startHour; h < entry.endHour; h++) {
      if (h < 24) grid[gridDay][h] = true;
    }
  }
  return grid;
}

interface DaypartingGridProps {
  schedule: boolean[][];
  onChange: (schedule: boolean[][]) => void;
}

export function DaypartingGrid({ schedule, onChange }: DaypartingGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(true);

  const toggle = useCallback((day: number, hour: number, value?: boolean) => {
    const next = schedule.map((row) => [...row]);
    next[day][hour] = value !== undefined ? value : !next[day][hour];
    onChange(next);
  }, [schedule, onChange]);

  const handleMouseDown = (day: number, hour: number) => {
    const newValue = !schedule[day][hour];
    setIsDragging(true);
    setDragValue(newValue);
    toggle(day, hour, newValue);
  };

  const handleMouseEnter = (day: number, hour: number) => {
    if (isDragging) toggle(day, hour, dragValue);
  };

  const handleMouseUp = () => setIsDragging(false);

  const selectedCount = schedule.flat().filter(Boolean).length;

  return (
    <div className="space-y-2" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex flex-wrap gap-2 mb-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(createFullGrid())}>Selecionar Todos</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(createEmptyGrid())}>Limpar</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          const g = createEmptyGrid();
          for (let d = 0; d < 5; d++) for (let h = 8; h < 18; h++) g[d][h] = true;
          onChange(g);
        }}>Horario Comercial</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          const g = createEmptyGrid();
          for (let d = 0; d < 5; d++) for (let h = 18; h < 24; h++) g[d][h] = true;
          for (let d = 5; d < 7; d++) for (let h = 0; h < 24; h++) g[d][h] = true;
          onChange(g);
        }}>Noites + FDS</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          const g = createEmptyGrid();
          for (let d = 0; d < 7; d++) for (let h = 6; h < 24; h++) g[d][h] = true;
          onChange(g);
        }}>Madrugada Off</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          const g = createEmptyGrid();
          for (let d = 0; d < 5; d++) { for (let h = 12; h < 14; h++) g[d][h] = true; for (let h = 19; h < 22; h++) g[d][h] = true; }
          onChange(g);
        }}>Pico Engajamento</Button>
        <span className="text-xs text-muted-foreground self-center ml-auto">{selectedCount}/168 horas</span>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-grid select-none" style={{ gridTemplateColumns: `60px repeat(24, 20px)` }}>
          {/* Header row */}
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-[10px] text-center text-muted-foreground">{String(h).padStart(2, "0")}</div>
          ))}
          {/* Day rows */}
          {DAYS.map((day, d) => (
            <>
              <div key={`label-${d}`} className="text-xs font-medium flex items-center">{day}</div>
              {HOURS.map((h) => (
                <div
                  key={`${d}-${h}`}
                  className={cn(
                    "w-5 h-5 border border-border/50 cursor-pointer transition-colors",
                    schedule[d][h] ? "bg-primary" : "bg-muted/30 hover:bg-muted"
                  )}
                  onMouseDown={() => handleMouseDown(d, h)}
                  onMouseEnter={() => handleMouseEnter(d, h)}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
