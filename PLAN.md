# Cove — initial scope and implementation plan

## Purpose

Build a personal music client for iPhone and Android using the existing Navidrome and ZenSync setup. Phase one should make browsing a collection, playing music, managing the playback queue, and searching feel polished and direct.

This plan captures the requirements and design exploration from the “Design Music App UI Variants” thread on 2026-11-13. It distinguishes requested functionality from proposed implementation steps. The first React Native implementation is now in this repository; release acceptance still requires real-service and device validation.

## Implementation status — 2026-11-13

The user selected React Native, with iPhone and Android first and future desktop support kept possible through clear platform boundaries. The application now uses Expo, NativeWind/Tailwind, React Navigation, TanStack Query, TanStack Form, and Zod in a pnpm workspace. Shared service/domain logic lives in `packages/core`; native UI, secure storage, and audio live in `apps/mobile`.

Implemented: connection/secure session storage; library browsing and detail screens; native audio playlist adapter with mini/full player and queue; Play next/Play last and upcoming reordering; independent playlist drafts with persisted ordering and failed-save recovery; independent library/Deezer/lossless.am search with acquisition submission. The Familiar/pink UI is the working baseline, not a final icon decision.

The integration uses existing supported OpenSubsonic and inspected ZenSync bearer endpoints. Missing service capabilities must be added in a separate backend PR, not hidden behind client workarounds. Durable acquisition tracking, authoritative library/provider identity mapping, and device verification remain open. No live server or device acceptance is claimed.

See [architecture](docs/architecture/mobile.md), [developer setup](README.md), and [validation checklist](docs/validation.md). The acceptance criteria below remain release criteria, rather than being marked complete by scaffolding or bundle checks.

## Agreed product scope

### Library

- Browse all songs, albums, artists, and playlists in the user's library.
- Open album, artist, and playlist detail views and play their tracks.
- Keep the focus on the user's collection rather than recommendation feeds.

### Playback

- Play songs in their normal order or shuffle the selected collection.
- Provide a persistent mini-player and a full now-playing view.
- Support play/pause and previous/next controls; validate seeking and other player controls during playback implementation.
- Preserve understandable playback context when navigating between views.

### Queue and track actions

- Show the current track and upcoming playback queue.
- Reorder upcoming tracks.
- Offer **Play next** to insert immediately after the current track and **Play last** to append to the queue.
- Make both actions available by swiping tracks in song lists, albums, playlists, and other track views, with a visible menu alternative.
- Keep queue edits independent from the saved order of a playlist.

### Playlists

- Browse playlists and their tracks.
- Change and persist track order within a playlist.
- Play or shuffle a playlist, or add individual tracks to the queue.
- Confirm whether playlist creation, renaming, adding tracks, and deletion belong in the first release; the prototype's entry points do not establish those requirements.

### Search

- Search both the user's Navidrome library and the external sources exposed through ZenSync providers.
- Clearly distinguish **Your library** and **ZenSync providers**, with All/Library/Providers scope filters as explored in the mockups.
- Handle loading, empty results, and errors independently for the two sources.
- Deduplicate matches already in the library and distinguish provider availability from actual playback readiness.
- Define the provider-result acquisition flow against ZenSync's actual API before implementing add-to-library or playback actions. The prototype simulates these actions.

## Design direction

- Reference Apple Music on both iPhone and Android: large headings, artwork, straightforward lists, and a persistent player.
- Use the pink direction requested for Cove's additional icon exploration.
- Retain all five explored directions: Familiar, Artwork, Focus, Collections, and Immersive. Each has two starting screens and navigation to the other core views.
- The earlier recommendation was Familiar as the foundation, Artwork's album detail, and Focus's queue. This is a proposal, not a final selection.
- The user accepted the designs as a useful starting point, with minor adjustments to follow. No single variant or final icon was selected.
- Validate safe areas, touch targets, text scaling, contrast, screen-reader labels, gesture alternatives, and platform conventions on both platforms.

## Outside phase one

- Personalized recommendations, smart playlists, “made for you” feeds, and similar discovery features.
- Radio and automatic queue continuation are absent from the current concepts and are not planned for the initial scope.
- Offline downloads, lyrics, casting, social features, and advanced audio features have no agreed requirement; do not add them to the initial release without a scope decision.

## Implementation sequence

1. **Confirm architecture and service contracts.** Choose the mobile framework and supported OS versions; inspect Navidrome and ZenSync authentication, library, streaming, playlist, provider-search, and acquisition APIs. Resolve what “local library” means for the client; the current scope means the user's library, not an offline download feature. Define secure credential storage and server configuration.
2. **Finalize the first UI baseline.** Select the starting design and Cove icon, define shared typography/colors/spacing, and map navigation and player states. Keep alternate concepts as reference material. Prepare platform icon packaging after selection.
3. **Create the application foundation.** Scaffold the chosen stack, typed service clients, navigation, connection/settings flow, error handling, and secure session storage. Establish appropriate lint, typecheck, build, and test scripts using pnpm where JavaScript is involved.
4. **Connect the library.** Implement songs, albums, artists, and playlists with artwork, detail views, pagination where needed, and loading/empty/error states.
5. **Implement real playback and queue behavior.** Add streaming, mini/full player synchronization, normal and shuffle playback, queue ordering, and Play next/Play last actions. Validate background playback, interruptions, and lock-screen/media controls as necessary mobile playback behavior.
6. **Persist playlist ordering.** Connect reorder interactions to the service, handle failed saves, and verify that queue edits do not mutate playlists.
7. **Connect combined search.** Add typed library/provider queries, scope filters, source-specific status, deduplication, and the agreed acquisition/readiness flow.
8. **Validate the initial release.** Test core journeys on iPhone and Android, including accessibility, network failures, reconnecting, interrupted playback, and large collections. Record any remaining scope decisions before release packaging.

## Development conventions

Follow [AGENTS.md](AGENTS.md). Where the chosen stack supports them:

- Use pnpm for JavaScript package management and scripts, and prefer TypeScript application/configuration files.
- Use TanStack React Query for API reads, mutations, pagination, polling, and cache management.
- Use TanStack Form with Zod for forms, including search and autosave editors, with reusable typed field components around shadcn controls where applicable.
- Use nuqs for URL query state and serialization when URL-based navigation is present.
- Use other TanStack libraries when they suit a feature; avoid TypeScript `any`.
- Keep Tailwind styling in React `className` values, using shared components. Limit global CSS to framework imports, theme tokens, document defaults, and animation definitions.

The archived standalone HTML mockups remain design references. The production scaffold is React Native with Expo; browser-only conventions apply only to a future web shell.

## Phase-one acceptance criteria

- A user can connect to the configured services and browse real songs, albums, artists, and playlists on both target platforms.
- Normal and shuffle playback work, and mini-player, full player, and queue stay in sync.
- Play next and Play last work from track views through gestures and accessible controls.
- Queue order can change without changing playlist order; saved playlist reordering survives reloading.
- Search returns clearly attributed library and provider results with independent failure/loading handling and accurate readiness states.
- Core flows remain usable with larger text, screen readers, network errors, and mobile playback interruptions.
- Recommendation feeds and smart playlists are absent from phase one.

## Existing deliverables

The transferred design archive contains ten starting mockup screens across five variants, five PNG exports, five source artwork images, twenty editable SVG app-icon concepts, two ZIP bundles, three HTML galleries, and their original notes. See [the design inventory](docs/design/README.md) for locations and provenance.
