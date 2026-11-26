# Pulse & Pitch

An iPhone-first, dependency-free metronome and single-note chromatic tuner, with transposed displays for trumpet and cornet. Runs locally in your browser; microphone audio is never recorded or sent to a server.

**Live app:** https://brucethebutler.github.io/pulse-and-pitch/

## Features

- Audio-clock metronome: 30–240 quarter notes/min, tap tempo (four-tap start, rolling average of eight intervals), time signatures, subdivisions, downbeat and compound-meter group accents.
- YIN pitch detection, roughly 80–1600 Hz; cents meter, stable-note median filtering, B♭/E♭ written or concert note names, concert A calibration 430–450 Hz.
- Offline-capable installable PWA, saved preferences, optional screen wake lock.
- Explicit microphone stop, interruption handling, no analytics, no third-party assets or dependencies.

## iPhone

Open in Safari, tap Start or Enable microphone, and allow microphone access. Share → Add to Home Screen to install. Keep the app visible and the device unlocked; backgrounding intentionally stops audio and releases the microphone. Screen wake lock is best-effort, not a guarantee. A physical iPhone listening test is still required before relying on it for practice; automated tests do not establish hardware accuracy or iOS audio reliability.

Use one sustained note, with some space between the bell and microphone. Bluetooth can add latency and alter microphone processing. Note names can be transposed; the Hz reading always represents sounding pitch. In B♭ mode concert B♭3 displays written C4. In E♭ mode concert E♭4 displays written C5. ±5 cents is marked in tune.

BPM always means quarter notes. In compound meters, clicks/lights are eighth notes grouped in threes. Dotted-quarter 60 equals quarter-note BPM 90.

## Development

This repository is the canonical source. No build step or package install is required.

```sh
npm run check
npm test
python3 -m http.server 8080
```

Localhost supports microphone testing on desktop. A phone needs the HTTPS Pages URL, not an unsecured LAN address. Pure pitch tests use synthetic notes and brass-like harmonic mixtures at 44.1 and 48 kHz; they do not replace acoustic instrument tests.

GitHub Actions runs checks, stages only public app assets, and deploys Pages from `main`. Pages must be configured with the GitHub Actions source. Increment the service-worker cache name when changing app assets. Existing open installations receive the new worker after closing/reopening; network-first fetches refresh assets when online.

## Device acceptance checklist

- iPhone Safari: grant/deny microphone, start/stop, switch tabs, lock/unlock, incoming interruption, rotation, home-screen install, offline reopen.
- Compare steady concert B♭3, F4, B♭4 and sharp/flat notes against a trusted tuner; check written display and alternate calibration.
- Listen at 60/120 BPM and in 6/8; verify accents/subdivision, rapid stop and tempo changes.
- Desktop Safari, Chrome and Firefox: microphone and audio output, keyboard controls, narrow/wide layout.

No claim of physical iPhone testing is made by this repository.
