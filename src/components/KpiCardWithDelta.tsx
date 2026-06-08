import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";

interface KpiCardWithDeltaProps {
  title: string;
  value: string;
  icon: LucideIcon;
  isLoading?: boolean;
  delta?: number | null;
  deltaPositive?: boolean;
  variant?: "default" | "featured";
  className?: string;
  /** Raw numeric value — quando fornecido, anima o número com NumberFlow */
  rawValue?: number;
  /** Format para o NumberFlow (default: number) */
  numberFormat?: Record<string, any>;
}

export function KpiCardWithDelta({
  title, value, icon: Icon, isLoading, delta, deltaPositive,
  variant = "default", className, rawValue, numberFormat,
}: KpiCardWithDeltaProps) {
  const showDelta = delta !== undefined && delta !== null;
  const isFeatured = variant === "featured";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-shadow duration-200",
        "hover:shadow-md",
        isFeatured
          ? "bg-brand-gradient text-primary-foreground border-transparent shadow-md"
          : "bg-card text-card-foreground border-border shadow-card",
        className,
      )}
    >
      {/* Top accent line */}
      {!isFeatured && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <p className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            isFeatured ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <motion.div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              isFeatured ? "bg-primary-foreground/20" : "bg-primary/10"
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Icon className={cn("h-4 w-4", isFeatured ? "text-primary-foreground" : "text-primary")} />
          </motion.div>
        </div>

        {/* Value */}
        {isLoading ? (
          <Skeleton className={cn("h-8 w-28 mt-1", isFeatured && "bg-primary-foreground/20")} />
        ) : (
          <div className="flex items-end gap-2 flex-wrap">
            <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums leading-none">
              {rawValue !== undefined ? (
                <NumberFlow
                  value={rawValue}
                  format={numberFormat}
                  className="font-mono text-2xl font-semibold tracking-tight tabular-nums leading-none"
                />
              ) : (
                value
              )}
            </span>
            {showDelta && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className={cn(
                  "mb-0.5 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold font-mono tabular-nums",
                  isFeatured
                    ? deltaPositive
                      ? "bg-white/20 text-white"
                      : delta === 0
                      ? "bg-white/10 text-white/60"
                      : "bg-black/20 text-white/80"
                    : deltaPositive
                    ? "bg-success/12 text-success"
                    : delta === 0
                    ? "bg-muted text-muted-foreground"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {delta > 0
                  ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  : delta < 0
                  ? <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                  : <Minus className="h-2.5 w-2.5 mr-0.5" />}
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
              </motion.span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
