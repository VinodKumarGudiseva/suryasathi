export type RoofSuitability = 'Suitable' | 'Partially Suitable' | 'Not Suitable';

export interface BillData {
  provider?: string;
  consumerName?: string;
  consumerNumber?: string;
  billingPeriod?: string;
  billAmount?: number;
  unitsConsumedKwh?: number;
  monthlyConsumptionKwh: number; // Primary consumption field (synced with unitsConsumedKwh)
  previousReading?: number;
  currentReading?: number;
  tariffRate?: number;
  tariffRatePerKwh?: number; // Alias for tariffRate
  sanctionedLoadKw?: number;
  confidence: number;
  extractedFields?: string[];
  extractedFieldsCount?: number;
  isUserConfirmed?: boolean;
  source?: 'extracted' | 'user_manual' | 'estimated';
  notes?: string;
}

export interface RoofFactors {
  estimatedUsableArea: string | number;
  obstructions: 'None/Minimal' | 'Moderate' | 'Potentially Limiting';
  shading: 'Minimal (Favorable)' | 'Moderate' | 'Potentially Limiting';
  orientation: 'Favorable (South/South-West)' | 'Moderate (East/West)' | 'Potentially Limiting (North)';
}

export interface RoofAnalysis {
  suitability: RoofSuitability;
  usableAreaSqM: number;
  usableAreaSqFt: number;
  estimatedPanelCount: number;
  estimatedCapacityKw: number;
  confidence: number;
  factors: RoofFactors;
  explanation: string;
  source: 'ai_assisted_estimate' | 'user_manual';
  roofType?: 'RCC Flat Concrete' | 'Sloped Metal Sheet' | 'Clay Tile' | 'Open Terrace';
  shadingAssessment?: string;
  orientation?: string;
  isUserConfirmed?: boolean;
}

export interface SolarLocation {
  state: string;
  city: string;
  pincode?: string;
  averageInsolationKwhPerSqm?: number;
  discomName?: string;
  stateSubsidyBonus?: number;
}

export interface MonthlyGenerationItem {
  month: string;
  kwh: number;
  isMonsoon: boolean;
  isPeakSummer: boolean;
}

export interface SolarAssumptions {
  panelEfficiencyWatts: number;
  panelAreaSqM: number;
  areaRequiredPerKwSqM: number;
  minSystemKw: number;
  maxResidentialSystemKw: number;
  defaultSolarYieldKwhPerKw: number;
  annualSolarHoursPerDay: number;
  systemDerateFactor: number;
  benchmarkCostPerKw: number;
  defaultTariffRatePerKwh: number;
  surplusExportTariffPerKwh: number;
  pmSuryaGharSubsidy: {
    upToOneKw: number;
    upToTwoKw: number;
    threeKwAndAbove: number;
  };
  gridEmissionFactorKgPerKwh: number;
  co2AbsorptionPerTreeKgPerYear: number;
  carEmissionFactorKgPerKm: number;
  coalDisplacementFactorKgPerKwh: number;
  annualDegradationRate: number;
  annualTariffEscalationRate: number;
  systemLifespanYears: number;
  inverterReplacementYear: number;
  inverterReplacementCostPercent: number;
  annualMaintenanceCostPercent: number;
  estimateDisclaimer: string;
}

export interface FinancialBreakdown {
  benchmarkGrossCost: number;
  pmSuryaGharSubsidy: number;
  stateSubsidyBonus: number;
  totalSubsidy: number;
  netInvestment: number;
  monthlyAverageSavings: number;
  firstYearSavings: number;
  twentyFiveYearSavings: number;
  simplePaybackYears: number;
  returnOnInvestmentPercent: number;
  yearlyCashflows: Array<{
    year: number;
    generationKwh: number;
    gridSavings: number;
    netSavings: number;
    cumulativeSavings: number;
  }>;
}

export interface EnvironmentalImpact {
  annualCO2ReductionKg: number;
  annualCO2ReductionTonnes: number;
  twentyFiveYearCO2ReductionTonnes: number;
  equivalentTreesPlanted: number;
  equivalentCarKmOffset: number;
  coalSavedTonnesAnnual: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: 'Required' | 'Recommended' | 'Next step';
  description: string;
  officialSource: string;
  status: 'pending' | 'ready';
  tips?: string;
}

export interface SolarPlan {
  id: string;
  createdAt: string;
  location: SolarLocation;
  monthlyConsumptionKwh: number;
  monthlyBillAmount: number;
  billData?: BillData;
  roofAnalysis?: RoofAnalysis;
  recommendedSystemKw: number;
  reasonForRecommendation: string;
  annualGenerationKwh: number;
  monthlyGenerationKwh: number;
  monthlyGeneration: MonthlyGenerationItem[];
  annualSavings: number;
  installationCost: number;
  subsidy: number;
  netInvestment: number;
  paybackYears: number;
  co2ReductionKg: number;
  recommendation: string;
  financialBreakdown: FinancialBreakdown;
  environmentalImpact: EnvironmentalImpact;
  documents: DocumentItem[];
  nextSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    actionLabel?: string;
    officialPortalUrl?: string;
  }>;
  assumptionsSnapshot: {
    benchmarkCostPerKw: number;
    pmSuryaGharSubsidy: number;
    tariffRatePerKwh: number;
    annualSolarYieldKwhPerKw: number;
    areaRequiredPerKwSqM: number;
    disclaimer: string;
  };
}

export interface AdvisorContext {
  state?: string;
  city?: string;
  location?: string;
  discomName?: string;
  monthlyConsumptionKwh?: number;
  monthlyBillAmount?: number;
  recommendedSystemKw?: number;
  annualGenerationKwh?: number;
  annualSavings?: number;
  estimatedSubsidy?: number;
  installationCost?: number;
  netInvestment?: number;
  paybackYears?: number;
  co2ReductionKg?: number;
  roofSuitability?: RoofSuitability;
  usableAreaSqM?: number;
  roofConfidence?: number;
  billConfidence?: number;
}

export interface AdvisorSource {
  title: string;
  url?: string;
  snippet?: string;
}

export interface AdvisorMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  confidence?: number;
  sources?: AdvisorSource[];
  references?: Array<{
    title: string;
    url?: string;
  }>;
  relatedQuestions?: string[];
}

export interface SchemeKnowledgeItem {
  id: string;
  topic: string;
  keywords: string[];
  summary: string;
  details: string;
  officialReference: string;
  eligibilityNotes?: string[];
}
