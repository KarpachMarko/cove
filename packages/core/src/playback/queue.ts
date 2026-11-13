import type { Song } from '../models';

export type QueueEntry = { key: string; song: Song };
export type QueueState = {
  entries: readonly QueueEntry[];
  currentIndex: number;
};
export const emptyQueue: QueueState = { entries: [], currentIndex: -1 };
export function moveItem<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  const copy = [...items];
  if (
    from < 0 ||
    to < 0 ||
    from >= copy.length ||
    to >= copy.length ||
    from === to
  )
    return copy;
  const [item] = copy.splice(from, 1);
  if (item !== undefined) copy.splice(to, 0, item);
  return copy;
}
export function insertQueue(
  state: QueueState,
  entry: QueueEntry,
  position: 'next' | 'last',
): QueueState {
  const entries = [...state.entries];
  entries.splice(
    position === 'next' ? Math.max(0, state.currentIndex + 1) : entries.length,
    0,
    entry,
  );
  return {
    entries,
    currentIndex: state.currentIndex < 0 ? 0 : state.currentIndex,
  };
}
export function moveUpcoming(
  state: QueueState,
  from: number,
  to: number,
): QueueState {
  if (from <= state.currentIndex || to <= state.currentIndex) return state;
  return { ...state, entries: moveItem(state.entries, from, to) };
}
export function shuffled<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result;
}
