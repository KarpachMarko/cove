import { Alert, PanResponder, Pressable, View } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { useMemo } from 'react';
import type { Song } from '@cove/core';
import { useServices } from '../../app/session';
import { Artwork } from '../../components/ui/artwork';
import { Text } from '../../components/ui/text';
import { IconButton } from '../../components/ui/button';
import { usePlayback } from './playback-provider';
export function TrackRow({
  song,
  onPlay,
  trailing,
}: {
  song: Song;
  onPlay?: () => void;
  trailing?: React.ReactNode;
}) {
  const { library } = useServices();
  const playback = usePlayback();
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 24 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) > 70)
            playback.enqueue(song, gesture.dx > 0 ? 'next' : 'last');
        },
      }),
    [playback, song],
  );
  function menu() {
    Alert.alert(song.title, song.artist, [
      { text: 'Play next', onPress: () => playback.enqueue(song, 'next') },
      { text: 'Play last', onPress: () => playback.enqueue(song, 'last') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }
  return (
    <View
      {...swipe.panHandlers}
      className="flex-row items-center gap-2 border-b border-line px-5 py-2"
    >
      <Pressable
        onPress={onPlay ?? (() => playback.play([song]))}
        accessibilityRole="button"
        accessibilityLabel={`Play ${song.title} by ${song.artist}`}
        className="min-h-14 flex-1 flex-row items-center gap-3 py-1 active:opacity-60"
      >
        <Artwork uri={library.artwork(song.coverArt, 160)} />
        <View className="flex-1 gap-1">
          <Text numberOfLines={1}>{song.title}</Text>
          <Text variant="caption" numberOfLines={1}>
            {song.artist}
          </Text>
        </View>
      </Pressable>
      {trailing}
      <IconButton
        icon={MoreHorizontal}
        label={`Queue actions for ${song.title}`}
        onPress={menu}
      />
    </View>
  );
}
