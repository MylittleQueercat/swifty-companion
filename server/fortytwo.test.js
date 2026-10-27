const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFortyTwoClient } = require('./fortytwo');

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers });
const profile = { login: 'jdoe', cursus_users: [], projects_users: [] };

test('reuses one token across searches', async () => {
  let tokens = 0;
  const client = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', fetchImpl: async (url) => {
    if (url.endsWith('/oauth/token')) { tokens++; return json(200, { access_token: 'token', expires_in: 7200 }); }
    return json(200, profile);
  } });
  await client.getUser('jdoe');
  await client.getUser('another');
  assert.equal(tokens, 1);
});

test('refreshes an expired token', async () => {
  let time = 0, tokens = 0;
  const client = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', now: () => time, fetchImpl: async (url) => {
    if (url.endsWith('/oauth/token')) { tokens++; return json(200, { access_token: `token${tokens}`, expires_in: 120 }); }
    return json(200, profile);
  } });
  await client.getUser('jdoe');
  time = 61_000;
  await client.getUser('jdoe');
  assert.equal(tokens, 2);
});

test('retries once after 401 with a new token', async () => {
  let tokens = 0;
  const client = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', fetchImpl: async (url) => {
    if (url.endsWith('/oauth/token')) { tokens++; return json(200, { access_token: `token${tokens}`, expires_in: 7200 }); }
    return tokens === 1 ? json(401, {}) : json(200, profile);
  } });
  assert.equal((await client.getUser('jdoe')).login, 'jdoe');
  assert.equal(tokens, 2);
});

test('maps not found, rate limiting and malformed profiles', async () => {
  for (const [response, code] of [[json(404, {}), 'NOT_FOUND'], [json(429, {}, { 'retry-after': '4' }), 'RATE_LIMITED'], [json(200, { login: 'jdoe' }), 'MALFORMED_DATA']]) {
    const client = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', fetchImpl: async (url) => url.endsWith('/oauth/token') ? json(200, { access_token: 'token', expires_in: 7200 }) : response });
    await assert.rejects(client.getUser('jdoe'), { code });
  }
});

test('rejects invalid login without requesting a token', async () => {
  const client = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', fetchImpl: () => { throw Error('unexpected request'); } });
  await assert.rejects(client.getUser(''), { code: 'INVALID_LOGIN' });
  await assert.rejects(client.getUser('../me'), { code: 'INVALID_LOGIN' });
});

test('maps token auth failures and API network failures', async () => {
  const authClient = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', fetchImpl: async () => json(401, {}) });
  await assert.rejects(authClient.getUser('jdoe'), { code: 'AUTH_ERROR' });
  const networkClient = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', fetchImpl: async (url) => {
    if (url.endsWith('/oauth/token')) return json(200, { access_token: 'token', expires_in: 7200 });
    throw new Error('offline');
  } });
  await assert.rejects(networkClient.getUser('jdoe'), { code: 'NETWORK_ERROR' });
});

test('coalesces simultaneous token requests', async () => {
  let tokens = 0;
  const client = createFortyTwoClient({ clientId: 'id', clientSecret: 'secret', fetchImpl: async (url) => {
    if (url.endsWith('/oauth/token')) { tokens++; return json(200, { access_token: 'token', expires_in: 7200 }); }
    return json(200, profile);
  } });
  await Promise.all([client.getUser('jdoe'), client.getUser('another')]);
  assert.equal(tokens, 1);
});
