import { md5 } from 'js-md5';
import { z } from 'zod';
import {
  albumSchema,
  artistSchema,
  playlistSchema,
  songSchema,
} from '../models';
import type { Session, Song } from '../models';
import { jsonRequest, serverUrl, ServiceError } from './http';
import type { Fetch } from './http';

const songs = z
  .array(songSchema)
  .nullish()
  .transform((value) => value ?? []);
const albums = z
  .array(albumSchema)
  .nullish()
  .transform((value) => value ?? []);
const artists = z
  .array(artistSchema)
  .nullish()
  .transform((value) => value ?? []);
const searchSchema = z.object({ song: songs, album: albums, artist: artists });
const envelopeSchema = z.object({
  'subsonic-response': z
    .object({
      status: z.enum(['ok', 'failed']),
      error: z.object({ code: z.number(), message: z.string() }).optional(),
    })
    .passthrough(),
});
export const PAGE_SIZE = 60;

export function createNavidromeAuth(
  url: string,
  username: string,
  password: string,
  salt: string,
): Session['navidrome'] {
  // MD5 is required by Subsonic's token protocol; this is not password storage.
  return {
    url: serverUrl(url),
    username: username.trim(),
    token: md5(password + salt),
    salt,
  };
}

export class NavidromeClient {
  constructor(
    readonly connection: Session['navidrome'],
    private readonly fetcher: Fetch = fetch,
  ) {}
  private params(extra: Record<string, string> = {}) {
    return new URLSearchParams({
      u: this.connection.username,
      t: this.connection.token,
      s: this.connection.salt,
      v: '1.16.1',
      c: 'cove',
      f: 'json',
      ...extra,
    });
  }
  private async request<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    params = new URLSearchParams(),
    signal?: AbortSignal,
    method = 'GET',
  ): Promise<T> {
    const all = this.params();
    params.forEach((value, key) => all.append(key, value));
    const url = `${this.connection.url}/rest/${endpoint}.view`;
    const response = await jsonRequest(
      this.fetcher,
      method === 'GET' ? `${url}?${all}` : url,
      envelopeSchema,
      {
        method,
        signal,
        headers: {
          Accept: 'application/json',
          ...(method === 'POST'
            ? { 'Content-Type': 'application/x-www-form-urlencoded' }
            : {}),
        },
        ...(method === 'POST' ? { body: all.toString() } : {}),
      },
    );
    const payload = response['subsonic-response'];
    if (payload.status !== 'ok')
      throw new ServiceError(
        payload.error?.code === 40 || payload.error?.code === 50
          ? 'Navidrome rejected the credentials or permissions. Check Connections.'
          : 'Navidrome could not complete this request. Please retry.',
        payload.error?.code === 40 || payload.error?.code === 50
          ? 401
          : undefined,
      );
    const result = schema.safeParse(payload);
    if (!result.success)
      throw new ServiceError('Navidrome returned an unsupported response.');
    return result.data;
  }
  ping(signal?: AbortSignal) {
    return this.request(
      'ping',
      z.object({ status: z.literal('ok') }),
      undefined,
      signal,
    );
  }
  async songs(offset = 0, signal?: AbortSignal) {
    const result = await this.request(
      'search3',
      z.object({ searchResult3: searchSchema }),
      new URLSearchParams({
        query: '',
        songCount: String(PAGE_SIZE),
        songOffset: String(offset),
        albumCount: '0',
        artistCount: '0',
      }),
      signal,
    );
    return result.searchResult3.song;
  }
  async allSongs(signal?: AbortSignal): Promise<Song[]> {
    const all: Song[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const page = await this.songs(offset, signal);
      all.push(...page);
      if (page.length < PAGE_SIZE) return all;
    }
  }
  async albums(offset = 0, signal?: AbortSignal) {
    const result = await this.request(
      'getAlbumList2',
      z.object({ albumList2: z.object({ album: albums }) }),
      new URLSearchParams({
        type: 'newest',
        size: String(PAGE_SIZE),
        offset: String(offset),
      }),
      signal,
    );
    return result.albumList2.album;
  }
  async album(id: string, signal?: AbortSignal) {
    return (
      await this.request(
        'getAlbum',
        z.object({ album: albumSchema.extend({ song: songs }) }),
        new URLSearchParams({ id }),
        signal,
      )
    ).album;
  }
  async artists(signal?: AbortSignal) {
    const result = await this.request(
      'getArtists',
      z.object({
        artists: z.object({
          index: z.array(z.object({ artist: artists })).nullish(),
        }),
      }),
      undefined,
      signal,
    );
    return result.artists.index?.flatMap((index) => index.artist) ?? [];
  }
  async artist(id: string, signal?: AbortSignal) {
    return (
      await this.request(
        'getArtist',
        z.object({ artist: artistSchema.extend({ album: albums }) }),
        new URLSearchParams({ id }),
        signal,
      )
    ).artist;
  }
  async playlists(signal?: AbortSignal) {
    const result = await this.request(
      'getPlaylists',
      z.object({
        playlists: z.object({ playlist: z.array(playlistSchema).nullish() }),
      }),
      undefined,
      signal,
    );
    return result.playlists.playlist ?? [];
  }
  async playlist(id: string, signal?: AbortSignal) {
    return (
      await this.request(
        'getPlaylist',
        z.object({ playlist: playlistSchema.extend({ entry: songs }) }),
        new URLSearchParams({ id }),
        signal,
      )
    ).playlist;
  }
  async savePlaylistOrder(id: string, songIds: readonly string[]) {
    // createPlaylist with playlistId REPLACES its entries, retaining metadata and duplicate occurrences.
    const params = new URLSearchParams({ playlistId: id });
    songIds.forEach((songId) => params.append('songId', songId));
    await this.request(
      'createPlaylist',
      z.object({ status: z.literal('ok') }),
      params,
      undefined,
      'POST',
    );
  }
  async search(query: string, offset = 0, signal?: AbortSignal) {
    return (
      await this.request(
        'search3',
        z.object({ searchResult3: searchSchema }),
        new URLSearchParams({
          query,
          songCount: String(PAGE_SIZE),
          songOffset: String(offset),
          albumCount: offset === 0 ? '20' : '0',
          artistCount: offset === 0 ? '20' : '0',
        }),
        signal,
      )
    ).searchResult3;
  }
  artwork(id?: string, size = 500) {
    return id
      ? `${this.connection.url}/rest/getCoverArt.view?${this.params({ id, size: String(size) })}`
      : undefined;
  }
  stream(id: string) {
    return `${this.connection.url}/rest/stream.view?${this.params({ id })}`;
  }
}
