/**
 * Try the real Gemini roof analysis on a local photo, without starting the app.
 *   npx tsx scripts/try-roof.ts "C:\path\to\roof.jpg"
 * Needs GEMINI_API_KEY in .env.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeRoofFromFile } from '../server/ai/roofAnalyzer.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npx tsx scripts/try-roof.ts <path-to-roof.jpg|png>');
  process.exit(1);
}
const mime = path.extname(file).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

const roof = await analyzeRoofFromFile({
  fileName: path.basename(file),
  fileType: mime,
  base64: fs.readFileSync(file).toString('base64'),
});
console.log(JSON.stringify(roof, null, 2));
