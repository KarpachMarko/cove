import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../../app/session';
import { usePlayback } from '../playback/playback-provider';
export function useSongPlayback() {
  const { library } = useServices();
  const playback = usePlayback();
  const cache = useQueryClient();
  // Browsing stays paginated, but a library listening session includes every song,
  // rather than silently stopping at the last visible page.
  const prepare = useMutation({
    mutationFn: async ({
      startId,
      shuffle,
    }: {
      startId?: string;
      shuffle?: boolean;
    }) => {
      const songs = await cache.fetchQuery({
        queryKey: ['library', 'playable-songs'],
        staleTime: 0,
        queryFn: ({ signal }) => library.allSongs(signal),
      });
      playback.play(
        songs,
        Math.max(
          0,
          songs.findIndex((song) => song.id === startId),
        ),
        shuffle,
      );
    },
  });
  return prepare;
}
