require('dotenv').config();
const http = require('node:http');
const { ApiError, createFortyTwoClient } = require('./fortytwo');

const clientId = process.env.FORTYTWO_CLIENT_ID;
const clientSecret = process.env.FORTYTWO_CLIENT_SECRET;
if (!clientId || !clientSecret || clientId.startsWith('replace_') || clientSecret.startsWith('replace_')) {
  console.error('Set FORTYTWO_CLIENT_ID and FORTYTWO_CLIENT_SECRET in .env before starting the backend.');
  process.exit(1);
}
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const client = createFortyTwoClient({ clientId, clientSecret });

http.createServer(async (request, response) => {
  const send = (status, body, headers = {}) => {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
    response.end(JSON.stringify(body));
  };
  const url = new URL(request.url || '/', 'http://localhost');
  if (request.method === 'GET' && url.pathname === '/health') return send(200, { ok: true });
  const match = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (request.method !== 'GET' || !match) return send(404, { error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  try {
    let login;
    try { login = decodeURIComponent(match[1]); } catch { throw new ApiError(400, 'INVALID_LOGIN', 'Enter a valid 42 login.'); }
    const user = await client.getUser(login);
    return send(200, user);
  } catch (error) {
    const safe = error instanceof ApiError ? error : new ApiError(502, 'API_ERROR', 'The request could not be completed.');
    return send(safe.status, { error: { code: safe.code, message: safe.message, retryAfter: safe.retryAfter } }, safe.retryAfter ? { 'Retry-After': String(safe.retryAfter) } : {});
  }
}).listen(port, host, () => console.log(`42 proxy listening on ${host}:${port}`));
