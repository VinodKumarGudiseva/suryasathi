import { solarCalculationService } from './solarCalculationService';
import { DEFAULT_SOLAR_ASSUMPTIONS, calculatePmSuryaGharSubsidy } from '../config/solarAssumptions';
import { INDIAN_STATES_DATA } from '../data/indianStates';

interface TestCase {
  name: string;
  code: string;
  input: Parameters<typeof solarCalculationService.calculateSolarPlan>[0];
  expectedChecks?: (plan: any) => string[];
  expectedError?: RegExp;
  expectedTariff?: number;
}

export function runStateDataQualityAudit(): { success: boolean; results: Array<{ name: string; passed: boolean }> } {
  const cfaCases = [
    { name: 'CEA emission factor', passed: DEFAULT_SOLAR_ASSUMPTIONS.gridEmissionFactorKgPerKwh === 0.675 },
    { name: 'All state subsidy bonuses are zero', passed: INDIAN_STATES_DATA.every((state) => state.stateSubsidyBonus === 0) },
  ];

  const telangana = INDIAN_STATES_DATA.find((state) => state.state === 'Telangana');
  const telanganaIsCorrect = telangana !== undefined
    && telangana.state === 'Telangana'
    && telangana.solarYieldFactor === 1500
    && telangana.averageTariffPerKwh === 8.2
    && telangana.discoms.includes('TGSPDCL (Southern)')
    && telangana.discoms.includes('TGNPDCL (Northern)');

  cfaCases.push({ name: 'Telangana data', passed: telanganaIsCorrect });

  return { success: cfaCases.every((result) => result.passed), results: cfaCases };
}

