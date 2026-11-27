import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setAudioSession } from '../audio-session.js';
test('metronome selects playback even with device silent mode', () => {
  const platform = {audioSession:{type:'auto'}};
  setAudioSession(platform, 'playback');
  assert.equal(platform.audioSession.type, 'playback');
  setAudioSession(platform, 'auto');
  assert.equal(platform.audioSession.type, 'auto');
});
test('unsupported audio sessions do not break startup', () => {
  assert.doesNotThrow(() => setAudioSession({}, 'playback'));
  assert.doesNotThrow(() => setAudioSession({audioSession:{set type(value){throw new Error('unsupported');}}}, 'playback'));
});
