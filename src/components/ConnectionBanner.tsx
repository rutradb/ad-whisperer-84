import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plug2 } from "lucide-react";

export function ConnectionBanner() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-8 animate-fade-in">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/6 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Icon */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Plug2 className="h-6 w-6" />
        </div>

        {/* Text */}
        <div className="flex-1 space-y-1">
          <h3 className="font-display font-bold text-base text-foreground">
            Conecte sua conta Google Ads
          </h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Configure seu Token de Acesso em <strong className="text-foreground/80">Configuracoes &rarr; Integracoes</strong> para
            visualizar campanhas, metricas e gerenciar seus anuncios.
          </p>
        </div>

        {/* CTA */}
        <Button
          onClick={() => navigate("/settings")}
          className="shrink-0 gap-2 shadow-lg"
        >
          Conectar agora
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
