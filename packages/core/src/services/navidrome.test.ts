import { describe, expect, it, vi } from 'vitest';
import { md5 } from 'js-md5';
import { createNavidromeAuth, NavidromeClient, PAGE_SIZE } from './navidrome';
import type { Fetch } from './http';
const connection = createNavidromeAuth(
  'https://music.example.com/subpath/',
  ' listener ',
  'test-password',
  'random-salt',
);
function response(payload: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ 'subsonic-response': { status: 'ok', ...payload } }),
  );
}
function client(payload: Record<string, unknown>) {
  const fetcher = vi.fn<Fetch>().mockResolvedValue(response(payload));
  return { fetcher, api: new NavidromeClient(connection, fetcher) };
}
function calledUrl(fetcher: ReturnType<typeof vi.fn<Fetch>>) {
  return new URL(String(fetcher.mock.calls[0]?.[0]));
}

describe('Navidrome OpenSubsonic client', () => {
  it('creates protocol tokens without retaining the password', () => {
    expect(connection).toEqual({
      url: 'https://music.example.com/subpath',
      username: 'listener',
      salt: 'random-salt',
      token: md5('test-passwordrandom-salt'),
    });
    expect(JSON.stringify(connection)).not.toContain('test-password');
  });
  it('pings the configured subpath with token authentication', async () => {
    const { api, fetcher } = client({});
    await api.ping();
    const url = calledUrl(fetcher);
    expect(url.pathname).toBe('/subpath/rest/ping.view');
    expect(url.searchParams.get('t')).toBe(connection.token);
    expect(url.searchParams.has('p')).toBe(false);
  });
  it('sends pagination offsets for songs, including an empty browse query', async () => {
    const { api, fetcher } = client({ searchResult3: {} });
    expect(await api.songs(PAGE_SIZE)).toEqual([]);
    expect(calledUrl(fetcher).searchParams.get('songOffset')).toBe(
      String(PAGE_SIZE),
    );
    expect(calledUrl(fetcher).searchParams.get('query')).toBe('');
  });
  it('prepares the full library across page boundaries before playback', async () => {
    const first = Array.from({ length: PAGE_SIZE }, (_, index) => ({
      id: `song-${index}`,
      title: `Song ${index}`,
    }));
    const fetcher = vi
      .fn<Fetch>()
      .mockResolvedValueOnce(response({ searchResult3: { song: first } }))
      .mockResolvedValueOnce(
        response({
          searchResult3: { song: [{ id: 'last', title: 'Last song' }] },
        }),
      );
    const api = new NavidromeClient(connection, fetcher);
    const songs = await api.allSongs();
    expect(songs).toHaveLength(PAGE_SIZE + 1);
    expect(songs.at(-1)?.id).toBe('last');
    expect(
      new URL(String(fetcher.mock.calls[1]?.[0])).searchParams.get(
        'songOffset',
      ),
    ).toBe(String(PAGE_SIZE));
  });
  it('handles empty albums and playlists represented by omitted lists', async () => {
    expect(await client({ albumList2: {} }).api.albums()).toEqual([]);
    expect(await client({ playlists: {} }).api.playlists()).toEqual([]);
  });
  it('flattens the server artist index without changing order', async () => {
    const { api } = client({
      artists: {
        index: [
          { artist: [{ id: '1', name: 'Alpha' }] },
          { artist: [{ id: '2', name: 'Beta' }] },
        ],
      },
    });
    expect((await api.artists()).map((artist) => artist.name)).toEqual([
      'Alpha',
      'Beta',
    ]);
  });
  it('retains duplicate playlist occurrences on detail reads', async () => {
    const song = { id: 'song', title: 'Tides' };
    const { api } = client({
      playlist: { id: 'mix', name: 'Mix', entry: [song, song] },
    });
    expect((await api.playlist('mix')).entry).toHaveLength(2);
  });
  it('saves the exact playlist order with POST and repeated songId fields', async () => {
    const { api, fetcher } = client({});
    await api.savePlaylistOrder('mix', ['b', 'a', 'b']);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toBe(
      'https://music.example.com/subpath/rest/createPlaylist.view',
    );
    expect(init?.method).toBe('POST');
    const body = new URLSearchParams(String(init?.body));
    expect(body.get('playlistId')).toBe('mix');
    expect(body.getAll('songId')).toEqual(['b', 'a', 'b']);
  });
  it('preserves song, album and artist search results', async () => {
    const { api, fetcher } = client({
      searchResult3: {
        song: [{ id: 's', title: 'Tides' }],
        album: [{ id: 'a', name: 'Blue' }],
        artist: [{ id: 'r', name: 'Cove' }],
      },
    });
    const result = await api.search('tides & blue');
    expect(result.song[0]?.title).toBe('Tides');
    expect(result.album).toHaveLength(1);
    expect(result.artist).toHaveLength(1);
    expect(calledUrl(fetcher).searchParams.get('query')).toBe('tides & blue');
  });
  it('accepts OpenSubsonic song metadata with empty and multiple ISRCs', async () => {
    const songs = [
      { id: 'empty-isrc', title: 'Tides', isrc: [] },
      {
        id: 'multiple-isrc',
        title: 'Still',
        isrc: ['TEST00000001', 'TEST00000002'],
      },
    ];
    expect(
      await client({ searchResult3: { song: songs } }).api.songs(),
    ).toMatchObject(songs);
    expect(
      (await client({ searchResult3: { song: songs } }).api.search('fixture'))
        .song,
    ).toMatchObject(songs);
    expect(
      (
        await client({
          album: { id: 'album', name: 'Blue', song: songs },
        }).api.album('album')
      ).song,
    ).toMatchObject(songs);
    expect(
      (
        await client({
          playlist: { id: 'mix', name: 'Mix', entry: songs },
        }).api.playlist('mix')
      ).entry,
    ).toMatchObject(songs);
  });
  it('still rejects malformed ISRC metadata rather than dropping a whole field silently', async () => {
    await expect(
      client({
        searchResult3: { song: [{ id: 's', title: 'Tides', isrc: [123] }] },
      }).api.songs(),
    ).rejects.toThrow('unsupported response');
  });
  it('detects API-level authentication failures even on HTTP 200', async () => {
    const { api } = client({
      status: 'failed',
      error: { code: 40, message: 'Invalid credentials' },
    });
    await expect(api.ping()).rejects.toMatchObject({ status: 401 });
  });
  it('rejects malformed service data', async () => {
    await expect(client({ album: { id: 123 } }).api.album('a')).rejects.toThrow(
      'unsupported response',
    );
  });
  it('builds encoded artwork and stream URLs for the current session', () => {
    const { api } = client({});
    expect(api.artwork(undefined)).toBeUndefined();
    expect(new URL(api.stream('a/b & c')).searchParams.get('id')).toBe(
      'a/b & c',
    );
    expect(new URL(api.artwork('cover', 160)!).searchParams.get('size')).toBe(
      '160',
    );
  });
});
