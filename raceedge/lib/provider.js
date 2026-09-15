import { normalizeProviderPayload } from './normalizers.js';

const defaultBaseURL = 'https://api.puntersedge.online';

export function providerConfigured() {
  return Boolean(process.env.PUNTERSEDGE_API_KEY);
}

export async function puntersEdgeRequest(path) {
  const key = process.env.PUNTERSEDGE_API_KEY;
  if (!key) {
    const error = new Error('PuntersEdge API key is not configured');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  const baseURL = (process.env.PUNTERSEDGE_BASE_URL || defaultBaseURL).replace(/\/$/, '');
  const response = await fetch(`${baseURL}${path}`, {
    headers: { 'X-API-Key': key, Accept: 'application/json' }
  });
  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`PuntersEdge returned HTTP ${response.status}`);
    error.status = response.status;
    error.providerBody = body.slice(0, 500);
    throw error;
  }
  return body ? JSON.parse(body) : null;
}

export async function getNextToGo() {
  return puntersEdgeRequest('/v1/racing/next-to-go');
}

export async function getNormalizedNextToGo() {
  const payload = await getNextToGo();
  return normalizeProviderPayload(payload);
}
