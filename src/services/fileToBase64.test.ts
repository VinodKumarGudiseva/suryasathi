import assert from 'node:assert/strict';
import { fileToBase64 } from './fileToBase64';

const file = new File([new Uint8Array([72, 101, 108, 108, 111])], 'a.png', { type: 'image/png' });
assert.equal(await fileToBase64(file), 'SGVsbG8=');
assert.equal(await fileToBase64({ name: 'x.png', size: 3, type: 'image/png' }), undefined);
const big = new File([new Uint8Array(300_000).fill(65)], 'big.png', { type: 'image/png' });
const out = await fileToBase64(big);
assert.equal(Buffer.from(out!, 'base64').length, 300_000);
console.log('3 checks passed');
