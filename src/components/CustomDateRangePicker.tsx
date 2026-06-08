import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CustomDateRangePickerProps {
  onApply: (range: { since: string; until: string }) => void;
}

export function CustomDateRangePicker({ onApply }: CustomDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();

  const handleApply = () => {
    if (from && to) {
      onApply({
        since: format(from, "yyyy-MM-dd"),
        until: format(to, "yyyy-MM-dd"),
      });
      setOpen(false);
    }
  };

  const label = from && to
    ? `${format(from, "dd/MM", { locale: ptBR })} - ${format(to, "dd/MM", { locale: ptBR })}`
    : "Personalizado";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex gap-0">
          <div className="border-r">
            <p className="text-xs font-medium text-muted-foreground px-3 pt-3 pb-1">De</p>
            <Calendar
              mode="single"
              selected={from}
              onSelect={setFrom}
              locale={ptBR}
              disabled={(date) => date > new Date() || (to ? date > to : false)}
            />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground px-3 pt-3 pb-1">Até</p>
            <Calendar
              mode="single"
              selected={to}
              onSelect={setTo}
              locale={ptBR}
              disabled={(date) => date > new Date() || (from ? date < from : false)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-3 border-t">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!from || !to}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
