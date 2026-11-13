# ZenSync mobile concepts

Five Apple Music inspired visual directions, ten starting screens. Open `index.html` for the interactive gallery. It is self-contained and needs no server. The PNG exports in `exports/` show both screens for each direction.

| Direction | Library treatment | Second screen |
| --- | --- | --- |
| Familiar | Categories and recently added albums | Search across your library and ZenSync providers |
| Artwork | Album shelf and category filters | Album detail with revealed queue actions |
| Focus | Dense song list | Playback queue with ordering controls |
| Collections | Personal playlists | Playlist editing with ordering controls |
| Immersive | Dark artwork-led collection | Full player |

Recommended starting point: Familiar, with Artwork's album detail and Focus's queue. The variants share the same core navigation: Library, Playlists, Search, and a persistent mini-player.

## Preview interactions

- Choose a direction using the gallery buttons. Toggle iPhone/Android to compare the platform shell; these are design concepts rather than native platform implementations.
- Navigate songs, albums, artists, playlists, search, player, and queue.
- Tap Play/Shuffle, pause/resume, skip tracks, and open track menus. Playback state is simulated; no audio plays.
- Swipe a track horizontally, or open its menu, for Play next and Play last.
- Reorder playlist and queue songs with the arrow controls or desktop drag-and-drop. Playlist order and queue order are independent.
- Filter the sample search between All, Your library, and Providers. The example query is fixed, and provider additions are simulated. Real search must query both sources, display their loading/error states independently, deduplicate matches already in the library, and distinguish provider availability from playback readiness.
- Settings, creation, sort selection, and device selection are illustrative entry points. No backend calls or account changes occur.

All content is fictional sample music. The concepts contain no recommendations, generated playlists, radio, or automatic queue continuation. In a native implementation, artwork color, dynamic type, platform safe areas, touch target sizing, and accessibility need platform-specific validation.

## Design references and assets

Apple Music library categories, mini-player/full player hierarchy, and queue controls informed the designs:

- https://support.apple.com/guide/iphone/iph0138fb328/ios
- https://support.apple.com/guide/iphone/queue-up-your-music-ipha4521ef7d/ios
- https://support.apple.com/en-ie/109336

Fictional cover art uses landscape photographs from Unsplash, stored under `assets/` and embedded in the HTML. The original source IDs are: `photo-1518837695005-2083093ee35b`, `photo-1470252649378-9c29740c9fa8`, `photo-1519608487953-e999c86e7455`, `photo-1441974231531-c6227db76b6e`, and `photo-1470770841072-f978cf4d019e`. Icons are generated from the project's existing Lucide library. No image-generation tool was used.

## Verification

Checked all five directions and ten screens in Chromium, including artwork loading, platform switching, queue and playlist ordering, search scope filters, Play next, and a 360px layout without horizontal overflow. Application code and dependencies were not changed.
