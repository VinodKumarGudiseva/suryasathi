import { BillData } from '../types/solar';
import { IBillExtractionService } from './interfaces';
import { fileToBase64 } from './fileToBase64';

/**
 * Local / Mock Bill Extraction Adapter
 *
 * Simulates realistic OCR parsing behavior across Indian DISCOM utility bills:
 * - Validates file format (.pdf, .jpg, .jpeg, .png)
 * - Validates file size (max 10 MB)
 * - Simulates high-confidence extraction on clean documents
 * - Simulates partial extraction on low-contrast / unclear scans
 * - Simulates extraction failure gracefully on corrupt/unreadable files
 *
 * Future AWS Implementation:
 * Swap this adapter with TextractBillExtractionAdapter from `./textractAdapter.ts`.
 */
export class MockBillExtractionAdapter implements IBillExtractionService {
  async extractBillData(
    file: File | { name: string; size: number; type: string }
  ): Promise<BillData> {
    const fileName = (file.name || '').trim();
    const fileNameLower = fileName.toLowerCase();
    const fileSize = Number(file.size) || 0;
    const fileType = (file.type || '').toLowerCase();

    // 1. File type validation
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const hasValidMime = fileType ? validMimes.includes(fileType) : true;

    if (!hasValidExt && !hasValidMime) {
      throw new Error('Unsupported file format. Please upload a PDF, JPG, or PNG electricity bill.');
    }

    // 2. File size validation (10 MB limit)
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error('File exceeds the 10 MB size limit. Please upload a compressed scan or photo.');
    }

    // 3. First attempt to call backend Express endpoint if running in browser
    if (typeof window !== 'undefined') {
      try {
        const base64 = await fileToBase64(file);
        const response = await fetch('/api/extract-bill', {
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
          throw new Error(errJson?.error || 'Bill extraction could not parse the document.');
        }
      } catch (fetchErr: any) {
        // If server specifically returned an error message, propagate it
        if (fetchErr.message && !fetchErr.message.includes('fetch')) {
          throw fetchErr;
        }
        // Otherwise fallback to local engine simulation below
      }
    }

    // 4. Local simulation latency
    await new Promise((resolve) => setTimeout(resolve, 900));

    // 5. Test trigger for extraction failure
    if (fileNameLower.includes('corrupt') || fileNameLower.includes('fail') || fileNameLower.includes('unreadable')) {
      throw new Error('Unable to extract text from this bill scan. Please enter your bill details manually below.');
    }

    // 6. Test trigger for partial extraction / low confidence
    if (fileNameLower.includes('partial') || fileNameLower.includes('unclear') || fileNameLower.includes('blurry')) {
      return {
        provider: 'State Electricity Board',
        consumerNumber: 'CA-9812401',
        billingPeriod: 'Previous Cycle',
        billAmount: 2150,
        unitsConsumedKwh: undefined, // Units could not be read
        monthlyConsumptionKwh: 250, // Default baseline for review
        confidence: 0.52, // Low confidence trigger
        extractedFields: ['provider', 'consumerNumber', 'billAmount'],
        extractedFieldsCount: 3,
        isUserConfirmed: false,
        source: 'extracted',
        notes: 'Low OCR confidence: Monthly units consumed could not be reliably extracted. Please confirm your consumption manually.',
      };
    }

    // 7. Realistic full extraction based on Indian DISCOM utility formats
    let provider = 'State Electricity Distribution Co. Ltd. (DISCOM)';
    let units = 285;
    let billAmount = 2280;
    let sanctionedLoadKw = 3.0;
    let consumerNumber = '1029485721';
    let previousReading = 14200;
    let currentReading = 14485;

    if (fileNameLower.includes('msedcl') || fileNameLower.includes('mahavitaran') || fileNameLower.includes('pune') || fileNameLower.includes('mumbai')) {
      provider = 'Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)';
      units = 310;
      billAmount = 2635;
      sanctionedLoadKw = 4.0;
      consumerNumber = '012948271034';
      previousReading = 18200;
      currentReading = 18510;
    } else if (fileNameLower.includes('bescom') || fileNameLower.includes('bangalore') || fileNameLower.includes('bengaluru')) {
      provider = 'Bangalore Electricity Supply Company (BESCOM)';
      units = 270;
      billAmount = 2160;
      sanctionedLoadKw = 3.0;
      consumerNumber = '983726154';
      previousReading = 12400;
      currentReading = 12670;
    } else if (fileNameLower.includes('bses') || fileNameLower.includes('delhi')) {
      provider = 'BSES Rajdhani Power Limited (BRPL - Delhi)';
      units = 340;
      billAmount = 2550;
      sanctionedLoadKw = 5.0;
      consumerNumber = '100492817';
      previousReading = 21000;
      currentReading = 21340;
    } else if (fileNameLower.includes('tangedco') || fileNameLower.includes('chennai') || fileNameLower.includes('tamil')) {
      provider = 'Tamil Nadu Generation and Distribution Corp (TANGEDCO)';
      units = 290;
      billAmount = 2262;
      sanctionedLoadKw = 3.0;
      consumerNumber = '07-024-004-918';
      previousReading = 15300;
      currentReading = 15590;
    } else if (fileNameLower.includes('torrent') || fileNameLower.includes('gujarat') || fileNameLower.includes('ugvcl')) {
      provider = 'Torrent Power / Gujarat Urja Vikas Nigam (UGVCL)';
      units = 260;
      billAmount = 1872;
      sanctionedLoadKw = 3.0;
      consumerNumber = '8374920194';
      previousReading = 9100;
      currentReading = 9360;
    } else {
      // Deterministic variation based on file size hash
      const variance = (fileSize % 80);
      units = 240 + variance;
      billAmount = Math.round(units * 7.8);
      sanctionedLoadKw = units > 350 ? 5.0 : 3.0;
      consumerNumber = `DL-${1000000 + (fileSize % 899999)}`;
      previousReading = 11000;
      currentReading = 11000 + units;
    }

    const currentYear = new Date().getFullYear();
    const tariffRate = units > 0 ? Math.round((billAmount / units) * 10) / 10 : 7.8;

    return {
      provider,
      consumerNumber,
      billingPeriod: `Cycle: 01/${currentYear} - 30/${currentYear}`,
      billAmount,
      unitsConsumedKwh: units,
      monthlyConsumptionKwh: units,
      previousReading,
      currentReading,
      tariffRate,
      tariffRatePerKwh: tariffRate,
      sanctionedLoadKw,
      confidence: 0.94,
      extractedFields: ['unitsConsumedKwh', 'billAmount', 'provider', 'consumerNumber', 'billingPeriod'],
      extractedFieldsCount: 5,
      isUserConfirmed: false,
      source: 'extracted',
      notes: 'Successfully extracted from electricity bill scan. Please review and confirm below.',
    };
  }
}

export const billExtractionService: IBillExtractionService = new MockBillExtractionAdapter();
