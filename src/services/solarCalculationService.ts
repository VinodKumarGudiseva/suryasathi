import {
  DEFAULT_SOLAR_ASSUMPTIONS,
  INDIAN_MONTHLY_SEASONAL_WEIGHTS,
  calculatePmSuryaGharSubsidy,
} from '../config/solarAssumptions';
import { getStateData } from '../data/indianStates';
import {
  DocumentItem,
  FinancialBreakdown,
  EnvironmentalImpact,
  MonthlyGenerationItem,
  SolarPlan,
} from '../types/solar';
import { ISolarCalculationService, SolarCalculationInput } from './interfaces';

/**
 * SuryaSathi Deterministic Solar Intelligence Engine
 *
 * Grounded in:
 * - MNRE PM Surya Ghar: Muft Bijli Yojana Central Subsidy Guidelines (2024)
 * - CERC Benchmark Turnkey Costs for Residential Rooftop Systems
 * - CEA Baseline Carbon Database for Indian Power Grid (0.82 kg CO2 / kWh)
 *
 * NOTE: These are planning estimates, not a final engineering quotation or guaranteed subsidy calculation.
 */
export class DeterministicSolarCalculationAdapter implements ISolarCalculationService {
  async calculateSolarPlan(input: SolarCalculationInput): Promise<SolarPlan> {
    const assumptions = {
      ...DEFAULT_SOLAR_ASSUMPTIONS,
      ...(input.customAssumptions || {}),
    };

    const stateData = getStateData(input.location?.state || 'Maharashtra');
    const solarYieldFactor = Number(stateData.solarYieldFactor) || assumptions.defaultSolarYieldKwhPerKw;
    
    // 7. Location + Tariff fallback: use confirmed bill tariff if valid (between ₹3 and ₹18), otherwise use state/central baseline
    const billTariff = Number(input.billData?.tariffRate || input.billData?.tariffRatePerKwh);
    const tariffRate = (!isNaN(billTariff) && billTariff >= 3.0 && billTariff <= 18.0)
      ? billTariff
      : (Number(stateData.averageTariffPerKwh) || assumptions.defaultTariffRatePerKwh);

    // 1. Sanitize consumption and roof inputs safely
    const rawConsumption = Number(input.monthlyConsumptionKwh);
    const monthlyKwh = (!isNaN(rawConsumption) && rawConsumption > 0)
      ? Math.round(rawConsumption)
      : 250; // Fallback default for demo if completely missing or zero

    const annualKwhNeed = monthlyKwh * 12;

    // 2. Usable Roof Area determination
    const rawRoofArea = Number(input.roofAreaSqM);
    const usableRoofAreaSqM = (!isNaN(rawRoofArea) && rawRoofArea > 0)
      ? rawRoofArea
      : (input.roofAnalysis?.usableAreaSqM && input.roofAnalysis.usableAreaSqM > 0
          ? input.roofAnalysis.usableAreaSqM
          : 35.0); // ~376 sq.ft baseline

    // Physical maximum system capacity supported by the available roof
    // Area per kW = ~9.29 sq.m (approx 100 sq.ft)
    const maxRoofCapacityKw = Math.max(0, Math.floor((usableRoofAreaSqM / assumptions.areaRequiredPerKwSqM) * 10) / 10);

    // Theoretical capacity needed to offset ~100% of annual household consumption
    const capacityByConsumption = annualKwhNeed / solarYieldFactor;

    // 3. Recommended System Sizing (considers BOTH consumption and roof area constraint)
    let recommendedSystemKw = 0;
    let reasonForRecommendation = '';

    if (maxRoofCapacityKw < 0.8) {
      // Roof is too small to host a standard 1 kW grid-tied residential inverter
      recommendedSystemKw = 0;
      reasonForRecommendation = `Available shadow-free roof area (${usableRoofAreaSqM.toFixed(1)} m² / ~${Math.round(usableRoofAreaSqM * 10.764)} sq.ft) is below the minimum ~${assumptions.areaRequiredPerKwSqM} m² required for a standard 1 kW residential solar installation.`;
    } else {
      // Practical residential sizing in integer steps: 1, 2, 3, 4, 5... up to maxResidentialSystemKw
      const idealRoundedKw = Math.max(assumptions.minSystemKw, Math.round(capacityByConsumption));

      if (idealRoundedKw <= maxRoofCapacityKw) {
        // Roof easily accommodates household need
        recommendedSystemKw = Math.min(idealRoundedKw, assumptions.maxResidentialSystemKw);
        const percentOffset = Math.min(100, Math.round(((recommendedSystemKw * solarYieldFactor) / annualKwhNeed) * 100));
        reasonForRecommendation = `Sized at ${recommendedSystemKw} kW to meet approximately ${percentOffset}% of your annual electricity demand (${annualKwhNeed.toLocaleString('en-IN')} units), fitting comfortably within your ${Math.round(usableRoofAreaSqM)} m² roof.`;
      } else {
        // Roof is the primary limiting constraint! Do NOT recommend larger than roof supports.
        const feasibleIntegerKw = Math.floor(maxRoofCapacityKw);
        recommendedSystemKw = Math.max(assumptions.minSystemKw, feasibleIntegerKw);

        if (recommendedSystemKw > maxRoofCapacityKw) {
          // If even 1 kW is slightly above floor(maxRoofCapacityKw) but maxRoofCapacityKw >= 0.8
          recommendedSystemKw = Math.max(1, Math.round(maxRoofCapacityKw));
        }

        reasonForRecommendation = `System size is constrained to ${recommendedSystemKw} kW by your available shadow-free rooftop area (${usableRoofAreaSqM.toFixed(1)} m²), even though your consumption could utilize a larger system.`;
      }
    }

    // Safety clamp
    recommendedSystemKw = Math.min(recommendedSystemKw, assumptions.maxResidentialSystemKw);
    if (isNaN(recommendedSystemKw) || recommendedSystemKw < 0) {
      recommendedSystemKw = 0;
    }

    // 4. Solar Generation with Seasonal Distribution
    // CRITICAL: Ensure annual generation EXACTLY equals the sum of monthly generation values!
    const targetAnnualGen = recommendedSystemKw > 0
      ? Math.round(recommendedSystemKw * solarYieldFactor)
      : 0;

    const monthlyGeneration: MonthlyGenerationItem[] = [];
    let runningSum = 0;

    if (recommendedSystemKw > 0) {
      INDIAN_MONTHLY_SEASONAL_WEIGHTS.forEach((item, index) => {
        if (index === INDIAN_MONTHLY_SEASONAL_WEIGHTS.length - 1) {
          // Last month takes the exact remainder to ensure sum(monthly) === annual total
          const lastMonthKwh = Math.max(0, targetAnnualGen - runningSum);
          monthlyGeneration.push({
            month: item.month,
            kwh: lastMonthKwh,
            isMonsoon: item.isMonsoon,
            isPeakSummer: item.isPeakSummer,
          });
        } else {
          const monthGen = Math.round((targetAnnualGen * item.weight) / 12);
          runningSum += monthGen;
          monthlyGeneration.push({
            month: item.month,
            kwh: monthGen,
            isMonsoon: item.isMonsoon,
            isPeakSummer: item.isPeakSummer,
          });
        }
      });
    } else {
      INDIAN_MONTHLY_SEASONAL_WEIGHTS.forEach((item) => {
        monthlyGeneration.push({
          month: item.month,
          kwh: 0,
          isMonsoon: item.isMonsoon,
          isPeakSummer: item.isPeakSummer,
        });
      });
    }

    const annualGenerationKwh = monthlyGeneration.reduce((sum, m) => sum + m.kwh, 0);
    const monthlyGenerationKwh = Math.round(annualGenerationKwh / 12);

    // 5. Electricity Savings (derived from solar generation and household consumption)
    // - Self-consumed units offset retail grid tariff
    // - Surplus exported units (if generation exceeds consumption) are credited at surplus export tariff
    let annualSavings = 0;
    if (recommendedSystemKw > 0 && annualGenerationKwh > 0) {
      if (annualGenerationKwh <= annualKwhNeed) {
        // 100% of generation is self-consumed, offsetting retail tariff
        annualSavings = Math.round(annualGenerationKwh * tariffRate);
      } else {
        // Generation exceeds consumption: offset 100% of home consumption + export surplus at APPC rate
        const selfConsumed = annualKwhNeed;
        const surplus = annualGenerationKwh - annualKwhNeed;
        annualSavings = Math.round(
          (selfConsumed * tariffRate) + (surplus * assumptions.surplusExportTariffPerKwh)
        );
      }
    }
    const monthlyAverageSavings = Math.round(annualSavings / 12);

    // 6. Turnkey Capital Cost & PM Surya Ghar Subsidy
    const installationCost = recommendedSystemKw > 0
      ? Math.round(recommendedSystemKw * assumptions.benchmarkCostPerKw)
      : 0;

    const centralSubsidy = calculatePmSuryaGharSubsidy(recommendedSystemKw, assumptions);
    const stateSubsidyBonus = stateData.stateSubsidyBonus || 0;
    const totalSubsidy = Math.min(installationCost, centralSubsidy + stateSubsidyBonus);
    const netInvestment = Math.max(0, installationCost - totalSubsidy);

    // 7. Payback Period & ROI Calculation
    // Simple payback = net investment / annual savings
    let simplePaybackYears = 0;
    if (netInvestment === 0 && annualSavings > 0) {
      simplePaybackYears = 0;
    } else if (annualSavings > 0) {
      const pb = netInvestment / annualSavings;
      simplePaybackYears = isFinite(pb) ? Math.round(pb * 10) / 10 : 0;
    }

    let returnOnInvestmentPercent = 0;
    if (netInvestment > 0 && annualSavings > 0) {
      const roi = (annualSavings / netInvestment) * 100;
      returnOnInvestmentPercent = isFinite(roi) ? Math.round(roi * 10) / 10 : 0;
    }

    // 8. 25-Year Cumulative Financial Cashflow Projection
    const yearlyCashflows: FinancialBreakdown['yearlyCashflows'] = [];
    let cumulativeSavings = -netInvestment;
    let total25YearSavings = 0;

    if (recommendedSystemKw > 0) {
      for (let yr = 1; yr <= assumptions.systemLifespanYears; yr++) {
        // Module performance degradation (0.5% per year)
        const degradationFactor = Math.max(0.75, 1 - (yr - 1) * assumptions.annualDegradationRate);
        const yrGen = Math.round(annualGenerationKwh * degradationFactor);

        // Projected tariff escalation (3.5% per year)
        const escalatedTariff = tariffRate * Math.pow(1 + assumptions.annualTariffEscalationRate, yr - 1);
        const escalatedSurplusTariff = assumptions.surplusExportTariffPerKwh * Math.pow(1 + assumptions.annualTariffEscalationRate, yr - 1);

        let grossYrSavings = 0;
        if (yrGen <= annualKwhNeed) {
          grossYrSavings = Math.round(yrGen * escalatedTariff);
        } else {
          grossYrSavings = Math.round(
            (annualKwhNeed * escalatedTariff) + ((yrGen - annualKwhNeed) * escalatedSurplusTariff)
          );
        }

        // Annual maintenance & panel cleaning (~1% of benchmark cost)
        const maintenanceCost = Math.round(installationCost * assumptions.annualMaintenanceCostPercent);

        // Central inverter replacement at Year 12
        const inverterCost = yr === assumptions.inverterReplacementYear
          ? Math.round(installationCost * assumptions.inverterReplacementCostPercent)
          : 0;

        const netYrSavings = grossYrSavings - maintenanceCost - inverterCost;
        cumulativeSavings += netYrSavings;
        total25YearSavings += netYrSavings;

        yearlyCashflows.push({
          year: yr,
          generationKwh: yrGen,
          gridSavings: grossYrSavings,
          netSavings: netYrSavings,
          cumulativeSavings,
        });
      }
    } else {
      for (let yr = 1; yr <= assumptions.systemLifespanYears; yr++) {
        yearlyCashflows.push({
          year: yr,
          generationKwh: 0,
          gridSavings: 0,
          netSavings: 0,
          cumulativeSavings: 0,
        });
      }
    }

    const financialBreakdown: FinancialBreakdown = {
      benchmarkGrossCost: installationCost,
      pmSuryaGharSubsidy: centralSubsidy,
      stateSubsidyBonus,
      totalSubsidy,
      netInvestment,
      monthlyAverageSavings,
      firstYearSavings: annualSavings,
      twentyFiveYearSavings: Math.round(total25YearSavings),
      simplePaybackYears,
      returnOnInvestmentPercent,
      yearlyCashflows,
    };

    // 9. Environmental Impact (CEA Indian Grid Baseline)
    const annualCO2ReductionKg = Math.round(annualGenerationKwh * assumptions.gridEmissionFactorKgPerKwh);
    const annualCO2ReductionTonnes = Math.round((annualCO2ReductionKg / 1000) * 100) / 100;
    const twentyFiveYearCO2ReductionTonnes = Math.round(
      (annualCO2ReductionKg * assumptions.systemLifespanYears * (1 - (assumptions.systemLifespanYears / 2) * assumptions.annualDegradationRate)) / 1000 * 10
    ) / 10;
    const equivalentTreesPlanted = Math.round(annualCO2ReductionKg / assumptions.co2AbsorptionPerTreeKgPerYear);
    const equivalentCarKmOffset = Math.round(annualCO2ReductionKg / assumptions.carEmissionFactorKgPerKm);
    const coalSavedTonnesAnnual = Math.round((annualGenerationKwh * assumptions.coalDisplacementFactorKgPerKwh) / 1000 * 10) / 10;

    const environmentalImpact: EnvironmentalImpact = {
      annualCO2ReductionKg,
      annualCO2ReductionTonnes,
      twentyFiveYearCO2ReductionTonnes,
      equivalentTreesPlanted,
      equivalentCarKmOffset,
      coalSavedTonnesAnnual,
    };

    // 10. Natural Language Narrative
    const percentOffset = annualKwhNeed > 0
      ? Math.min(100, Math.round((annualGenerationKwh / annualKwhNeed) * 100))
      : 0;

    let recommendationNarrative = '';
    if (recommendedSystemKw > 0) {
      recommendationNarrative = `Based on your monthly consumption of ${monthlyKwh} kWh (${Math.round(monthlyKwh / 30)} units/day) and available rooftop space in ${input.location?.city || 'your city'}, ${stateData.state}, a ${recommendedSystemKw} kW on-grid solar system appears optimal. It is projected to generate approximately ${annualGenerationKwh.toLocaleString('en-IN')} kWh annually, offsetting roughly ${percentOffset}% of your household electricity demand. Under the PM Surya Ghar: Muft Bijli Yojana, this system qualifies for an estimated central subsidy of ₹${totalSubsidy.toLocaleString('en-IN')}, bringing your net out-of-pocket investment down to approximately ₹${netInvestment.toLocaleString('en-IN')} with an estimated payback period of ~${simplePaybackYears} years.`;
    } else {
      recommendationNarrative = `Based on your rooftop parameters, available shadow-free area appears insufficient for a standard 1 kW grid-tied installation. We recommend exploring shared community solar or consulting a structural surveyor for terrace expansion.`;
    }

    // 11. Document Checklist
    const documents: DocumentItem[] = [
      {
        id: 'doc-elec-bill',
        name: 'Recent Electricity Bill (Last 2 months)',
        category: 'Required',
        description: 'Shows your domestic Consumer Account (CA) number, sanctioned connected load, and billing tariff slab.',
        officialSource: `${stateData.discoms[0] || 'State DISCOM'} Portal / Physical Bill`,
        status: input.billData ? 'ready' : 'pending',
        tips: 'Ensure the name on the electricity bill matches your property or family Aadhaar card.',
      },
      {
        id: 'doc-aadhaar',
        name: 'Aadhaar Card of Electricity Consumer',
        category: 'Required',
        description: 'Required for identity verification and linking Direct Benefit Transfer (DBT) subsidy payments.',
        officialSource: 'UIDAI',
        status: 'pending',
        tips: 'Aadhaar must be linked to the bank account where subsidy will be disbursed.',
      },
      {
        id: 'doc-roof-proof',
        name: 'Rooftop Ownership / Property Tax Receipt',
        category: 'Required',
        description: 'Proves legal ownership or authorization over the rooftop premises.',
        officialSource: 'Municipal Corporation / Gram Panchayat',
        status: 'pending',
        tips: 'In apartment buildings or housing societies, a NOC from the society RWA is required.',
      },
      {
        id: 'doc-bank-cheque',
        name: 'Cancelled Bank Cheque / Passbook Copy',
        category: 'Required',
        description: 'Bank account number and IFSC code for direct deposit of the PM Surya Ghar subsidy.',
        officialSource: 'Bank of Account Holder',
        status: 'pending',
        tips: 'Account holder name must match the electricity consumer and Aadhaar name.',
      },
      {
        id: 'doc-roof-photo',
        name: 'Rooftop Site Photograph',
        category: 'Recommended',
        description: 'Clear wide-angle photo showing the shadow-free rooftop area and inverter placement location.',
        officialSource: 'SuryaSathi Roof Scanner',
        status: input.roofAnalysis ? 'ready' : 'pending',
        tips: 'Take during peak sunlight (11 AM - 2 PM) to demonstrate absence of tree or building shadows.',
      },
      {
        id: 'doc-sanction-load',
        name: 'Sanctioned Load Enhancement Slip (If needed)',
        category: 'Next step',
        description: recommendedSystemKw > 0
          ? `Your recommended system is ${recommendedSystemKw} kW. If your existing sanctioned load is below ${recommendedSystemKw} kW, apply to ${stateData.discoms[0] || 'DISCOM'} for load enhancement.`
          : 'DISCOM connected load verification.',
        officialSource: `${stateData.discoms[0] || 'DISCOM'} Portal`,
        status: 'pending',
        tips: 'Most DISCOMs allow online load enhancement within 48 hours for a nominal deposit.',
      },
    ];

    // 12. Next Steps
    const nextSteps = [
      {
        stepNumber: 1,
        title: 'Register on National Portal',
        description: 'Visit pmsuryaghar.gov.in, select your State and DISCOM, and register using your consumer account number.',
        actionLabel: 'Visit PM Surya Ghar Portal',
        officialPortalUrl: 'https://pmsuryaghar.gov.in',
      },
      {
        stepNumber: 2,
        title: 'Submit Feasibility Approval Request',
        description: recommendedSystemKw > 0
          ? `Apply for ${recommendedSystemKw} kW technical feasibility through the portal. Your DISCOM will verify transformer capacity.`
          : 'Apply for feasibility review on the portal.',
        actionLabel: 'DISCOM Feasibility Guidelines',
      },
      {
        stepNumber: 3,
        title: 'Select Empaneled Vendor & Finalize Quote',
        description: 'Choose a verified solar installer empaneled under PM Surya Ghar in your city to conduct a physical survey.',
        actionLabel: 'Find Empaneled Vendors',
      },
      {
        stepNumber: 4,
        title: 'Installation & Net Meter Commissioning',
        description: 'Installer constructs the structure and panels. DISCOM inspects and installs the smart bi-directional net meter.',
        actionLabel: 'Inspection Protocols',
      },
      {
        stepNumber: 5,
        title: 'Receive Direct Subsidy in Bank Account',
        description: totalSubsidy > 0
          ? `Upload commissioning certificate and bank cancelled cheque. Estimated central subsidy of ₹${totalSubsidy.toLocaleString('en-IN')} is credited within 30 days.`
          : 'Upload commissioning certificate for DBT subsidy disbursement.',
        actionLabel: 'Track DBT Status',
      },
    ];

    // 13. Final Solar Plan Object
    const planId = `ss-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const billAmountCalculated = input.monthlyBillAmount && input.monthlyBillAmount > 0
      ? input.monthlyBillAmount
      : Math.round(monthlyKwh * tariffRate);

    return {
      id: planId,
      createdAt: new Date().toISOString(),
      location: {
        ...input.location,
        state: stateData.state,
        discomName: stateData.discoms[0],
        averageInsolationKwhPerSqm: stateData.averageInsolationKwhPerSqm,
        stateSubsidyBonus: stateData.stateSubsidyBonus,
      },
      monthlyConsumptionKwh: monthlyKwh,
      monthlyBillAmount: billAmountCalculated,
      billData: input.billData,
      roofAnalysis: input.roofAnalysis,
      recommendedSystemKw,
      reasonForRecommendation,
      annualGenerationKwh,
      monthlyGenerationKwh,
      monthlyGeneration,
      annualSavings,
      installationCost,
      subsidy: totalSubsidy,
      netInvestment,
      paybackYears: simplePaybackYears,
      co2ReductionKg: annualCO2ReductionKg,
      recommendation: recommendationNarrative,
      financialBreakdown,
      environmentalImpact,
      documents,
      nextSteps,
      assumptionsSnapshot: {
        benchmarkCostPerKw: assumptions.benchmarkCostPerKw,
        pmSuryaGharSubsidy: totalSubsidy,
        tariffRatePerKwh: tariffRate,
        annualSolarYieldKwhPerKw: solarYieldFactor,
        areaRequiredPerKwSqM: assumptions.areaRequiredPerKwSqM,
        disclaimer: assumptions.estimateDisclaimer,
      },
    };
  }
}

export const solarCalculationService = new DeterministicSolarCalculationAdapter();
