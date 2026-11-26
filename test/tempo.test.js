import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTapTempo } from '../tempo.js';
test('waits for four taps and averages intervals', () => {
  const tap = createTapTempo();
  for (const time of [0, 480, 1020]) assert.equal(tap(time).bpm, null);
  assert.equal(tap(1500).bpm, 120);
  assert.equal(tap(2050).bpm, 60000 * 4 / 2050);
});
test('rolling window retains eight intervals', () => {
  const tap = createTapTempo();
  for (let i = 0; i <= 8; i++) tap(i * 500);
  const result = tap(4600);
  assert.equal(result.count, 9);
  assert.equal(result.bpm, 60000 * 8 / 4100);
});
test('pause resets and double taps are ignored', () => {
  const tap = createTapTempo();
  tap(0); tap(500); tap(1000);
  assert.equal(tap(1050).count, 3);
  assert.equal(tap(1500).bpm, 120);
  assert.deepEqual(tap(5000), { count: 1, bpm: null });
});
test('supports slow tapping at 30 BPM without resetting', () => {
  const tap = createTapTempo();
  tap(0); tap(2000); tap(4000);
  assert.equal(tap(6000).bpm, 30);
});
