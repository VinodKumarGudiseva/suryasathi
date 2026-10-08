import { BillData } from '../types/solar';
import { IBillExtractionService } from './interfaces';

/**
 * Normalization function that transforms raw AWS Textract AnalyzeDocument / Expense response
 * key-value pairs and query results into the unified SuryaSathi BillData model.
 *
 * FUTURE AWS ARCHITECTURE:
 * 1. User uploads bill file to Amazon S3 bucket via presigned URL:
 *    s3://suryasathi-bills-bucket/uploads/{userId}/{fileId}.pdf
 * 2. AWS Lambda invokes Amazon Textract AnalyzeDocumentCommand with QUERIES & FORMS feature types:
 *    - Query 1: "What is the total units consumed or kWh?"
 *    - Query 2: "What is the total amount due or bill amount?"
 *    - Query 3: "What is the electricity distribution company or provider?"
 *    - Query 4: "What is the consumer account number?"
 * 3. Textract returns Block responses with Confidence scores.
 * 4. This normalization function maps the extracted blocks to clean BillData.
 */
export function normalizeTextractResponse(rawTextractOutput: any): BillData {
  if (!rawTextractOutput) {
    throw new Error('Empty Textract response payload');
  }

  // Example mappings from Textract key-value pairs / query results:
  const extractedUnits = Number(
    rawTextractOutput.queries?.['UNITS_CONSUMED'] ||
    rawTextractOutput.keyValues?.['Total Units'] ||
    rawTextractOutput.keyValues?.['Units (kWh)'] ||
    rawTextractOutput.unitsConsumedKwh ||
    0
  );

  const extractedAmount = Number(
    rawTextractOutput.queries?.['BILL_AMOUNT'] ||
    rawTextractOutput.keyValues?.['Total Amount Due'] ||
    rawTextractOutput.keyValues?.['Net Amount Payable'] ||
    rawTextractOutput.billAmount ||
    0
  );

  const provider = String(
    rawTextractOutput.queries?.['PROVIDER'] ||
    rawTextractOutput.keyValues?.['DISCOM Name'] ||
    rawTextractOutput.provider ||
    'State Electricity Distribution Company'
  );

  const consumerNumber = String(
    rawTextractOutput.queries?.['CONSUMER_NO'] ||
    rawTextractOutput.keyValues?.['Consumer No'] ||
    rawTextractOutput.consumerNumber ||
    ''
  );

  const billingPeriod = String(
    rawTextractOutput.keyValues?.['Billing Period'] ||
    rawTextractOutput.billingPeriod ||
    'Last 30 Days'
  );

  const confidence = typeof rawTextractOutput.confidence === 'number'
    ? rawTextractOutput.confidence
    : (rawTextractOutput.averageQueryConfidence ? rawTextractOutput.averageQueryConfidence / 100 : 0.92);

  const extractedFields: string[] = [];
  if (extractedUnits > 0) extractedFields.push('unitsConsumedKwh');
  if (extractedAmount > 0) extractedFields.push('billAmount');
  if (provider) extractedFields.push('provider');
  if (consumerNumber) extractedFields.push('consumerNumber');
  if (billingPeriod) extractedFields.push('billingPeriod');

  const tariffRate = (extractedUnits > 0 && extractedAmount > 0)
    ? Math.round((extractedAmount / extractedUnits) * 10) / 10
    : 7.5;

  return {
    provider,
    consumerNumber: consumerNumber || undefined,
    billingPeriod,
    billAmount: extractedAmount > 0 ? extractedAmount : undefined,
    unitsConsumedKwh: extractedUnits > 0 ? extractedUnits : undefined,
    monthlyConsumptionKwh: extractedUnits > 0 ? extractedUnits : 250,
    tariffRate,
    tariffRatePerKwh: tariffRate,
    confidence: Math.min(1.0, Math.max(0.0, confidence)),
    extractedFields,
    extractedFieldsCount: extractedFields.length,
    isUserConfirmed: false,
    source: 'extracted',
    notes: 'Normalized from AWS Textract OCR extraction.',
  };
}

/**
 * TextractBillExtractionAdapter
 *
 * Prepared future adapter for AWS Textract.
 * When AWS credentials and S3 buckets are configured, this adapter will replace
 * MockBillExtractionAdapter with ZERO changes to UI components or the solar engine.
 */
export class TextractBillExtractionAdapter implements IBillExtractionService {
  private s3BucketName: string;
  private awsRegion: string;

  constructor(s3BucketName = 'suryasathi-bills-prod', awsRegion = 'ap-south-1') {
    this.s3BucketName = s3BucketName;
    this.awsRegion = awsRegion;
  }

  async extractBillData(
    file: File | { name: string; size: number; type: string }
  ): Promise<BillData> {
    // NOTE: This is the production AWS contract.
    // In production:
    // 1. Upload to S3:
    //    const s3Upload = await fetch(presignedUrl, { method: 'PUT', body: file });
    // 2. Call Textract via Lambda / API Gateway:
    //    const response = await fetch('/api/textract/analyze', { method: 'POST', body: JSON.stringify({ s3Key }) });
    //    const rawOutput = await response.json();
    // 3. Return normalized BillData:
    //    return normalizeTextractResponse(rawOutput);

    throw new Error(
      'TextractBillExtractionAdapter is configured for AWS deployment. ' +
      'Please use MockBillExtractionAdapter for hackathon demonstration or configure AWS Textract credentials.'
    );
  }
}
