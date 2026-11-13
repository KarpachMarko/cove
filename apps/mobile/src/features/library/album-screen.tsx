import { FlatList, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../app/session';
import { usePlayback } from '../playback/playback-provider';
import { TrackRow } from '../playback/track-row';
import { Artwork } from '../../components/ui/artwork';
import { Button } from '../../components/ui/button';
import {
  Loading,
  Notice,
  PageHeading,
  Screen,
} from '../../components/ui/screen';
export function AlbumScreen({ id }: { id: string }) {
  const { library } = useServices();
  const playback = usePlayback();
  const query = useQuery({
    queryKey: ['library', 'album', id],
    queryFn: ({ signal }) => library.album(id, signal),
  });
  if (query.isPending)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (query.isError)
    return (
      <Screen>
        <Notice
          title="Could not load this album"
          message={query.error.message}
          retry={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  const album = query.data;
  return (
    <Screen>
      <FlatList
        data={album.song}
        keyExtractor={(song, index) => `${song.id}:${index}`}
        ListHeaderComponent={
          <>
            <View className="mx-auto w-full max-w-sm px-7 pt-4">
              <Artwork
                uri={library.artwork(album.coverArt, 800)}
                size="large"
              />
            </View>
            <PageHeading
              title={album.name}
              subtitle={`${album.artist} · ${album.song.length} songs`}
            />
            <View className="flex-row gap-3 px-5 pb-5">
              <Button
                className="flex-1"
                disabled={!album.song.length || playback.busy}
                onPress={() => playback.play(album.song)}
              >
                Play
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                disabled={!album.song.length || playback.busy}
                onPress={() => playback.play(album.song, 0, true)}
              >
                Shuffle
              </Button>
            </View>
          </>
        }
        ListEmptyComponent={<Notice title="This album has no tracks" />}
        renderItem={({ item, index }) => (
          <TrackRow
            song={item}
            onPlay={() => playback.play(album.song, index)}
          />
        )}
      />
    </Screen>
  );
}
