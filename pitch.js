// YIN difference function with cumulative mean normalization and parabolic refinement.
// Restrict to useful single-note brass range, not arbitrary noisy microphone peaks.
export function detectPitch(samples, sampleRate, minHz = 80, maxHz = 1600) {
  let energy = 0, mean = 0;
  for (const x of samples) mean += x;
  mean /= samples.length;
  for (const x of samples) energy += (x - mean) ** 2;
  const rms = Math.sqrt(energy / samples.length);
  if (rms < 0.008) return null;
  const maxLag = Math.min(Math.floor(sampleRate / minHz), Math.floor(samples.length / 2) - 1);
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const size = samples.length - maxLag;
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let sum = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let d = 0;
    for (let i = 0; i < size; i++) d += (samples[i] - samples[i + lag]) ** 2;
    sum += d;
    cmnd[lag] = sum ? d * lag / sum : 1;
  }
  for (let lag = minLag; lag < maxLag; lag++) {
    if (cmnd[lag] >= 0.15) continue;
    while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
    if (lag >= maxLag) return null;
    const a = cmnd[lag - 1], b = cmnd[lag], c = cmnd[lag + 1];
    const denominator = 2 * (2 * b - a - c);
    const refined = lag + (denominator ? (c - a) / denominator : 0);
    const hz = sampleRate / refined;
    if (hz < minHz || hz > maxHz) return null;
    return { hz, clarity: 1 - b, rms };
  }
  return null;
}
export function noteFor(hz, reference = 440, transpose = 0) {
  const exact = 69 + 12 * Math.log2(hz / reference);
  const midi = Math.round(exact);
  const written = midi + transpose;
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  return { name: names[((written % 12) + 12) % 12], octave: Math.floor(written / 12) - 1, cents: (exact - midi) * 100, midi };
}
export function beatDuration(bpm, denominator = 4) {
  // BPM always denotes quarter notes; eighth-note meters therefore click twice as fast.
  return 60 / bpm * 4 / denominator;
}
