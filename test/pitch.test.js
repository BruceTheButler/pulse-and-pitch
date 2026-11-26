import { test } from 'node:test';
import assert from 'node:assert/strict';
import {detectPitch,noteFor,beatDuration} from '../pitch.js';
function tone(hz,sampleRate,harmonic=false) {
  return Float32Array.from({length:4096},(_,i) => {
    const t = 2*Math.PI*hz*i/sampleRate;
    return harmonic ? 0.10*Math.sin(t)+0.28*Math.sin(2*t)+0.15*Math.sin(3*t)+0.07*Math.sin(4*t) : 0.4*Math.sin(t);
  });
}
for (const rate of [44100,48000]) for (const hz of [82.41,116.54,164.81,233.08,261.626,440,466.164,523.251,932.328,1396.91]) for (const harmonic of [false,true]) {
  test(`${rate}Hz sample rate: ${hz}Hz ${harmonic?'brass harmonics':'sine'}`,()=> {
    const pitch = detectPitch(tone(hz,rate,harmonic),rate);
    assert.ok(pitch,'pitch detected');
    assert.ok(Math.abs(1200*Math.log2(pitch.hz/hz))<3,`detected ${pitch.hz}`);
  });
}
test('silence and deterministic white noise rejected',()=> {
  assert.equal(detectPitch(new Float32Array(4096),48000),null);
  let seed=42; const noise=Float32Array.from({length:4096},()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32-.5;});
  assert.equal(detectPitch(noise,48000),null);
});
test('concert and written B-flat / E-flat pitches',()=> {
  assert.equal(noteFor(440).name,'A'); assert.equal(noteFor(440).octave,4);
  assert.equal(noteFor(233.08188,440,2).name,'C'); assert.equal(noteFor(233.08188,440,2).octave,4);
  assert.equal(noteFor(311.12698,440,9).name,'C'); assert.equal(noteFor(311.12698,440,9).octave,5);
});
test('calibration and cents',()=> {
  assert.ok(Math.abs(noteFor(442,442).cents)<.001);
  assert.ok(Math.abs(noteFor(440*2**(17/1200)).cents-17)<.001);
});
test('quarter-note BPM and eighth-note meter',()=> {
  assert.equal(beatDuration(120,4),.5); assert.equal(beatDuration(120,8),.25);
  assert.equal(beatDuration(90,8)*3,1);
});
test('all instrument keys map their sounding pitch to written C', () => {
  for (let transpose = 0; transpose < 12; transpose++) {
    const hz = 440 * 2 ** ((72 - transpose - 69) / 12);
    const result = noteFor(hz,440,transpose);
    assert.equal(result.name,'C');
    assert.equal(result.octave,5);
    assert.ok(Math.abs(result.cents)<0.001);
  }
  assert.equal(noteFor(174.614116,440,7).name,'C'); // F3 -> written C4 (horn)
  assert.equal(noteFor(174.614116,440,7).octave,4);
});
