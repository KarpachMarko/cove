import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';
import { insertQueue, moveUpcoming, shuffled } from '@cove/core';
import type { QueueEntry, Song } from '@cove/core';
import * as Crypto from 'expo-crypto';
import { useAudioEngine } from '../../platform/audio';
import type { AudioStatus, AudioTrack } from '../../platform/audio.types';
import { useServices } from '../../app/session';

type Playback = {
  entries: readonly QueueEntry[];
  current?: Song;
  status: AudioStatus;
  error?: string;
  message?: string;
  busy: boolean;
  play: (songs: readonly Song[], start?: number, shuffle?: boolean) => void;
  enqueue: (song: Song, position: 'next' | 'last') => void;
  move: (from: number, to: number) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
};
const PlaybackContext = createContext<Playback | null>(null);
export function PlaybackProvider({ children }: PropsWithChildren) {
  const { library } = useServices();
  const { engine, status } = useAudioEngine();
  const [entries, setEntries] = useState<readonly QueueEntry[]>([]);
  const entriesRef = useRef(entries);
  const [error, setError] = useState<string>();
  const [feedback, setFeedback] = useState<{ text: string; key: string }>();
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  const current = entries[status.currentIndex]?.song;
  const source = (song: Song): AudioTrack => ({
    uri: library.stream(song.id),
    title: song.title,
    artist: song.artist,
    album: song.album,
    artwork: library.artwork(song.coverArt),
  });
  function update(next: readonly QueueEntry[]) {
    entriesRef.current = next;
    setEntries(next);
  }
  function run(action: () => void | Promise<void>) {
    setError(undefined);
    try {
      void Promise.resolve(action()).catch(() => {
        if (active.current)
          setError(
            'Playback could not complete. Check your connection and try again.',
          );
      });
    } catch {
      setError(
        'Playback could not complete. Check your connection and try again.',
      );
    }
  }
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(undefined), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      engine.stop();
    };
  }, [engine]);
  useEffect(() => {
    if (!current) return;
    try {
      engine.metadata({
        uri: library.stream(current.id),
        title: current.title,
        artist: current.artist,
        album: current.album,
        artwork: library.artwork(current.coverArt),
      });
    } catch {
      setError('System playback controls are unavailable.');
    }
  }, [current, engine, library]);
  return (
    <PlaybackContext.Provider
      value={{
        entries,
        current,
        status,
        error,
        message: feedback?.text,
        busy,
        play(songs, start = 0, shuffle = false) {
          if (!songs.length || busy) return;
          setBusy(true);
          run(async () => {
            try {
              await engine.prepare();
              if (!active.current) return;
              const ordered = shuffle ? shuffled(songs) : [...songs];
              const index = shuffle
                ? 0
                : Math.max(0, Math.min(start, ordered.length - 1));
              engine.load(ordered.map(source), index);
              update(
                ordered.map((song) => ({ key: Crypto.randomUUID(), song })),
              );
              const first = ordered[index];
              if (first) engine.metadata(source(first));
              engine.play();
            } finally {
              if (active.current) setBusy(false);
            }
          });
        },
        enqueue(song, position) {
          run(() => {
            const queue = {
              entries: entriesRef.current,
              currentIndex: entriesRef.current.length
                ? engine.currentIndex()
                : -1,
            };
            const entry = { key: Crypto.randomUUID(), song };
            const index =
              position === 'next'
                ? Math.max(0, queue.currentIndex + 1)
                : queue.entries.length;
            engine.insert(source(song), index);
            update(insertQueue(queue, entry, position).entries);
            const text = `${song.title} added to play ${position}.`;
            setFeedback({ text, key: entry.key });
            AccessibilityInfo.announceForAccessibility(text);
          });
        },
        move(from, to) {
          run(() => {
            const state = {
              entries: entriesRef.current,
              currentIndex: engine.currentIndex(),
            };
            if (
              from <= state.currentIndex ||
              to <= state.currentIndex ||
              from < 0 ||
              to < 0 ||
              from >= state.entries.length ||
              to >= state.entries.length
            )
              return;
            engine.move(from, to);
            update(moveUpcoming(state, from, to).entries);
          });
        },
        toggle() {
          run(async () => {
            await engine.prepare();
            if (!active.current) return;
            if (status.playing) engine.pause();
            else {
              if (current) engine.metadata(source(current));
              engine.play();
            }
          });
        },
        next() {
          run(() => engine.next());
        },
        previous() {
          run(() => {
            if (status.currentTime > 3) return engine.seek(0);
            engine.previous();
          });
        },
        seek(seconds) {
          run(() =>
            engine.seek(Math.max(0, Math.min(seconds, status.duration))),
          );
        },
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}
export function usePlayback() {
  const value = useContext(PlaybackContext);
  if (!value) throw new Error('PlaybackProvider is missing.');
  return value;
}
