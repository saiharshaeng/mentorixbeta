// Deep bass + particle burst launch sound
// Generated entirely via Web Audio API — no external files needed
let played = false;

export function playIntro() {
  if (played) return;
  played = true;

  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.05);
  master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.8);
  master.connect(ctx.destination);

  // --- DEEP SUB BASS THUD ---
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(55, ctx.currentTime);
  sub.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.5);
  subGain.gain.setValueAtTime(1.2, ctx.currentTime);
  subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  sub.connect(subGain);
  subGain.connect(master);
  sub.start(ctx.currentTime);
  sub.stop(ctx.currentTime + 0.65);

  // --- MID PUNCH ---
  const mid = ctx.createOscillator();
  const midGain = ctx.createGain();
  mid.type = 'triangle';
  mid.frequency.setValueAtTime(110, ctx.currentTime);
  mid.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.3);
  midGain.gain.setValueAtTime(0.8, ctx.currentTime);
  midGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  mid.connect(midGain);
  midGain.connect(master);
  mid.start(ctx.currentTime);
  mid.stop(ctx.currentTime + 0.45);

  // --- RISING SYNTH SWEEP ---
  const sweep = ctx.createOscillator();
  const sweepGain = ctx.createGain();
  const sweepFilter = ctx.createBiquadFilter();
  sweep.type = 'sawtooth';
  sweep.frequency.setValueAtTime(80, ctx.currentTime + 0.1);
  sweep.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.4);
  sweepFilter.type = 'bandpass';
  sweepFilter.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
  sweepFilter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.4);
  sweepFilter.Q.value = 3;
  sweepGain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
  sweepGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.4);
  sweepGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
  sweep.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(master);
  sweep.start(ctx.currentTime + 0.1);
  sweep.stop(ctx.currentTime + 1.6);

  // --- CRYSTALLINE HIGH SHIMMER ---
  [1200, 1800, 2400, 3200].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime + 0.3 + i * 0.06);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5 + i * 0.06);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8 + i * 0.1);
    osc.connect(g);
    g.connect(master);
    osc.start(ctx.currentTime + 0.3 + i * 0.06);
    osc.stop(ctx.currentTime + 2.0);
  });

  // --- NOISE BURST (particle texture) ---
  const bufSize = ctx.sampleRate * 0.15;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const noise = ctx.createBufferSource();
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();
  noise.buffer = buf;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 0.8;
  noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(ctx.currentTime);
}

export function playClick() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}
