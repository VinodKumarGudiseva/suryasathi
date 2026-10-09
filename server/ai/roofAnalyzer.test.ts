import assert from 'node:assert/strict';
import { analyzeRoofFromFile, decideSuitability, normalizeRoofAnalysis } from './roofAnalyzer.js';
import { AiServiceError } from './config.js';

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}`);
    throw err;
  }
}

const good = {
  isRoofPhoto: true, roofType: 'RCC Flat Concrete', usableAreaSqM: 30, scaleReference: 'water tank about 1 m wide',
  obstructions: 'None/Minimal', shading: 'Minimal (Favorable)', orientation: 'south', confidence: 0.9, notes: 'Open terrace.',
};

await test('good roof: Suitable, capacity matches calculation formula, confidence capped at 0.6', () => {
  const r = normalizeRoofAnalysis(good);
  assert.equal(r.suitability, 'Suitable');
  assert.equal(r.usableAreaSqM, 30);
  assert.equal(r.estimatedCapacityKw, 3.2); // floor(30 / 9.29 * 10) / 10
  assert.equal(r.confidence, 0.6);
  assert.equal(r.source, 'ai_assisted_estimate');
  assert.equal(r.isUserConfirmed, false);
  assert.equal(r.factors.orientation, 'Favorable (South/South-West)');
});

await test('no scale reference lowers confidence and adds a note', () => {
  const r = normalizeRoofAnalysis({ ...good, scaleReference: null });
  assert.ok(r.confidence <= 0.45);
  assert.match(r.explanation, /conservative guess/);
});

await test('unknown orientation is NOT presented as a real finding', () => {
  const r = normalizeRoofAnalysis({ ...good, orientation: 'unknown' });
  assert.equal(r.orientation, 'Not determined from photo');
  assert.equal(r.factors.orientation, 'Moderate (East/West)');
});

await test('suitability rules: small, limited and large roofs', () => {
  assert.equal(decideSuitability(6, 'None/Minimal', 'Minimal (Favorable)'), 'Not Suitable');
  assert.equal(decideSuitability(15, 'None/Minimal', 'Minimal (Favorable)'), 'Partially Suitable');
  assert.equal(decideSuitability(40, 'Potentially Limiting', 'Minimal (Favorable)'), 'Partially Suitable');
  assert.equal(decideSuitability(40, 'Moderate', 'Moderate'), 'Partially Suitable');
  assert.equal(decideSuitability(40, 'None/Minimal', 'Minimal (Favorable)'), 'Suitable');
});

await test('model cannot overrule the rules: it says Suitable-looking data on a tiny roof -> Not Suitable', () => {
  const r = normalizeRoofAnalysis({ ...good, usableAreaSqM: 5, suitability: 'Suitable' });
  assert.equal(r.suitability, 'Not Suitable');
  assert.equal(r.estimatedCapacityKw, 0.5); // below the 1 kW minimum, so Not Suitable
});

await test('not a roof photo -> 422', () => {
  assert.throws(() => normalizeRoofAnalysis({ isRoofPhoto: false }), (e: any) => e instanceof AiServiceError && e.status === 422);
});

await test('area missing / zero / negative -> 422 (manual entry), no invented area', () => {
  for (const v of [null, 0, -4, 'abc', undefined]) {
    assert.throws(() => normalizeRoofAnalysis({ ...good, usableAreaSqM: v }), (e: any) => e.status === 422);
  }
});

await test('absurdly large area gets very low confidence', () => {
  const r = normalizeRoofAnalysis({ ...good, usableAreaSqM: 900 });
  assert.ok(r.confidence <= 0.3);
});

await test('unknown enum values fall back to cautious defaults, not crashes', () => {
  const r = normalizeRoofAnalysis({ ...good, obstructions: 'weird', shading: 7, roofType: 'glass' });
  assert.equal(r.factors.obstructions, 'Moderate');
  assert.equal(r.factors.shading, 'Moderate');
  assert.equal(r.roofType, undefined);
});

await test('orchestrator rejects pdf / oversize before calling the model', async () => {
  let called = false;
  const spy = async () => { called = true; return good; };
  await assert.rejects(() => analyzeRoofFromFile({ fileType: 'application/pdf', base64: 'AAAA' }, spy), /Unsupported/);
  await assert.rejects(() => analyzeRoofFromFile({ fileType: 'image/jpeg', base64: 'A'.repeat(15 * 1024 * 1024) }, spy), /10 MB/);
  assert.equal(called, false);
});

await test('orchestrator handles data-URL and returns RoofAnalysis', async () => {
  let seen = '';
  const r = await analyzeRoofFromFile({ fileType: 'image/png', base64: 'data:image/png;base64,QUJD' }, async (o) => { seen = o.base64; return good; });
  assert.equal(seen, 'QUJD');
  assert.equal(r.suitability, 'Suitable');
});

console.log(`\n${passed} tests passed`);
