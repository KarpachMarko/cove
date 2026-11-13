import { describe, expect, it } from 'vitest';
import type { Song } from '../models';
import type { QueueEntry } from './queue';
import {
  emptyQueue,
  insertQueue,
  moveItem,
  moveUpcoming,
  shuffled,
} from './queue';
const song: Song = {
  id: 'one',
  title: 'Tides',
  artist: 'Cove',
  album: 'Blue',
  duration: 180,
};
function entry(key: string): QueueEntry {
  return { key, song: { ...song } };
}

describe('listening queue', () => {
  it('allows multiple occurrences of one recording', () => {
    const state = insertQueue(
      insertQueue(emptyQueue, entry('first'), 'last'),
      entry('second'),
      'next',
    );
    expect(state.entries.map((item) => item.song.id)).toEqual(['one', 'one']);
    expect(state.entries.map((item) => item.key)).toEqual(['first', 'second']);
    expect(state.currentIndex).toBe(0);
  });
  it('inserts Play next directly after the current track', () => {
    const original = {
      entries: [entry('a'), entry('b'), entry('c')],
      currentIndex: 1,
    };
    expect(
      insertQueue(original, entry('next'), 'next').entries.map(
        (item) => item.key,
      ),
    ).toEqual(['a', 'b', 'next', 'c']);
    expect(original.entries).toHaveLength(3);
  });
  it('appends Play last without moving playback', () => {
    const original = { entries: [entry('a'), entry('b')], currentIndex: 0 };
    const result = insertQueue(original, entry('last'), 'last');
    expect(result.entries.map((item) => item.key)).toEqual(['a', 'b', 'last']);
    expect(result.currentIndex).toBe(0);
  });
  it('moves upcoming entries without changing the active entry or playlist', () => {
    const playlist = [entry('a'), entry('b'), entry('c'), entry('d')];
    const result = moveUpcoming({ entries: playlist, currentIndex: 1 }, 3, 2);
    expect(result.entries.map((item) => item.key)).toEqual([
      'a',
      'b',
      'd',
      'c',
    ]);
    expect(result.entries[1]?.key).toBe('b');
    expect(playlist.map((item) => item.key)).toEqual(['a', 'b', 'c', 'd']);
  });
  it.each([
    [0, 2],
    [2, 0],
    [1, 2],
    [2, 1],
  ])('refuses moves across the active entry: %i to %i', (from, to) => {
    const state = {
      entries: [entry('a'), entry('b'), entry('c')],
      currentIndex: 1,
    };
    expect(moveUpcoming(state, from, to)).toBe(state);
  });
  it.each([
    [-1, 0],
    [0, -1],
    [4, 0],
    [0, 4],
  ])('ignores invalid list indices: %i to %i', (from, to) => {
    expect(moveItem(['a', 'b', 'c'], from, to)).toEqual(['a', 'b', 'c']);
  });
  it('shuffles a copy without losing occurrences', () => {
    const original = ['a', 'a', 'b', 'c'];
    const result = shuffled(original, () => 0);
    expect(result).not.toEqual(original);
    expect([...result].sort()).toEqual([...original].sort());
    expect(original).toEqual(['a', 'a', 'b', 'c']);
  });
  it('handles an empty or single-track collection', () => {
    expect(shuffled([])).toEqual([]);
    expect(shuffled(['a'])).toEqual(['a']);
  });
});
