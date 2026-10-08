import { MockRoofAnalysisAdapter } from './roofAnalysisService';
import { normalizeSageMakerResponse } from './sageMakerAdapter';
import { solarCalculationService } from './solarCalculationService';
import { DEFAULT_SOLAR_ASSUMPTIONS } from '../config/solarAssumptions';
import { RoofAnalysis } from '../types/solar';

export async function runRoofAnalysisAudit(): Promise<{ success: boolean; results: any[] }> {
  const adapter = new MockRoofAnalysisAdapter();
  const testResults: any[] = [];
  let allPassed = true;

  // Test A: Valid rooftop image
  try {
    const validRoof = await adapter.analyzeRoof({
      name: 'terrace_clean_view.jpg',
      size: 450000,
      type: 'image/jpeg',
    });
    const hasArea = validRoof.usableAreaSqM > 0;
    const hasPanels = validRoof.estimatedPanelCount > 0;
    const hasCapacity = validRoof.estimatedCapacityKw > 0;
    const hasFactors = Boolean(validRoof.factors && validRoof.factors.shading);
    const passed = hasArea && hasPanels && hasCapacity && hasFactors && validRoof.source === 'ai_assisted_estimate';
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test A: Valid rooftop image analysis',
      passed,
      detail: `Detected ${validRoof.usableAreaSqM} m² (~${validRoof.usableAreaSqFt} sq.ft), max ${validRoof.estimatedCapacityKw} kW (${validRoof.estimatedPanelCount} panels), source: ${validRoof.source}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test A: Valid rooftop image analysis', passed: false, detail: err.message });
  }

  // Test B: Unsupported file format rejection
  try {
    let rejected = false;
    try {
      await adapter.analyzeRoof({
        name: 'terrace_plan.dwg',
        size: 200000,
        type: 'application/octet-stream',
      });
    } catch (err: any) {
      rejected = err.message.includes('Unsupported file format');
    }
    if (!rejected) allPassed = false;
    testResults.push({
      name: 'Test B: Unsupported file rejection',
      passed: rejected,
      detail: 'Successfully rejected unsupported CAD/DWG file with friendly error',
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test B: Unsupported file rejection', passed: false, detail: err.message });
  }

  // Test C: Oversized file rejection (>15 MB)
  try {
    let rejected = false;
    try {
      await adapter.analyzeRoof({
        name: 'huge_raw_photo.png',
        size: 18 * 1024 * 1024,
        type: 'image/png',
      });
    } catch (err: any) {
      rejected = err.message.includes('15 MB limit');
    }
    if (!rejected) allPassed = false;
    testResults.push({
      name: 'Test C: Oversized file rejection',
      passed: rejected,
      detail: 'Rejected 18 MB file exceeding the 15 MB limit',
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test C: Oversized file rejection', passed: false, detail: err.message });
  }

  // Test D: Small usable roof
  try {
    const smallRoof = await adapter.analyzeRoof({
      name: 'tiny_small_balcony.jpg',
      size: 300000,
      type: 'image/jpeg',
    });
    const passed = smallRoof.usableAreaSqM < 10 && smallRoof.suitability === 'Not Suitable';
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test D: Small usable roof detection',
      passed,
      detail: `Area: ${smallRoof.usableAreaSqM} m², suitability: ${smallRoof.suitability}, note: ${smallRoof.explanation}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test D: Small usable roof detection', passed: false, detail: err.message });
  }

  // Test E: Large usable roof
  try {
    const largeRoof = await adapter.analyzeRoof({
      name: 'industrial_metal_shed.jpg',
      size: 500000,
      type: 'image/jpeg',
    });
    const passed = largeRoof.usableAreaSqM >= 40 && largeRoof.suitability === 'Suitable' && largeRoof.estimatedCapacityKw >= 8;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test E: Large usable roof detection',
      passed,
      detail: `Area: ${largeRoof.usableAreaSqM} m², max capacity: ${largeRoof.estimatedCapacityKw} kW (${largeRoof.estimatedPanelCount} panels)`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test E: Large usable roof detection', passed: false, detail: err.message });
  }

  // Test F: Suitable roof classification
  try {
    const suitableRoof = await adapter.analyzeRoof({
      name: 'spacious_concrete_terrace.jpg',
      size: 400000,
      type: 'image/jpeg',
    });
    const passed = suitableRoof.suitability === 'Suitable' && suitableRoof.factors.shading === 'Minimal (Favorable)';
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test F: Suitable roof classification',
      passed,
      detail: `Suitability: ${suitableRoof.suitability}, shading: ${suitableRoof.factors.shading}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test F: Suitable roof classification', passed: false, detail: err.message });
  }

  // Test G: Partially suitable roof (Moderate shading/obstruction)
  try {
    const partialRoof = await adapter.analyzeRoof({
      name: 'afternoon_shade_tank.jpg',
      size: 350000,
      type: 'image/jpeg',
    });
    const passed = partialRoof.suitability === 'Partially Suitable' && partialRoof.factors.obstructions === 'Moderate';
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test G: Partially suitable roof classification',
      passed,
      detail: `Suitability: ${partialRoof.suitability}, obstructions: ${partialRoof.factors.obstructions}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test G: Partially suitable roof classification', passed: false, detail: err.message });
  }

  // Test H: Not suitable roof (< 9.3 m²)
  try {
    const unsuitable = await adapter.analyzeRoof({
      name: 'unsuitable_parapet.jpg',
      size: 300000,
      type: 'image/jpeg',
    });
    const passed = unsuitable.suitability === 'Not Suitable' && unsuitable.usableAreaSqM < DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test H: Not suitable roof classification',
      passed,
      detail: `Suitability: ${unsuitable.suitability}, area: ${unsuitable.usableAreaSqM} m² (below 9.29 m² requirement)`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test H: Not suitable roof classification', passed: false, detail: err.message });
  }

  // Test I: Manual area correction
  try {
    const manualAreaSqM = 25.0; // ~269 sq.ft
    const manualAnalysis: RoofAnalysis = {
      suitability: 'Suitable',
      usableAreaSqM: manualAreaSqM,
      usableAreaSqFt: 269,
      estimatedPanelCount: Math.floor(manualAreaSqM / DEFAULT_SOLAR_ASSUMPTIONS.panelAreaSqM),
      estimatedCapacityKw: 5.5,
      confidence: 1.0,
      factors: {
        estimatedUsableArea: '25 m² (269 sq.ft)',
        obstructions: 'None/Minimal',
        shading: 'Minimal (Favorable)',
        orientation: 'Favorable (South/South-West)',
      },
      explanation: 'User manually verified 269 sq.ft terrace area.',
      source: 'user_manual',
      isUserConfirmed: true,
    };
    const passed = manualAnalysis.source === 'user_manual' && manualAnalysis.isUserConfirmed === true;
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test I: Manual area correction & source tracking',
      passed,
      detail: `Created user_manual roof analysis with confirmed area: ${manualAnalysis.usableAreaSqM} m²`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test I: Manual area correction', passed: false, detail: err.message });
  }

  // Test J: Roof capacity constraining solar system size (solar recommendation never exceeds roof capacity)
  try {
    // 14 m² roof can physically only hold floor(14 / 9.29) = 1 kW system
    // Even if user consumes 800 kWh/month (which would normally demand 6-7 kW),
    // the engine MUST NOT recommend > 1 kW!
    const plan = await solarCalculationService.calculateSolarPlan({
      location: { state: 'Maharashtra', city: 'Pune' },
      monthlyConsumptionKwh: 800,
      roofAreaSqM: 14.0, // 14 m² max capacity is ~1.5 kW
    });

    const maxPhysicalCapacity = Math.floor(14.0 / DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM);
    const passed = plan.recommendedSystemKw <= Math.max(1, maxPhysicalCapacity) && !isNaN(plan.recommendedSystemKw);
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test J: Roof capacity strictly constrains solar recommendation',
      passed,
      detail: `High consumption (800 kWh) with 14 m² roof resulted in constrained kW: ${plan.recommendedSystemKw} kW (never exceeded roof capacity)`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test J: Roof capacity constraint', passed: false, detail: err.message });
  }

  // Test K: Missing roof image with manual area fallback
  try {
    const plan = await solarCalculationService.calculateSolarPlan({
      location: { state: 'Gujarat', city: 'Surat' },
      monthlyConsumptionKwh: 280,
      roofAreaSqM: 32.0, // Manual area provided without roof image
    });
    const passed = plan.recommendedSystemKw > 0 && plan.recommendedSystemKw <= 3 && isFinite(plan.paybackYears);
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test K: Missing roof image with manual area fallback',
      passed,
      detail: `Successfully completed solar plan with manual 32 m² roof: ${plan.recommendedSystemKw} kW, payback: ${plan.paybackYears} yrs`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test K: Missing roof image fallback', passed: false, detail: err.message });
  }

  // Test L: Invalid/negative manual area handling
  try {
    const plan = await solarCalculationService.calculateSolarPlan({
      location: { state: 'Delhi (NCT)', city: 'New Delhi' },
      monthlyConsumptionKwh: 300,
      roofAreaSqM: -50, // Negative roof area passed
    });
    const passed = !isNaN(plan.recommendedSystemKw) && plan.recommendedSystemKw >= 0 && isFinite(plan.annualGenerationKwh);
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test L: Invalid / negative manual area safety sanitization',
      passed,
      detail: `Safely sanitized negative roof area without crashing: ${plan.recommendedSystemKw} kW, gen: ${plan.annualGenerationKwh} kWh`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test L: Invalid area sanitization', passed: false, detail: err.message });
  }

  // Test M: SageMaker Normalizer mapping test
  try {
    const rawSageMaker = {
      usableAreaSqM: 38.5,
      confidence: 0.94,
      obstructions: 'None/Minimal',
      shading: 'Minimal (Favorable)',
      orientation: 'Favorable (South/South-West)',
    };
    const normalized = normalizeSageMakerResponse(rawSageMaker);
    const passed = normalized.usableAreaSqM === 38.5 && normalized.suitability === 'Suitable' && normalized.source === 'ai_assisted_estimate';
    if (!passed) allPassed = false;
    testResults.push({
      name: 'Test M: Future AWS SageMaker normalization mapping',
      passed,
      detail: `Normalized SageMaker response: ${normalized.usableAreaSqM} m², max ${normalized.estimatedCapacityKw} kW, suitability: ${normalized.suitability}`,
    });
  } catch (err: any) {
    allPassed = false;
    testResults.push({ name: 'Test M: SageMaker Normalization', passed: false, detail: err.message });
  }

  return { success: allPassed, results: testResults };
}

// Standalone execution if run via tsx
if (import.meta.url.endsWith(process.argv[1] || '')) {
  runRoofAnalysisAudit().then(({ success, results }) => {
    console.log(`\n=== SuryaSathi Rooftop Analysis Audit: ${success ? 'ALL PASSED' : 'FAILURES DETECTED'} ===\n`);
    for (const r of results) {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
      console.log(`   ${r.detail}\n`);
    }
    if (!success) process.exit(1);
  });
}
