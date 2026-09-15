import { normalizeProviderPayload, normalizeChanges } from './normalizers.js';

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

export const getNextToGo = () => puntersEdgeRequest('/v1/racing/next-to-go');
export const getEvents = () => puntersEdgeRequest('/v1/racing/events');
export const getResults = () => puntersEdgeRequest('/v1/racing/results');
export const getAcceptances = () => puntersEdgeRequest('/v1/racing/acceptances');
export const getChanges = () => puntersEdgeRequest('/v1/racing/changes');

export async function getNormalizedNextToGo() {
  return normalizeProviderPayload(await getNextToGo());
}

export async function getNormalizedEvents() {
  return normalizeProviderPayload(await getEvents());
}

export async function getNormalizedAcceptances() {
  return normalizeProviderPayload(await getAcceptances());
}

export async function getNormalizedChanges() {
  return normalizeChanges(await getChanges());
}
