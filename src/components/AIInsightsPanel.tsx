import { useEffect } from "react";
import { Sparkles, AlertTriangle, TrendingUp, Info, Zap, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIInsights, type Insight, type InsightType } from "@/hooks/useAIInsights";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface AIInsightsPanelProps {
  prompt: string | null;
  context?: string;
  className?: string;
}

const TYPE_CONFIG: Record<InsightType, {
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  border: string;
  label: string;
  labelColor: string;
}> = {
  warning: {
    Icon: AlertTriangle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    border: "border-destructive/20",
    label: "Atenção",
    labelColor: "text-destructive",
  },
  opportunity: {
    Icon: TrendingUp,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    border: "border-success/20",
    label: "Oportunidade",
    labelColor: "text-success",
  },
  info: {
    Icon: Info,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    border: "border-primary/20",
    label: "Contexto",
    labelColor: "text-primary",
  },
  action: {
    Icon: Zap,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    border: "border-warning/20",
    label: "Ação",
    labelColor: "text-warning",
  },
};

function InsightCard({ insight }: { insight: Insight }) {
  const { Icon, iconBg, iconColor, border, label, labelColor } = TYPE_CONFIG[insight.type];
  const navigate = useNavigate();

  return (
    <div className={cn(
      "group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-200",
      "hover:shadow-md hover:-translate-y-px",
      border,
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn("text-[10px] font-semibold uppercase tracking-widest", labelColor)}>
            {label}
          </span>
          <p className="text-sm font-semibold text-foreground leading-snug mt-0.5">
            {insight.title}
          </p>
        </div>
      </div>

      {/* Body */}
      <p className="text-xs text-muted-foreground leading-relaxed pl-11">
        {insight.body}
      </p>

      {/* Action */}
      {insight.action && (
        <div className="pl-11">
          {insight.requiresSetup ? (
            <button
              onClick={() => navigate("/settings")}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors",
                iconBg, iconColor,
                "hover:opacity-80",
              )}
            >
              <Settings className="h-3 w-3" />
              {insight.action}
            </button>
          ) : (
            <p className={cn("text-xs font-medium leading-snug", iconColor)}>
              → {insight.action}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-16 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded ml-11" />
          <Skeleton className="h-3 w-4/5 rounded ml-11" />
        </div>
      ))}
    </div>
  );
}

export function AIInsightsPanel({ prompt, context, className }: AIInsightsPanelProps) {
  const navigate = useNavigate();
  const { insights, isLoading, error, hasApiKey, generate, refresh } = useAIInsights();

  useEffect(() => {
    if (prompt) generate(prompt);
  }, [prompt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasApiKey) {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-xl border border-dashed border-border/60 px-4 py-3",
        className
      )}>
        <Sparkles className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Configure sua{" "}
          <button onClick={() => navigate("/settings")} className="text-primary hover:underline font-medium">
            Anthropic API Key
          </button>{" "}
          para ativar análise de IA nesta página
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card/50 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pl-4 pr-2 py-2.5 bg-muted/20 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Análise IA</span>
          {context && <span className="text-xs text-muted-foreground">· {context}</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => prompt && refresh(prompt)}
          disabled={isLoading || !prompt}
          title="Atualizar análise"
        >
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Body */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">Falha ao gerar análise</p>
          <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={() => prompt && refresh(prompt)}>
            Tentar novamente
          </Button>
        </div>
      ) : insights && insights.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
