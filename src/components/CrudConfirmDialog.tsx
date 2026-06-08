import { AlertTriangle, Pause, Play, Archive, DollarSign, TrendingDown } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export type CrudAction = "pause" | "activate" | "archive";

export interface CrudConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: CrudAction;
  entityType: "campanha" | "conjunto de anúncios" | "anúncio";
  entityName: string;
  budget?: string;   // e.g. "R$ 50,00/dia"
  spend?: string;    // e.g. "R$ 1.240,00 nos últ. 30d"
  onConfirm: () => void;
}

const ACTION_CONFIG: Record<CrudAction, {
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: (type: string) => string;
  consequence: string;
  note?: string;
  actionLabel: string;
  actionClass: string;
}> = {
  pause: {
    Icon: Pause,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    title: (type) => `Pausar ${type}?`,
    consequence: "Os anúncios param de veicular imediatamente e o gasto é interrompido. Você pode reativar a qualquer momento.",
    actionLabel: "Pausar agora",
    actionClass: "bg-warning text-warning-foreground hover:bg-warning/90",
  },
  activate: {
    Icon: Play,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    title: (type) => `Ativar ${type}?`,
    consequence: "Os anúncios voltam a veicular imediatamente. O orçamento começa a ser consumido.",
    actionLabel: "Ativar agora",
    actionClass: "bg-success text-success-foreground hover:bg-success/90",
  },
  archive: {
    Icon: Archive,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    title: (type) => `Arquivar ${type}?`,
    consequence: "Esta ação é permanente e irreversível. A entidade arquivada não pode ser reativada — apenas consultada.",
    note: "Arquivar não exclui os dados históricos de performance.",
    actionLabel: "Arquivar permanentemente",
    actionClass: "",
  },
};

export function CrudConfirmDialog({
  open, onOpenChange, action, entityType, entityName, budget, spend, onConfirm,
}: CrudConfirmDialogProps) {
  const cfg = ACTION_CONFIG[action];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {/* Icon + title */}
          <div className="flex items-start gap-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", cfg.iconBg)}>
              <cfg.Icon className={cn("h-5 w-5", cfg.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="leading-snug">{cfg.title(entityType)}</AlertDialogTitle>
              <p className="mt-0.5 text-sm font-medium text-foreground truncate" title={entityName}>
                "{entityName}"
              </p>
            </div>
          </div>

          {/* Consequence */}
          <AlertDialogDescription className="mt-3 text-sm leading-relaxed">
            {cfg.consequence}
          </AlertDialogDescription>

          {/* Context chips */}
          {(budget || spend) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {budget && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  {budget}
                </span>
              )}
              {spend && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                  <TrendingDown className="h-3 w-3 text-muted-foreground" />
                  {spend} gastos (30d)
                </span>
              )}
            </div>
          )}

          {/* Extra note for archive */}
          {cfg.note && (
            <p className="mt-2 text-xs text-muted-foreground">{cfg.note}</p>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={cfg.actionClass}
            onClick={onConfirm}
          >
            {cfg.actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
