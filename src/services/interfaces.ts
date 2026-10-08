import {
  BillData,
  RoofAnalysis,
  SolarLocation,
  SolarPlan,
  AdvisorMessage,
  AdvisorContext,
  SchemeKnowledgeItem,
  SolarAssumptions
} from '../types/solar';

/**
 * Service Interfaces for SuryaSathi Rooftop Solar Platform
 *
 * Each interface defines the contract that decouples the frontend UI and business logic
 * from concrete infrastructure providers.
 *
 * FUTURE AWS ARCHITECTURE MAPPING:
 * 1. IBillExtractionService   -> AWS Textract (AnalyzeDocument API for electricity bills)
 * 2. IRoofAnalysisService      -> Amazon SageMaker / AWS Rekognition (Computer Vision for aerial/roof segmentation)
 * 3. ISolarCalculationService  -> AWS Lambda (Serverless solar deterministic engine)
 * 4. ISolarAdvisorService      -> Amazon Bedrock (Claude 3.5 Sonnet / Amazon Titan with prompt templates)
 * 5. ISchemeKnowledgeService   -> Amazon Bedrock Knowledge Bases (RAG over MNRE/DISCOM government gazettes)
 * 6. ISolarPlanStorageService  -> Amazon DynamoDB (NoSQL persistence) & Amazon S3 (PDF reports and images)
 */

export interface IBillExtractionService {
  /**
   * Extracts structured utility consumption, billing amount, and DISCOM information from bill files.
   * Future implementation: Uses AWS Textract Queries & Forms extraction.
   */
  extractBillData(file: File | { name: string; size: number; type: string; base64?: string }): Promise<BillData>;
}

export interface IRoofAnalysisService {
  /**
   * Analyzes rooftop image for usable shadow-free surface area, orientation, and suitability.
   * Future implementation: Uses Amazon SageMaker endpoint running YOLOv8 or SAM rooftop segmentation.
   */
  analyzeRoof(image: File | { name: string; size: number; type: string; base64?: string }): Promise<RoofAnalysis>;
}

export interface SolarCalculationInput {
  location: SolarLocation;
  monthlyConsumptionKwh: number;
  monthlyBillAmount?: number;
  roofAreaSqM?: number;
  roofSuitability?: string;
  customAssumptions?: Partial<SolarAssumptions>;
  billData?: BillData;
  roofAnalysis?: RoofAnalysis;
}

export interface ISolarCalculationService {
  /**
   * Computes recommended solar capacity, generation, financial payback, PM Surya Ghar subsidy,
   * and environmental impact.
   * Future implementation: Executed as AWS Lambda function with deterministic rules & CERC standards.
   */
  calculateSolarPlan(input: SolarCalculationInput): Promise<SolarPlan>;
}

export interface ISchemeKnowledgeService {
  /**
   * Semantic and keyword retrieval over government solar schemes and DISCOM regulations.
   * Future implementation: Uses Amazon Bedrock Knowledge Bases with vector search in Amazon OpenSearch Serverless.
   */
  searchSchemeKnowledge(query: string): Promise<SchemeKnowledgeItem[]>;
}

export interface ISolarAdvisorService {
  /**
   * Provides contextual guidance, answering household solar questions using the user's solar plan context.
   * Accepts either a full/partial SolarPlan or structured AdvisorContext.
   * Future implementation: Amazon Bedrock RetrieveAndGenerate or Converse API with Claude / Titan.
   */
  askSolarAdvisor(
    question: string,
    context?: Partial<SolarPlan> | AdvisorContext,
    conversationHistory?: AdvisorMessage[]
  ): Promise<AdvisorMessage>;
}

export interface ISolarPlanStorageService {
  /**
   * Persists generated solar plans and assessment history.
   * Future implementation: Amazon DynamoDB for plan metadata & Amazon S3 for generated report artifacts.
   */
  saveSolarPlan(plan: SolarPlan): Promise<{ success: boolean; id: string }>;
  getSolarPlan(id: string): Promise<SolarPlan | null>;
  getAllSolarPlans(): Promise<SolarPlan[]>;
  deleteSolarPlan(id: string): Promise<boolean>;
}
