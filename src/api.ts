import { parseProfile, Profile } from './profile';

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
let lastProfile: Profile | null = null;

export class LookupError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export function cachedProfile(login: string): Profile | null {
  return lastProfile?.login.toLowerCase() === login.toLowerCase() ? lastProfile : null;
}

export async function lookup(login: string): Promise<Profile> {
  const value = login.trim().toLowerCase();
  if (!value) throw new LookupError('INVALID_LOGIN', 'Enter a student login to search.');
  if (!/^[a-z0-9_-]{1,32}$/.test(value)) throw new LookupError('INVALID_LOGIN', 'Use a valid 42 login with letters, numbers, hyphens or underscores.');
  if (!baseUrl) throw new LookupError('CONFIG_ERROR', 'Set EXPO_PUBLIC_API_BASE_URL in .env and restart Expo.');
  let response: Response;
  try { response = await fetch(`${baseUrl}/api/users/${encodeURIComponent(value)}`, { signal: AbortSignal.timeout(12000) }); }
  catch { throw new LookupError('NETWORK_ERROR', 'Cannot reach the local backend. Check that it is running and the API URL is correct.'); }
  let body: unknown;
  try { body = await response.json(); } catch { throw new LookupError('MALFORMED_DATA', 'The backend returned invalid data.'); }
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'error' in body ? (body as { error?: { code?: string; message?: string } }).error : undefined;
    throw new LookupError(error?.code || 'API_ERROR', error?.message || 'The lookup failed. Please try again.');
  }
  try { lastProfile = parseProfile(body); return lastProfile; }
  catch { throw new LookupError('MALFORMED_DATA', 'The profile data is incomplete.'); }
}
