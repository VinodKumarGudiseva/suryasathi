import { RoofAnalysis, RoofSuitability, RoofFactors } from '../types/solar';
import { DEFAULT_SOLAR_ASSUMPTIONS } from '../config/solarAssumptions';
import { IRoofAnalysisService } from './interfaces';

/**
 * Normalization function that transforms raw Amazon SageMaker / Rekognition endpoint output
 * (e.g. polygon masks, boundary contours, classified obstructions) into the unified SuryaSathi RoofAnalysis model.
 *
 * FUTURE AWS ARCHITECTURE:
 * 1. User uploads terrace photo to Amazon S3 bucket via presigned upload URL:
 *    s3://suryasathi-terrace-images-prod/uploads/{userId}/{imageId}.jpg
 * 2. AWS Lambda invokes Amazon SageMaker real-time inference endpoint running
 *    a lightweight segmentation model (e.g. YOLOv8-seg or Segment Anything Model fine-tuned for rooftops):
 *    - Detects rooftop boundary polygons
 *    - Identifies parapet walls, water tanks, staircases, and shadow regions
 *    - Computes unshaded contiguous polygonal area in square meters
 * 3. This normalization function maps the raw CV inference JSON to clean RoofAnalysis.
 */
export function normalizeSageMakerResponse(rawOutput: any): RoofAnalysis {
  if (!rawOutput) {
    throw new Error('Empty SageMaker inference response payload');
  }

  const rawArea = Number(rawOutput.usableAreaSqM || rawOutput.segmented_area_m2 || 35.0);
  const usableAreaSqM = Math.max(0, Math.round(rawArea * 10) / 10);
  const usableAreaSqFt = Math.round(usableAreaSqM * 10.764);

  // Panel sizing derived from centralized solarAssumptions:
  const estimatedPanelCount = Math.floor(usableAreaSqM / DEFAULT_SOLAR_ASSUMPTIONS.panelAreaSqM);
  const estimatedCapacityKw = Math.max(
    0,
    Math.round(((estimatedPanelCount * DEFAULT_SOLAR_ASSUMPTIONS.panelEfficiencyWatts) / 1000) * 10) / 10
  );

  // Practical suitability classification based on physical thresholds:
  let suitability: RoofSuitability = 'Suitable';
  let explanation = rawOutput.explanation || 'AI-assisted rooftop suitability estimate.';

  if (usableAreaSqM < DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM) {
    suitability = 'Not Suitable';
    explanation = `Available unshaded terrace area (${usableAreaSqM} m²) is below the minimum ~${DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM} m² required for standard 1 kW residential solar installation.`;
  } else if (usableAreaSqM < 20.0 || rawOutput.obstruction_level === 'high') {
    suitability = 'Partially Suitable';
    explanation = `Terrace supports approximately ${estimatedCapacityKw} kW. Moderate shadow obstructions detected; microinverters or tilt structures recommended.`;
  } else {
    suitability = 'Suitable';
    explanation = `Spacious terrace with approximately ${usableAreaSqFt} sq.ft of shadow-free area detected, suitable for up to ${estimatedCapacityKw} kW.`;
  }

  const factors: RoofFactors = {
    estimatedUsableArea: `${usableAreaSqM} m² (${usableAreaSqFt} sq.ft)`,
    obstructions: rawOutput.obstructions || (usableAreaSqM < 15 ? 'Moderate' : 'None/Minimal'),
    shading: rawOutput.shading || (usableAreaSqM < 15 ? 'Moderate' : 'Minimal (Favorable)'),
    orientation: rawOutput.orientation || 'Favorable (South/South-West)',
  };

  const confidence = typeof rawOutput.confidence === 'number'
    ? Math.min(1.0, Math.max(0.0, rawOutput.confidence))
    : 0.90;

  return {
    suitability,
    usableAreaSqM,
    usableAreaSqFt,
    estimatedPanelCount,
    estimatedCapacityKw,
    confidence,
    factors,
    explanation,
    source: 'ai_assisted_estimate',
    roofType: rawOutput.roofType || 'RCC Flat Concrete',
    shadingAssessment: factors.shading,
    orientation: factors.orientation,
    isUserConfirmed: false,
  };
}

/**
 * SageMakerRoofAnalysisAdapter
 *
 * Prepared future adapter for Amazon SageMaker / AWS Rekognition.
 * When an AWS SageMaker endpoint is provisioned, this adapter replaces MockRoofAnalysisAdapter
 * with ZERO changes to UI components or the solar calculation engine.
 */
export class SageMakerRoofAnalysisAdapter implements IRoofAnalysisService {
  private endpointName: string;
  private awsRegion: string;

  constructor(endpointName = 'suryasathi-roof-segmentation-v1', awsRegion = 'ap-south-1') {
    this.endpointName = endpointName;
    this.awsRegion = awsRegion;
  }

  async analyzeRoof(
    image: File | { name: string; size: number; type: string }
  ): Promise<RoofAnalysis> {
    // In production:
    // 1. Upload image to S3:
    //    await uploadToS3(presignedUrl, image);
    // 2. Invoke SageMaker endpoint:
    //    const response = await fetch('/api/sagemaker/segment', { method: 'POST', body: JSON.stringify({ s3Uri }) });
    //    const rawOutput = await response.json();
    // 3. Return normalized RoofAnalysis:
    //    return normalizeSageMakerResponse(rawOutput);

    throw new Error(
      'SageMakerRoofAnalysisAdapter is prepared for AWS cloud deployment. ' +
      'Please use MockRoofAnalysisAdapter for hackathon demonstration or configure AWS SageMaker credentials.'
    );
  }
}
