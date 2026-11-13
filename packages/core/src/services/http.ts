import { z } from 'zod';

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
export type Fetch = typeof fetch;
export function serverUrl(value: string): string {
  const url = new URL(value.trim());
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new ServiceError(
      'Use an HTTPS server address without credentials, a query, or a fragment.',
    );
  }
  return url.toString().replace(/\/$/, '');
}
export const serverUrlSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    try {
      return serverUrl(value);
    } catch {
      ctx.addIssue({
        code: 'custom',
        message:
          'Enter an HTTPS server address, such as https://music.example.com.',
      });
      return z.NEVER;
    }
  });

export async function jsonRequest<T>(
  fetcher: Fetch,
  url: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  init.signal?.addEventListener('abort', abort, { once: true });
  if (init.signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20_000);
  try {
    const response = await fetcher(url, {
      ...init,
      signal: controller.signal,
      redirect: 'error',
    });
    if (!response.ok) {
      const message =
        response.status === 401 || response.status === 403
          ? 'Access denied. Check your credentials and permissions in Connections.'
          : `The service could not complete the request (HTTP ${response.status}). Please retry.`;
      throw new ServiceError(message, response.status);
    }
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ServiceError(
        'The server returned an unexpected response. Check the server address.',
      );
    }
    const result = schema.safeParse(data);
    if (!result.success)
      throw new ServiceError(
        'The server returned data Cove could not read. Check service compatibility.',
      );
    return result.data;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    if (controller.signal.aborted)
      throw new ServiceError(
        'The request was cancelled or timed out. Please retry.',
      );
    // Do not propagate native network errors containing signed stream/API URLs.
    throw new ServiceError(
      'Could not reach the service. Check your connection and server address.',
    );
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abort);
  }
}
