# Pulse & Pitch

An iPhone-first metronome and single-note chromatic tuner for everyday music practice. Also works on desktop. Runs in your browser without dependencies; microphone audio is never recorded or sent to a server.

**Live app:** https://brucethebutler.github.io/pulse-and-pitch/

## Interface

A compact, typography-led interface: oversized sans-serif readings, responsive beat strips, open space and a custom split-letter icon. Light/dark appearances follow the device automatically. No introductory hero pushes the tools down the screen. Essential controls are designed to fit small portrait phone viewports; optional branding and help sit below them. Layout is responsive and supports safe-area insets and reduced motion.

## Features

- Metronome from 30–240 BPM, with tap tempo that averages recent taps rather than just the last two.
- Time signatures, subdivisions, downbeat accents and full-volume clicks. Your device volume stays under your control.
- Musical beat units: quarter-note beats in simple meters and dotted-quarter beats in 6/8, 9/8 and 12/8.
- Change settings while playing. Tempo and subdivision changes carry on without resetting the bar; changing time signature starts a fresh bar at the next scheduled click.
- Single-note chromatic tuner with a cents meter and stable-note filtering, covering roughly 80–1600 Hz.
- Note displays for all 12 instrument keys, including B♭, E♭ and F, or concert pitch (C). Frequency always shows sounding pitch.
- Concert A calibration from 430–450 Hz; ±5 cents is marked in tune.
- Installable, offline-capable app with saved preferences and optional screen wake lock.
- Explicit microphone stop, interruption handling, no analytics and no third-party dependencies.

## Using the app

### iPhone

Open the live app in Safari. Tap Start for the metronome, or Enable microphone for the tuner and allow microphone access. To install, choose Share → Add to Home Screen.

Keep the app visible and the device unlocked. Backgrounding intentionally stops audio and releases the microphone. Screen wake lock is best-effort, not a guarantee.

### iOS status-bar rendering

Build 14 targets the native iOS top scroll-edge blur rather than moving controls below it. An empty, fixed 11px edge element supplies WebKit's status-bar color extension, which suppresses the top scroll pocket. Background clipping prevents the element painting over controls; it cannot intercept taps, takes no layout space, and follows light/dark colors. It is limited to standalone WebKit. The status-bar style remains default (not edge-to-edge translucent).

This uses an implementation detail, not a supported CSS opt-out. Browser checks cannot prove suppression of iOS system chrome: verify Build 14 on a physical installed iPhone at launch, after scrolling Help and returning, and in both themes. Future WebKit versions may change the heuristic.

References: [real-device investigation](https://zenn.dev/uakihir0/articles/260920-ios27-pwa-blur), [WebKit scroll-pocket predicate](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/API/ios/WKWebViewIOS.mm), [fixed-container sampling](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalFrameView.cpp).

### Tuning

Play or sing one sustained note in a quiet space, leaving some distance from the microphone. Select your instrument's key to see written note names, or C for concert pitch. Bluetooth can add latency and alter microphone processing.

### Desktop

Open the same live app in a modern browser and allow microphone access when using the tuner.

## Development

This repository is the canonical source. No build step or package install is required.

```sh
npm run check
npm test
python3 -m http.server 8080
```

Localhost supports microphone testing on desktop. A phone needs the HTTPS Pages URL, not an unsecured LAN address.

Pitch detection uses YIN. Automated tests use synthetic notes and harmonic mixtures at 44.1 and 48 kHz; these do not replace acoustic instrument tests or establish hardware accuracy.

GitHub Actions runs checks, stages only public app assets, and deploys Pages from `main`. Pages must be configured with the GitHub Actions source. Increment the service-worker cache name when changing app assets. Existing open installations receive the new worker after closing/reopening; network-first fetches refresh assets when online.

## Device acceptance checklist

Physical iPhone testing is still outstanding. Before relying on the app, check:

- iPhone Safari: grant/deny microphone, start/stop, switch tabs, lock/unlock, incoming interruption, rotation, home-screen install and offline reopen.
- Compare sustained notes across the usable range against a trusted tuner; check sharp/flat readings, transposed displays (including F) and alternate calibration.
- Listen at 60/120 BPM and in 6/8, 9/8 and 12/8; verify accents, subdivisions, averaged tap tempo and settings changes during playback.
- Desktop Safari, Chrome and Firefox: microphone and audio output, keyboard controls and narrow/wide layout.

No claim of physical iPhone testing is made by this repository.

