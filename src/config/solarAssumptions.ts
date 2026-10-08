import { SolarAssumptions } from '../types/solar';

/**
 * SuryaSathi Centralized Solar Assumptions & Engineering Benchmarks
 *
 * Grounded in:
 * - Ministry of New and Renewable Energy (MNRE) - PM Surya Ghar: Muft Bijli Yojana Guidelines (2024)
 * - Central Electricity Authority (CEA) Baseline Carbon Database for Indian Power Sector (User Guide v19)
 * - Central Electricity Regulatory Commission (CERC) benchmark capital costs for residential rooftop PV
 *
 * NOTE: These are planning estimates, not a final engineering quotation or guaranteed subsidy calculation.
 * Actual rooftop viability, generation, and net-metering credits are subject to site survey and DISCOM approval.
 */
export const DEFAULT_SOLAR_ASSUMPTIONS: SolarAssumptions = {
  // Typical high-efficiency Mono PERC / TOPCon residential solar panel wattage
  panelEfficiencyWatts: 540,

  // Average physical footprint of a single 540W residential PV module (~2.1m x 1.1m)
  panelAreaSqM: 2.3,

  // Area requirement: approximately 9.29 sq. meters (~100 sq. ft) per 1 kWp capacity
  areaRequiredPerKwSqM: 9.29,

  // Practical residential system capacity limits
  minSystemKw: 1.0,
  maxResidentialSystemKw: 10.0,

  // National average solar yield baseline (kWh per 1 kWp installed per year)
  defaultSolarYieldKwhPerKw: 1450,

  // Average effective solar generation hours per day across India (equivalent peak sun hours)
  annualSolarHoursPerDay: 4.15,

  // Combined system derate factor (losses due to soiling, temperature coefficient, inverter conversion ~18%)
  systemDerateFactor: 0.82,

  // Standard benchmark turnkey cost per kW installed (panels, grid-tie inverter, structure, AC/DC cabling, earthing)
  benchmarkCostPerKw: 52000,

  // National average residential retail grid electricity tariff (₹/unit)
  defaultTariffRatePerKwh: 7.50,

  // Average Power Purchase Cost (APPC) for surplus solar exported to grid beyond consumption under net-metering
  surplusExportTariffPerKwh: 3.00,

  // PM Surya Ghar: Muft Bijli Yojana Direct Benefit Transfer (DBT) subsidy structure:
  // - Systems up to 1 kW: ₹30,000
  // - Systems >1 kW up to 2 kW: ₹60,000
  // - Systems >2 kW and higher: ₹78,000 (Capped at ₹78,000 maximum for single residential household)
  pmSuryaGharSubsidy: {
    upToOneKw: 30000,
    upToTwoKw: 60000,
    threeKwAndAbove: 78000,
  },

  // Average Indian grid carbon intensity factor: 0.82 kg CO2 per kWh (CEA Grid Baseline)
  gridEmissionFactorKgPerKwh: 0.82,

  // Mature tree carbon sequestration rate: ~22.0 kg CO2 per tree per year
  co2AbsorptionPerTreeKgPerYear: 22.0,

  // Passenger car travel carbon factor: ~0.12 kg CO2 per km
  carEmissionFactorKgPerKm: 0.12,

  // Thermal coal power displacement: ~0.65 kg coal per kWh generated
  coalDisplacementFactorKgPerKwh: 0.65,

  // Annual PV module performance degradation (0.5% per year)
  annualDegradationRate: 0.005,

  // Projected annual electricity tariff escalation in Indian DISCOMs (~3.5% per annum)
  annualTariffEscalationRate: 0.035,

  // Standard PV module warranty lifespan
  systemLifespanYears: 25,

  // Central grid-tie string inverter expected replacement milestone at Year 12
  inverterReplacementYear: 12,

  // Estimated inverter replacement cost as % of initial benchmark cost
  inverterReplacementCostPercent: 0.15,

  // Annual preventative maintenance, panel cleaning, and insurance (~1% per year)
  annualMaintenanceCostPercent: 0.01,

  // Standard planning disclaimer
  estimateDisclaimer: 'These are planning estimates, not a final engineering quotation or guaranteed subsidy calculation.',
};

/**
 * Seasonal monthly distribution weights for the Indian subcontinent.
 * Sums exactly to 12.000 so the sum of monthly generation matches the annual total.
 */
export const INDIAN_MONTHLY_SEASONAL_WEIGHTS: Array<{
  month: string;
  weight: number;
  isMonsoon: boolean;
  isPeakSummer: boolean;
}> = [
  { month: 'Jan', weight: 0.95, isMonsoon: false, isPeakSummer: false },
  { month: 'Feb', weight: 1.05, isMonsoon: false, isPeakSummer: false },
  { month: 'Mar', weight: 1.15, isMonsoon: false, isPeakSummer: true },
  { month: 'Apr', weight: 1.20, isMonsoon: false, isPeakSummer: true },
  { month: 'May', weight: 1.25, isMonsoon: false, isPeakSummer: true },
  { month: 'Jun', weight: 0.95, isMonsoon: true, isPeakSummer: false },
  { month: 'Jul', weight: 0.75, isMonsoon: true, isPeakSummer: false },
  { month: 'Aug', weight: 0.75, isMonsoon: true, isPeakSummer: false },
  { month: 'Sep', weight: 0.90, isMonsoon: false, isPeakSummer: false },
  { month: 'Oct', weight: 1.05, isMonsoon: false, isPeakSummer: false },
  { month: 'Nov', weight: 1.02, isMonsoon: false, isPeakSummer: false },
  { month: 'Dec', weight: 0.98, isMonsoon: false, isPeakSummer: false },
];

/**
 * Calculates estimated PM Surya Ghar central financial subsidy according to official slab:
 * - Systems <= 0 kW: ₹0
 * - Systems 0.1 to 1.0 kW: ₹30,000 (or proportional for fractional systems)
 * - Systems >1.0 kW to 2.0 kW: ₹60,000
 * - Systems >2.0 kW+: ₹78,000 (capped at ₹78,000 for standard residential meters)
 */
export function calculatePmSuryaGharSubsidy(
  systemKw: number,
  assumptions: SolarAssumptions = DEFAULT_SOLAR_ASSUMPTIONS
): number {
  if (!systemKw || isNaN(systemKw) || systemKw <= 0) {
    return 0;
  }

  // Rounded to standard practical tiers
  if (systemKw < 1.0) {
    // Proportional for micro systems below 1 kW
    return Math.round(systemKw * assumptions.pmSuryaGharSubsidy.upToOneKw);
  }
  if (systemKw < 1.99) {
    return assumptions.pmSuryaGharSubsidy.upToOneKw;
  }
  if (systemKw < 2.99) {
    return assumptions.pmSuryaGharSubsidy.upToTwoKw;
  }
  return assumptions.pmSuryaGharSubsidy.threeKwAndAbove;
}
