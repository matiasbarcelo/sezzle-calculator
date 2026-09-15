import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculate, CalculatorApiError } from './api.js';

function mockFetch(status, body) {
  const fetchMock = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('no body');
      return body;
    },
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('calculate', () => {
  it('POSTs both operands as JSON and returns the API response', async () => {
    const response = { operation: 'add', a: 2, b: 3, result: 5 };
    const fetchMock = mockFetch(200, response);

    await expect(calculate('add', 2, 3)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: 2, b: 3 }),
    });
  });

  it('sends only a for single-operand operations', async () => {
    const fetchMock = mockFetch(200, { operation: 'sqrt', a: 9, result: 3 });
    await calculate('sqrt', 9);
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ a: 9 }));
  });

  it('throws the API error message with its status', async () => {
    mockFetch(422, { error: 'division by zero' });
    const err = await calculate('divide', 1, 0).catch((e) => e);
    expect(err).toBeInstanceOf(CalculatorApiError);
    expect(err).toMatchObject({ message: 'division by zero', status: 422 });
  });

  it('falls back to the status code when the error body is not JSON', async () => {
    mockFetch(502);
    await expect(calculate('add', 1, 2)).rejects.toThrow('API error 502');
  });

  it('rejects a success response without a numeric result', async () => {
    mockFetch(200, { operation: 'add' });
    await expect(calculate('add', 1, 2)).rejects.toThrow('missing a numeric result');
  });

  it('reports when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const err = await calculate('add', 1, 2).catch((e) => e);
    expect(err).toMatchObject({ message: 'cannot reach the calculator API', status: null });
  });
});
