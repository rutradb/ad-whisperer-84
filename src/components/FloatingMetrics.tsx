import { motion } from "motion/react";
import { useMemo } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, Eye, MousePointerClick,
  BarChart3, Users, Target, Percent, Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricItem {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: "up" | "down";
}

const METRICS: MetricItem[] = [
  { label: "CTR", value: "2.84%", icon: Percent, trend: "up" },
  { label: "CPC", value: "R$ 0.42", icon: DollarSign, trend: "down" },
  { label: "Impressões", value: "1.2M", icon: Eye },
  { label: "Cliques", value: "34.1K", icon: MousePointerClick, trend: "up" },
  { label: "Alcance", value: "890K", icon: Users },
  { label: "ROAS", value: "4.2x", icon: TrendingUp, trend: "up" },
  { label: "CPM", value: "R$ 12.50", icon: BarChart3, trend: "down" },
  { label: "Conversões", value: "1.847", icon: Target, trend: "up" },
  { label: "Frequência", value: "1.8", icon: Activity },
  { label: "Gasto", value: "R$ 15.2K", icon: DollarSign },
  { label: "CPA", value: "R$ 8.23", icon: DollarSign, trend: "down" },
  { label: "Leads", value: "2.340", icon: Users, trend: "up" },
];

// Duplicate for seamless loop
const TRACK_1 = [...METRICS.slice(0, 6), ...METRICS.slice(0, 6)];
const TRACK_2 = [...METRICS.slice(6), ...METRICS.slice(6)];

function MetricPill({ metric }: { metric: MetricItem }) {
  const Icon = metric.icon;
  return (
    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm whitespace-nowrap select-none">
      <Icon className="h-6 w-6 text-primary/40" />
      <span className="text-lg font-semibold text-muted-foreground/50">{metric.label}</span>
      <span className="text-2xl font-bold font-mono text-foreground/35 tabular-nums">{metric.value}</span>
      {metric.trend === "up" && <TrendingUp className="h-5 w-5 text-success/35" />}
      {metric.trend === "down" && <TrendingDown className="h-5 w-5 text-destructive/25" />}
    </div>
  );
}

function ScrollTrack({
  metrics,
  duration,
  direction = "left",
  className,
}: {
  metrics: MetricItem[];
  duration: number;
  direction?: "left" | "right";
  className?: string;
}) {
  const halfLen = metrics.length / 2;
  // Calculate approximate width per item to set correct translateX
  // Each pill is ~180px wide + 12px gap
  const trackWidth = halfLen * 340;

  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="flex gap-3"
        animate={{
          x: direction === "left" ? [0, -trackWidth] : [-trackWidth, 0],
        }}
        transition={{
          x: {
            duration,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {metrics.map((m, i) => (
          <MetricPill key={`${m.label}-${i}`} metric={m} />
        ))}
      </motion.div>
    </div>
  );
}

export function FloatingMetrics() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlays for fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

      {/* Track 1 — top area, scrolling left */}
      <div className="absolute top-[12%] left-0 right-0 -rotate-[8deg] scale-110 opacity-40">
        <ScrollTrack metrics={TRACK_1} duration={35} direction="left" />
      </div>

      {/* Track 2 — middle-top, scrolling right */}
      <div className="absolute top-[30%] left-0 right-0 -rotate-[8deg] scale-110 opacity-25">
        <ScrollTrack metrics={TRACK_2} duration={45} direction="right" />
      </div>

      {/* Track 3 — middle-bottom, scrolling left */}
      <div className="absolute top-[52%] left-0 right-0 -rotate-[8deg] scale-110 opacity-20">
        <ScrollTrack metrics={TRACK_1} duration={40} direction="left" />
      </div>

      {/* Track 4 — bottom, scrolling right */}
      <div className="absolute top-[72%] left-0 right-0 -rotate-[8deg] scale-110 opacity-15">
        <ScrollTrack metrics={TRACK_2} duration={50} direction="right" />
      </div>

      {/* Track 5 — very bottom, subtle */}
      <div className="absolute top-[88%] left-0 right-0 -rotate-[8deg] scale-110 opacity-10">
        <ScrollTrack metrics={TRACK_1} duration={55} direction="left" />
      </div>
    </div>
  );
}
