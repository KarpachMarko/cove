import { useState } from 'react';
import { Keyboard, SectionList, View } from 'react-native';
import { useForm } from '@tanstack/react-form';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { z } from 'zod';
import { libraryMatch, PAGE_SIZE } from '@cove/core';
import type { Album, Artist, ProviderTrack, Song } from '@cove/core';
import type { RootStackParams } from '../../app/navigation-types';
import { useServices } from '../../app/session';
import { Button } from '../../components/ui/button';
import { Field, fieldError } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import {
  Loading,
  Notice,
  PageHeading,
  Screen,
} from '../../components/ui/screen';
import { EntityRow } from '../library/entity-row';
import { TrackRow } from '../playback/track-row';
import { usePlayback } from '../playback/playback-provider';
import { ProviderRow } from './provider-row';
type Row =
  | { kind: 'song'; data: Song }
  | { kind: 'album'; data: Album }
  | { kind: 'artist'; data: Artist }
  | { kind: 'provider'; data: ProviderTrack; match?: Song };
type Section = {
  title: string;
  data: Row[];
  loading: boolean;
  error: Error | null;
  retry: () => void;
  messages?: string[];
  enabled: boolean;
};
const schema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Enter a song, artist, or album.')
    .max(500, 'Keep your search under 500 characters.'),
});
export function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { library, providers, providerKey } = useServices();
  const playback = usePlayback();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'library' | 'providers'>('all');
  const form = useForm({
    defaultValues: { query: '' },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => {
      Keyboard.dismiss();
      setQuery(value.query.trim());
    },
  });
  // Keep library matching available in provider scope so known library recordings are deduplicated.
  const local = useInfiniteQuery({
    queryKey: ['library', 'search', query],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      library.search(query, pageParam, signal),
    getNextPageParam: (last, pages) =>
      last.song.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
    enabled: Boolean(query),
  });
  const deezer = useQuery({
    queryKey: ['providers', providerKey, 'search', 'deezer', query],
    queryFn: ({ signal }) => providers!.search(query, 'deezer', signal),
    enabled: Boolean(query && providers && scope !== 'library'),
  });
  const lossless = useQuery({
    queryKey: ['providers', providerKey, 'search', 'lossless', query],
    queryFn: ({ signal }) => providers!.search(query, 'lossless', signal),
    enabled: Boolean(query && providers && scope !== 'library'),
  });
  const songs = local.data?.pages.flatMap((page) => page.song) ?? [];
  const first = local.data?.pages[0];
  const libraryRows: Row[] = [
    ...songs.map((data) => ({ kind: 'song' as const, data })),
    ...(first?.album ?? []).map((data) => ({ kind: 'album' as const, data })),
    ...(first?.artist ?? []).map((data) => ({ kind: 'artist' as const, data })),
  ];
  const sections: Section[] = [
    {
      title: 'Your library',
      data: libraryRows,
      loading: local.isPending,
      error: local.error,
      retry: () => {
        void local.refetch();
      },
      enabled: Boolean(query && scope !== 'providers'),
    },
    ...[
      { title: 'Deezer', result: deezer },
      { title: 'lossless.am', result: lossless },
    ].map(({ title, result }): Section => ({
      title: `ZenSync · ${title}`,
      data: (result.data?.tracks ?? [])
        .filter((track) => scope === 'providers' || !libraryMatch(track, songs))
        .map((data) => ({
          kind: 'provider',
          data,
          match: libraryMatch(data, songs),
        })),
      loading: result.isPending,
      error: result.error,
      retry: () => {
        void result.refetch();
      },
      messages: result.data?.warnings,
      enabled: Boolean(query && providers && scope !== 'library'),
    })),
  ].filter((section) => section.enabled);
  return (
    <Screen>
      <SectionList<Row, Section>
        sections={sections}
        stickySectionHeadersEnabled={false}
        keyExtractor={(row) =>
          row.kind === 'provider'
            ? row.data.target
            : `${row.kind}:${row.data.id}`
        }
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <PageHeading
              title="Search"
              subtitle="Find a favorite. Discover something new."
            />
            <View className="gap-3 px-5 pb-4">
              <form.Field name="query">
                {(field) => (
                  <Field
                    label="Songs, artists, albums"
                    placeholder="Search your music"
                    autoCorrect={false}
                    returnKeyType="search"
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    onSubmitEditing={() => {
                      void form.handleSubmit();
                    }}
                    error={fieldError(field.state.meta.errors)}
                  />
                )}
              </form.Field>
              <View className="flex-row gap-2">
                <Button
                  className="flex-1"
                  onPress={() => {
                    void form.handleSubmit();
                  }}
                >
                  Search
                </Button>
                {query && (
                  <Button
                    variant="ghost"
                    onPress={() => {
                      form.reset();
                      setQuery('');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </View>
              <View className="flex-row flex-wrap gap-2">
                {(['all', 'library', 'providers'] as const).map((value) => (
                  <Button
                    key={value}
                    variant={scope === value ? 'secondary' : 'ghost'}
                    accessibilityState={{ selected: scope === value }}
                    onPress={() => setScope(value)}
                  >
                    {value === 'all'
                      ? 'All'
                      : value === 'library'
                        ? 'Library'
                        : 'Providers'}
                  </Button>
                ))}
              </View>
            </View>
            {!query && (
              <Notice
                title="Search your collection and beyond"
                message="Your library and each provider have their own results and connection status."
              />
            )}
            {query && !providers && scope !== 'library' && (
              <Notice
                title="Connect ZenSync for provider search"
                message="Add a server and API key in Connections."
              />
            )}
            {query && scope === 'providers' && local.isError && (
              <Notice
                title="Library matching is unavailable"
                message="Provider results are shown, but Cove cannot check them against your library right now."
              />
            )}
          </>
        }
        renderSectionHeader={({ section }) => (
          <View className="gap-2 pb-2 pt-5">
            <View className="px-5">
              <Text accessibilityRole="header" variant="heading">
                {section.title}
              </Text>
              {section.title !== 'Your library' && (
                <Text variant="caption">
                  Matching recordings in the loaded library results are shown in
                  Your library.
                </Text>
              )}
            </View>
            {section.loading ? (
              <Loading />
            ) : section.error ? (
              <Notice
                title="Search unavailable"
                message={section.error.message}
                retry={section.retry}
              />
            ) : !section.data.length ? (
              <Notice
                title={
                  section.title === 'Your library'
                    ? 'No library matches'
                    : 'No additional matches'
                }
              />
            ) : null}
            {section.messages?.map((message) => (
              <View key={message} className="px-5">
                <Text variant="caption">{message}</Text>
              </View>
            ))}
          </View>
        )}
        renderItem={({ item }) => {
          switch (item.kind) {
            case 'song':
              return (
                <TrackRow
                  song={item.data}
                  onPlay={() =>
                    playback.play(
                      songs,
                      songs.findIndex((song) => song.id === item.data.id),
                    )
                  }
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
                  subtitle="Artist"
                  onPress={() =>
                    navigation.navigate('Artist', {
                      id: item.data.id,
                      title: item.data.name,
                    })
                  }
                />
              );
            case 'provider':
              return <ProviderRow track={item.data} match={item.match} />;
          }
        }}
        renderSectionFooter={({ section }) =>
          section.title === 'Your library' && local.hasNextPage ? (
            <Button
              variant="ghost"
              loading={local.isFetchingNextPage}
              onPress={() => {
                void local.fetchNextPage();
              }}
            >
              Load more library matches
            </Button>
          ) : null
        }
      />
    </Screen>
  );
}
