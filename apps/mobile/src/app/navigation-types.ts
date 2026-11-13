export type RootStackParams = {
  Home: undefined;
  Collection: {
    kind: 'songs' | 'albums' | 'artists' | 'playlists';
    title: string;
  };
  Album: { id: string; title: string };
  Artist: { id: string; title: string };
  Playlist: { id: string; title: string };
  Player: undefined;
  Queue: undefined;
  Connections: undefined;
};
export type TabParams = {
  Library: undefined;
  Search: undefined;
};
