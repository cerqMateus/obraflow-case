import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkContract } from './contract-check.mjs';

const original = JSON.parse(readFileSync(new URL('../docs/openapi.json', import.meta.url), 'utf8'));
test('validates the planned document and every inline example', async () => {
  const result = await checkContract(original);
  assert.equal(result.operations, 21);
  assert.ok(result.examples > 50);
});
test('rejects duplicate operation IDs', async () => {
  const document = structuredClone(original);
  document.paths['/auth/login'].post.operationId = document.paths['/auth/csrf'].get.operationId;
  await assert.rejects(checkContract(document), /duplicate operationId/);
});
test('rejects unresolved references', async () => {
  const document = structuredClone(original);
  document.paths['/auth/login'].post.requestBody.content['application/json'].schema = { $ref: '#/components/schemas/Missing' };
  await assert.rejects(checkContract(document));
});
test('rejects invalid request and response examples', async () => {
  for (const request of [true, false]) {
    const document = structuredClone(original);
    const operation = document.paths['/auth/login'].post;
    const media = request ? operation.requestBody.content['application/json'] :
      operation.responses['200'].content['application/json'];
    media.example = { unexpected: true };
    await assert.rejects(checkContract(document), /example/);
  }
});
