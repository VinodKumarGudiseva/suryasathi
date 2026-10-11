import assert from 'node:assert/strict';
import { extractBillFromFile, maskConsumerNumber, normalizeBillExtraction } from './billExtractor.js';
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

const clean = {
  isElectricityBill: true, provider: 'DVVNL', consumerNumber: '1234 5678 9012', billingPeriod: '01/09/2026 - 30/09/2026',
  billingMonths: 1, unitsConsumedKwh: 320, previousReading: 1000, currentReading: 1320, billAmount: 2240,
  sanctionedLoadKw: 3, confidence: 0.95, notes: '',
};

await test('clean bill is normalized, tariff computed, consumer number masked', () => {
  const b = normalizeBillExtraction(clean);
  assert.equal(b.monthlyConsumptionKwh, 320);
  assert.equal(b.billAmount, 2240);
  assert.equal(b.tariffRate, 7);
  assert.equal(b.consumerNumber, 'XXXXXXXX9012');
  assert.equal(b.confidence, 0.95);
  assert.equal(b.isUserConfirmed, false);
  assert.equal(b.source, 'extracted');
});

await test('missing units: NO invented default, low confidence', () => {
  const b = normalizeBillExtraction({ ...clean, unitsConsumedKwh: null, previousReading: null, currentReading: null });
  assert.equal(b.monthlyConsumptionKwh, 0);
  assert.equal(b.unitsConsumedKwh, undefined);
  assert.ok(b.confidence <= 0.4);
});

await test('units derived from meter readings when not printed', () => {
  const b = normalizeBillExtraction({ ...clean, unitsConsumedKwh: null });
  assert.equal(b.monthlyConsumptionKwh, 320);
  assert.ok(b.confidence <= 0.8);
  assert.match(b.notes || '', /meter readings/);
});

await test('bi-monthly bill is converted to monthly', () => {
  const b = normalizeBillExtraction({ ...clean, billingMonths: 2, unitsConsumedKwh: 640, billAmount: 4480 });
  assert.equal(b.monthlyConsumptionKwh, 320);
  assert.equal(b.billAmount, 2240);
});

await test('string numbers, commas, rupee sign, devanagari digits are parsed', () => {
  const b = normalizeBillExtraction({ ...clean, unitsConsumedKwh: '३२०', billAmount: '₹2,240.00' });
  assert.equal(b.monthlyConsumptionKwh, 320);
  assert.equal(b.billAmount, 2240);
});

await test('negative / zero / garbage values become undefined', () => {
  const b = normalizeBillExtraction({ ...clean, unitsConsumedKwh: -5, billAmount: 'abc', previousReading: null, currentReading: null });
  assert.equal(b.monthlyConsumptionKwh, 0);
  assert.equal(b.billAmount, undefined);
});

await test('absurd tariff lowers confidence', () => {
  const b = normalizeBillExtraction({ ...clean, billAmount: 90000 });
  assert.ok(b.confidence <= 0.6);
});

await test('non-bill document is rejected with 422', () => {
  try {
    normalizeBillExtraction({ isElectricityBill: false });
    assert.fail('should throw');
  } catch (e: any) {
    assert.ok(e instanceof AiServiceError);
    assert.equal(e.status, 422);
  }
});

await test('maskConsumerNumber keeps only last 4', () => {
  assert.equal(maskConsumerNumber('1029485721'), 'XXXXXX5721');
  assert.equal(maskConsumerNumber(undefined), undefined);
});

await test('orchestrator rejects bad mime type and oversize files before calling the model', async () => {
  let called = false;
  const spy = async () => { called = true; return clean; };
  await assert.rejects(() => extractBillFromFile({ fileType: 'text/plain', base64: 'AAAA' }, spy), /Unsupported/);
  const big = 'A'.repeat(15 * 1024 * 1024);
  await assert.rejects(() => extractBillFromFile({ fileType: 'application/pdf', base64: big }, spy), /10 MB/);
  assert.equal(called, false);
});

await test('orchestrator handles data-URL base64 and returns BillData', async () => {
  let seen = '';
  const b = await extractBillFromFile(
    { fileType: 'image/png', base64: 'data:image/png;base64,QUJD' },
    async (o) => { seen = o.base64; return clean; }
  );
  assert.equal(seen, 'QUJD');
  assert.equal(b.monthlyConsumptionKwh, 320);
});

await test('orchestrator turns non-object model output into a 422', async () => {
  await assert.rejects(() => extractBillFromFile({ fileType: 'image/png', base64: 'QUJD' }, async () => null), /manually/);
});

console.log(`\n${passed} tests passed`);
