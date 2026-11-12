/**
 * Zero-dependency Web Audio API procedural sci-fi sound engine
 * for ASTRO-AI Space Agency Mission Control.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.listeners = new Set();
    this.ambientNodes = null;
    this.ambientInterval = null;
    this.lastBlipAt = 0;
    this.lastHydraulicAt = 0;
    this.lastKlaxonAt = 0;
    this.thrusterNodes = null;
  }

  ensureContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(nextMuted) {
    this.muted = Boolean(nextMuted);
    if (this.muted) {
      this.stopAmbientHum();
      this.stopThrusterRumble();
    }
    this.listeners.forEach((cb) => cb(this.muted));
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playClickSound();
    }
    return this.muted;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  playHoverChirp() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1380, now + 0.045);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  playClickSound() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Mechanical low thud
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(210, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(75, now + 0.065);
    thumpGain.gain.setValueAtTime(0.09, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.075);

    // Crisp tactical confirmation ping
    const pingOsc = ctx.createOscillator();
    const pingGain = ctx.createGain();
    pingOsc.type = 'square';
    pingOsc.frequency.setValueAtTime(1420, now);
    pingOsc.frequency.exponentialRampToValueAtTime(1040, now + 0.04);
    pingGain.gain.setValueAtTime(0.025, now);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    pingOsc.connect(pingGain);
    pingGain.connect(ctx.destination);
    pingOsc.start(now);
    pingOsc.stop(now + 0.05);
  }

  playCameraWhoosh() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.65;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(1350, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(240, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    // Subtle sub-harmonic swell
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(65, now);
    sub.frequency.exponentialRampToValueAtTime(115, now + 0.28);
    sub.frequency.exponentialRampToValueAtTime(52, now + duration);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.05, now + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + duration);
  }

  playDialogueBlip(pitchOffset = 0) {
    if (this.muted) return;
    const perfNow = performance.now();
    if (perfNow - this.lastBlipAt < 42) return;
    this.lastBlipAt = perfNow;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 540 + pitchOffset + (Math.random() * 140 - 70);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, now + 0.025);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.036);
  }

  playHangarDoorSound() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.85;

    // Hydraulic pneumatic hiss
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(2200, now);
    hp.frequency.exponentialRampToValueAtTime(520, now + duration);
    hp.Q.setValueAtTime(1.4, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.linearRampToValueAtTime(0.06, now + 0.04);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    noise.connect(hp);
    hp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.48);

    // Heavy servo rumble
    const servo = ctx.createOscillator();
    const sGain = ctx.createGain();
    servo.type = 'sawtooth';
    servo.frequency.setValueAtTime(92, now + 0.05);
    servo.frequency.linearRampToValueAtTime(58, now + duration);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(260, now);

    sGain.gain.setValueAtTime(0.0001, now + 0.05);
    sGain.gain.linearRampToValueAtTime(0.055, now + 0.14);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    servo.connect(lp);
    lp.connect(sGain);
    sGain.connect(ctx.destination);
    servo.start(now + 0.05);
    servo.stop(now + duration);
  }

  /**
   * Multi-layered VAB part installation: heavy pneumatic hiss + metallic clank + electric arc weld sizzle.
   */
  playPartInstallSound() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Heavy pneumatic release hiss
    const hissDur = 0.28;
    const hissBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * hissDur), ctx.sampleRate);
    const hissData = hissBuf.getChannelData(0);
    for (let i = 0; i < hissData.length; i += 1) {
      hissData[i] = Math.random() * 2 - 1;
    }
    const hiss = ctx.createBufferSource();
    hiss.buffer = hissBuf;
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.setValueAtTime(3200, now);
    hissFilter.frequency.exponentialRampToValueAtTime(900, now + hissDur);
    hissFilter.Q.setValueAtTime(1.2, now);
    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.001, now);
    hissGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    hissGain.gain.exponentialRampToValueAtTime(0.0001, now + hissDur);
    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(ctx.destination);
    hiss.start(now);
    hiss.stop(now + hissDur);

    // 2. Heavy metallic clank (delayed 0.14s as part seats on stack)
    const clankAt = now + 0.14;
    const clankSub = ctx.createOscillator();
    const clankSubGain = ctx.createGain();
    clankSub.type = 'triangle';
    clankSub.frequency.setValueAtTime(165, clankAt);
    clankSub.frequency.exponentialRampToValueAtTime(42, clankAt + 0.18);
    clankSubGain.gain.setValueAtTime(0.18, clankAt);
    clankSubGain.gain.exponentialRampToValueAtTime(0.0001, clankAt + 0.2);
    clankSub.connect(clankSubGain);
    clankSubGain.connect(ctx.destination);
    clankSub.start(clankAt);
    clankSub.stop(clankAt + 0.21);

    const clankRing = ctx.createOscillator();
    const clankRingGain = ctx.createGain();
    clankRing.type = 'square';
    clankRing.frequency.setValueAtTime(420, clankAt);
    clankRing.frequency.exponentialRampToValueAtTime(290, clankAt + 0.09);
    clankRingGain.gain.setValueAtTime(0.04, clankAt);
    clankRingGain.gain.exponentialRampToValueAtTime(0.0001, clankAt + 0.1);
    clankRing.connect(clankRingGain);
    clankRingGain.connect(ctx.destination);
    clankRing.start(clankAt);
    clankRing.stop(clankAt + 0.11);

    // 3. Electric arc weld sizzle (0.24s -> 0.72s)
    const weldAt = now + 0.24;
    const weldDur = 0.48;
    const weldBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * weldDur), ctx.sampleRate);
    const weldData = weldBuf.getChannelData(0);
    for (let i = 0; i < weldData.length; i += 1) {
      // Crackling arc modulation
      const crackle = Math.random() > 0.82 ? 1.0 : 0.28;
      weldData[i] = (Math.random() * 2 - 1) * crackle;
    }
    const weld = ctx.createBufferSource();
    weld.buffer = weldBuf;
    const weldHp = ctx.createBiquadFilter();
    weldHp.type = 'highpass';
    weldHp.frequency.setValueAtTime(2800, weldAt);
    const weldGain = ctx.createGain();
    weldGain.gain.setValueAtTime(0.0001, weldAt);
    weldGain.gain.linearRampToValueAtTime(0.065, weldAt + 0.04);
    weldGain.gain.setValueAtTime(0.055, weldAt + 0.3);
    weldGain.gain.exponentialRampToValueAtTime(0.0001, weldAt + weldDur);
    weld.connect(weldHp);
    weldHp.connect(weldGain);
    weldGain.connect(ctx.destination);
    weld.start(weldAt);
    weld.stop(weldAt + weldDur);
  }

  /**
   * Gantry crane servo whirr when switching between rocket slots.
   */
  playCraneServoSound() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 0.38;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(260, now + 0.16);
    osc1.frequency.exponentialRampToValueAtTime(185, now + dur);
    osc2.frequency.setValueAtTime(282, now);
    osc2.frequency.exponentialRampToValueAtTime(524, now + 0.16);
    osc2.frequency.exponentialRampToValueAtTime(372, now + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(620, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.02);
    osc2.stop(now + dur + 0.02);
  }

  /**
   * Throttled hydraulic pressure hum when dragging the fuel mass slider.
   */
  playHydraulicHum(ratio = 0.5) {
    if (this.muted) return;
    const perfNow = performance.now();
    if (perfNow - this.lastHydraulicAt < 110) return;
    this.lastHydraulicAt = perfNow;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const freq = 75 + Math.max(0, Math.min(1, ratio)) * 95;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq + 12, now + 0.09);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.032, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Warning klaxon chirp when TWR < 1.0.
   */
  playKlaxonChirp() {
    if (this.muted) return;
    const perfNow = performance.now();
    if (perfNow - this.lastKlaxonAt < 750) return;
    this.lastKlaxonAt = perfNow;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.14].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(640, now + offset);
      osc.frequency.linearRampToValueAtTime(440, now + offset + 0.1);

      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.linearRampToValueAtTime(0.038, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  }

  /**
   * Deep hangar siren + heavy crawler-transporter rumble on Launchpad Rollout.
   */
  playRolloutSiren() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 1.45;

    // Deep hangar klaxon siren sweep
    const siren1 = ctx.createOscillator();
    const siren2 = ctx.createOscillator();
    const sirenGain = ctx.createGain();
    siren1.type = 'sawtooth';
    siren2.type = 'triangle';
    siren1.frequency.setValueAtTime(220, now);
    siren1.frequency.linearRampToValueAtTime(340, now + 0.55);
    siren1.frequency.linearRampToValueAtTime(195, now + dur);
    siren2.frequency.setValueAtTime(223, now);
    siren2.frequency.linearRampToValueAtTime(344, now + 0.55);
    siren2.frequency.linearRampToValueAtTime(198, now + dur);

    const sirenFilter = ctx.createBiquadFilter();
    sirenFilter.type = 'lowpass';
    sirenFilter.frequency.setValueAtTime(850, now);

    sirenGain.gain.setValueAtTime(0.0001, now);
    sirenGain.gain.linearRampToValueAtTime(0.065, now + 0.15);
    sirenGain.gain.setValueAtTime(0.055, now + 0.9);
    sirenGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    siren1.connect(sirenFilter);
    siren2.connect(sirenFilter);
    sirenFilter.connect(sirenGain);
    sirenGain.connect(ctx.destination);
    siren1.start(now);
    siren2.start(now);
    siren1.stop(now + dur + 0.05);
    siren2.stop(now + dur + 0.05);

    // Heavy crawler-transporter sub-bass rumble
    const rumble = ctx.createOscillator();
    const rGain = ctx.createGain();
    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(48, now);
    rumble.frequency.linearRampToValueAtTime(38, now + dur);
    rGain.gain.setValueAtTime(0.0001, now);
    rGain.gain.linearRampToValueAtTime(0.14, now + 0.2);
    rGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    rumble.connect(rGain);
    rGain.connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + dur + 0.05);

    // Also trigger pneumatic hangar door hiss
    this.playHangarDoorSound();
  }

  startAmbientHum() {
    if (this.muted || this.ambientNodes) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(54, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(108.5, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    this.ambientNodes = { osc1, osc2, gain };

    // Subtle periodic telemetry radio pulse
    this.ambientInterval = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      const pulse = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pulse.type = 'sine';
      pulse.frequency.setValueAtTime(1680, t);
      pGain.gain.setValueAtTime(0.0001, t);
      pGain.gain.linearRampToValueAtTime(0.009, t + 0.01);
      pGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      pulse.connect(pGain);
      pGain.connect(this.ctx.destination);
      pulse.start(t);
      pulse.stop(t + 0.08);
    }, 4500);
  }

  stopAmbientHum() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientNodes) {
      try {
        this.ambientNodes.osc1.stop();
        this.ambientNodes.osc2.stop();
      } catch {
        // Ignore already stopped oscillators
      }
      this.ambientNodes = null;
    }
  }

  /**
   * Countdown beep (T-5..T-1) or higher-pitched dual-tone Liftoff chime (T-0).
   */
  playCountdownBeep(isLiftoff = false) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isLiftoff ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isLiftoff ? 1320 : 880, now);
    if (isLiftoff) {
      osc.frequency.setValueAtTime(1760, now + 0.12);
    }

    const dur = isLiftoff ? 0.36 : 0.14;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(isLiftoff ? 0.095 : 0.065, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  /**
   * Continuous deep roaring rocket thruster rumble using filtered noise + sub-bass oscillator.
   */
  startThrusterRumble() {
    if (this.muted || this.thrusterNodes) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 2.0;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(340, now);
    lp.Q.setValueAtTime(1.1, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.linearRampToValueAtTime(0.16, now + 0.45);

    const sub = ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(42, now);

    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(110, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.085, now + 0.45);

    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(ctx.destination);

    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(ctx.destination);

    noise.start(now);
    sub.start(now);

    this.thrusterNodes = { noise, sub, lp, nGain, subGain };
  }

  updateThrusterRumble(intensity = 1) {
    if (!this.thrusterNodes || !this.ctx || this.muted) return;
    const clamped = Math.max(0, Math.min(1.4, intensity));
    const now = this.ctx.currentTime;
    this.thrusterNodes.nGain.gain.setTargetAtTime(0.16 * clamped, now, 0.08);
    this.thrusterNodes.subGain.gain.setTargetAtTime(0.085 * clamped, now, 0.08);
    this.thrusterNodes.lp.frequency.setTargetAtTime(220 + clamped * 220, now, 0.1);
  }

  stopThrusterRumble() {
    if (!this.thrusterNodes) return;
    try {
      this.thrusterNodes.noise.stop();
      this.thrusterNodes.sub.stop();
    } catch {
      // Ignore already stopped
    }
    this.thrusterNodes = null;
  }

  /**
   * Stage separation pneumatic clunk + pyro bolt release.
   */
  playStageSeparationSound() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Pyro bolt pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.22);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);

    // Pneumatic release hiss
    const dur = 0.42;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    const hiss = ctx.createBufferSource();
    hiss.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2400, now + 0.05);
    bp.frequency.exponentialRampToValueAtTime(600, now + dur);
    const hGain = ctx.createGain();
    hGain.gain.setValueAtTime(0.001, now + 0.05);
    hGain.gain.linearRampToValueAtTime(0.09, now + 0.08);
    hGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    hiss.connect(bp);
    bp.connect(hGain);
    hGain.connect(ctx.destination);
    hiss.start(now + 0.05);
    hiss.stop(now + dur + 0.02);
  }

  /**
   * Classic NASA Quindar / HQ radio telemetry chirp.
   */
  playRadioChirp() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2524, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.006);
    gain.gain.setValueAtTime(0.035, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Dramatic vehicle failure explosion boom.
   */
  playExplosionBoom() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 1.65;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(950, now);
    lp.frequency.exponentialRampToValueAtTime(65, now + dur);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.28, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(lp);
    lp.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + dur + 0.05);

    const sub = ctx.createOscillator();
    const sGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(95, now);
    sub.frequency.exponentialRampToValueAtTime(24, now + 0.9);
    sGain.gain.setValueAtTime(0.28, now);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    sub.connect(sGain);
    sGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 1.0);
  }

  /**
   * Triumphant Mars Horizon-style landing fanfare chord.
   */
  playLandingFanfare() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.065, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.9);
    });
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
