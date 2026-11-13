# Mobile architecture

## Decisions

Cove starts with **React Native, Expo SDK 58, and TypeScript**, targeting **iOS and Android only**. Expo generates the native projects from `app.config.ts`; generated `ios/` and `android/` folders are ignored. Development builds include the audio background service and secure-storage modules. Expo Go is not the playback acceptance environment.

**NativeWind 4 / Tailwind 3** provides `className` styling on native views. Shared native components in `components/ui` own buttons, text, text inputs, notices, and artwork. They follow shadcn's small, source-owned component approach. Browser shadcn/Radix components are not compatible with native views and are not installed. More complex native controls can adopt React Native Reusables primitives when needed. Babel and Metro use their supported CommonJS configuration entry points; application, Tailwind, Expo, lint, and test configuration use TypeScript.

**React Navigation** supplies native stacks, Library/Search bottom tabs, and the modal player. Playlists are reached from Library; the home screen has no additional app-name header. **React Native Keyboard Controller** supplies a shared focused-field-aware form scroll view for setup and connection editing on both platforms. The app does not currently expose URL query state; nuqs belongs in a future URL-based shell, rather than being forced into native component state.

**TanStack Query** owns service reads, pagination, connection/acquisition mutations, request identity, and caching. **TanStack Form with Zod** owns connection, search, and playlist-editor drafts. Shared native input fields display typed validation errors. Playback transport and queue position are native audio state, not a server-query cache.

## Ownership and dependency direction

```text
apps/mobile/src/
  app/                    Composition, providers, navigation, account caches
  components/ui/          Domain-independent native controls and typography
  features/
    connection/           Connect, validate, change accounts
    library/              Paged collections, details, library playback preparation
    playback/             Shared player state, track actions, mini/full player, queue
    playlists/            Separate editable order, explicit save, navigation guard
    search/               Source-specific results and acquisition requests
  platform/               Native audio and OS credential storage adapters
  theme/                  Native API color tokens
packages/core/src/
  models.ts               Shared domain types and runtime response validation
  services/               OpenSubsonic and ZenSync clients, safe HTTP transport
  playback/               Pure occurrence-aware queue and shuffle operations
  search/                 Conservative library recording matching
```

The mobile app imports `@cove/core`; core never imports React, React Native, Expo, or the mobile app. ESLint enforces that boundary and prevents UI primitives from depending on features. Feature screens compose shared controls; service details stay out of screen rendering code. Avoid introducing cross-feature global stores for server data.

A future Windows/macOS React Native app, Linux shell, or web app can consume the core package. It must supply an actual audio backend, OS credential store, navigation, and appropriate UI. Expo does not imply automatic desktop support. The default platform adapters fail closed; mobile selects the `.native.ts` implementations. Desktop-specific components can be added without moving native dependencies into core. A second UI package should be extracted when a second shell exists and establishes what is actually shared.

## Connections and account boundaries

- Server addresses must be HTTPS and may include a reverse-proxy subpath. URL credentials, queries, and fragments are rejected.
- Navidrome uses the OpenSubsonic `MD5(password + random salt)` token protocol. The password is discarded after connection; the token and salt remain sensitive credentials.
- Session credentials use Expo SecureStore (iOS Keychain / Android Keystore-backed encrypted storage), never plain preferences or an environment variable bundled into the app.
- ZenSync is optional and uses its bearer API key. Required scopes are `search:read` and `requests:create`.
- ZenSync can be edited in Connections without replacing Navidrome credentials. Leaving its replacement-key field empty keeps the saved key. Each saved provider connection gets a non-secret ID used in provider query and acquisition keys, so old results/receipts cannot appear under a changed URL or credential.
- Connection setup validates Navidrome with `ping`. ZenSync access is checked by each provider query and reports its own error; a failed provider does not prevent library playback.
- Every authenticated mount gets its own QueryClient. Disconnect clears the stored session, disposes audio, cancels reads, and discards the account cache. Late mutations can only update their discarded cache.
- Requests time out after 20 seconds and forward cancellation. HTTP, schema, and transport failures are sanitized rather than exposing credential-bearing URLs or raw response bodies. Authentication failures do not automatically retry.

## Service contracts

The Navidrome integration uses its supported OpenSubsonic API rather than private web endpoints:

