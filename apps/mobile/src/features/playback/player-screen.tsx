import { ScrollView, View } from 'react-native';
import Slider from '@react-native-community/slider';
import {
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { usePlayback } from './playback-provider';
import { useServices } from '../../app/session';
import { Artwork } from '../../components/ui/artwork';
import { Button, IconButton } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { Notice, Screen } from '../../components/ui/screen';
import { colors } from '../../theme/tokens';
export function time(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
export function PlayerScreen({ onQueue }: { onQueue: () => void }) {
  const { current, status, error, entries, toggle, previous, next, seek } =
    usePlayback();
  const { library } = useServices();
  if (!current)
    return (
      <Screen>
        <Notice
          title="Nothing playing yet"
          message="Choose a song from your library."
        />
      </Screen>
    );
  return (
    <Screen>
      <ScrollView contentContainerClassName="mx-auto w-full max-w-xl gap-6 px-7 pb-10 pt-5">
        <Artwork uri={library.artwork(current.coverArt, 1000)} size="large" />
        <View className="gap-1">
          <Text variant="heading">{current.title}</Text>
          <Text className="text-primary">{current.artist}</Text>
          <Text variant="caption">{current.album}</Text>
        </View>
        <View>
          <Slider
            accessibilityLabel="Playback position"
            disabled={!status.loaded || status.duration <= 0}
            minimumValue={0}
            maximumValue={Math.max(1, status.duration)}
            value={status.currentTime}
            onSlidingComplete={seek}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.primary}
          />
          <View className="flex-row justify-between">
            <Text variant="caption">{time(status.currentTime)}</Text>
            <Text variant="caption">{time(status.duration)}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-evenly">
          <IconButton
            icon={SkipBack}
            label="Previous track"
            onPress={previous}
          />
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
        {status.buffering && (
          <Text accessibilityLiveRegion="polite" variant="caption">
            Buffering audio…
          </Text>
        )}
        {error && (
          <Text accessibilityRole="alert" className="text-primary">
            {error}
          </Text>
        )}
        <Button variant="secondary" onPress={onQueue}>
          View queue
        </Button>
        <View className="items-center">
          <ListMusic color={colors.primary} accessible={false} />
        </View>
      </ScrollView>
    </Screen>
  );
}
