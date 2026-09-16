import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { startHealthServer } from '../src/healthServer.js';

test('endpoint /health zwraca bezpieczny status usługi', async (context) => {
  const client = { isReady: () => true };
  const server = startHealthServer(client, { port: 0, host: '127.0.0.1', logger: () => {} });
  context.after(() => server.close());

  await once(server, 'listening');
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.service, 'EMUPLCOOM Bot');
  assert.equal(body.status, 'online');
  assert.equal(Object.hasOwn(body, 'token'), false);
});

test('nieznany endpoint zwraca 404', async (context) => {
  const client = { isReady: () => false };
  const server = startHealthServer(client, { port: 0, host: '127.0.0.1', logger: () => {} });
  context.after(() => server.close());

  await once(server, 'listening');
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/sekret`);

  assert.equal(response.status, 404);
});
