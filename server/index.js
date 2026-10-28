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
  const photoMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/photo$/);
  if (request.method === 'GET' && photoMatch) {
    try {
      const user = await client.getUser(decodeURIComponent(photoMatch[1]));
      const versions = user.image?.versions || {};
      const candidates = [versions.large, versions.medium, versions.small, user.image?.link, user.image_url];
      for (const candidate of candidates) {
        if (typeof candidate !== 'string') continue;
        let imageUrl;
        try { imageUrl = new URL(candidate); } catch { continue; }
        if (imageUrl.protocol !== 'https:' || !imageUrl.hostname.endsWith('.intra.42.fr')) continue;
        try {
          const image = await client.getImage(imageUrl);
          if (!image) continue;
          response.writeHead(200, { 'Content-Type': image.contentType, 'Cache-Control': 'public, max-age=3600' });
          return response.end(image.data);
        } catch { /* try the next image size */ }
      }
      return send(404, { error: { code: 'PHOTO_NOT_FOUND', message: 'No profile photo is available.' } });
    } catch (error) {
      const safe = error instanceof ApiError ? error : new ApiError(502, 'API_ERROR', 'The profile photo could not be loaded.');
      return send(safe.status, { error: { code: safe.code, message: safe.message } });
    }
  }
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
