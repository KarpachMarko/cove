# Cove

A React Native music client for iPhone and Android: browse and stream your **Navidrome** collection, manage a listening queue, reorder playlists, and search **ZenSync** providers. The starting UI follows the Familiar design with Cove's pink palette.

## Development

Use Node **26** and **pnpm 12.18.0**. From the repository root:

```sh
pnpm install
pnpm android       # Build/install the Android development app (Android SDK + JDK required)
pnpm ios           # Build/install the iOS development app (macOS + Xcode required)
pnpm start         # Metro for an already installed development build
```

The first two commands generate the native project locally. Run on a connected device or an available emulator/simulator. iOS cannot be compiled locally on Linux; use a Mac or configure an Expo cloud development build. Background audio and system media controls must be tested in a development build rather than Expo Go.

For the installed Linux toolchain, USB pairing, and physical-device commands, see [Android device development](docs/android-development.md).

In the app, enter your HTTPS Navidrome address, username, and password. Reverse-proxy subpaths are supported. Credentials are saved in device secure storage; the password is discarded after deriving the protocol token. Optionally enter a ZenSync HTTPS address and API key with `search:read` and `requests:create` scopes. No secrets belong in source files or `EXPO_PUBLIC_*` variables.

## Structure

- `apps/mobile`: native navigation, feature screens, shared UI controls, and platform adapters.
- `packages/core`: platform-independent music models, validated API clients, queue operations, and search matching.
- `docs/architecture/mobile.md`: ownership rules, service contracts, and the path to future desktop shells.

The stack is Expo, TypeScript, NativeWind/Tailwind, React Navigation, TanStack Query, TanStack Form, and Zod. Native UI primitives follow shadcn's component ownership approach without using browser-only controls. See [architecture and integration details](docs/architecture/mobile.md) and [project conventions](AGENTS.md).

## Checks

```sh
pnpm check
pnpm --filter @cove/mobile exec expo install --check
pnpm --filter @cove/mobile export  # iOS and Android Hermes bundles; not native app compilation
```

The app and service flows are implemented, but real-server and physical-device validation is still required. Acquisition requests report submission; durable status tracking and authoritative cross-service identity mapping are not implemented. See [validation and remaining decisions](docs/validation.md) before treating this as release-ready.

## Planning and designs

- [Project scope and implementation status](PLAN.md)
- [Design inventory and provenance](docs/design/README.md)
- [Interactive mobile mockups](docs/design/mobile-concepts/index.html)
- [Original app-icon concepts](docs/design/app-icons/index.html)
- [Ten pink Cove icon concepts](docs/design/app-icons/cove-pink/index.html)

The archived HTML files open directly without a server. They retain all design directions and simulated interactions; no final icon has been selected.
