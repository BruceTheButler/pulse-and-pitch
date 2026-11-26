import { detectPitch, noteFor } from './pitch.js';
import { createTapTempo, beatsPerBar, createBeatCursor } from './tempo.js';
const tapTempo = createTapTempo();
const $ = id => document.getElementById(id);
let context, running = false, listening = false, starting = false, timer, frame, stream, source, analyser, wake;
let nextTime = 0, cursor = createBeatCursor(), queue = [], voices = new Set(), recent = [], lastHeard = 0, lastNote = '';
let tunerGeneration = 0;
const notice = text => { $('notice').textContent = text; };
const config = () => ({ bpm: Number($('bpm').value), meter: $('meter').value.split(',').map(Number), subdivision: Number($('subdivision').value) });
try {
  const saved = JSON.parse(localStorage.getItem('brass-settings') || '{}');
  for (const id of ['bpm', 'meter', 'subdivision', 'transpose', 'reference']) {
    if (saved[id] !== undefined) {
      const el = $(id); el.value = saved[id];
      if (!el.checkValidity() || el.value === '') el.value = ({bpm:100,meter:'4,4',subdivision:'1',transpose:'2',reference:440})[id];
    }
  }
  if (typeof saved.accent === 'boolean') $('accent').checked = saved.accent;
} catch { /* Storage can be disabled in private browsers. */ }
function save() {
  const saved = {};
  for (const id of ['bpm','meter','subdivision','transpose','reference']) saved[id] = $(id).value;
  saved.accent = $('accent').checked;
  try { localStorage.setItem('brass-settings', JSON.stringify(saved)); } catch {}
}
async function audio() {
  if (!context || context.state === 'closed') {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Web Audio is not available in this browser. Try Safari, Chrome or Firefox.');
    context = new Audio({ latencyHint: 'interactive' });
    context.onstatechange = () => {
      if ((running || listening) && context.state !== 'running') {
        stopMetronome(); stopTuner(); notice('Audio was interrupted. Tap Start to resume.');
      }
    };
  }
  await context.resume();
  return context;
}
async function keepAwake() {
  try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch {}
}
function releaseWake() { if (wake) { wake.release().catch(() => {}); wake = null; } }
function beats() {
  const {meter:[count,denominator]} = config();
  $('beats').replaceChildren(...Array.from({length:beatsPerBar([count,denominator])}, (_, i) => {
    const el = document.createElement('span'); el.className = 'beat' + ((i === 0) ? ' down' : ''); return el;
  }));
  $('meter-hint').textContent = denominator === 8 ? 'Dotted-quarter beats' : 'Quarter-note beats';
}
function tempo(value) {
  const n = Number(value);
  $('bpm').value = Math.min(240, Math.max(30, Number.isFinite(n) && n ? Math.round(n) : 100));
  $('tempo-slider').value = $('bpm').value;
  $('tempo-word').textContent = n < 60 ? 'Largo' : n < 76 ? 'Adagio' : n < 108 ? 'Andante' : n < 120 ? 'Moderato' : n < 168 ? 'Allegro' : 'Presto';
  save();
}
function click(time, beat, sub) {
  const osc = context.createOscillator(), gain = context.createGain();
  const accented = $('accent').checked;
  const strong = accented && sub === 0 && beat === 0;
  osc.frequency.value = strong ? 1500 : sub === 0 ? 1000 : 700;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(sub === 0 ? 1 : 0.65, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);
  osc.connect(gain); gain.connect(context.destination);
  voices.add(osc); osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
  osc.start(time); osc.stop(time + 0.06);
}
function schedule() {
  if (!running) return;
  if (nextTime < context.currentTime) nextTime = context.currentTime + 0.02; // Never burst overdue clicks.
  while (nextTime < context.currentTime + 0.12) {
    const {beat, sub, duration} = cursor(config());
    click(nextTime, beat, sub);
    if (!sub) queue.push({time:nextTime,beat});
    nextTime += duration;
  }
}
function paint() {
  if (!running) return;
  while (queue.length && queue[0].time <= context.currentTime) {
    const {beat} = queue.shift();
    [...$('beats').children].forEach((el,i) => el.classList.toggle('on', i === beat));
  }
  frame = requestAnimationFrame(paint);
}
function stopMetronome() {
  running = false; clearInterval(timer); cancelAnimationFrame(frame); queue = [];
  for (const osc of voices) { try { osc.stop(); } catch {} } voices.clear();
  $('start').textContent = 'Start metronome'; $('start').classList.remove('running');
  for (const el of $('beats').children) el.classList.remove('on');
  if (!listening) releaseWake();
}
$('start').onclick = async () => {
  if (running) return stopMetronome();
  if (starting) return;
  starting = true;
  try {
    await audio();
    if (document.hidden) return;
    tempo($('bpm').value); stopTuner(); running = true; cursor = createBeatCursor(); nextTime = context.currentTime + 0.06;
    $('start').textContent = 'Stop metronome'; $('start').classList.add('running'); notice('Keep this app visible and your phone unlocked.');
    schedule(); timer = setInterval(schedule,25); paint(); keepAwake();
  } catch (e) { notice(e.message); } finally { starting = false; }
};
$('slower').onclick = () => tempo(Number($('bpm').value) - 1);
$('faster').onclick = () => tempo(Number($('bpm').value) + 1);
$('bpm').onchange = () => tempo($('bpm').value);
$('tempo-slider').oninput = () => tempo($('tempo-slider').value);
$('tap').onclick = () => {
  const result = tapTempo(performance.now());
  if (result.bpm !== null) tempo(result.bpm);
  $('tap').textContent = result.count < 4 ? `Tap tempo · ${result.count}/4` : 'Tap tempo';
};
$('meter').onchange = () => { queue = []; beats(); save(); };
$('subdivision').onchange = save;
$('accent').onchange = save;
for (const name of ['metronome','tuner']) $('tab-' + name).onclick = () => {
  stopMetronome(); stopTuner(); notice('');
  for (const n of ['metronome','tuner']) { $(n).hidden = n !== name; $('tab-' + n).classList.toggle('active',n === name); $('tab-' + n).setAttribute('aria-selected',String(n === name)); $('tab-' + n).tabIndex = n === name ? 0 : -1; }
};
document.querySelector('[role=tablist]').addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const target = event.key === 'Home' ? 'metronome' : event.key === 'End' ? 'tuner' : $('metronome').hidden ? 'metronome' : 'tuner';
  $('tab-' + target).focus(); $('tab-' + target).click();
});
function emptyPitch() {
  $('note').replaceChildren(document.createTextNode('—'));
  $('pitch-detail').textContent = 'One clear, steady note.'; $('needle').style.opacity = '0';
  $('tuning-status').textContent = listening ? 'Listening for a steady note…' : 'Enable the microphone to start tuning.';
  $('tuning-status').classList.remove('good'); lastNote = '';
}
function stopTuner() {
  tunerGeneration++; listening = false; cancelAnimationFrame(tunerFrame);
  stream?.getTracks().forEach(track => track.stop()); stream = null;
  source?.disconnect(); source = null; analyser?.disconnect(); analyser = null;
  $('listen').disabled = false; $('listen').textContent = 'Enable microphone'; $('listening').textContent = 'MIC OFF';
  recent = []; emptyPitch(); if (!running) releaseWake();
}
let tunerFrame;
function showPitch(hz) {
  const n = noteFor(hz,Number($('reference').value),Number($('transpose').value));
  const key = n.name + n.octave;
  if (key !== lastNote) {
    const sub = document.createElement('sub'); sub.textContent = n.octave;
    $('note').replaceChildren(document.createTextNode(n.name),sub); lastNote = key;
  }
  const cents = Math.round(n.cents), good = Math.abs(n.cents) <= 5;
  $('pitch-detail').textContent = `${hz.toFixed(1)} Hz · ${cents > 0 ? '+' : ''}${cents} cents`;
  $('needle').style.opacity = '1'; $('needle').style.left = `${50 + Math.max(-50,Math.min(50,n.cents))}%`;
  const status = good ? 'In tune' : cents < 0 ? 'Flat · bring the pitch up' : 'Sharp · bring the pitch down';
  if ($('tuning-status').textContent !== status) $('tuning-status').textContent = status;
  $('tuning-status').classList.toggle('good',good);
}
$('listen').onclick = async () => {
  if (listening) return stopTuner();
  if (!navigator.mediaDevices?.getUserMedia) { notice('Microphone access needs HTTPS and a supported browser. Open this page in Safari.'); return; }
  stopMetronome();
  const generation = ++tunerGeneration;
  $('listen').disabled = true; $('listen').textContent = 'Waiting for microphone…'; notice('');
  let acquired;
  try {
    await audio();
    acquired = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    if (generation !== tunerGeneration || document.hidden) { acquired.getTracks().forEach(t => t.stop()); return; }
    stream = acquired; source = context.createMediaStreamSource(stream); analyser = context.createAnalyser(); analyser.fftSize = 4096; source.connect(analyser);
    // Deliberately NOT connected to speakers: no microphone feedback or monitoring.
    listening = true; recent = []; lastHeard = performance.now(); $('listen').textContent = 'Stop microphone'; $('listening').textContent = 'LISTENING'; emptyPitch(); keepAwake();
    stream.getTracks()[0].onended = () => { if (listening) { stopTuner(); notice('Microphone disconnected. Tap to enable it again.'); } };
    const data = new Float32Array(analyser.fftSize); let lastAnalysis = 0;
    function analyse(now) {
      if (!listening) return;
      if (now - lastAnalysis >= 65) {
        lastAnalysis = now; analyser.getFloatTimeDomainData(data);
        const pitch = detectPitch(data,context.sampleRate);
        if (pitch && pitch.clarity > 0.85) {
          if (recent.length && Math.abs(12 * Math.log2(pitch.hz / recent.at(-1))) > 0.7) recent = [];
          recent.push(pitch.hz); recent = recent.slice(-5); lastHeard = now;
          if (recent.length >= 3) showPitch([...recent].sort((a,b) => a-b)[Math.floor(recent.length/2)]);
        } else if (now - lastHeard > 500) { recent = []; emptyPitch(); }
      }
      tunerFrame = requestAnimationFrame(analyse);
    }
    tunerFrame = requestAnimationFrame(analyse);
  } catch (e) {
    acquired?.getTracks().forEach(t => t.stop());
    if (generation !== tunerGeneration) return;
    stopTuner();
    notice(e.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow microphone access in Safari’s website settings, then try again.' : e.name === 'NotFoundError' ? 'No microphone found. Connect one and try again.' : `Could not start the microphone: ${e.message}`);
  } finally { if (generation === tunerGeneration) $('listen').disabled = false; }
};
function transposition() {
  const key = $('transpose').selectedOptions[0].textContent;
  $('transpose-hint').textContent = Number($('transpose').value) === 0 ? 'Note names match concert pitch.' : `Concert ${key} is shown as written C.`;
  recent = []; emptyPitch(); save();
}
$('transpose').onchange = transposition;
$('reference').onchange = () => { $('reference').value = Math.max(430,Math.min(450,Math.round(Number($('reference').value) || 440))); recent = []; emptyPitch(); save(); };
document.addEventListener('visibilitychange',() => { if (document.hidden) { const active = running || listening; stopMetronome(); stopTuner(); if (active) notice('Paused while the app was in the background. Tap Start to resume.'); } });
window.addEventListener('pagehide',() => {stopMetronome(); stopTuner();});
beats(); tempo($('bpm').value); transposition();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

// Explicit refresh also works in standalone iPhone windows without browser chrome.
$('refresh-app').onclick = async () => {
  stopMetronome(); stopTuner();
  const button = $('refresh-app'); button.disabled = true; button.textContent = 'Refreshing…';
  if (!navigator.onLine) { button.disabled = false; button.textContent = 'Refresh app'; notice('Connect to the internet to refresh the app.'); return; }
  const reload = () => { const url = new URL(location.href); url.searchParams.set('refresh', Date.now()); location.replace(url); };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.update();
      if (registration.installing) await new Promise(resolve => {
        const worker = registration.installing;
        worker.addEventListener('statechange', () => { if (['installed','redundant'].includes(worker.state)) resolve(); });
        setTimeout(resolve, 5000);
      });
      if (registration.waiting) {
        const worker = registration.waiting;
        await new Promise(resolve => {
          worker.addEventListener('statechange', () => { if (worker.state === 'activated') resolve(); });
          worker.postMessage('ACTIVATE_UPDATE'); setTimeout(resolve, 5000);
        });
      }
    }
    reload();
  } catch { button.disabled = false; button.textContent = 'Refresh app'; notice('Could not check for an update. Check your connection and try again.'); }
};
// iOS standalone may ignore viewport zoom limits; cancel its pinch gesture too.
document.addEventListener('gesturestart', event => event.preventDefault(), {passive:false});
