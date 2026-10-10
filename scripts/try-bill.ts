/**
 * Try the real Gemini bill extraction on a local file, without starting the app.
 *   npx tsx scripts/try-bill.ts "C:\path\to\bill.jpg"
 * Needs GEMINI_API_KEY in .env. With BILL_OCR=textract it reads the text with Amazon Textract first
 * (needs AWS credentials); the notes in the output say which engine was really used.
 * Prints the BillData (consumer number is masked).
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { extractBill } from '../server/ai/billPipeline.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npx tsx scripts/try-bill.ts <path-to-bill.jpg|png|pdf>');
  process.exit(1);
}
const ext = path.extname(file).toLowerCase();
const mime = ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

const bill = await extractBill({
  fileName: path.basename(file),
  fileType: mime,
  base64: fs.readFileSync(file).toString('base64'),
});
console.log(JSON.stringify(bill, null, 2));
