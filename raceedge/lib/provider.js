import { normalizeProviderPayload, normalizeChanges, normalizeResults } from './normalizers.js';

const defaultBaseURL = 'https://api.puntersedge.online';
const defaultTimeoutMs = 10000;

export function providerConfigured() { return Boolean(process.env.PUNTERSEDGE_API_KEY); }

export function providerTimeoutMs() {
  const configured = Number(process.env.PUNTERSEDGE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1000 && configured <= 30000 ? configured : defaultTimeoutMs;
}

export async function puntersEdgeRequest(path) {
  const key = process.env.PUNTERSEDGE_API_KEY;
  if (!key) {
    const error = new Error('PuntersEdge API key is not configured');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  const baseURL = (process.env.PUNTERSEDGE_BASE_URL || defaultBaseURL).replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), providerTimeoutMs());

  try {
    const response = await fetch(`${baseURL}${path}`, {
      headers: { 'X-API-Key': key, Accept: 'application/json' },
      signal: controller.signal
    });
    const body = await response.text();

    if (!response.ok) {
      const error = new Error(`PuntersEdge returned HTTP ${response.status}`);
      error.status = response.status;
      error.code = 'PROVIDER_HTTP_ERROR';
      // Keep a short provider validation detail for server-side diagnostics only.
      // Never include request headers, credentials, or the full upstream payload.
      if (body) {
        try {
          const detail = JSON.parse(body);
          error.providerDetail = detail?.detail ?? detail?.message ?? detail?.error ?? null;
        } catch {
          error.providerDetail = body.slice(0, 300);
        }
      }
      throw error;
    }

    if (!body) return null;
    try {
      return JSON.parse(body);
    } catch {
      const error = new Error('PuntersEdge returned invalid JSON');
      error.code = 'PROVIDER_INVALID_JSON';
      throw error;
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('PuntersEdge request timed out');
      timeoutError.code = 'PROVIDER_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const getNextToGo = () => puntersEdgeRequest('/v1/racing/next-to-go?num_races=200');
export const getEvents = () => puntersEdgeRequest('/v1/racing/events?hours_ahead=24');
export const getResults = () => puntersEdgeRequest('/v1/racing/results');
export const getAcceptances = () => puntersEdgeRequest('/v1/racing/acceptances');
let changesCursor = null;
function freshChangesCursor() { return new Date(Date.now() - 5 * 60 * 1000).toISOString(); }
export async function getChanges() {
  const since = changesCursor || freshChangesCursor();
  const payload = await puntersEdgeRequest(`/v1/racing/changes?since=${encodeURIComponent(since)}`);
  if (payload?.server_time) changesCursor = payload.server_time;
  return payload;
}
export async function getNormalizedNextToGo() { return normalizeProviderPayload(await getNextToGo()); }
export async function getNormalizedEvents() { return normalizeProviderPayload(await getEvents()); }
export async function getNormalizedAcceptances() { return normalizeProviderPayload(await getAcceptances()); }
export async function getNormalizedChanges() { return normalizeChanges(await getChanges()); }
export async function getNormalizedResults() { return normalizeResults(await getResults()); }
