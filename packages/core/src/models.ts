import { z } from 'zod';

export const songSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string().default('Unknown artist'),
  album: z.string().default(''),
  albumId: z.string().optional(),
  artistId: z.string().optional(),
  coverArt: z.string().optional(),
  duration: z.number().nonnegative().default(0),
  track: z.number().optional(),
  isrc: z.array(z.string()).optional(),
});
export const albumSchema = z.object({
  id: z.string(),
  name: z.string(),
  artist: z.string().default('Unknown artist'),
  artistId: z.string().optional(),
  coverArt: z.string().optional(),
  songCount: z.number().default(0),
});
export const artistSchema = z.object({
  id: z.string(),
  name: z.string(),
  coverArt: z.string().optional(),
  albumCount: z.number().default(0),
});
export const playlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string().default(''),
  coverArt: z.string().optional(),
  songCount: z.number().default(0),
  readonly: z.boolean().default(false),
});
export type Song = z.infer<typeof songSchema>;
export type Album = z.infer<typeof albumSchema>;
export type Artist = z.infer<typeof artistSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
export type PlaylistDetail = Playlist & { entry: Song[] };
export type AlbumDetail = Album & { song: Song[] };
export type ArtistDetail = Artist & { album: Album[] };
export type LibrarySearch = { song: Song[]; album: Album[]; artist: Artist[] };
export type ProviderName = 'deezer' | 'lossless';
export type ProviderTrack = {
  target: string;
  provider: ProviderName;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork?: string;
};
export const sessionSchema = z.object({
  navidrome: z.object({
    url: z.string().url(),
    username: z.string(),
    token: z.string(),
    salt: z.string(),
  }),
  zensync: z
    .object({
      url: z.string().url(),
      apiKey: z.string(),
      id: z.string().optional(),
    })
    .optional(),
});
export type Session = z.infer<typeof sessionSchema>;
export interface CredentialStorage {
  load(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
}
