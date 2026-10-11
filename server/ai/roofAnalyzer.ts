import { RoofAnalysis, RoofFactors, RoofSuitability } from '../../src/types/solar.js';
import { DEFAULT_SOLAR_ASSUMPTIONS } from '../../src/config/solarAssumptions.js';
import { AiServiceError } from './config.js';
import { geminiJsonFromFile } from './gemini.js';
import type { ModelCall } from './billExtractor.js';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const SQM_TO_SQFT = 10.764;

/** A photo cannot prove the area. Confidence is capped so the UI never presents it as certain. */
const MAX_CONFIDENCE = 0.6;
const MAX_CONFIDENCE_NO_SCALE = 0.45;

export const ROOF_PROMPT = `You are assessing a rooftop / terrace photo for rooftop solar panels on an Indian home.

Return ONLY one JSON object with exactly these keys:
{
  "isRoofPhoto": boolean,                 // false if this is not a photo of a rooftop, terrace or roof
  "roofType": "RCC Flat Concrete" | "Sloped Metal Sheet" | "Clay Tile" | "Open Terrace" | null,
  "usableAreaSqM": number | null,         // shadow-free, obstruction-free area where panels could be placed
  "scaleReference": string | null,        // what in the photo you used to judge size (e.g. "water tank about 1 m wide", "staircase door", "parapet wall"); null if nothing gives scale
  "obstructions": "None/Minimal" | "Moderate" | "Potentially Limiting",   // water tanks, stair rooms, antennas, clutter
  "shading": "Minimal (Favorable)" | "Moderate" | "Potentially Limiting", // trees, taller buildings, parapets
  "orientation": "south" | "east_west" | "north" | "unknown",             // only if sun/shadow cues make it clear, else "unknown"
  "confidence": number,                   // 0 to 1
  "notes": string                         // short plain-language summary of what you see and any doubts
}

Rules:
- Estimating real area from one photo is hard. If no object gives scale, set scaleReference to null and give a CONSERVATIVE (smaller) usableAreaSqM.
- Do not count areas under shadow, water tanks, stair rooms or other obstructions.
- If you cannot estimate the area at all, use null. Never invent a number just to fill the field.
- Do not describe people, faces, house numbers or any identifying details.`;

type RawRoof = Record<string, unknown>;

const ROOF_TYPES = ['RCC Flat Concrete', 'Sloped Metal Sheet', 'Clay Tile', 'Open Terrace'] as const;
const OBSTRUCTIONS = ['None/Minimal', 'Moderate', 'Potentially Limiting'] as const;
const SHADINGS = ['Minimal (Favorable)', 'Moderate', 'Potentially Limiting'] as const;

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' ? allowed.find((a) => a.toLowerCase() === value.trim().toLowerCase()) : undefined;
}

function toPositive(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value.replace(/[,\s]|m²|sqm/gi, '')) : value;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t && t.toLowerCase() !== 'null' ? t : undefined;
}

/** Suitability is decided here in code, from numbers, not taken from the model. */
export function decideSuitability(
  areaSqM: number,
  obstructions: RoofFactors['obstructions'],
  shading: RoofFactors['shading']
): RoofSuitability {
  const perKw = DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM;
  if (areaSqM < perKw) return 'Not Suitable';
  const limiting = obstructions === 'Potentially Limiting' || shading === 'Potentially Limiting';
  const bothModerate = obstructions === 'Moderate' && shading === 'Moderate';
  if (areaSqM < perKw * 2 || limiting || bothModerate) return 'Partially Suitable';
  return 'Suitable';
}

/**
 * Pure function: raw model JSON -> RoofAnalysis. No network, unit-testable.
 *
 * Contract notes for the UI:
 *  - source is always 'ai_assisted_estimate' and isUserConfirmed is false: the user must confirm/edit the area.
 *  - If the model cannot estimate area, this throws a 422 so the UI falls back to manual area entry.
 *  - Orientation cannot be read reliably from a photo. When unknown, factors.orientation is the neutral
 *    'Moderate (East/West)' (required by the type) and the top-level orientation says it was not determined.
 */
