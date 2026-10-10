import { BillData } from '../../src/types/solar.js';
import { AiServiceError } from './config.js';
import { geminiJsonFromFile } from './gemini.js';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export const BILL_PROMPT = `You are reading an Indian residential electricity bill (image or PDF).
It may be in English, Hindi or a regional language, and may use non-Latin digits. Convert all numbers to normal digits.

Return ONLY one JSON object with exactly these keys:
{
  "isElectricityBill": boolean,        // false if this is not an electricity bill at all
  "provider": string | null,           // DISCOM / utility name, e.g. "DVVNL", "BSES Rajdhani"
  "consumerNumber": string | null,     // account / consumer number as printed
  "billingPeriod": string | null,      // as printed, e.g. "01/09/2026 - 30/09/2026"
  "billingMonths": number | null,      // months this bill covers: 1 normally, 2 if bi-monthly
  "unitsConsumedKwh": number | null,   // units (kWh) billed for THIS cycle only
  "previousReading": number | null,
  "currentReading": number | null,
  "billAmount": number | null,         // total payable for THIS cycle in INR (exclude old arrears if shown separately)
  "sanctionedLoadKw": number | null,   // sanctioned / contracted load in kW
  "confidence": number,                // 0 to 1: how sure you are that the values above are read correctly
  "notes": string                      // anything unclear, blurry, cropped or ambiguous
}

Rules:
- NEVER guess or estimate. If a value is not clearly visible, use null.
- Do not copy units from a previous-months history table; use the current cycle only.
- Do not include the consumer's name or address anywhere.`;

type RawBill = Record<string, unknown>;

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

function toPositiveNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : undefined;
  if (typeof value === 'string') {
    const ascii = value.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
    const cleaned = ascii.replace(/[₹,\s]|rs\.?|inr/gi, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function toText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.toLowerCase() !== 'null' ? trimmed : undefined;
}

/** Keeps only the last 4 characters of an account number so the full number is never stored. */
export function maskConsumerNumber(value?: string): string | undefined {
  if (!value) return undefined;
  const compact = value.replace(/\s+/g, '');
  if (compact.length <= 4) return compact;
  return `${'X'.repeat(compact.length - 4)}${compact.slice(-4)}`;
}

/**
 * Pure function: turns the raw model JSON into a BillData. No network, fully unit-testable.
 *
 * Contract note: when monthly units cannot be read, monthlyConsumptionKwh is 0 and
 * unitsConsumedKwh is undefined. We do NOT invent a default, so the UI must ask the user to
 * enter the number manually before any plan is generated.
 */
export function normalizeBillExtraction(raw: RawBill): BillData {
  if (raw.isElectricityBill === false) {
    throw new AiServiceError(
      'This does not look like an electricity bill. Please upload a clear photo or PDF of your bill.',
      422
    );
  }

  const notes: string[] = [];
  const modelNotes = toText(raw.notes);
  if (modelNotes) notes.push(modelNotes);

  const months = (() => {
    const m = toPositiveNumber(raw.billingMonths);
    return m && m >= 1 && m <= 3 ? Math.round(m) : 1;
  })();

  let cycleUnits = toPositiveNumber(raw.unitsConsumedKwh);
  const previous = toPositiveNumber(raw.previousReading);
  const current = toPositiveNumber(raw.currentReading);
  let derivedFromReadings = false;

  if (cycleUnits === undefined && previous !== undefined && current !== undefined && current > previous) {
    cycleUnits = Math.round((current - previous) * 100) / 100;
    derivedFromReadings = true;
    notes.push('Units were calculated from meter readings (current minus previous).');
  }

  const monthlyUnits = cycleUnits !== undefined ? Math.round(cycleUnits / months) : undefined;
  if (months > 1 && monthlyUnits !== undefined) {
    notes.push(`Bill covers ${months} months; units were divided to get a monthly figure.`);
  }

  const billAmountCycle = toPositiveNumber(raw.billAmount);
  const monthlyAmount = billAmountCycle !== undefined ? Math.round(billAmountCycle / months) : undefined;

  const tariff =
    monthlyUnits && monthlyAmount ? Math.round((monthlyAmount / monthlyUnits) * 10) / 10 : undefined;

  // Confidence: start from the model's own estimate, then apply hard rules.
  let confidence = toPositiveNumber(raw.confidence) ?? 0.5;
  confidence = Math.min(1, confidence);
  if (monthlyUnits === undefined) confidence = Math.min(confidence, 0.4);
  if (monthlyAmount === undefined) confidence = Math.max(0, confidence - 0.1);
  if (derivedFromReadings) confidence = Math.min(confidence, 0.8);
  if (monthlyUnits !== undefined && (monthlyUnits < 20 || monthlyUnits > 5000)) {
    confidence = Math.min(confidence, 0.5);
    notes.push('Monthly units look unusual for a home connection. Please double-check.');
  }
  if (tariff !== undefined && (tariff < 2 || tariff > 25)) {
    confidence = Math.min(confidence, 0.6);
    notes.push(`Implied rate of about Rs ${tariff}/unit looks unusual. Please check units and amount.`);
  }
  if (monthlyUnits === undefined) {
    notes.push('Monthly units could not be read from this bill. Please enter them manually.');
  }
  confidence = Math.round(confidence * 100) / 100;

  const provider = toText(raw.provider);
  const consumerNumber = maskConsumerNumber(toText(raw.consumerNumber));
  const billingPeriod = toText(raw.billingPeriod);
  const sanctionedLoadKw = toPositiveNumber(raw.sanctionedLoadKw);

  const extractedFields: string[] = [];
  if (monthlyUnits !== undefined) extractedFields.push('unitsConsumedKwh');
  if (monthlyAmount !== undefined) extractedFields.push('billAmount');
  if (provider) extractedFields.push('provider');
  if (consumerNumber) extractedFields.push('consumerNumber');
  if (billingPeriod) extractedFields.push('billingPeriod');
  if (sanctionedLoadKw !== undefined) extractedFields.push('sanctionedLoadKw');

  return {
    provider,
    consumerNumber,
    billingPeriod,
    billAmount: monthlyAmount,
    unitsConsumedKwh: monthlyUnits,
    monthlyConsumptionKwh: monthlyUnits ?? 0,
    previousReading: previous,
    currentReading: current,
    tariffRate: tariff,
    tariffRatePerKwh: tariff,
    sanctionedLoadKw,
    confidence,
    extractedFields,
    extractedFieldsCount: extractedFields.length,
    isUserConfirmed: false,
    source: 'extracted',
    notes: notes.join(' ') || 'Extracted by AI from the uploaded bill. Please review and confirm.',
  };
}

export interface BillFileInput {
  fileName?: string;
  fileType?: string;
  base64: string;
}

export type ModelCall = (opts: { prompt: string; mimeType: string; base64: string }) => Promise<unknown>;

/** Validates an upload and returns clean base64 + mime type. Shared by every bill pipeline. */
export function decodeBillUpload(input: BillFileInput): { mimeType: string; base64: string } {
  const mimeType = (input.fileType || '').toLowerCase();
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw new AiServiceError('Unsupported file format. Please upload a PDF, JPG, or PNG electricity bill.', 400);
  }

  // Accept both raw base64 and data-URL form.
  const base64 = input.base64.includes(',') ? input.base64.split(',').pop()! : input.base64;
  if (!base64) throw new AiServiceError('Uploaded file is empty.', 400);

  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_FILE_BYTES) {
    throw new AiServiceError('File exceeds the 10 MB limit. Please upload a smaller scan or photo.', 400);
  }
  return { mimeType, base64 };
}

/** Validates the upload, asks the model, and normalizes the answer. `callModel` is injectable for tests. */
export async function extractBillFromFile(
  input: BillFileInput,
  callModel: ModelCall = geminiJsonFromFile
): Promise<BillData> {
  const { mimeType, base64 } = decodeBillUpload(input);

  const raw = await callModel({ prompt: BILL_PROMPT, mimeType, base64 });
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AiServiceError('Could not read this bill. Please enter the details manually.', 422);
  }
  return normalizeBillExtraction(raw as RawBill);
}
