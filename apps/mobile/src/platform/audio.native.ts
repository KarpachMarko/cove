import { useMemo } from 'react';
import {
  setAudioModeAsync,
  useAudioPlaylist,
  useAudioPlaylistStatus,
} from 'expo-audio';
import type { AudioEngine, AudioStatus, AudioTrack } from './audio.types';
export function useAudioEngine(): { engine: AudioEngine; status: AudioStatus } {
  const playlist = useAudioPlaylist({ loop: 'none', updateInterval: 500 });
  const status = useAudioPlaylistStatus(playlist);
  const engine = useMemo<AudioEngine>(
    () => ({
      prepare: () =>
        setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        }),
      load(tracks, startIndex) {
        playlist.pause();
        playlist.clear();
        tracks.forEach((track) =>
          playlist.add({ uri: track.uri, name: track.title }),
        );
        if (tracks.length) playlist.skipTo(startIndex);
      },
      insert(track, index) {
        playlist.insert({ uri: track.uri, name: track.title }, index);
      },
      move(from, to) {
        const source = playlist.sources[from];
        if (!source?.uri || from === to) return;
        // Only upcoming entries may move; the active native player stays in place.
        playlist.remove(from);
        playlist.insert(source, to);
      },
      play() {
        playlist.play();
      },
      pause() {
        playlist.pause();
      },
      next() {
        playlist.next();
      },
      previous() {
        playlist.previous();
      },
      seek: (seconds) => playlist.seekTo(seconds),
      currentIndex: () => playlist.currentIndex,
      metadata(track: AudioTrack) {
        playlist.setActiveForLockScreen(true, {
          title: track.title,
          artist: track.artist,
          albumTitle: track.album,
          artworkUrl: track.artwork,
        });
      },
      stop() {
        playlist.pause();
        playlist.clearLockScreenControls();
        playlist.clear();
      },
    }),
    [playlist],
  );
  return {
    engine,
    status: {
      currentIndex: status.currentIndex,
      currentTime: status.currentTime,
      duration: status.duration,
      playing: status.playing,
      buffering: status.isBuffering,
      loaded: status.isLoaded,
    },
  };
}