export function normalizeRoofAnalysis(raw: RawRoof): RoofAnalysis {
  if (raw.isRoofPhoto === false) {
    throw new AiServiceError('This does not look like a rooftop photo. Please upload a clear photo of your terrace or roof.', 422);
  }

  const area = toPositive(raw.usableAreaSqM);
  if (area === undefined) {
    throw new AiServiceError('Could not estimate the usable roof area from this photo. Please enter your terrace area manually.', 422);
  }
  const usableAreaSqM = Math.round(area * 10) / 10;

  const notes: string[] = [];
  const modelNotes = text(raw.notes);
  if (modelNotes) notes.push(modelNotes);

  const obstructions = pick(raw.obstructions, OBSTRUCTIONS) ?? 'Moderate';
  const shading = pick(raw.shading, SHADINGS) ?? 'Moderate';
  const roofType = pick(raw.roofType, ROOF_TYPES);

  const orientationRaw = typeof raw.orientation === 'string' ? raw.orientation.trim().toLowerCase() : 'unknown';
  let orientation: RoofFactors['orientation'] = 'Moderate (East/West)';
  let orientationText: string = 'Not determined from photo';
  if (orientationRaw === 'south') {
    orientation = 'Favorable (South/South-West)';
    orientationText = orientation;
  } else if (orientationRaw === 'north') {
    orientation = 'Potentially Limiting (North)';
    orientationText = orientation;
  } else if (orientationRaw === 'east_west') {
    orientationText = orientation;
  }

  let confidence = Math.min(toPositive(raw.confidence) ?? 0.4, MAX_CONFIDENCE);
  if (!text(raw.scaleReference)) {
    confidence = Math.min(confidence, MAX_CONFIDENCE_NO_SCALE);
    notes.push('Nothing in the photo gave a clear sense of size, so the area is a conservative guess.');
  }
  if (usableAreaSqM > 300) {
    confidence = Math.min(confidence, 0.3);
    notes.push('The estimated area is unusually large for a home. Please check it.');
  }
  confidence = Math.round(confidence * 100) / 100;

  const suitability = decideSuitability(usableAreaSqM, obstructions, shading);

  // Same capacity formula as solarCalculationService (area / areaRequiredPerKw, rounded down to 0.1 kW).
  const perKw = DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM;
  const estimatedCapacityKw = Math.max(0, Math.floor((usableAreaSqM / perKw) * 10) / 10);
  const estimatedPanelCount = Math.round((estimatedCapacityKw * 1000) / DEFAULT_SOLAR_ASSUMPTIONS.panelEfficiencyWatts);
  const usableAreaSqFt = Math.round(usableAreaSqM * SQM_TO_SQFT);

  const explanation =
    `AI-assisted estimate from one photo: about ${usableAreaSqM} m² (~${usableAreaSqFt} sq.ft) looks usable. ` +
    `This is a rough guess, please confirm or correct the area. ` +
    notes.join(' ');

  return {
    suitability,
    usableAreaSqM,
    usableAreaSqFt,
    estimatedPanelCount,
    estimatedCapacityKw,
    confidence,
    factors: {
      estimatedUsableArea: `${usableAreaSqM} m² (~${usableAreaSqFt} sq.ft)`,
      obstructions,
      shading,
      orientation,
    },
    explanation: explanation.trim(),
    source: 'ai_assisted_estimate',
    roofType,
    shadingAssessment: shading,
    orientation: orientationText,
    isUserConfirmed: false,
  };
}

export interface RoofFileInput {
  fileName?: string;
  fileType?: string;
  base64: string;
}

/** Validates the upload, asks the model, normalizes the answer. `callModel` is injectable for tests. */
export async function analyzeRoofFromFile(
  input: RoofFileInput,
  callModel: ModelCall = geminiJsonFromFile
): Promise<RoofAnalysis> {
  const mimeType = (input.fileType || '').toLowerCase();
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw new AiServiceError('Unsupported file format. Please upload a JPG or PNG rooftop photograph.', 400);
  }

  const base64 = input.base64.includes(',') ? input.base64.split(',').pop()! : input.base64;
  if (!base64) throw new AiServiceError('Uploaded image is empty.', 400);

  if (Math.floor((base64.length * 3) / 4) > MAX_FILE_BYTES) {
    throw new AiServiceError('Image exceeds the 10 MB limit. Please upload a smaller photo.', 400);
  }

  const raw = await callModel({ prompt: ROOF_PROMPT, mimeType, base64 });
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AiServiceError('Could not analyze this photo. Please enter your terrace area manually.', 422);
  }
  return normalizeRoofAnalysis(raw as RawRoof);
}
