/**
 * Funções estatísticas para análise de testes A/B.
 */

/**
 * Aproximação da CDF normal padrão (Abramowitz & Stegun).
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Z-test para duas proporções (ex: taxa de conversão A vs B).
 * @returns { zScore, pValue, confidence } onde confidence = 1 - pValue em %.
 */
export function zTestTwoProportions(
  convA: number,
  impA: number,
  convB: number,
  impB: number
): { zScore: number; pValue: number; confidence: number } {
  if (impA === 0 || impB === 0) {
    return { zScore: 0, pValue: 1, confidence: 0 };
  }

  const pA = convA / impA;
  const pB = convB / impB;
  const pPool = (convA + convB) / (impA + impB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / impA + 1 / impB));

  if (se === 0) {
    return { zScore: 0, pValue: 1, confidence: 0 };
  }

  const zScore = (pA - pB) / se;
  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  const confidence = (1 - pValue) * 100;

  return { zScore: parseFloat(zScore.toFixed(4)), pValue: parseFloat(pValue.toFixed(6)), confidence: parseFloat(confidence.toFixed(2)) };
}

/**
 * Calcula tamanho mínimo de amostra por variante.
 * @param baselineRate - taxa de conversão baseline (ex: 0.05 = 5%)
 * @param mde - minimum detectable effect (ex: 0.01 = 1 pp)
 * @param power - poder estatístico (default 0.8)
 * @param significance - nível de significância (default 0.05)
 */
export function minSampleSize(
  baselineRate: number,
  mde: number,
  power = 0.8,
  significance = 0.05
): number {
  // z-scores for common values
  const zAlpha = significance === 0.05 ? 1.96 : significance === 0.01 ? 2.576 : 1.96;
  const zBeta = power === 0.8 ? 0.842 : power === 0.9 ? 1.282 : 0.842;

  const p1 = baselineRate;
  const p2 = baselineRate + mde;
  const pBar = (p1 + p2) / 2;

  const n =
    ((zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) /
    (mde ** 2);

  return Math.ceil(n);
}
