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
