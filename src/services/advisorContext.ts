import { SolarPlan, AdvisorContext } from '../types/solar';

/**
 * Extracts a normalized, sanitized AdvisorContext from a SolarPlan or partial context.
 * Strictly avoids PII (no consumer names, phone numbers, or complete street addresses).
 * Keeps numbers tied directly to the solarCalculationEngine results.
 */
export function buildAdvisorContext(plan?: Partial<SolarPlan> | AdvisorContext): AdvisorContext {
  if (!plan) {
    return {};
  }

  // If it's already an AdvisorContext without a nested location object
  if ('state' in plan && !('location' in plan)) {
    const rawCtx = plan as AdvisorContext;
    return {
      state: rawCtx.state,
      city: rawCtx.city,
      location: rawCtx.location || (rawCtx.city ? `${rawCtx.city}, ${rawCtx.state || ''}` : rawCtx.state),
      discomName: rawCtx.discomName,
      monthlyConsumptionKwh: rawCtx.monthlyConsumptionKwh,
      monthlyBillAmount: rawCtx.monthlyBillAmount,
      recommendedSystemKw: rawCtx.recommendedSystemKw,
      annualGenerationKwh: rawCtx.annualGenerationKwh,
      annualSavings: rawCtx.annualSavings,
      estimatedSubsidy: rawCtx.estimatedSubsidy,
      installationCost: rawCtx.installationCost,
      netInvestment: rawCtx.netInvestment,
      paybackYears: rawCtx.paybackYears,
      co2ReductionKg: rawCtx.co2ReductionKg,
      roofSuitability: rawCtx.roofSuitability,
      usableAreaSqM: rawCtx.usableAreaSqM,
      roofConfidence: rawCtx.roofConfidence,
      billConfidence: rawCtx.billConfidence,
    };
  }

  // If it's a SolarPlan (or partial SolarPlan)
  const p = plan as Partial<SolarPlan>;
  const state = p.location?.state;
  const city = p.location?.city;
  const discomName = p.location?.discomName;
  const location = city && state ? `${city}, ${state}` : state || city;

  return {
    state,
    city,
    location,
    discomName,
    monthlyConsumptionKwh: p.monthlyConsumptionKwh,
    monthlyBillAmount: p.monthlyBillAmount,
    recommendedSystemKw: p.recommendedSystemKw,
    annualGenerationKwh: p.annualGenerationKwh,
    annualSavings: p.annualSavings,
    estimatedSubsidy: p.subsidy,
    installationCost: p.installationCost,
    netInvestment: p.netInvestment,
    paybackYears: p.paybackYears,
    co2ReductionKg: p.co2ReductionKg,
    roofSuitability: p.roofAnalysis?.suitability,
    usableAreaSqM: p.roofAnalysis?.usableAreaSqM,
    roofConfidence: p.roofAnalysis?.confidence,
    billConfidence: p.billData?.confidence,
  };
}
