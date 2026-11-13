import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { jsonRequest, serverUrl } from './http';
import type { Fetch } from './http';
const schema = z.object({ ok: z.boolean() });

describe('service transport', () => {
  it('normalizes server subpaths', () => {
    expect(serverUrl(' https://music.example.com/base/ ')).toBe(
      'https://music.example.com/base',
    );
  });
  it.each([
    'http://music.example.com',
    'https://user:password@example.com',
    'https://example.com?token=x',
    'https://example.com#x',
    'not a url',
  ])('rejects unsafe or ambiguous server addresses: %s', (value) => {
    expect(() => serverUrl(value)).toThrow();
  });
  it.each([401, 403, 500])(
    'reports HTTP %i without leaking response bodies or URLs',
    async (status) => {
      const fetcher = vi
        .fn<Fetch>()
        .mockResolvedValue(new Response('secret', { status }));
      await expect(
        jsonRequest(fetcher, 'https://example.com?token=secret', schema),
      ).rejects.toMatchObject({ status });
      await expect(
        jsonRequest(fetcher, 'https://example.com?token=secret', schema),
      ).rejects.not.toThrow('secret');
    },
  );
  it('does not expose credentials from underlying native network errors', async () => {
    const fetcher = vi
      .fn<Fetch>()
      .mockRejectedValue(
        new Error('Cannot fetch https://music.example.com?t=secret'),
      );
    await expect(
      jsonRequest(fetcher, 'https://music.example.com?t=secret', schema),
    ).rejects.toThrow('Could not reach');
    await expect(
      jsonRequest(fetcher, 'https://music.example.com?t=secret', schema),
    ).rejects.not.toThrow('secret');
  });
  it('rejects HTML responses and malformed JSON', async () => {
    const fetcher = vi
      .fn<Fetch>()
      .mockResolvedValue(new Response('<html>gateway</html>'));
    await expect(
      jsonRequest(fetcher, 'https://example.com', schema),
    ).rejects.toThrow('unexpected response');
  });
  it('rejects invalid shapes without embedding their contents in the error', async () => {
    const fetcher = vi
      .fn<Fetch>()
      .mockResolvedValue(new Response('{"ok":"secret"}'));
    await expect(
      jsonRequest(fetcher, 'https://example.com', schema),
    ).rejects.toThrow('could not read');
  });
  it('forwards cancellation to the transport', async () => {
    const outer = new AbortController();
    const fetcher = vi.fn<Fetch>().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new Error('aborted')),
          );
        }),
    );
    const pending = jsonRequest(fetcher, 'https://example.com', schema, {
      signal: outer.signal,
    });
    outer.abort();
    await expect(pending).rejects.toThrow('cancelled or timed out');
  });
  it('aborts a stalled request after twenty seconds', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<Fetch>().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new Error('aborted')),
            );
          }),
      );
      const pending = expect(
        jsonRequest(fetcher, 'https://example.com', schema),
      ).rejects.toThrow('timed out');
      await vi.advanceTimersByTimeAsync(20_000);
      await pending;
    } finally {
      vi.useRealTimers();
    }
  });
});
