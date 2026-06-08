import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface AudienceOverlapChartProps {
  customerId: string;
  audience1: { id: string; name: string };
  audience2: { id: string; name: string };
  onClose: () => void;
}

/**
 * Google Ads does not have a native audience overlap API like Facebook.
 * This component is a placeholder that informs the user.
 */
export function AudienceOverlapChart({ audience1, audience2, onClose }: AudienceOverlapChartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Sobreposi\u00e7\u00e3o de P\u00fablicos</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500" />
          <div>
            <p className="font-medium">An\u00e1lise de sobreposi\u00e7\u00e3o n\u00e3o dispon\u00edvel</p>
            <p className="text-sm text-muted-foreground mt-1">
              O Google Ads n\u00e3o oferece uma API nativa de sobreposi\u00e7\u00e3o de p\u00fablicos.
              Use o Google Analytics ou o Audience Insights para analisar a sobreposi\u00e7\u00e3o entre
              "{audience1.name}" e "{audience2.name}".
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
