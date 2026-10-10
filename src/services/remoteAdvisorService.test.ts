import assert from 'node:assert/strict';
import { RemoteSolarAdvisorAdapter } from './remoteAdvisorService';

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const realFetch = globalThis.fetch;
const stub = (ok: boolean, status: number, body: unknown) => {
  (globalThis as any).fetch = async (_url: string, init: any) => {
    (stub as any).last = init;
    return { ok, status, json: async () => body };
  };
};

await test('sends question, context and history to /api/advisor and returns the agent message', async () => {
  stub(true, 200, { success: true, data: { id: 'a1', sender: 'assistant', text: 'hello', timestamp: '2026-10-10T10:00:00.000Z' } });
  const r = await new RemoteSolarAdvisorAdapter().askSolarAdvisor('Am I eligible?', { recommendedSystemKw: 3 } as any, []);
  const sent = JSON.parse((stub as any).last.body);
  assert.equal(sent.question, 'Am I eligible?');
  assert.equal(sent.context.recommendedSystemKw, 3);
  assert.equal(r.text, 'hello');
  assert.doesNotMatch(r.timestamp, /T\d\d:\d\d:\d\d/); // short local time, not an ISO string
});

await test('backend failure throws (no silent fallback to the mock advisor)', async () => {
  stub(false, 502, { success: false, error: 'Advisor request failed: boom' });
  await assert.rejects(() => new RemoteSolarAdvisorAdapter().askSolarAdvisor('hi'), /boom/);
});

(globalThis as any).fetch = realFetch;
console.log(`\n${passed} tests passed`);
