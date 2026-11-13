import { Pressable, View } from 'react-native';
import { Pause, Play, SkipForward } from 'lucide-react-native';
import { usePlayback } from './playback-provider';
import { useServices } from '../../app/session';
import { Artwork } from '../../components/ui/artwork';
import { IconButton } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
export function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const { current, status, toggle, next, entries, error, busy, message } =
    usePlayback();
  const { library } = useServices();
  if (!current)
    return error || busy ? (
      <View className="mx-3 mb-2 rounded-2xl bg-secondary p-4">
        <Text accessibilityLiveRegion="polite" variant="caption">
          {error ?? 'Preparing playback…'}
        </Text>
      </View>
    ) : null;
  return (
    <View className="mx-3 mb-2 flex-row items-center gap-1 rounded-2xl border border-line bg-secondary p-2">
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open now playing: ${current.title}`}
        className="min-h-12 flex-1 flex-row items-center gap-3"
      >
        <Artwork uri={library.artwork(current.coverArt, 160)} />
        <View className="flex-1">
          <Text variant="label" numberOfLines={1}>
            {current.title}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {error ??
              message ??
              (status.buffering ? 'Buffering…' : current.artist)}
          </Text>
        </View>
      </Pressable>
      <IconButton
        icon={status.playing ? Pause : Play}
        label={status.playing ? 'Pause' : 'Play'}
        onPress={toggle}
      />
      <IconButton
        icon={SkipForward}
        label="Next track"
        disabled={status.currentIndex >= entries.length - 1}
        onPress={next}
      />
    </View>
  );
}
