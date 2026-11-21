// All sound, generated in code with WebAudio: no audio files, no network.
// One job: footsteps, alert stings, pickups and the quiet vault hum.
let audioCtx = null;
let masterGain = null;
let humNodes = null;

/** Create the audio context on the first user gesture (browsers require one). */
export function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
    startHum();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

/** A low, barely-there hum so the vault never feels dead silent. */
function startHum() {
  if (!audioCtx || humNodes) return;
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 55;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.035;
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.015;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  lfo.start();
  humNodes = { osc, lfo };
}

/** A short filtered noise burst: the sound of one footstep. */
function footstepNoise(when, volume, lowpass, pan) {
  const duration = 0.09;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
  const panner = audioCtx.createStereoPanner();
  panner.pan.value = pan;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(masterGain);
  source.start(when);
}

/** A soft step for the courier; `sneaking` makes it quieter and duller. */
export function playPlayerStep(sneaking) {
  if (!audioCtx) return;
  footstepNoise(audioCtx.currentTime, sneaking ? 0.05 : 0.14, sneaking ? 500 : 900, 0);
}

/** A heavier boot step for a guard; volume and pan follow its distance and side. */
export function playGuardStep(guard, player) {
  if (!audioCtx) return;
  const dx = guard.x - player.x;
  const dy = guard.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 520) return;
  const volume = 0.22 * (1 - dist / 520);
  const pan = Math.max(-0.8, Math.min(0.8, dx / 320));
  footstepNoise(audioCtx.currentTime, volume, 420, pan);
}

/** Two rising notes: a guard's suspicion just crossed into alarm. */
export function playAlertSting() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [220, 311].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now + i * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.14 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.22);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + i * 0.14);
    osc.stop(now + i * 0.14 + 0.25);
  });
}

/** A bright little chime when the relic is taken. */
export function playPickup() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.14, now + i * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + i * 0.07);
    osc.stop(now + i * 0.07 + 0.32);
  });
}

/** A low thud when the courier is caught. */
export function playCaught() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.5);
}

/** A warm major chord when a level is cleared. */
export function playLevelClear() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [392, 494, 587].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now + i * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.09 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.6);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now + i * 0.09);
    osc.stop(now + i * 0.09 + 0.65);
  });
}
