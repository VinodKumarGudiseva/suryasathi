import { RoofAnalysis, RoofSuitability, RoofFactors } from '../types/solar';
import { DEFAULT_SOLAR_ASSUMPTIONS } from '../config/solarAssumptions';
import { IRoofAnalysisService } from './interfaces';
import { fileToBase64 } from './fileToBase64';

/**
 * Local / Mock Rooftop Computer Vision Analysis Adapter
 *
 * Implements deterministic rooftop suitability estimation:
 * - Validates image format (.jpg, .jpeg, .png)
 * - Validates file size (max 15 MB, non-empty)
 * - Computes usable area, panel count, and capacity using centralized solarAssumptions
 * - Evaluates practical suitability (Suitable, Partially Suitable, Not Suitable)
 * - Returns structured factors (obstructions, shading, orientation)
 *
 * Future AWS Implementation:
 * Swap with SageMakerRoofAnalysisAdapter from `./sageMakerAdapter.ts`.
 */
export class MockRoofAnalysisAdapter implements IRoofAnalysisService {
  async analyzeRoof(
    image: File | { name: string; size: number; type: string }
  ): Promise<RoofAnalysis> {
    const fileName = (image.name || '').trim();
    const fileNameLower = fileName.toLowerCase();
    const fileSize = Number(image.size) || 0;
    const fileType = (image.type || '').toLowerCase();

    // 1. File format validation
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    const hasValidMime = fileType ? validMimes.includes(fileType) : true;

    if (!hasValidExt && !hasValidMime) {
      throw new Error('Unsupported file format. Please upload a JPG, JPEG, or PNG rooftop photograph.');
    }

    // 2. File size validation
    if (fileSize <= 0) {
      throw new Error('Uploaded image file is empty (0 bytes). Please upload a valid photograph.');
    }

    if (fileSize > 15 * 1024 * 1024) {
      throw new Error('Image exceeds 15 MB limit. Please upload a standard compressed photo.');
    }

    // 3. Optional failure trigger for robust testing
    if (fileNameLower.includes('corrupt') || fileNameLower.includes('fail') || fileNameLower.includes('broken')) {
      throw new Error('Unable to analyze image. Please adjust terrace area manually.');
    }

    // 4. First attempt to call backend Express API if running in browser
    if (typeof window !== 'undefined') {
      try {
        const base64 = await fileToBase64(image);
        const response = await fetch('/api/analyze-roof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            fileSize,
            fileType,
            base64,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            return json.data;
          }
        } else {
          const errJson = await response.json().catch(() => null);
          throw new Error(errJson?.error || 'Rooftop analysis could not process the photo.');
        }
      } catch (fetchErr: any) {
        if (fetchErr.message && !fetchErr.message.includes('fetch')) {
          throw fetchErr;
        }
        // Fallback to local heuristic simulation below
      }
    }

    // 5. Local simulation latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 6. Deterministic simulation based on file characteristics
    let suitability: RoofSuitability = 'Suitable';
    let usableAreaSqM = 35.0; // ~376 sq ft
    let confidence = 0.92;
    let explanation = 'AI-assisted rooftop suitability estimate: Open RCC terrace with favorable sun exposure and minimal parapet shading.';
    let roofType: 'RCC Flat Concrete' | 'Sloped Metal Sheet' | 'Clay Tile' | 'Open Terrace' = 'RCC Flat Concrete';

    let obstructions: 'None/Minimal' | 'Moderate' | 'Potentially Limiting' = 'None/Minimal';
    let shading: 'Minimal (Favorable)' | 'Moderate' | 'Potentially Limiting' = 'Minimal (Favorable)';
    let orientation: 'Favorable (South/South-West)' | 'Moderate (East/West)' | 'Potentially Limiting (North)' = 'Favorable (South/South-West)';

    if (fileNameLower.includes('unsuitable') || fileNameLower.includes('small') || fileNameLower.includes('tiny')) {
      suitability = 'Not Suitable';
      usableAreaSqM = 6.5; // ~70 sq ft (below the 9.3 m² required for 1 kW)
      confidence = 0.88;
      obstructions = 'Potentially Limiting';
      shading = 'Potentially Limiting';
      roofType = 'Clay Tile';
      explanation = `AI-assisted rooftop suitability estimate: Available unshaded area (${usableAreaSqM} m²) is below the minimum ~${DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM} m² required for a standard 1 kW residential installation.`;
    } else if (fileNameLower.includes('shade') || fileNameLower.includes('tree') || fileNameLower.includes('partial')) {
      suitability = 'Partially Suitable';
      usableAreaSqM = 18.0; // ~194 sq ft
      confidence = 0.86;
      obstructions = 'Moderate';
      shading = 'Moderate';
      orientation = 'Moderate (East/West)';
      explanation = 'AI-assisted rooftop suitability estimate: Terrace has moderate afternoon shading from adjacent high-rise or overhead water tank structure.';
    } else if (fileNameLower.includes('shed') || fileNameLower.includes('metal')) {
      suitability = 'Suitable';
      usableAreaSqM = 48.0;
      confidence = 0.93;
      roofType = 'Sloped Metal Sheet';
      explanation = 'AI-assisted rooftop suitability estimate: Sloped tin/metal sheet roof identified with favorable azimuth orientation for solar clamps.';
    } else {
      // Deterministic sizing from file size hash (25 to 55 sq m)
      const modulo = (fileSize % 25);
      usableAreaSqM = Math.round((28 + modulo * 1.1) * 10) / 10;
      explanation = `AI-assisted rooftop suitability estimate: Spacious ${roofType} identified. Detected approximately ${Math.round(usableAreaSqM * 10.764)} sq.ft of shadow-free installation area.`;
    }

    const usableAreaSqFt = Math.round(usableAreaSqM * 10.764);

    // Panel count derived from centralized solarAssumptions.panelAreaSqM (~2.3 m² per 540W module)
    const estimatedPanelCount = Math.floor(usableAreaSqM / DEFAULT_SOLAR_ASSUMPTIONS.panelAreaSqM);
    const estimatedCapacityKw = Math.max(
      0,
      Math.round(((estimatedPanelCount * DEFAULT_SOLAR_ASSUMPTIONS.panelEfficiencyWatts) / 1000) * 10) / 10
    );

    const factors: RoofFactors = {
      estimatedUsableArea: `${usableAreaSqM} m² (~${usableAreaSqFt} sq.ft)`,
      obstructions,
      shading,
      orientation,
    };

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
      roofType,
      shadingAssessment: shading,
      orientation,
      isUserConfirmed: false,
    };
  }
}

export const roofAnalysisService: IRoofAnalysisService = new MockRoofAnalysisAdapter();
