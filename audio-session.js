// iOS Web Audio defaults to ambient sound, which obeys the silent switch.
// Select media playback before creating/resuming the metronome's context.
// Restore automatic session selection for microphone capture.
export function setAudioSession(platform, mode) {
  try {
    if (platform.audioSession) platform.audioSession.type = mode;
  } catch { /* Unsupported session policies must not prevent audio startup. */ }
}
