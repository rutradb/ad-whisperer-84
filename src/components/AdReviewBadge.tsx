import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface AdReviewBadgeProps {
  approvalStatus?: string;
  policyTopics?: string[];
}

export function AdReviewBadge({ approvalStatus, policyTopics }: AdReviewBadgeProps) {
  if (!approvalStatus) return null;

  switch (approvalStatus) {
    case "APPROVED":
      return (
        <Badge className="gap-1 text-xs bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
          <CheckCircle className="h-3 w-3" />Aprovado
        </Badge>
      );

    case "APPROVED_LIMITED":
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="gap-1 text-xs bg-yellow-500 text-white">
                <AlertTriangle className="h-3 w-3" />Aprovado com Restricoes
              </Badge>
            </TooltipTrigger>
            {policyTopics && policyTopics.length > 0 && (
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Politicas aplicadas:</p>
                  {policyTopics.map((topic, i) => <p key={i}>{topic}</p>)}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );

    case "DISAPPROVED":
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="gap-1 text-xs">
                <XCircle className="h-3 w-3" />Reprovado
              </Badge>
            </TooltipTrigger>
            {policyTopics && policyTopics.length > 0 && (
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Motivos da reprovacao:</p>
                  {policyTopics.map((topic, i) => <p key={i}>{topic}</p>)}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      );

    case "AREA_OF_INTEREST_ONLY":
      return (
        <Badge className="gap-1 text-xs bg-yellow-500 text-white">
          <AlertTriangle className="h-3 w-3" />Area de Interesse
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <HelpCircle className="h-3 w-3" />Desconhecido
        </Badge>
      );
  }
}
