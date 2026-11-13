import { z } from 'zod';
import type { ProviderName, ProviderTrack, Session } from '../models';
import { jsonRequest, ServiceError } from './http';
import type { Fetch } from './http';

const trackSchema = z
  .object({
    provider: z.enum(['deezer', 'lossless']).optional(),
    source: z.string().optional(),
    id: z.number(),
    title: z.string(),
    title_version: z.string().optional(),
    duration: z.number(),
    artist: z.object({ name: z.string() }),
    album: z.object({ title: z.string(), cover_medium: z.string().optional() }),
  })
  .refine(
    (track) => track.provider !== 'lossless' || Boolean(track.source),
    'Lossless tracks require a source identity.',
  );
const searchSchema = z.union([
  z
    .array(trackSchema)
    .nullable()
    .transform((tracks) => ({
      tracks: tracks ?? [],
      warnings: [] as string[],
    })),
  z.object({
    tracks: z
      .array(trackSchema)
      .nullable()
      .transform((tracks) => tracks ?? []),
    warnings: z.array(z.string()).optional().default([]),
  }),
]);

export class ZenSyncClient {
  constructor(
    private readonly connection: NonNullable<Session['zensync']>,
    private readonly fetcher: Fetch = fetch,
  ) {}
  private headers() {
    return {
      Authorization: `Bearer ${this.connection.apiKey}`,
      Accept: 'application/json',
    };
  }
  async search(
    query: string,
    provider: ProviderName,
    signal?: AbortSignal,
  ): Promise<{ tracks: ProviderTrack[]; warnings: string[] }> {
    const params = new URLSearchParams({ q: query, provider, details: '1' });
    const result = await jsonRequest(
      this.fetcher,
      `${this.connection.url}/api/v2/search?${params}`,
      searchSchema,
      { signal, headers: this.headers() },
    );
    const seenTargets = new Set<string>();
    return {
      warnings: result.warnings,
      tracks: result.tracks
        .map((track) => {
          const source = track.provider ?? provider;
          if (source === 'lossless' && !track.source)
            throw new ServiceError(
              'ZenSync returned a recording without its source identity.',
            );
          return {
            target:
              source === 'lossless'
                ? `lossless:track:${track.source}:${track.id}`
                : `deezer:track:${track.id}`,
            provider: source,
            title:
              track.title_version &&
              !track.title
                .toLowerCase()
                .includes(track.title_version.toLowerCase())
                ? `${track.title} ${track.title_version}`
                : track.title,
            artist: track.artist.name,
            album: track.album.title,
            duration: track.duration,
            artwork: track.album.cover_medium,
          };
        })
        .filter((track) => {
          // Provider search can repeat one recording. Its source-qualified target
          // is the identity for display, acquisition, and request receipts.
          if (seenTargets.has(track.target)) return false;
          seenTargets.add(track.target);
          return true;
        }),
    };
  }
  requestTrack(target: string, idempotencyKey: string) {
    return jsonRequest(
      this.fetcher,
      `${this.connection.url}/api/v2/requests`,
      z.object({ id: z.string() }),
      {
        method: 'POST',
        headers: {
          ...this.headers(),
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ target }),
      },
    );
  }
}
