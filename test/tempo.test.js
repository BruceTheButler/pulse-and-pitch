import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTapTempo, beatsPerBar, createBeatCursor } from '../tempo.js';
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

test('simple and compound meters count conductor beats', () => {
  for (const [meter, beats] of [[[4,4],4],[[3,4],3],[[6,8],2],[[9,8],3],[[12,8],4]]) {
    assert.equal(beatsPerBar(meter), beats);
    const next = createBeatCursor(), settings = {bpm:60,meter,subdivision:1};
    for (let i=0;i<beats*2;i++) assert.deepEqual(next(settings), {beat:i%beats,sub:0,duration:1});
  }
});
test('tempo changes preserve position in the bar', () => {
  const next = createBeatCursor(), settings = {bpm:60,meter:[4,4],subdivision:1};
  next(settings);
  assert.deepEqual(next({...settings,bpm:120}), {beat:1,sub:0,duration:.5});
  assert.equal(next(settings).beat, 2);
});
test('subdivision changes finish the current beat and carry on', () => {
  const next = createBeatCursor(), settings = {bpm:60,meter:[4,4],subdivision:2};
  assert.deepEqual(next(settings), {beat:0,sub:0,duration:.5});
  assert.deepEqual(next({...settings,subdivision:3}), {beat:0,sub:1,duration:.5});
  for (let sub=0;sub<3;sub++) assert.deepEqual(next({...settings,subdivision:3}), {beat:1,sub,duration:1/3});
  assert.equal(next(settings).beat, 2);
});
test('meter changes start a new bar even during subdivisions', () => {
  const next = createBeatCursor(), settings = {bpm:60,meter:[4,4],subdivision:3};
  next(settings); next(settings);
  assert.deepEqual(next({...settings,meter:[6,8]}), {beat:0,sub:0,duration:1/3});
});
test('repeated setting updates never lose the bar position', () => {
  const next = createBeatCursor();
  for (let i=0;i<100;i++) {
    const result = next({bpm:60+i,meter:[4,4],subdivision:1});
    assert.equal(result.beat,i%4);
    assert.equal(result.duration,60/(60+i));
  }
});
