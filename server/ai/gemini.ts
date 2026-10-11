import { GoogleGenAI } from '@google/genai';
import { AiServiceError, getGeminiModel } from './config.js';

function getClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new AiServiceError('GEMINI_API_KEY is not set in .env (AI_PROVIDER=gemini needs it).', 500);
  }
  return new GoogleGenAI({ apiKey });
}

export interface JsonFromFileOptions {
  prompt: string;
  mimeType: string;
  base64: string;
}

/**
 * Sends one file (image or PDF) plus an instruction to Gemini and parses the JSON reply.
 * Output shape is enforced in our own code (see billExtractor.ts), not trusted from the model.
 */
export async function geminiJsonFromFile(opts: JsonFromFileOptions): Promise<unknown> {
  const client = getClient();
  let text: string | undefined;
  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: opts.mimeType, data: opts.base64 } }, { text: opts.prompt }],
        },
      ],
      config: { responseMimeType: 'application/json', temperature: 0 },
    });
    text = response.text;
  } catch (err: any) {
    // Never log the file or the key. Message only.
    throw new AiServiceError(`Gemini request failed: ${err?.message || 'unknown error'}`, 502);
  }

  if (!text) throw new AiServiceError('Gemini returned an empty response.', 502);

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AiServiceError('Gemini returned a response that was not valid JSON.', 502);
  }
}

/** Text-only variant, used when Textract has already read the document. */
export async function geminiJsonFromText(opts: { prompt: string }): Promise<unknown> {
  const client = getClient();
  let text: string | undefined;
  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
      config: { responseMimeType: 'application/json', temperature: 0 },
    });
    text = response.text;
  } catch (err: any) {
    throw new AiServiceError(`Gemini request failed: ${err?.message || 'unknown error'}`, 502);
  }
  if (!text) throw new AiServiceError('Gemini returned an empty response.', 502);
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AiServiceError('Gemini returned a response that was not valid JSON.', 502);
  }
}
