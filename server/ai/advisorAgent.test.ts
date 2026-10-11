import assert from 'node:assert/strict';
import { Model } from '@strands-agents/sdk';
import { askAdvisorAgent, buildSystemPrompt, findUngroundedAmounts, stripMarkdown, toSeedMessages } from './advisorAgent.js';
import { AiServiceError } from './config.js';
import type { AdvisorMessage } from '../../src/types/solar.js';

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

/** A scripted stand-in for a real model: optionally calls the KB tool first, then answers. */
class FakeModel extends Model<any> {
  calls: Array<{ systemPrompt: unknown; messages: any[] }> = [];
  constructor(private answer: string, private useTool: boolean) { super(); }
  updateConfig() {}
  getConfig() { return { modelId: 'fake' }; }
  async *stream(messages: any[], options?: any): AsyncIterable<any> {
    this.calls.push({ systemPrompt: options?.systemPrompt, messages });
    const lastIsToolResult = JSON.stringify(messages[messages.length - 1]).includes('toolResult');
    yield { type: 'modelMessageStartEvent', role: 'assistant' };
    if (this.useTool && !lastIsToolResult) {
      yield { type: 'modelContentBlockStartEvent', start: { type: 'toolUseStart', name: 'search_scheme_knowledge', toolUseId: 't1' } };
      yield { type: 'modelContentBlockDeltaEvent', delta: { type: 'toolUseInputDelta', input: '{"query":"subsidy for 3 kW"}' } };
      yield { type: 'modelContentBlockStopEvent' };
      yield { type: 'modelMessageStopEvent', stopReason: 'toolUse' };
      return;
    }
    yield { type: 'modelContentBlockStartEvent' };
    yield { type: 'modelContentBlockDeltaEvent', delta: { type: 'textDelta', text: this.answer } };
    yield { type: 'modelContentBlockStopEvent' };
    yield { type: 'modelMessageStopEvent', stopReason: 'endTurn' };
  }
}

const ctx = { state: 'Uttar Pradesh', city: 'Mathura', recommendedSystemKw: 3, estimatedSubsidy: 78000, netInvestment: 102000 };

await test('agent calls the KB tool, returns sources, answer grounded in plan numbers', async () => {
  const model = new FakeModel('Your 3 kW system gets a subsidy of ₹78,000 and a net cost of ₹1,02,000.', true);
  const r = await askAdvisorAgent('How much subsidy will I get?', ctx, [], { model });
  assert.equal(r.sender, 'assistant');
  assert.match(r.text, /₹78,000/);
  assert.ok((r.sources || []).length > 0, 'sources come from the tool call');
  assert.equal(r.confidence, 0.85);
  assert.doesNotMatch(r.text, /could not verify/);
});

await test('plan numbers reach the model through the system prompt; missing ones say Unavailable', async () => {
  const model = new FakeModel('ok', false);
  await askAdvisorAgent('hello', ctx, [], { model });
  const sp = JSON.stringify(model.calls[0].systemPrompt);
  assert.match(sp, /Recommended system: 3 kW/);
  assert.match(sp, /Estimated subsidy: ₹78000/);
  assert.match(sp, /Payback: Unavailable/);
});

await test('invented rupee amount is flagged and confidence drops', async () => {
  const model = new FakeModel('Your subsidy is ₹99,999.', true);
  const r = await askAdvisorAgent('How much subsidy?', ctx, [], { model });
  assert.match(r.text, /could not verify ₹99,999/);
  assert.equal(r.confidence, 0.4);
});

await test('answer without using the knowledge tool gets lower confidence', async () => {
  const model = new FakeModel('Please finish the assessment first.', false);
  const r = await askAdvisorAgent('hi', ctx, [], { model });
  assert.equal(r.confidence, 0.6);
  assert.deepEqual(r.sources, []);
});

await test('empty and over-long questions are rejected with 400', async () => {
  const model = new FakeModel('x', false);
  await assert.rejects(() => askAdvisorAgent('   ', ctx, [], { model }), (e: any) => e instanceof AiServiceError && e.status === 400);
  await assert.rejects(() => askAdvisorAgent('a'.repeat(1001), ctx, [], { model }), (e: any) => e.status === 400);
});

await test('history is trimmed, alternates roles, starts with user, never ends with user', () => {
  const h: AdvisorMessage[] = [
    { id: '0', sender: 'assistant', text: 'welcome', timestamp: '' },
    { id: '1', sender: 'user', text: 'q1', timestamp: '' },
    { id: '2', sender: 'assistant', text: 'a1', timestamp: '' },
    { id: '3', sender: 'user', text: 'q2', timestamp: '' },
  ];
  const seeded = toSeedMessages(h);
  assert.deepEqual(seeded.map((m) => m.role), ['user', 'assistant']);
});

await test('history reaches the model, and a long conversation is capped', async () => {
  const many: AdvisorMessage[] = [];
  for (let i = 0; i < 20; i++) many.push({ id: String(i), sender: i % 2 ? 'assistant' : 'user', text: `m${i}`, timestamp: '' });
  const seeded = toSeedMessages(many);
  assert.ok(seeded.length <= 6);
  assert.equal(seeded[0].role, 'user');
});

await test('findUngroundedAmounts: numbers with commas / Indian grouping match; unknown ones do not', () => {
  assert.deepEqual(findUngroundedAmounts('₹78,000 and ₹1,02,000', '{"a":78000,"b":102000}'), []);
  assert.deepEqual(findUngroundedAmounts('₹5,00,000 saved', '78000'), ['₹5,00,000']);
  assert.deepEqual(findUngroundedAmounts('25 years, 30 days, 3 kW', ''), []); // only rupee amounts are checked
});

await test('buildSystemPrompt contains the safety rules', () => {
  const p = buildSystemPrompt({});
  assert.match(p, /NEVER invent or change numbers/);
  assert.match(p, /search_scheme_knowledge/);
});

await test('stripMarkdown removes ** bold, # headings and * bullets but keeps numbered lists and amounts', () => {
  const out = stripMarkdown('## Eligibility\n1. **Residential consumer**: needs a home connection.\n* **Subsidy**: ₹78,000\n  * sub point');
  assert.doesNotMatch(out, /\*\*|##/);
  assert.match(out, /1\. Residential consumer: needs a home connection\./);
  assert.match(out, /- Subsidy: ₹78,000/);
  assert.match(out, /\s- sub point/);
});

await test('advisor answer reaches the chat without markdown asterisks', async () => {
  const model = new FakeModel('1. **Residential Domestic Consumer**: you need a home connection.', false);
  const r = await askAdvisorAgent('Am I eligible?', ctx, [], { model });
  assert.doesNotMatch(r.text, /\*\*/);
});

console.log(`\n${passed} tests passed`);
