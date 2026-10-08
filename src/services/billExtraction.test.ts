import { MockBillExtractionAdapter } from './billExtractionService';
import { validateBillData } from './billValidation';
import { normalizeTextractResponse } from './textractAdapter';
import { solarCalculationService } from './solarCalculationService';
import { BillData } from '../types/solar';

export async function runBillExtractionAudit(): Promise<{ success: boolean; results: any[] }> {
  const adapter = new MockBillExtractionAdapter();
  const testResults: any[] = [];
  let allPassed = true;

  // Test A: Valid bill data
  try {
    const validBill = await adapter.extractBillData({
      name: 'msedcl_october_bill.pdf',
      size: 350000,
      type: 'application/pdf',
    });
    const hasUnits = typeof validBill.monthlyConsumptionKwh === 'number' && validBill.monthlyConsumptionKwh > 0;
    const hasConfidence = validBill.confidence >= 0.8;
    const hasProvider = Boolean(validBill.provider);
    const passed = hasUnits && hasConfidence && hasProvider;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test A: Valid bill extraction (PDF/MSEDCL)',
      passed,
      detail: `Extracted ${validBill.monthlyConsumptionKwh} kWh, confidence ${validBill.confidence}, provider: ${validBill.provider}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test A: Valid bill extraction', passed: false, detail: err.message });
  }

  // Test B: Missing consumption validation
  try {
    const res = validateBillData(null, 2500, 7.5);
    const passed = !res.isValid && res.errors.some((e) => e.includes('missing')) && res.sanitizedConsumptionKwh > 0;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test B: Missing consumption validation',
      passed,
      detail: `Reported errors: ${res.errors.join('; ')} | Sanitized to safe fallback: ${res.sanitizedConsumptionKwh} kWh`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test B: Missing consumption validation', passed: false, detail: err.message });
  }

  // Test C: Missing bill amount (should estimate from tariff fallback)
  try {
    const res = validateBillData(300, null, 8.0);
    const passed = res.isValid && res.sanitizedBillAmount === 2400; // 300 * 8.0
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test C: Missing bill amount auto-estimation',
      passed,
      detail: `Auto-estimated bill to ₹${res.sanitizedBillAmount} (300 units @ ₹8/unit)`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test C: Missing bill amount auto-estimation', passed: false, detail: err.message });
  }

  // Test D: Invalid negative consumption
  try {
    const res = validateBillData(-150, 2000, 7.5);
    const passed = !res.isValid && res.errors.some((e) => e.includes('greater than 0')) && !isNaN(res.sanitizedConsumptionKwh);
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test D: Invalid negative consumption handling',
      passed,
      detail: `Rejected negative units: ${res.errors.join('; ')}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test D: Invalid negative consumption handling', passed: false, detail: err.message });
  }

  // Test E: Extremely high consumption (>5,000 kWh residential)
  try {
    const res = validateBillData(6500, 52000, 8.0);
    const passed = res.warnings.some((w) => w.includes('High consumption')) && res.sanitizedConsumptionKwh === 6500;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test E: Extremely high consumption warning',
      passed,
      detail: `Warning raised without crash: ${res.warnings[0]}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test E: Extremely high consumption warning', passed: false, detail: err.message });
  }

  // Test F: Low extraction confidence simulation
  try {
    const lowConfBill = await adapter.extractBillData({
      name: 'unclear_blurry_scan.jpg',
      size: 400000,
      type: 'image/jpeg',
    });
    const passed = lowConfBill.confidence < 0.65 && lowConfBill.unitsConsumedKwh === undefined;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test F: Low extraction confidence behavior',
      passed,
      detail: `Confidence: ${lowConfBill.confidence}, units omitted for manual input, note: ${lowConfBill.notes}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test F: Low extraction confidence behavior', passed: false, detail: err.message });
  }

  // Test G: Extraction failure graceful recovery
  try {
    let failedCleanly = false;
    try {
      await adapter.extractBillData({
        name: 'corrupt_broken_file.pdf',
        size: 150000,
        type: 'application/pdf',
      });
    } catch (extractErr: any) {
      failedCleanly = extractErr.message.includes('Unable to extract') || extractErr.message.includes('parse');
    }
    if (!failedCleanly) allPassed = false;
    testResults.push({
      name: 'Test G: Extraction failure graceful exception',
      passed: failedCleanly,
      detail: 'Gracefully threw descriptive parsing error for corrupt scan without crash',
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test G: Extraction failure', passed: false, detail: err.message });
  }

  // Test H: Manual fallback flow
  try {
    const manualVal = validateBillData(320, 2600, 8.1);
    const manualBill: BillData = {
      monthlyConsumptionKwh: manualVal.sanitizedConsumptionKwh,
      billAmount: manualVal.sanitizedBillAmount,
      provider: 'User Entered DISCOM',
      billingPeriod: 'Manual',
      confidence: 1.0,
      source: 'user_manual',
      isUserConfirmed: true,
    };
    const passed = manualBill.isUserConfirmed === true && manualBill.source === 'user_manual';
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test H: Manual fallback bill construction',
      passed,
      detail: `Manual bill created: ${manualBill.monthlyConsumptionKwh} units, ₹${manualBill.billAmount}, source: ${manualBill.source}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test H: Manual fallback', passed: false, detail: err.message });
  }

  // Test I: Confirmed bill data reaching calculateSolarPlan()
  try {
    const confirmedBill: BillData = {
      provider: 'Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)',
      consumerNumber: '012948271034',
      billingPeriod: 'Cycle: 01/2026 - 30/2026',
      billAmount: 2635,
      unitsConsumedKwh: 310,
      monthlyConsumptionKwh: 310,
      tariffRate: 8.5,
      confidence: 0.94,
      source: 'extracted',
      isUserConfirmed: true,
    };

    const plan = await solarCalculationService.calculateSolarPlan({
      location: { state: 'Maharashtra', city: 'Pune' },
      monthlyConsumptionKwh: confirmedBill.monthlyConsumptionKwh,
      monthlyBillAmount: confirmedBill.billAmount,
      billData: confirmedBill,
      roofAreaSqM: 40,
    });

    const hasNoNaN = isFinite(plan.recommendedSystemKw) && isFinite(plan.annualGenerationKwh) && isFinite(plan.paybackYears);
    const usesConfirmedUnits = plan.monthlyConsumptionKwh === 310;
    const usesConfirmedBill = plan.monthlyBillAmount === 2635;
    const planContainsBillData = plan.billData?.consumerNumber === '012948271034';

    const passed = hasNoNaN && usesConfirmedUnits && usesConfirmedBill && planContainsBillData;
    if (!passed) allPassed = false;

    testResults.push({
      name: 'Test I: Confirmed bill data integrated into calculateSolarPlan()',
      passed,
      detail: `Sized system to ${plan.recommendedSystemKw} kW for confirmed 310 kWh bill, payback: ${plan.paybackYears} yrs, bill attached: ${Boolean(plan.billData)}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test I: Confirmed bill data integration', passed: false, detail: err.message });
  }

  // Test J: Textract Normalizer unit test
  try {
    const rawMock = {
      queries: {
        UNITS_CONSUMED: 295,
        BILL_AMOUNT: 2360,
        PROVIDER: 'BESCOM',
      },
      averageQueryConfidence: 96,
    };
    const normalized = normalizeTextractResponse(rawMock);
    const passed = normalized.monthlyConsumptionKwh === 295 && normalized.billAmount === 2360 && normalized.confidence === 0.96;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test J: Future AWS Textract normalization mapping',
      passed,
      detail: `Normalized Textract response: ${normalized.monthlyConsumptionKwh} kWh, ₹${normalized.billAmount}, confidence ${normalized.confidence}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test J: Textract Normalization', passed: false, detail: err.message });
  }

  return { success: allPassed, results: testResults };
}

// Standalone execution if run via tsx
if (import.meta.url.endsWith(process.argv[1] || '')) {
  runBillExtractionAudit().then(({ success, results }) => {
    console.log(`\n=== SuryaSathi Bill Pipeline Audit: ${success ? 'ALL PASSED' : 'FAILURES DETECTED'} ===\n`);
    for (const r of results) {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
      console.log(`   ${r.detail}\n`);
    }
    if (!success) process.exit(1);
  });
}
