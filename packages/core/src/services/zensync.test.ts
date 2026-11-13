import { describe, expect, it, vi } from 'vitest';
import { ZenSyncClient } from './zensync';
import type { Fetch } from './http';
const track = {
  id: 12,
  title: 'Tides',
  duration: 180,
  artist: { name: 'Cove' },
  album: { title: 'Blue' },
};
function client(payload: unknown) {
  const fetcher = vi
    .fn<Fetch>()
    .mockResolvedValue(new Response(JSON.stringify(payload)));
  return {
    fetcher,
    api: new ZenSyncClient(
      { url: 'https://zen.example.com/base', apiKey: 'test-key' },
      fetcher,
    ),
  };
}

describe('ZenSync source contract', () => {
  it('uses bearer authentication with details and an explicit provider', async () => {
    const { api, fetcher } = client({
      tracks: [track],
      warnings: ['Example warning'],
    });
    const result = await api.search('tides', 'deezer');
    expect(result.tracks[0]?.target).toBe('deezer:track:12');
    expect(result.warnings).toEqual(['Example warning']);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toContain('/base/api/v2/search?');
    expect(new URL(String(url)).searchParams.get('provider')).toBe('deezer');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-key' });
    expect(String(url)).not.toContain('test-key');
  });
  it('never collapses two lossless sources with the same numeric id', async () => {
    const { api } = client([
      { ...track, provider: 'lossless', source: 'one' },
      { ...track, provider: 'lossless', source: 'two' },
    ]);
    expect(
      (await api.search('tides', 'lossless')).tracks.map((row) => row.target),
    ).toEqual(['lossless:track:one:12', 'lossless:track:two:12']);
  });
  it('deduplicates repeated provider recording identities while retaining source order', async () => {
    const first = { ...track, provider: 'lossless', source: 'main' };
    const { api } = client([
      first,
      { ...first, title: 'Duplicate catalog entry' },
      { ...first, source: 'other' },
    ]);
    const result = await api.search('tides', 'lossless');
    expect(result.tracks.map((item) => item.target)).toEqual([
      'lossless:track:main:12',
      'lossless:track:other:12',
    ]);
    expect(result.tracks[0]?.title).toBe('Tides');
  });
  it('rejects lossless identities missing their source', async () => {
    await expect(
      client([{ ...track, provider: 'lossless' }]).api.search(
        'tides',
        'lossless',
      ),
    ).rejects.toThrow('could not read');
  });
  it('rejects an implicit lossless recording without a source identity', async () => {
    await expect(
      client([track]).api.search('tides', 'lossless'),
    ).rejects.toThrow('source identity');
  });
  it('keeps recording version information', async () => {
    const result = await client([
      { ...track, title_version: '(Live)' },
    ]).api.search('tides', 'deezer');
    expect(result.tracks[0]?.title).toBe('Tides (Live)');
  });
  it('supports null provider result lists', async () => {
    expect(
      (await client({ tracks: null }).api.search('tides', 'deezer')).tracks,
    ).toEqual([]);
  });
  it('submits an exact provider target and preserves the caller idempotency key', async () => {
    const { api, fetcher } = client({ id: 'request-1' });
    expect(
      await api.requestTrack('lossless:track:one:12', 'stable-retry-key'),
    ).toEqual({ id: 'request-1' });
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toBe('https://zen.example.com/base/api/v2/requests');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({
      'Idempotency-Key': 'stable-retry-key',
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      target: 'lossless:track:one:12',
    });
  });
});
