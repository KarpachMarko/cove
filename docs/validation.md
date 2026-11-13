# Validation and release checklist

## Automated verification

Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm --filter @cove/mobile exec expo install --check
pnpm --filter @cove/mobile export
```

`pnpm check` runs strict TypeScript checks, lint (including platform dependency boundaries), core regression tests, and formatting. The native export produces Hermes bundles for **both iOS and Android**. It does not compile Swift/Kotlin, install an app, or validate a device.

The regression tests cover protocol auth without password persistence, reverse-proxy paths, song pagination and full-library preparation, empty collections, duplicate playlist entries and saves, HTTP and API-level failures, sanitized errors, cancellation/timeouts, provider identities and idempotency headers, conservative recording matching, queue insertion/reordering, and shuffle preservation.

No live server credentials were supplied. Service verification uses fixtures matching the inspected contracts. An ARM64 Android debug APK has now compiled successfully on this Linux host using JDK 17, SDK 37.0, Build Tools 37.0.0, NDK 27.1.12297006, and CMake 3.22.1. Its APK signature and package metadata were checked. Real library contents, provider availability, acquisition, iOS native compilation, and device playback remain unverified. ADB was installed before a device was available. The later Android regression checks below were performed on a connected phone; full physical-device release acceptance remains open. See [Android device development](android-development.md) for the installed toolchain and USB run commands.

## Required device checks before release

Use custom development builds on at least one supported iPhone and Android device:

- Connect over HTTPS, including a server mounted under a path. Reject invalid credentials; recover from a changed password or revoked ZenSync key.
- Kill and reopen the app; restore the secure connection. Disconnect while requests are in flight, reconnect to a different account, and verify no old artwork/data/queue appears.
- Browse and refresh songs/albums/artists/playlists, including an empty library, repeated tracks, missing artwork, and a large collection. Check pagination and full-library playback preparation.
- Play and shuffle albums, the song library, and playlists. Navigate with the mini-player, open the full player, seek, and verify the queue matches the audible track.
- Lock the device for more than five minutes and let several tracks advance. Verify play/pause/previous/next/seek, artwork/metadata updates, notification/Control Center, Bluetooth headset controls, and no playback after the queue ends.
- Test incoming calls, other audio apps, headphone removal, audio route changes, background/foreground transitions, and the platforms' expected behavior when force-closing the app.
- Test stream failures, buffering, loss of connectivity mid-track, and recovery. Ensure a server/codec error is understandable and recoverable; Expo's status surface and native errors need evaluation on device.
- Swipe tracks both ways and use the visible menu. Insert duplicate songs; move upcoming tracks. Verify the active audio does not restart, and saved playlists remain unchanged.
- Reorder a playlist containing duplicate songs. Save and reopen; compare with Navidrome. Force a failed save and retry the retained draft. Back navigation must protect unsaved changes. Owned/readonly playlist permissions must be respected.
- Search Library/Providers/All. Disable one provider and Navidrome independently. Check attribution, known matches, scope changes, empty results, request failures, and idempotent retry. A submitted acquisition must never be labeled ready to play.
- Check VoiceOver/TalkBack, larger font settings, light appearance, contrast, keyboard dismissal, narrow screens, safe areas, device rotation, and touch targets.

## Remaining product/integration decisions

- Select the final Cove icon and prepare adaptive/store artwork; no explored icon has been declared final.
- Decide whether durable acquisition tracking and exact recording identity mapping are needed in the first release. Add missing scoped service endpoints in a separate ZenSync PR before implementing dependent client behavior.
- Establish an explicit minimum-OS support policy against Expo SDK 58 and the devices actually available for testing; the scaffold currently inherits that SDK's minimums.
- Define distribution identifiers, signing, build profiles, and store metadata before distributing outside development.
- Resolve any device failures before marking PLAN.md phase-one acceptance complete.

## HAR and Android regression — 2026-11-13

The supplied private capture contained six successful OpenSubsonic `search3` responses. Cove rejected them because its song schema modeled `isrc` as a string instead of the protocol's string array. The schema now accepts empty and multiple ISRC values across song browsing, search, album detail, and playlist detail. A malformed array is still rejected.

The opt-in capture replay test uses only captured response bodies with a mock transport. It never sends captured URLs or credentials to a service, and private HAR files remain outside the repository:

```sh
COVE_NAVIDROME_HAR=/absolute/path/to/private.har pnpm test
```

The full check with the supplied capture passes 58 tests, TypeScript, ESLint, and formatting. The updated ARM64 Android build completed successfully with the native keyboard-controller module.

On the connected Samsung SM-N970F, verified:

- Song rows load, and library search returns playable result rows without parser errors.
- The home app-name header is removed; only Library and Search remain in the bottom bar. Playlists remain accessible from Library.
- The ZenSync address and secure API-key fields scroll above the open Gboard keyboard while focused, including typing in the last field. This was checked in a temporary form preview without changing saved credentials; the preview code was removed.
- Provider search had a separate misspelled hostname that did not resolve. The address was corrected through the new editable ZenSync connection form, preserving the existing API key and Navidrome connection. Both Deezer and lossless.am now show provider results with request controls and no search errors on the device. Repeated provider targets are deduplicated by source-qualified recording identity, preventing duplicate React list keys while preserving different catalogs. No domain-specific URL rewriting or backend workaround was added.

These checks do not establish iOS keyboard behavior, all playback/background acceptance, acquisition success, or general release readiness. The remaining release checklist above still applies.
