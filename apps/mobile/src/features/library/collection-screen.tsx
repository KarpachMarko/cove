import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../app/navigation-types';
import type { Album, Artist, Playlist, Song } from '@cove/core';
import { useServices } from '../../app/session';
import { useAlbums, useArtists, usePlaylists, useSongs } from './queries';
import { EntityRow } from './entity-row';
import { TrackRow } from '../playback/track-row';
import { useSongPlayback } from './use-song-playback';
import { Button } from '../../components/ui/button';
import {
  Loading,
  Notice,
  PageHeading,
  Screen,
} from '../../components/ui/screen';
type Row =
  | { kind: 'song'; data: Song }
  | { kind: 'album'; data: Album }
  | { kind: 'artist'; data: Artist }
  | { kind: 'playlist'; data: Playlist };
export function CollectionScreen({
  kind,
  title,
}: RootStackParams['Collection']) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { library } = useServices();
  const playSongs = useSongPlayback();
  const songs = useSongs(kind === 'songs');
  const albums = useAlbums(kind === 'albums');
  const artists = useArtists(kind === 'artists');
  const playlists = usePlaylists(kind === 'playlists');
  const query =
    kind === 'songs'
      ? songs
      : kind === 'albums'
        ? albums
        : kind === 'artists'
          ? artists
          : playlists;
  const songData = songs.data?.pages.flat() ?? [];
  const rows: Row[] =
    kind === 'songs'
      ? songData.map((data) => ({ kind: 'song', data }))
      : kind === 'albums'
        ? (albums.data?.pages.flat() ?? []).map((data) => ({
            kind: 'album',
            data,
          }))
        : kind === 'artists'
          ? (artists.data ?? []).map((data) => ({ kind: 'artist', data }))
          : (playlists.data ?? []).map((data) => ({ kind: 'playlist', data }));
  const more =
    kind === 'songs' ? songs : kind === 'albums' ? albums : undefined;
  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.data.id}
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        ListHeaderComponent={
          <PageHeading
            title={title}
            subtitle={
              playSongs.isPending
                ? 'Preparing your library for playback…'
                : undefined
            }
            action={
              kind === 'songs' ? (
                <Button
                  variant="secondary"
                  loading={playSongs.isPending}
                  disabled={!songData.length}
                  onPress={() => playSongs.mutate({ shuffle: true })}
                >
                  Shuffle
                </Button>
              ) : undefined
            }
          />
        }
        ListEmptyComponent={
          query.isPending ? (
            <Loading />
          ) : query.isError ? (
            <Notice
              title={`Could not load ${title.toLowerCase()}`}
              message={query.error.message}
              retry={() => {
                void query.refetch();
              }}
            />
          ) : (
            <Notice
              title={`No ${title.toLowerCase()} yet`}
              message="Your Navidrome collection will appear here."
            />
          )
        }
        renderItem={({ item }) => {
          switch (item.kind) {
            case 'song':
              return (
                <TrackRow
                  song={item.data}
                  onPlay={() => {
                    if (!playSongs.isPending)
                      playSongs.mutate({ startId: item.data.id });
                  }}
                />
              );
            case 'album':
              return (
                <EntityRow
                  title={item.data.name}
                  subtitle={item.data.artist}
                  artwork={library.artwork(item.data.coverArt, 160)}
                  onPress={() =>
                    navigation.navigate('Album', {
                      id: item.data.id,
                      title: item.data.name,
                    })
                  }
                />
              );
            case 'artist':
              return (
                <EntityRow
                  title={item.data.name}
                  subtitle={`${item.data.albumCount} albums`}
                  artwork={library.artwork(item.data.coverArt, 160)}
                  onPress={() =>
                    navigation.navigate('Artist', {
                      id: item.data.id,
                      title: item.data.name,
                    })
                  }
                />
              );
            case 'playlist':
              return (
                <EntityRow
                  title={item.data.name}
                  subtitle={`${item.data.songCount} songs · ${item.data.owner}`}
                  artwork={library.artwork(item.data.coverArt, 160)}
                  onPress={() =>
                    navigation.navigate('Playlist', {
                      id: item.data.id,
                      title: item.data.name,
                    })
                  }
                />
              );
          }
        }}
        ListFooterComponent={
          <>
            {playSongs.error && (
              <Notice
                title="Could not prepare playback"
                message={playSongs.error.message}
              />
            )}
            {query.isError && rows.length > 0 && (
              <Notice
                title="Could not refresh this collection"
                message={query.error.message}
                retry={() => {
                  void query.refetch();
                }}
              />
            )}
            {more?.hasNextPage && (
              <Button
                variant="ghost"
                loading={more.isFetchingNextPage}
                onPress={() => {
                  void more.fetchNextPage();
                }}
              >
                Load more
              </Button>
            )}
          </>
        }
      />
    </Screen>
  );
}
