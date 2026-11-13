import { FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../app/navigation-types';
import { useServices } from '../../app/session';
import { EntityRow } from './entity-row';
import {
  Loading,
  Notice,
  PageHeading,
  Screen,
} from '../../components/ui/screen';
export function ArtistScreen({ id }: { id: string }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { library } = useServices();
  const query = useQuery({
    queryKey: ['library', 'artist', id],
    queryFn: ({ signal }) => library.artist(id, signal),
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
          title="Could not load this artist"
          message={query.error.message}
          retry={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  return (
    <Screen>
      <FlatList
        data={query.data.album}
        keyExtractor={(album) => album.id}
        ListHeaderComponent={
          <PageHeading
            title={query.data.name}
            subtitle={`${query.data.album.length} albums`}
          />
        }
        ListEmptyComponent={<Notice title="No albums found" />}
        renderItem={({ item }) => (
          <EntityRow
            title={item.name}
            subtitle={`${item.songCount} songs`}
            artwork={library.artwork(item.coverArt, 160)}
            onPress={() =>
              navigation.navigate('Album', { id: item.id, title: item.name })
            }
          />
        )}
      />
    </Screen>
  );
}
