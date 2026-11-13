import type { AudioEngine, AudioStatus } from './audio.types';
export function useAudioEngine(): { engine: AudioEngine; status: AudioStatus } {
  throw new Error(
    'An audio adapter is required for this platform. Cove currently supports iOS and Android.',
  );
}
