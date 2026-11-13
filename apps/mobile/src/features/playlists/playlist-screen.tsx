import { Alert, FlatList, View } from 'react-native';
import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { moveItem, songSchema } from '@cove/core';
import type { PlaylistDetail } from '@cove/core';
import { useServices, useSession } from '../../app/session';
import { usePlayback } from '../playback/playback-provider';
import { TrackRow } from '../playback/track-row';
import { Button, IconButton } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import {
  Loading,
  Notice,
  PageHeading,
  Screen,
} from '../../components/ui/screen';
export function PlaylistScreen({ id }: { id: string }) {
  const { library } = useServices();
  const query = useQuery({
    queryKey: ['library', 'playlist', id],
    queryFn: ({ signal }) => library.playlist(id, signal),
    staleTime: Infinity,
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
          title="Could not load this playlist"
          message={query.error.message}
          retry={() => {
            void query.refetch();
          }}
        />
      </Screen>
    );
  return <PlaylistEditor key={id} playlist={query.data} />;
}
function PlaylistEditor({ playlist }: { playlist: PlaylistDetail }) {
  const { library } = useServices();
  const { session } = useSession();
  const playback = usePlayback();
  const cache = useQueryClient();
  const writable =
    !playlist.readonly && playlist.owner === session?.navidrome.username;
  // Occurrence keys retain duplicate songs. Draft changes never write to the playback queue.
  const initial = playlist.entry.map((song, index) => ({
    song,
    key: `${song.id}:${index}`,
  }));
  const save = useMutation({
    mutationFn: async (entries: typeof initial) => {
      await library.savePlaylistOrder(
        playlist.id,
        entries.map((entry) => entry.song.id),
      );
      cache.setQueryData(['library', 'playlist', playlist.id], {
        ...playlist,
        entry: entries.map((entry) => entry.song),
      });
      await cache.invalidateQueries({ queryKey: ['library', 'playlists'] });
    },
  });
  const form = useForm({
    defaultValues: { entries: initial },
    validators: {
      onSubmit: z.object({
        entries: z.array(
          z.object({
            key: z.string(),
            song: songSchema.extend({
              artist: z.string(),
              album: z.string(),
              duration: z.number(),
            }),
          }),
        ),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await save.mutateAsync(value.entries);
        form.reset({ entries: value.entries });
      } catch {
        /* Retain the draft and expose the retry below. */
      }
    },
  });
  const navigation = useNavigation();
  const dirty = useStore(form.store, (state) => state.isDirty);
  usePreventRemove(dirty || save.isPending, ({ data }) => {
    if (save.isPending) {
      Alert.alert(
        'Saving playlist',
        'Wait for the save to finish before leaving.',
      );
      return;
    }
    Alert.alert(
      'Discard playlist changes?',
      'Your unsaved order will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });
  return (
    <Screen>
      <form.Field name="entries">
        {(field) => (
          <FlatList
            data={field.state.value}
            keyExtractor={(entry) => entry.key}
            ListHeaderComponent={
              <>
                <PageHeading
                  title={playlist.name}
                  subtitle={`${playlist.entry.length} songs · ${writable ? 'Reorder and save your playlist' : 'Read-only playlist'}`}
                />
                <View className="flex-row gap-3 px-5 pb-4">
                  <Button
                    className="flex-1"
                    disabled={!field.state.value.length || playback.busy}
                    onPress={() =>
                      playback.play(
                        field.state.value.map((entry) => entry.song),
                      )
                    }
                  >
                    Play
                  </Button>
                  <Button
                    className="flex-1"
                    variant="secondary"
                    disabled={!field.state.value.length || playback.busy}
                    onPress={() =>
                      playback.play(
                        field.state.value.map((entry) => entry.song),
                        0,
                        true,
                      )
                    }
                  >
                    Shuffle
                  </Button>
                </View>
                {writable && (
                  <View className="gap-2 px-5 pb-4">
                    <form.Subscribe
                      selector={(state) => ({
                        dirty: state.isDirty,
                        submitting: state.isSubmitting,
                      })}
                    >
                      {(state) => (
                        <View className="flex-row gap-2">
                          <Button
                            className="flex-1"
                            disabled={!state.dirty}
                            loading={state.submitting}
                            onPress={() => {
                              void form.handleSubmit();
                            }}
                          >
                            Save order
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={!state.dirty || state.submitting}
                            onPress={() => {
                              form.reset();
                              save.reset();
                            }}
                          >
                            Discard
                          </Button>
                        </View>
                      )}
                    </form.Subscribe>
                    {save.error && (
                      <Text accessibilityRole="alert" className="text-primary">
                        {save.error.message} Your order is kept here; retry Save
                        order.
                      </Text>
                    )}
                    {save.isSuccess && (
                      <Text accessibilityLiveRegion="polite" variant="caption">
                        Playlist order saved.
                      </Text>
                    )}
                  </View>
                )}
              </>
            }
            ListEmptyComponent={<Notice title="This playlist is empty" />}
            renderItem={({ item, index }) => (
              <TrackRow
                song={item.song}
                onPlay={() =>
                  playback.play(
                    field.state.value.map((entry) => entry.song),
                    index,
                  )
                }
                trailing={
                  writable ? (
                    <>
                      <IconButton
                        icon={ArrowUp}
                        label={`Move ${item.song.title} earlier in playlist`}
                        disabled={index === 0 || save.isPending}
                        onPress={() => {
                          save.reset();
                          field.handleChange(
                            moveItem(field.state.value, index, index - 1),
                          );
                        }}
                      />
                      <IconButton
                        icon={ArrowDown}
                        label={`Move ${item.song.title} later in playlist`}
                        disabled={
                          index === field.state.value.length - 1 ||
                          save.isPending
                        }
                        onPress={() => {
                          save.reset();
                          field.handleChange(
                            moveItem(field.state.value, index, index + 1),
                          );
                        }}
                      />
                    </>
                  ) : undefined
                }
              />
            )}
          />
        )}
      </form.Field>
    </Screen>
  );
}
