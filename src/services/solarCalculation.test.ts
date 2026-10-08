import { solarCalculationService } from './solarCalculationService';
import { DEFAULT_SOLAR_ASSUMPTIONS } from '../config/solarAssumptions';

interface TestCase {
  name: string;
  code: string;
  input: Parameters<typeof solarCalculationService.calculateSolarPlan>[0];
  expectedChecks: (plan: any) => string[];
}

export async function runSolarCalculationAudit(): Promise<{ success: boolean; results: any[] }> {
  const tests: TestCase[] = [
    {
      name: 'Scenario A: Small Household',
      code: 'A',
      input: {
        location: { state: 'Maharashtra', city: 'Pune' },
        monthlyConsumptionKwh: 100,
        roofAreaSqM: 40,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw < 1) errors.push(`Expected kW >= 1, got ${plan.recommendedSystemKw}`);
        if (plan.annualGenerationKwh <= 0) errors.push('Annual gen must be > 0');
        if (plan.subsidy !== 30000) errors.push(`Expected 1 kW subsidy ₹30,000, got ${plan.subsidy}`);
        return errors;
      },
    },
    {
      name: 'Scenario B: Medium Household',
      code: 'B',
      input: {
        location: { state: 'Gujarat', city: 'Ahmedabad' },
        monthlyConsumptionKwh: 260,
        monthlyBillAmount: 2000,
        roofAreaSqM: 50,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw < 2 || plan.recommendedSystemKw > 3) errors.push(`Expected 2-3 kW, got ${plan.recommendedSystemKw}`);
        if (plan.subsidy < 60000) errors.push(`Expected subsidy >= 60000, got ${plan.subsidy}`);
        return errors;
      },
    },
    {
      name: 'Scenario C: High-Consumption Household',
      code: 'C',
      input: {
        location: { state: 'Delhi (NCT)', city: 'New Delhi' },
        monthlyConsumptionKwh: 850,
        monthlyBillAmount: 6500,
        roofAreaSqM: 120,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw < 5) errors.push(`Expected kW >= 5 for 850 kWh, got ${plan.recommendedSystemKw}`);
        if (plan.subsidy !== 78000 + (plan.location.stateSubsidyBonus || 0)) errors.push(`Expected capped subsidy 78000 + state bonus`);
        return errors;
      },
    },
    {
      name: 'Scenario D: Small Roof (Constrained)',
      code: 'D',
      input: {
        location: { state: 'Karnataka', city: 'Bengaluru' },
        monthlyConsumptionKwh: 500, // Wants ~4 kW
        roofAreaSqM: 14, // 14 m² can only support ~1.5 kW (~1 kW practical)
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw > 2) errors.push(`Roof area 14 m² exceeded! Got ${plan.recommendedSystemKw} kW`);
        if (!plan.reasonForRecommendation.toLowerCase().includes('roof') && !plan.reasonForRecommendation.toLowerCase().includes('area')) {
          errors.push('Expected reason to mention roof constraint');
        }
        return errors;
      },
    },
    {
      name: 'Scenario E: Large Roof',
      code: 'E',
      input: {
        location: { state: 'Rajasthan', city: 'Jaipur' },
        monthlyConsumptionKwh: 300,
        roofAreaSqM: 200, // Very large roof
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        // Should size to consumption (~2-3 kW), not blow up to 20 kW!
        if (plan.recommendedSystemKw > 4) errors.push(`Oversized based on large roof! Got ${plan.recommendedSystemKw} kW`);
        return errors;
      },
    },
    {
      name: 'Scenario F: Missing Optional Bill Amount',
      code: 'F',
      input: {
        location: { state: 'Tamil Nadu', city: 'Chennai' },
        monthlyConsumptionKwh: 220,
        // monthlyBillAmount is undefined
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (!plan.monthlyBillAmount || plan.monthlyBillAmount <= 0) errors.push('Expected monthlyBillAmount to auto-calculate from tariff');
        return errors;
      },
    },
    {
      name: 'Scenario G: Very Low Consumption',
      code: 'G',
      input: {
        location: { state: 'Uttar Pradesh', city: 'Lucknow' },
        monthlyConsumptionKwh: 25,
        roofAreaSqM: 30,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw < 1) errors.push(`Expected minSystemKw = 1, got ${plan.recommendedSystemKw}`);
        return errors;
      },
    },
    {
      name: 'Scenario H: Zero / Invalid / Extreme Inputs',
      code: 'H',
      input: {
        location: { state: 'Invalid State Name', city: '' },
        monthlyConsumptionKwh: 0,
        monthlyBillAmount: -500,
        roofAreaSqM: -20,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (isNaN(plan.recommendedSystemKw) || plan.recommendedSystemKw < 0) errors.push('Negative or NaN systemKw');
        if (isNaN(plan.annualGenerationKwh) || plan.annualGenerationKwh < 0) errors.push('Negative or NaN annualGenerationKwh');
        if (isNaN(plan.paybackYears) || !isFinite(plan.paybackYears) || plan.paybackYears < 0) errors.push('Invalid paybackYears');
        return errors;
      },
    },
  ];

  const results: any[] = [];
  let allPassed = true;

  for (const tc of tests) {
    try {
      const plan = await solarCalculationService.calculateSolarPlan(tc.input);

      // Invariant assertions:
      const invariants: string[] = [];

      // Invariant 1: No NaN or Infinity anywhere
      if (!isFinite(plan.recommendedSystemKw)) invariants.push('recommendedSystemKw is not finite');
      if (!isFinite(plan.annualGenerationKwh)) invariants.push('annualGenerationKwh is not finite');
      if (!isFinite(plan.annualSavings)) invariants.push('annualSavings is not finite');
      if (!isFinite(plan.installationCost)) invariants.push('installationCost is not finite');
      if (!isFinite(plan.subsidy)) invariants.push('subsidy is not finite');
      if (!isFinite(plan.netInvestment)) invariants.push('netInvestment is not finite');
      if (!isFinite(plan.paybackYears)) invariants.push('paybackYears is not finite');
      if (!isFinite(plan.co2ReductionKg)) invariants.push('co2ReductionKg is not finite');

      // Invariant 2: Monthly generation sum === annual generation
      if (plan.monthlyGeneration && plan.monthlyGeneration.length === 12) {
        const sumMonthly = plan.monthlyGeneration.reduce((acc, m) => acc + m.kwh, 0);
        if (sumMonthly !== plan.annualGenerationKwh) {
          invariants.push(`Monthly sum (${sumMonthly}) !== annualGenerationKwh (${plan.annualGenerationKwh})`);
        }
      } else {
        invariants.push('monthlyGeneration array must have 12 items');
      }

      // Invariant 3: Net investment = installation cost - subsidy (clamped at 0)
      const expectedNet = Math.max(0, plan.installationCost - plan.subsidy);
      if (Math.abs(plan.netInvestment - expectedNet) > 1) {
        invariants.push(`netInvestment mismatch: got ${plan.netInvestment}, expected ${expectedNet}`);
      }

      // Custom checks for scenario
      const scenarioErrors = tc.expectedChecks(plan);
      const allErrors = [...invariants, ...scenarioErrors];

      const passed = allErrors.length === 0;
      if (!passed) allPassed = false;

      results.push({
        name: tc.name,
        code: tc.code,
        passed,
        errors: allErrors,
        summary: {
          recommendedSystemKw: plan.recommendedSystemKw,
          annualGenerationKwh: plan.annualGenerationKwh,
          annualSavings: plan.annualSavings,
          subsidy: plan.subsidy,
          netInvestment: plan.netInvestment,
          paybackYears: plan.paybackYears,
          reason: plan.reasonForRecommendation,
        },
      });
    } catch (err: any) {
      allPassed = false;
      results.push({
        name: tc.name,
        code: tc.code,
        passed: false,
        errors: [err.message || 'Execution error'],
      });
    }
  }

  return { success: allPassed, results };
}

// Standalone execution if run via tsx
if (import.meta.url.endsWith(process.argv[1] || '')) {
  runSolarCalculationAudit().then(({ success, results }) => {
    console.log(`\n=== SuryaSathi Calculation Engine Audit: ${success ? 'ALL PASSED' : 'FAILURES DETECTED'} ===\n`);
    for (const r of results) {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
      if (r.passed) {
        console.log(`   kW: ${r.summary.recommendedSystemKw} | Gen: ${r.summary.annualGenerationKwh} kWh | Subsidy: ₹${r.summary.subsidy} | Net: ₹${r.summary.netInvestment} | Payback: ${r.summary.paybackYears} yrs`);
        console.log(`   Rationale: ${r.summary.reason}\n`);
      } else {
        console.log(`   Errors: ${r.errors.join('; ')}\n`);
      }
    }
    if (!success) process.exit(1);
  });
}
