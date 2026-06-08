import { Badge } from "@/components/ui/badge";

interface LabelBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
}

export function LabelBadge({ name, color, onRemove }: LabelBadgeProps) {
  return (
    <Badge
      className="text-xs gap-1"
      style={{ backgroundColor: color, color: "#fff" }}
    >
      {name}
      {onRemove && (
        <button
          className="ml-1 hover:opacity-80"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          ×
        </button>
      )}
    </Badge>
  );
}
