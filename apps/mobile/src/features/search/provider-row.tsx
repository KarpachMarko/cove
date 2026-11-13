import { View } from 'react-native';
import { useMutation, useMutationState } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import type { ProviderTrack, Song } from '@cove/core';
import { useServices } from '../../app/session';
import { usePlayback } from '../playback/playback-provider';
import { Artwork } from '../../components/ui/artwork';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
export function ProviderRow({
  track,
  match,
}: {
  track: ProviderTrack;
  match?: Song;
}) {
  const { providers, providerKey } = useServices();
  const playback = usePlayback();
  const mutationKey = ['providers', providerKey, 'request', track.target];
  // Retain request identity/status across virtualized row unmounts and search changes.
  // The authenticated QueryClient owns this state and is discarded on disconnect.
  const previous = useMutationState({
    filters: { mutationKey, exact: true },
    select: (mutation) => ({
      key:
        typeof mutation.state.variables === 'string'
          ? mutation.state.variables
          : undefined,
      status: mutation.state.status,
      error: mutation.state.error,
    }),
  }).at(-1);
  const request = useMutation({
    mutationKey,
    gcTime: Infinity,
    mutationFn: (key: string) => {
      if (!providers) throw new Error('Connect ZenSync first.');
      return providers.requestTrack(track.target, key);
    },
  });
  const submitted = previous?.status === 'success';
  return (
    <View className="gap-3 border-b border-line px-5 py-4">
      <View className="flex-row items-center gap-3">
        <Artwork uri={track.artwork} />
        <View className="flex-1 gap-1">
          <Text variant="label">{track.title}</Text>
          <Text variant="caption">
            {track.artist} · {track.album}
          </Text>
          <Text variant="caption">
            {track.provider === 'deezer' ? 'Deezer' : 'lossless.am'} ·{' '}
            {match ? 'In your library' : 'Provider result'}
          </Text>
        </View>
      </View>
      {match ? (
        <Button variant="secondary" onPress={() => playback.play([match])}>
          Play from library
        </Button>
      ) : (
        <Button
          variant="secondary"
          loading={previous?.status === 'pending'}
          disabled={submitted}
          onPress={() => request.mutate(previous?.key ?? Crypto.randomUUID())}
        >
          {submitted ? 'Request submitted' : 'Request for library'}
        </Button>
      )}
      {submitted && !match && (
        <Text accessibilityLiveRegion="polite" variant="caption">
          Submitted to ZenSync for approval and acquisition. This is not
          playable yet. Refresh your library after acquisition completes.
        </Text>
      )}
      {previous?.error && (
        <Text accessibilityRole="alert" className="text-primary">
          {previous.error.message}
        </Text>
      )}
    </View>
  );
}