export function runCentralCfaAudit(): { success: boolean; results: Array<{ name: string; passed: boolean; expected: number; actual: number }> } {
  const cases = [
    { name: '1.0 kW', systemKw: 1.0, expected: 30000 },
    { name: '1.5 kW', systemKw: 1.5, expected: 45000 },
    { name: '2.0 kW', systemKw: 2.0, expected: 60000 },
    { name: '2.5 kW', systemKw: 2.5, expected: 69000 },
    { name: '3.0 kW', systemKw: 3.0, expected: 78000 },
    { name: '4.0 kW', systemKw: 4.0, expected: 78000 },
    { name: '6.0 kW', systemKw: 6.0, expected: 78000 },
    { name: '0 kW', systemKw: 0, expected: 0 },
    { name: 'negative input', systemKw: -1, expected: 0 },
    { name: 'invalid input', systemKw: Number.NaN, expected: 0 },
  ];

  const results = cases.map(({ name, systemKw, expected }) => {
    const actual = calculatePmSuryaGharSubsidy(systemKw, DEFAULT_SOLAR_ASSUMPTIONS);
    return {
      name,
      passed: actual === expected,
      expected,
      actual,
    };
  });

  return { success: results.every((result) => result.passed), results };
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
      name: 'Scenario A1: Bill-Derived Tariff Is Preferred',
      code: 'A1',
      input: {
        location: { state: 'Maharashtra', city: 'Pune' },
        monthlyConsumptionKwh: 150,
        monthlyBillAmount: 2100,
        roofAreaSqM: 40,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw !== 1) errors.push(`Expected 1 kW, got ${plan.recommendedSystemKw}`);
        if (plan.subsidy !== 30000) errors.push(`Expected subsidy ₹30,000, got ${plan.subsidy}`);
        return errors;
      },
      expectedTariff: 14,
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
        roofAreaSqM: 40,
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
      name: 'Scenario B1: Missing Bill Amount Uses State Tariff',
      code: 'B1',
      input: {
        location: { state: 'Maharashtra', city: 'Pune' },
        monthlyConsumptionKwh: 150,
        roofAreaSqM: 40,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw !== 1) errors.push(`Expected 1 kW, got ${plan.recommendedSystemKw}`);
        if (plan.monthlyBillAmount !== Math.round(150 * 8.5)) errors.push('Expected state tariff estimate to populate monthly bill amount');
        return errors;
      },
      expectedTariff: 8.5,
    },
    {
      name: 'Scenario C1: Invalid Bill Amount Uses State Tariff',
      code: 'C1',
      input: {
        location: { state: 'Maharashtra', city: 'Pune' },
        monthlyConsumptionKwh: 150,
        monthlyBillAmount: -500,
        roofAreaSqM: 40,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.monthlyBillAmount !== Math.round(150 * 8.5)) errors.push('Expected invalid bill amount to use state tariff estimate');
        return errors;
      },
      expectedTariff: 8.5,
    },
    {
      name: 'Scenario D1: Valid Calculations Remain Unchanged',
      code: 'D1',
      input: {
        location: { state: 'Gujarat', city: 'Ahmedabad' },
        monthlyConsumptionKwh: 260,
        monthlyBillAmount: 2000,
        roofAreaSqM: 50,
      },
      expectedChecks: (plan) => {
        const errors: string[] = [];
        if (plan.recommendedSystemKw !== 2) errors.push(`Expected 2 kW, got ${plan.recommendedSystemKw}`);
        if (plan.subsidy !== 60000) errors.push(`Expected subsidy ₹60,000, got ${plan.subsidy}`);
        if (!plan.reasonForRecommendation.includes('2 kW')) errors.push('Expected unchanged sizing recommendation');
        return errors;
      },
      expectedTariff: 7.6923076923076925,
    },
    {
      name: 'Scenario H: Invalid State and Missing Required Inputs',
      code: 'H',
      input: {
        location: { state: 'Invalid State Name', city: '' },
        monthlyConsumptionKwh: 0,
        monthlyBillAmount: -500,
        roofAreaSqM: -20,
      },
      expectedError: /valid state|monthly electricity consumption|roof area/i,
    },
    {
      name: 'Scenario I: Missing Roof Area Is Rejected',
      code: 'I',
      input: {
        location: { state: 'Maharashtra', city: 'Pune' },
        monthlyConsumptionKwh: 250,
      },
      expectedError: /roof area/i,
    },
  ];

  const results: any[] = [];
  let allPassed = true;

  for (const tc of tests) {
    if (tc.expectedError) {
      try {
        await solarCalculationService.calculateSolarPlan(tc.input);
        allPassed = false;
        results.push({
          name: tc.name,
          code: tc.code,
          passed: false,
          errors: ['Expected invalid input to be rejected, but calculation succeeded'],
        });
      } catch (err: any) {
        const errorMessage = err.message || 'Execution error';
        const passed = tc.expectedError.test(errorMessage);
        if (!passed) {
          allPassed = false;
        }
        results.push({
          name: tc.name,
          code: tc.code,
          passed,
          errors: passed ? [] : [`Expected error matching ${tc.expectedError}, got: ${errorMessage}`],
        });
      }
      continue;
    }

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
      const scenarioErrors = tc.expectedChecks!(plan);
      const allErrors = [...invariants, ...scenarioErrors];
      if (tc.expectedTariff !== undefined) {
        const expectedTariff = tc.expectedTariff;
        const actualTariff = plan.assumptionsSnapshot.tariffRatePerKwh;
        if (Math.abs(actualTariff - expectedTariff) > 0.0001) {
          allErrors.push(`Expected tariff ₹${expectedTariff}/kWh, got ₹${actualTariff}/kWh`);
        }
      }

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
          tariffRatePerKwh: plan.assumptionsSnapshot.tariffRatePerKwh,
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
  void (async () => {
    const stateAudit = runStateDataQualityAudit();
    console.log(`\n=== Solar Assumption & State Data Audit: ${stateAudit.success ? 'ALL PASSED' : 'FAILURES DETECTED'} ===\n`);
    for (const result of stateAudit.results) {
      console.log(`[${result.passed ? 'PASS' : 'FAIL'}] ${result.name}`);
    }

    const cfaAudit = runCentralCfaAudit();
    console.log(`\n=== PM Surya Ghar CFA Audit: ${cfaAudit.success ? 'ALL PASSED' : 'FAILURES DETECTED'} ===\n`);
    for (const result of cfaAudit.results) {
      console.log(`[${result.passed ? 'PASS' : 'FAIL'}] ${result.name}: expected ₹${result.expected}, got ₹${result.actual}`);
    }

    const calculationAudit = await runSolarCalculationAudit();
    console.log(`\n=== SuryaSathi Calculation Engine Audit: ${calculationAudit.success ? 'ALL PASSED' : 'FAILURES DETECTED'} ===\n`);
    for (const r of calculationAudit.results) {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
      if (r.passed) {
        const summary = r.summary || {};
        console.log(`   kW: ${summary.recommendedSystemKw ?? 'n/a'} | Gen: ${summary.annualGenerationKwh ?? 'n/a'} kWh | Subsidy: ₹${summary.subsidy ?? 'n/a'} | Net: ₹${summary.netInvestment ?? 'n/a'} | Payback: ${summary.paybackYears ?? 'n/a'} yrs`);
        if (summary.reason) console.log(`   Rationale: ${summary.reason}\n`);
      } else {
        console.log(`   Errors: ${r.errors.join('; ')}\n`);
      }
    }

    if (!stateAudit.success || !cfaAudit.success || !calculationAudit.success) process.exit(1);
  })();
}
