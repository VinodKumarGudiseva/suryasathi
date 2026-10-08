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
