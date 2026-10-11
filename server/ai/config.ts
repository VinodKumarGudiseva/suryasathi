/**
 * AI provider switch.
 *
 *   AI_PROVIDER=mock    -> existing local mock behaviour (default, nothing changes)
 *   AI_PROVIDER=gemini  -> real extraction/analysis through Gemini (local dev)
 *   AI_PROVIDER=aws     -> Textract / Bedrock adapters (added once the AWS account is verified)
 *
 * IMPORTANT: always read env lazily (inside functions). server.ts calls dotenv.config()
 * after its imports are evaluated, so reading process.env at module load would see nothing.
 */
export type AiProvider = 'mock' | 'gemini' | 'aws';

export function getAiProvider(): AiProvider {
  const value = (process.env.AI_PROVIDER || 'mock').trim().toLowerCase();
  if (value === 'gemini' || value === 'aws') return value;
  return 'mock';
}

export function getGeminiModel(): string {
  // Override with GEMINI_MODEL in .env if this model name is not available for your key.
  return (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
}

/** Error that carries the HTTP status the API route should answer with. */
export class AiServiceError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'AiServiceError';
    this.status = status;
  }
}

/**
 * Service switches that are independent of AI_PROVIDER (Bedrock is not needed for these).
 *   BILL_OCR=textract    -> read the bill text with Amazon Textract, then structure it with Gemini
 *   PLAN_STORAGE=dynamodb -> save plans in Amazon DynamoDB through /api/plans
 */
export type BillOcr = 'gemini' | 'textract';
export type PlanStorage = 'local' | 'dynamodb';

export function getBillOcr(): BillOcr {
  return (process.env.BILL_OCR || '').trim().toLowerCase() === 'textract' ? 'textract' : 'gemini';
}

export function getPlanStorage(): PlanStorage {
  return (process.env.PLAN_STORAGE || '').trim().toLowerCase() === 'dynamodb' ? 'dynamodb' : 'local';
}

export function getAwsRegion(): string {
  return (process.env.AWS_REGION || 'ap-south-1').trim();
}
