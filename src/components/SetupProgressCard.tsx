import { useState } from "react";
import { CheckCircle2, Circle, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { cn } from "@/lib/utils";

export function SetupProgressCard() {
  const { steps, completionPercentage, isComplete } = useOnboardingProgress();
  const [modalOpen, setModalOpen] = useState(false);

  if (isComplete) return null;

  return (
    <>
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold text-foreground">Configuração da plataforma</span>
                <span className="text-xs text-muted-foreground">{completionPercentage}%</span>
              </div>

              <Progress value={completionPercentage} className="h-1.5" />

              <div className="flex flex-wrap gap-1.5">
                {steps.map((step) => (
                  <Badge
                    key={step.id}
                    variant={step.isComplete ? "default" : "outline"}
                    className={cn(
                      "text-[10px] gap-1 font-normal",
                      step.isComplete
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : (
                      <Circle className="h-2.5 w-2.5" />
                    )}
                    {step.label}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="shrink-0 text-xs"
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>

      {modalOpen && <OnboardingModal forceOpen onOpenChange={setModalOpen} />}
    </>
  );
}
