import type { ProviderTrack, Song } from '../models';
function normalized(text: string) {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ')
    .trim();
}
export function libraryMatch(
  candidate: ProviderTrack,
  songs: readonly Song[],
): Song | undefined {
  // Conservative metadata match: retain album/version differences and a duration tolerance.
  return songs.find(
    (song) =>
      normalized(song.title) === normalized(candidate.title) &&
      normalized(song.artist) === normalized(candidate.artist) &&
      normalized(song.album) === normalized(candidate.album) &&
      song.duration > 0 &&
      candidate.duration > 0 &&
      Math.abs(song.duration - candidate.duration) <= 2,
  );
}
