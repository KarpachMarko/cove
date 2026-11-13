export type AudioTrack = {
  uri: string;
  title: string;
  artist: string;
  album: string;
  artwork?: string;
};
export type AudioStatus = {
  currentIndex: number;
  currentTime: number;
  duration: number;
  playing: boolean;
  buffering: boolean;
  loaded: boolean;
};
export interface AudioEngine {
  prepare(): Promise<void>;
  load(tracks: readonly AudioTrack[], startIndex: number): void;
  insert(track: AudioTrack, index: number): void;
  move(from: number, to: number): void;
  play(): void;
  pause(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): Promise<void>;
  currentIndex(): number;
  metadata(track: AudioTrack): void;
  stop(): void;
}
