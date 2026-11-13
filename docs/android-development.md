# Android device development on this computer

## Installed toolchain

Cove's Android toolchain is installed on the Omarchy Linux host:

- ADB and Android USB rules from the Arch `android-tools` / `android-udev` packages.
- OpenJDK 17 (`/usr/lib/jvm/java-17-openjdk`).
- Android SDK under `~/Android/Sdk`, including command-line tools and platform tools.
- Android SDK platform 37.0, Build Tools 37.0.0, NDK 27.1.12297006, and CMake 3.22.1, matching the installed Expo/React Native project.
- The project's Gradle 9.4.1 wrapper; a separate system Gradle installation is unnecessary.

Shell configuration in `~/.config/cove/android-env.sh` exports `ANDROID_HOME`, `JAVA_HOME`, and the SDK command paths. It is sourced from `~/.bashrc` before the interactive-shell guard, so new interactive and login shells can use the same toolchain. Existing terminals can load it with:

```sh
source ~/.config/cove/android-env.sh
```

The SDK platform's current Google package identifier is `platforms;android-37.0` (including `.0`). The command-line tools archive was checked against Google's published SHA-256 before extraction. SDK licenses were accepted during installation. Android Studio, emulator images, and system-wide Gradle are not required for the USB device workflow below.

## Verification

The ARM64 `:app:assembleDebug` build completed successfully (481 tasks). The generated debug APK passed signature verification and identifies as `app.cove.music`. Java, ADB, CMake, and NDK Clang executables were checked. ADB started normally; no Android phone was connected at the time of setup. This confirms build readiness, not on-device app behavior.

## Connect the phone

1. Enable Developer options on the Android phone, then enable **USB debugging**.
2. Connect it using a USB cable that supports data. Unlock the phone.
3. Accept **Allow USB debugging** on the phone. Confirm the computer's key only on your own device.
4. Check the connection:

```sh
adb devices -l
```

A ready phone appears with status `device`. `unauthorized` means the phone still needs to approve the debugging key. If the list is empty, check the cable and USB debugging setting. If access is denied, reconnect the phone and sign out/in once to apply the newly added `adbusers` group membership. Do not run ADB as root.

## Build and run Cove

From this repository's root:

```sh
pnpm install --frozen-lockfile
pnpm android --device
```

Expo prompts for the connected device, builds the native development app, installs it, and starts Metro. Generated Android files live in the ignored `apps/mobile/android/` directory; the source of truth remains `apps/mobile/app.config.ts`.

For later sessions with the development app already installed:

```sh
adb reverse tcp:8081 tcp:8081
pnpm start --localhost
```

Open Cove's development app on the phone and select the local development server. USB port forwarding allows Metro access without sharing a Wi-Fi network.

The native build can be verified without connecting a device:

```sh
cd apps/mobile/android
./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --max-workers=2 --no-daemon -Dorg.gradle.parallel=false
```

This builds for an ARM64 Android phone. The actual device's architecture is selected by Expo when running with `--device`. The worker limit keeps the initial native compilation manageable on this host's memory budget. The generated debug APK is under `app/build/outputs/apk/debug/` and requires Metro for JavaScript during development.

Native build success does not validate playback or service integration. Follow [the device acceptance checklist](validation.md) once a phone is connected.
