import { describe, expect, it } from 'vitest';
import type { ProviderTrack, Song } from '../models';
import { libraryMatch } from './matches';
const song: Song = {
  id: 's',
  title: 'Tides',
  artist: 'Cove',
  album: 'Blue',
  duration: 180,
};
const candidate: ProviderTrack = {
  target: 'deezer:track:1',
  provider: 'deezer',
  title: 'tides',
  artist: ' Cove ',
  album: 'Blue',
  duration: 181,
};
describe('library matching', () => {
  it('matches normalized metadata within a small duration tolerance', () => {
    expect(libraryMatch(candidate, [song])).toBe(song);
  });
  it.each([
    { title: 'Tides (Live)' },
    { album: 'Blue Deluxe' },
    { artist: 'Other' },
    { duration: 200 },
    { duration: 0 },
  ])('retains distinct recordings: %o', (change) => {
    expect(libraryMatch({ ...candidate, ...change }, [song])).toBeUndefined();
  });
  it('does not claim unknown library durations are exact matches', () => {
    expect(libraryMatch(candidate, [{ ...song, duration: 0 }])).toBeUndefined();
  });
});
