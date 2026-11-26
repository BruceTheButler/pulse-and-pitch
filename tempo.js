// Average elapsed time across up to eight intervals, rather than the last pair.
export function createTapTempo() {
  let taps = [];
  return now => {
    if (taps.length && now - taps.at(-1) > 3000) taps = [];
    // Ignore accidental double taps without moving the previous beat.
    if (taps.length && now - taps.at(-1) < 120) return result();
    taps.push(now);
    taps = taps.slice(-9);
    return result();
  };
  function result() {
    return {
      count: taps.length,
      bpm: taps.length < 4 ? null : 60000 * (taps.length - 1) / (taps.at(-1) - taps[0])
    };
  }
}

// Musical beats: compound meters group eighth notes into dotted quarters.
export function beatsPerBar([count, denominator]) {
  return denominator === 8 && count % 3 === 0 ? count / 3 : count;
}

// Settings take effect on the next beat; a meter change starts a new bar.
// Keeping the cursor independent of the subdivision avoids skipped/repeated beats.
export function createBeatCursor() {
  let beat = 0, sub = 0, active = null;
  return settings => {
    const meterChanged = active && settings.meter.join() !== active.meter.join();
    if (meterChanged) { beat = 0; sub = 0; }
    if (!active || sub === 0) active = {...settings, meter: [...settings.meter]};
    const event = {beat, sub, duration: 60 / active.bpm / active.subdivision};
    sub++;
    if (sub === active.subdivision) {
      sub = 0;
      beat = (beat + 1) % beatsPerBar(active.meter);
    }
    return event;
  };
}
