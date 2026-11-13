import { FlatList, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { usePlayback } from './playback-provider';
import { Artwork } from '../../components/ui/artwork';
import { IconButton } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { Notice, PageHeading, Screen } from '../../components/ui/screen';
import { useServices } from '../../app/session';
export function QueueScreen() {
  const { entries, status, move, error } = usePlayback();
  const { library } = useServices();
  return (
    <Screen>
      <FlatList
        data={entries.slice(Math.max(0, status.currentIndex))}
        keyExtractor={(entry) => entry.key}
        ListHeaderComponent={
          <>
            <PageHeading
              title="Playing next"
              subtitle="Changes here affect this listening session."
            />
            {error && <Notice title="Playback issue" message={error} />}
          </>
        }
        ListEmptyComponent={
          <Notice
            title="Your queue is empty"
            message="Play an album or add songs with Play next and Play last."
          />
        }
        renderItem={({ item, index }) => {
          const absolute = index + Math.max(0, status.currentIndex);
          const current = absolute === status.currentIndex;
          return (
            <View className="flex-row items-center gap-3 border-b border-line px-5 py-3">
              <Artwork uri={library.artwork(item.song.coverArt, 160)} />
              <View className="flex-1 gap-1">
                <Text variant="label">{item.song.title}</Text>
                <Text variant="caption">
                  {current ? 'Now playing · ' : ''}
                  {item.song.artist}
                </Text>
              </View>
              {!current && (
                <>
                  <IconButton
                    icon={ArrowUp}
                    label={`Move ${item.song.title} earlier`}
                    disabled={absolute <= status.currentIndex + 1}
                    onPress={() => move(absolute, absolute - 1)}
                  />
                  <IconButton
                    icon={ArrowDown}
                    label={`Move ${item.song.title} later`}
                    disabled={absolute === entries.length - 1}
                    onPress={() => move(absolute, absolute + 1)}
                  />
                </>
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}
