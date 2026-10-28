const API_ROOT = 'https://api.intra.42.fr';

class ApiError extends Error {
  constructor(status, code, message, retryAfter) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function createFortyTwoClient({ clientId, clientSecret, fetchImpl = fetch, now = Date.now }) {
  let token;
  let expiresAt = 0;
  let tokenPromise;

  async function obtainToken(force = false) {
    if (!force && token && now() < expiresAt - 60_000) return token;
    if (tokenPromise) return tokenPromise;
    tokenPromise = (async () => {
      let response;
      try {
        response = await fetchImpl(`${API_ROOT}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        throw new ApiError(502, 'NETWORK_ERROR', 'Could not contact 42 authentication.');
      }
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        throw new ApiError(502, 'AUTH_ERROR', '42 rejected the application credentials. Check the UID and secret in .env.');
      }
      if (response.status === 429) {
        const raw = Number(response.headers.get('retry-after'));
        throw new ApiError(429, 'RATE_LIMITED', '42 authentication is rate limited. Please try again shortly.', Number.isFinite(raw) && raw > 0 ? Math.min(raw, 3600) : 30);
      }
      if (!response.ok) throw new ApiError(502, 'AUTH_SERVICE_ERROR', `42 authentication is temporarily unavailable (HTTP ${response.status}).`);
      let data;
      try { data = await response.json(); } catch { throw new ApiError(502, 'MALFORMED_DATA', '42 authentication returned invalid data.'); }
      if (!data || typeof data.access_token !== 'string' || !Number.isFinite(Number(data.expires_in)) || Number(data.expires_in) <= 0) {
        throw new ApiError(502, 'MALFORMED_DATA', '42 authentication returned an incomplete token.');
      }
      token = data.access_token;
      expiresAt = now() + Number(data.expires_in) * 1000;
      return token;
    })();
    try { return await tokenPromise; } finally { tokenPromise = undefined; }
  }

  async function getUser(login) {
    if (typeof login !== 'string' || !/^[a-zA-Z0-9_-]{1,32}$/.test(login.trim())) {
      throw new ApiError(400, 'INVALID_LOGIN', 'Enter a valid 42 login.');
    }
    const normalized = login.trim().toLowerCase();
    let accessToken = await obtainToken();
    for (let attempt = 0; attempt < 2; attempt++) {
      let response;
      try {
        response = await fetchImpl(`${API_ROOT}/v2/users/${encodeURIComponent(normalized)}`, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        throw new ApiError(502, 'NETWORK_ERROR', 'Could not reach the 42 API.');
      }
      if (response.status === 401 && attempt === 0) {
        token = undefined;
        accessToken = await obtainToken(true);
        continue;
      }
      if (response.status === 404) throw new ApiError(404, 'NOT_FOUND', 'No student was found for that login.');
      if (response.status === 401 || response.status === 403) throw new ApiError(502, 'AUTH_ERROR', '42 denied this application access.');
      if (response.status === 429) {
        const raw = Number(response.headers.get('retry-after'));
        throw new ApiError(429, 'RATE_LIMITED', '42 is receiving too many requests. Please try again shortly.', Number.isFinite(raw) && raw > 0 ? Math.min(raw, 3600) : 30);
      }
      if (!response.ok) throw new ApiError(502, 'API_ERROR', 'The 42 API could not complete the request.');
      let data;
      try { data = await response.json(); } catch { throw new ApiError(502, 'MALFORMED_DATA', '42 returned invalid profile data.'); }
      if (!data || typeof data !== 'object' || typeof data.login !== 'string' || !Array.isArray(data.cursus_users) || !Array.isArray(data.projects_users)) {
        throw new ApiError(502, 'MALFORMED_DATA', '42 returned an incomplete profile.');
      }
      return data;
    }
    throw new ApiError(502, 'AUTH_ERROR', '42 authentication could not be refreshed.');
  }

  async function getImage(imageUrl) {
    let accessToken = await obtainToken();
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetchImpl(imageUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 401 && attempt === 0) {
        token = undefined;
        accessToken = await obtainToken(true);
        continue;
      }
      if (!response.ok || !(response.headers.get('content-type') || '').startsWith('image/')) return null;
      return { contentType: response.headers.get('content-type'), data: Buffer.from(await response.arrayBuffer()) };
    }
    return null;
  }

  return { getUser, getImage };
}

module.exports = { ApiError, createFortyTwoClient };