| Operation              | Endpoint                                                        |
| ---------------------- | --------------------------------------------------------------- |
| Validate connection    | `ping`                                                          |
| Browse songs / search  | `search3`, with song offsets                                    |
| Recently added albums  | `getAlbumList2`, newest, with offsets                           |
| Album / artist detail  | `getAlbum`, `getArtist`                                         |
| Artists                | `getArtists` alphabetical index                                 |
| Playlists / detail     | `getPlaylists`, `getPlaylist`                                   |
| Persist playlist order | `createPlaylist` with `playlistId` and repeated `songId` fields |
| Artwork / playback     | `getCoverArt`, `stream`                                         |

`createPlaylist` is the protocol's existing-playlist replacement operation, not creation of a replacement playlist. It retains the playlist ID and metadata and preserves repeated song IDs. Cove only enables editing on playlists owned by the current user and not marked readonly. Saves are explicit, block further order edits while in flight, retain drafts on failure, and protect unsaved changes on navigation. The API does not provide an order revision precondition: simultaneous edits from another client remain last-write-wins, and need a service contract if conflict detection becomes required.

Song and album browsing is paginated. Album and playlist play use their complete detail response. Starting a whole-library listening session fetches all song pages first, with a preparing state, so playback does not stop at the loaded UI page. The artist index and playlist list are unpaginated because their OpenSubsonic endpoints are unpaginated. Large-library preparation and those indexes need device profiling.

ZenSync contracts were inspected in `~/SoftwareDev/zensync`, particularly `internal/app/api_keys.go`, `providers.go`, `requests.go`, and `web/src/lib/api.ts`:

- `GET /api/v2/search?q=…&provider=deezer|lossless&details=1`, bearer authentication.
- `POST /api/v2/requests`, JSON `{ target }`, bearer authentication and a stable `Idempotency-Key` reused on retry.
- Target identities stay `deezer:track:<id>` or `lossless:track:<source>:<id>`; source IDs must never be merged across providers.
- Provider search, provider availability, request acceptance, completed acquisition, and library playability are separate states. Cove currently offers submission and explicitly reports that a submitted request is not playable. It does not invent a streaming URL or pretend submission completed acquisition.
- A successful request and its retry identity survive virtualized row unmounts within the authenticated session. This receipt is not a durable cross-launch acquisition tracker. Status polling and acquisition-to-library identity mapping are still needed for that feature.
- Provider previews are not implemented. The current bearer allowlist does not authorize ZenSync's provider audio proxy. If previews become required, add and review the appropriate scoped API in a separate ZenSync PR first.
- Any newly required service capability must be added as a proper backend contract in a separate PR, rather than approximated by scraping, private endpoints, or client-side workarounds.

Library, Deezer, and lossless.am queries fail and retry independently. Search scopes are native state. Known matches in loaded library search pages are deduplicated in All; Providers scope can play a known match from the library. Matching requires normalized title, artist, album, and a two-second duration tolerance. This is conservative metadata matching, not an authoritative recording identity map. Unloaded library pages can contain additional duplicates. Exact cross-service deduplication/readiness needs a supported identity contract before it can be guaranteed.

## Audio and queue

Expo Audio's native playlist is the playback authority, including automatic track progression. The application does not depend on a JavaScript end-of-track callback running while suspended. The adapter enables background playback, silent-mode playback, interruption handling, and system lock-screen controls. Microphone permissions and background recording are disabled.

Queue entries have unique occurrence keys independent of song IDs. Play next inserts immediately after the active occurrence; Play last appends. Only upcoming occurrences can move, so queue reordering never replaces the currently playing audio. Full player, mini-player, and queue subscribe to one provider. The playlist editor owns its own draft and never mutates the listening queue. Horizontal track swipes and a visible action menu offer the same queue commands; reorder arrows offer labeled, accessible controls.

Native playlists retain the entire queue. JS updates full lock-screen metadata when index events are delivered; actual background metadata refresh, media-button behavior, interruptions, and end-of-queue behavior must be checked on both platforms. Native seek uses seconds and only enables after a duration is loaded. There is no automatic radio continuation or repeat queue.

Queue state is session-local. Cross-launch queue restoration, downloads, lyrics, casting, recommendations, playlist creation/renaming/deletion, and provider previews are outside this implementation.

## References

- [Expo Audio](https://docs.expo.dev/versions/v58.0.0/sdk/audio/)
- [Expo SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/)
- [NativeWind installation](https://www.nativewind.dev/docs/getting-started/installation)
- [OpenSubsonic API](https://opensubsonic.github.io/)
