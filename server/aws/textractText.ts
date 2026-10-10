import { DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { getTextractClient } from './clients.js';

const MAX_TEXT_CHARS = 12_000;
const MIN_USEFUL_CHARS = 40;

export type TextractSend = (command: DetectDocumentTextCommand) => Promise<{ Blocks?: Array<{ BlockType?: string; Text?: string }> }>;

export interface OcrResult {
  text: string | null;
  /** Error class name only (never the message, which may echo document details). */
  errorName?: string;
}

/**
 * Reads the text of a bill with Amazon Textract (DetectDocumentText, synchronous).
 * Works on JPG/PNG and single-page PDF. Multi-page PDFs are rejected by Textract; the caller falls back.
 * The file bytes are sent to Textract only for this call. Nothing is stored in S3.
 */
export async function ocrBillText(
  base64: string,
  send: TextractSend = (cmd) => getTextractClient().send(cmd) as any
): Promise<OcrResult> {
  try {
    const response = await send(new DetectDocumentTextCommand({ Document: { Bytes: Buffer.from(base64, 'base64') } }));
    const lines = (response.Blocks || [])
      .filter((b) => b.BlockType === 'LINE' && typeof b.Text === 'string' && b.Text.trim())
      .map((b) => b.Text!.trim());
    const text = lines.join('\n').slice(0, MAX_TEXT_CHARS);
    return text.length >= MIN_USEFUL_CHARS ? { text } : { text: null, errorName: 'TooLittleText' };
  } catch (err: any) {
    return { text: null, errorName: String(err?.name || 'TextractError') };
  }
}
