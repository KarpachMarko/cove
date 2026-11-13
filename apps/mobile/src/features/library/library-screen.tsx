import { FlatList, Pressable, View } from 'react-native';
import { ChevronRight, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../app/navigation-types';
import { useServices } from '../../app/session';
import { useAlbums } from './queries';
import { EntityRow } from './entity-row';
import { Text } from '../../components/ui/text';
import { Button, IconButton } from '../../components/ui/button';
import {
  Loading,
  Notice,
  PageHeading,
  Screen,
} from '../../components/ui/screen';
import { colors } from '../../theme/tokens';
const collections = [
  { kind: 'songs', title: 'Songs' },
  { kind: 'albums', title: 'Albums' },
  { kind: 'artists', title: 'Artists' },
  { kind: 'playlists', title: 'Playlists' },
] as const;
export function LibraryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const albums = useAlbums();
  const { library } = useServices();
  return (
    <Screen>
      <FlatList
        data={albums.data?.pages.flat() ?? []}
        keyExtractor={(album) => album.id}
        refreshing={albums.isRefetching}
        onRefresh={() => {
          void albums.refetch();
        }}
        ListHeaderComponent={
          <>
            <PageHeading
              title="Library"
              subtitle="A home for all your music."
              action={
                <IconButton
                  icon={Settings}
                  label="Connection settings"
                  onPress={() => navigation.navigate('Connections')}
                />
              }
            />
            {collections.map((collection) => (
              <Pressable
                key={collection.kind}
                onPress={() => navigation.navigate('Collection', collection)}
                accessibilityRole="button"
                className="min-h-14 flex-row items-center justify-between border-b border-line px-5 py-3"
              >
                <Text className="text-xl text-primary">{collection.title}</Text>
                <ChevronRight color={colors.primary} size={20} />
              </Pressable>
            ))}
            <View className="px-5 pb-2 pt-7">
              <Text variant="heading">Recently added</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          albums.isPending ? (
            <Loading />
          ) : albums.isError ? (
            <Notice
              title="Could not load albums"
              message={albums.error.message}
              retry={() => {
                void albums.refetch();
              }}
            />
          ) : (
            <Notice
              title="Your library starts here"
              message="Albums added to Navidrome will appear here."
            />
          )
        }
        renderItem={({ item }) => (
          <EntityRow
            title={item.name}
            subtitle={item.artist}
            artwork={library.artwork(item.coverArt, 160)}
            onPress={() =>
              navigation.navigate('Album', { id: item.id, title: item.name })
            }
          />
        )}
        ListFooterComponent={
          albums.hasNextPage ? (
            <Button
              variant="ghost"
              loading={albums.isFetchingNextPage}
              onPress={() => {
                void albums.fetchNextPage();
              }}
            >
              Load more albums
            </Button>
          ) : undefined
        }
      />
    </Screen>
  );
}
