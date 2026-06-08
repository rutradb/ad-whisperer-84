import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, TrendingUp, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { calculateSafeScale, type ScaleResult } from "@/lib/ai/scaleCalculator";
import { CONFIG } from "@/config";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ScaleCalculatorPage() {
  const [currentBudget, setCurrentBudget] = useState("");
  const [targetBudget, setTargetBudget] = useState("");
  const [result, setResult] = useState<ScaleResult | null>(null);

  const current = parseFloat(currentBudget) || 0;
  const target = parseFloat(targetBudget) || 0;
  const canCalculate = current > 0 && target > current;

  const handleCalculate = () => {
    if (!canCalculate) return;
    setResult(calculateSafeScale(current, target));
  };

  const multiplier = result ? (result.targetBudget / result.originalBudget).toFixed(1) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calculadora de Escala Segura</h1>
        <p className="text-muted-foreground">
          Regra de ouro: maximo +{CONFIG.MAX_SCALE_PERCENT}% a cada {CONFIG.SCALE_WAIT_DAYS} dias para nao prejudicar a fase de aprendizado do Google Ads
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Regra de ouro:</strong> Nunca aumente o orcamento mais de {CONFIG.MAX_SCALE_PERCENT}% de uma vez.
          Espere {CONFIG.SCALE_WAIT_DAYS} dias entre cada aumento para manter a otimizacao do algoritmo.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Parametros
          </CardTitle>
          <CardDescription>Informe o orcamento atual e o orcamento desejado (em Reais)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Orcamento Atual (R$/dia)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 100"
                value={currentBudget}
                onChange={(e) => { setCurrentBudget(e.target.value); setResult(null); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Orcamento Desejado (R$/dia)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 500"
                value={targetBudget}
                onChange={(e) => { setTargetBudget(e.target.value); setResult(null); }}
              />
            </div>
          </div>

          {current > 0 && target > 0 && target <= current && (
            <p className="text-sm text-destructive">O orcamento desejado deve ser maior que o atual.</p>
          )}

          <Button onClick={handleCalculate} disabled={!canCalculate} className="w-full sm:w-auto">
            <Calculator className="mr-2 h-4 w-4" />
            Calcular Escala
          </Button>
        </CardContent>
      </Card>

      {result && result.steps.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-3xl font-bold">{result.totalDays} dias</div>
                <p className="text-sm text-muted-foreground">Tempo total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-3xl font-bold">{result.steps.length - 1} ajustes</div>
                <p className="text-sm text-muted-foreground">Numero de aumentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <ArrowRight className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-3xl font-bold">{multiplier}x</div>
                <p className="text-sm text-muted-foreground">Multiplicador</p>
              </CardContent>
            </Card>
          </div>

          {/* Steps table */}
          <Card>
            <CardHeader>
              <CardTitle>Plano de Escala</CardTitle>
              <CardDescription>
                {formatCurrency(result.originalBudget)} &rarr; {formatCurrency(result.targetBudget)} em {result.totalDays} dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead className="text-right">Orcamento</TableHead>
                    <TableHead className="text-right">Aumento</TableHead>
                    <TableHead className="text-right">Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.steps.map((step, i) => (
                    <TableRow key={step.day} className={i === 0 ? "bg-muted/30" : ""}>
                      <TableCell>
                        {step.day === 0 ? (
                          <Badge variant="outline">Hoje</Badge>
                        ) : (
                          <span>Dia {step.day}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(step.budget)}
                      </TableCell>
                      <TableCell className="text-right">
                        {step.increase === "Atual" ? (
                          <span className="text-muted-foreground">--</span>
                        ) : (
                          <Badge variant="secondary">{step.increase}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {step.cumulative === "0%" ? "--" : step.cumulative}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recharts AreaChart */}
          <Card>
            <CardHeader><CardTitle>Evolucao Visual</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={result.steps.map(s => ({ dia: s.day === 0 ? "Hoje" : `Dia ${s.day}`, budget: s.budget }))}>
                  <defs>
                    <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Orcamento"]} />
                  <Area type="monotone" dataKey="budget" stroke="hsl(var(--primary))" fill="url(#budgetGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Dica: A cada step, confira se o ROAS/CPA se mantem estavel antes de prosseguir ao proximo aumento.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
