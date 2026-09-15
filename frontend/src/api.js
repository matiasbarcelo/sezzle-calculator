// Client for the Go calculator API (see backend/README.md).
// In dev, Vite proxies /api to the backend; in Docker, nginx does.
// Static hosting (GitHub Pages) sets VITE_API_URL to the hosted API,
// e.g. https://api.example.com/api/v1, at build time.
const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');

export class CalculatorApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'CalculatorApiError';
    this.status = status; // null when the API couldn't be reached
  }
}

/**
 * POST /api/v1/{operation} and return the API's response unchanged:
 *   { operation, a, b?, result }
 * Throws CalculatorApiError with the API's { error } message on failure.
 */
export async function calculate(operation, a, b) {
  const body = b === undefined ? { a } : { a, b };

  let response;
  try {
    response = await fetch(`${API_BASE}/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CalculatorApiError('cannot reach the calculator API');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CalculatorApiError(data?.error ?? `API error ${response.status}`, response.status);
  }
  if (typeof data?.result !== 'number') {
    throw new CalculatorApiError('API response is missing a numeric result', response.status);
  }
  return data;
}
