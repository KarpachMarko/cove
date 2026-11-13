import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PAGE_SIZE } from '@cove/core';
import { useServices } from '../../app/session';
export function useSongs(enabled = true) {
  const { library } = useServices();
  return useInfiniteQuery({
    queryKey: ['library', 'songs'],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => library.songs(pageParam, signal),
    getNextPageParam: (last, pages) =>
      last.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
    enabled,
  });
}
export function useAlbums(enabled = true) {
  const { library } = useServices();
  return useInfiniteQuery({
    queryKey: ['library', 'albums'],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => library.albums(pageParam, signal),
    getNextPageParam: (last, pages) =>
      last.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
    enabled,
  });
}
export function useArtists(enabled = true) {
  const { library } = useServices();
  return useQuery({
    queryKey: ['library', 'artists'],
    queryFn: ({ signal }) => library.artists(signal),
    enabled,
  });
}
export function usePlaylists(enabled = true) {
  const { library } = useServices();
  return useQuery({
    queryKey: ['library', 'playlists'],
    queryFn: ({ signal }) => library.playlists(signal),
    enabled,
  });
}
