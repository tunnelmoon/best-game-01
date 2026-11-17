// Every sound is synthesized with WebAudio: no audio files, nothing fetched.
// The catch note climbs a pentatonic ladder with the combo, so a long streak
// literally sounds higher.

const LADDER = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.7, 1318.5];

export function makeAudio() {
  const audio = {
    context: null,
    muted: false,
    master: null,
  };
  return audio;
}

function ensureContext(audio) {
  if (audio.context) {
    if (audio.context.state === 'suspended') audio.context.resume();
    return audio.context;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  const context = new Ctor();
  const master = context.createGain();
  master.gain.value = 0.5;
  master.connect(context.destination);
  audio.context = context;
  audio.master = master;
  return context;
}

function tone(audio, frequency, seconds, type, volume, when = 0, slideTo = 0) {
  const context = ensureContext(audio);
  if (!context || audio.muted) return;
  const start = context.currentTime + when;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

function noiseBurst(audio, seconds, volume, lowpass) {
  const context = ensureContext(audio);
  if (!context || audio.muted) return;
  const start = context.currentTime;
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = context.createGain();
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  source.start(start);
}

export function unlockAudio(audio) {
  ensureContext(audio);
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  if (audio.master) audio.master.gain.value = muted ? 0 : 0.5;
}

export function playCatch(audio, combo) {
  const step = Math.min(Math.max(combo - 1, 0), LADDER.length - 1);
  tone(audio, LADDER[step], 0.22, 'sine', 0.32);
  tone(audio, LADDER[step] * 2, 0.12, 'sine', 0.1);
}

export function playWish(audio) {
  tone(audio, 1046.5, 0.16, 'triangle', 0.3);
  tone(audio, 1318.5, 0.16, 'triangle', 0.3, 0.07);
  tone(audio, 1568.0, 0.3, 'triangle', 0.3, 0.14);
}

export function playComet(audio) {
  tone(audio, 160, 0.4, 'sawtooth', 0.3, 0, 55);
  noiseBurst(audio, 0.25, 0.25, 900);
}

export function playClear(audio) {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((frequency, i) => tone(audio, frequency, 0.34, 'triangle', 0.28, i * 0.09));
}

export function playOver(audio) {
  const notes = [392.0, 329.63, 261.63, 196.0];
  notes.forEach((frequency, i) => tone(audio, frequency, 0.4, 'sine', 0.26, i * 0.16));
}

export function playWin(audio) {
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1568.0];
  notes.forEach((frequency, i) => tone(audio, frequency, 0.3, 'triangle', 0.26, i * 0.11));
}

export function playClick(audio) {
  tone(audio, 880, 0.07, 'square', 0.12);
}

export function playTick(audio) {
  tone(audio, 1200, 0.05, 'sine', 0.1);
}
