import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function EmptyStateToken() {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Token não configurado</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Configure seu token do Facebook em <strong>Configurações &gt; Integrações</strong> para visualizar seus dados.
        </p>
        <Button onClick={() => navigate("/settings")}>
          Configurar Integrações
        </Button>
      </CardContent>
    </Card>
  );
}
