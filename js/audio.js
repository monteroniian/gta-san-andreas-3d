/* ==========================================================================
   GRAND THEFT AUTO: SAN ANDREAS — PROCEDURAL WEB AUDIO ENGINE
   Synthesizes the West Coast G-Funk theme, Mission Passed fanfare,
   Radio Stations, Engine RPM, Police Sirens, Weapons & Classic Menu SFX.
   ========================================================================== */

class SAAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;

    // Engine synth nodes
    this.engineOsc = null;
    this.engineGain = null;

    // Siren synth nodes
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenPhase = 0;

    // Radio Sequencer
    this.radioStations = [
      { id: 'rls', name: 'RADIO LOS SANTOS', genre: 'West Coast G-Funk & Hip-Hop' },
      { id: 'playback', name: 'PLAYBACK FM', genre: 'Classic East Coast Hip-Hop' },
      { id: 'kdst', name: 'K-DST "THE DUST"', genre: 'Classic 70s Rock' },
      { id: 'bounce', name: 'BOUNCE FM', genre: 'Pure Party Funk' },
      { id: 'off', name: 'RADIO APAGADA', genre: '' }
    ];
    this.currentStationIndex = 0;
    this.radioPlaying = false;
    this.radioTimer = null;
    this.beatStep = 0;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.42;
    this.masterGain.connect(this.ctx.destination);

    // Setup continuous vehicle engine oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 48;

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 190;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;

    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();

    // Setup police siren oscillator
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.value = 650;
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0.0;
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);
    this.sirenOsc.start();

    this.initialized = true;
  }

  /* ------------------- CLASSIC UI & CHEAT SOUNDS ------------------- */
  playMenuHover() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.045);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playMenuClick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.04);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playCheatSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 783.99, 1174.66]; // D5, G5, D6 classic confirmation chime
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      g.gain.setValueAtTime(0.22, now + i * 0.055);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.18);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.19);
    });
  }

  playPickupSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  /* ------------------- MISSION PASSED FANFARE (GTA SA STYLE) ------------------- */
  playMissionPassedFanfare() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // West Coast G-Funk high whine lead melody (D minor / A minor groove)
    const leadMelody = [
      { f: 587.33, t: 0.0, d: 0.35 },   // D5
      { f: 659.25, t: 0.38, d: 0.25 },  // E5
      { f: 698.46, t: 0.66, d: 0.45 },  // F5
      { f: 659.25, t: 1.15, d: 0.28 },  // E5
      { f: 587.33, t: 1.46, d: 0.35 },  // D5
      { f: 523.25, t: 1.85, d: 0.32 },  // C5
      { f: 440.00, t: 2.20, d: 0.55 },  // A4
      { f: 587.33, t: 2.80, d: 0.90 }   // D5 final hold
    ];

    leadMelody.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';

      const flt = this.ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = 1800;

      osc.frequency.setValueAtTime(n.f * 0.97, now + n.t);
      osc.frequency.exponentialRampToValueAtTime(n.f, now + n.t + 0.07);

      g.gain.setValueAtTime(0.001, now + n.t);
      g.gain.linearRampToValueAtTime(0.24, now + n.t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(flt);
      flt.connect(g);
      g.connect(this.masterGain);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });

    // Deep West Coast Sub-Bass notes
    const bassNotes = [
      { f: 73.42, t: 0.0, d: 0.65 },
      { f: 87.31, t: 0.7, d: 0.65 },
      { f: 65.41, t: 1.4, d: 0.70 },
      { f: 73.42, t: 2.2, d: 1.40 }
    ];
    bassNotes.forEach((b) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(b.f, now + b.t);
      g.gain.setValueAtTime(0.35, now + b.t);
      g.gain.exponentialRampToValueAtTime(0.001, now + b.t + b.d);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + b.t);
      osc.stop(now + b.t + b.d + 0.02);
    });
  }

  playWastedSound() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 1.4);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  /* ------------------- WEAPON & COMBAT SFX ------------------- */
  playGunshot(type = 'pistol') {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (type === 'fist' || type === 'bat') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'bat' ? 160 : 120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.11);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
      return;
    }

    if (type === 'spray') {
      this.playNoiseBurst(0.12, 2800, 0.12);
      return;
    }

    // Create white noise burst for gunfire
    const dur = type === 'shotgun' ? 0.32 : type === 'rpg' ? 0.55 : 0.16;
    const cutoff = type === 'shotgun' ? 950 : type === 'ak47' ? 1400 : 1900;
    this.playNoiseBurst(dur, cutoff, 0.38);

    // Low punch transient
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(type === 'shotgun' ? 130 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  playExplosion() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(1.1, 420, 0.65);

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.95);
    g.gain.setValueAtTime(0.6, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.98);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  playHorn(isHydraulics = false) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    if (isHydraulics) {
      // Hydraulic air pump hiss + clunk
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.18);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(370, now);
    }
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playNoiseBurst(duration, filterFreq, volume) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const g = this.ctx.createGain();
    g.gain.value = volume;

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start();
  }

  /* ------------------- CONTINUOUS ENGINE & SIREN ------------------- */
  updateVehicleAudio(inVehicle, speed, vehicleType, policeNearby) {
    if (!this.initialized || !this.ctx) return;

    if (inVehicle && vehicleType !== 'bmx') {
      const absSpeed = Math.abs(speed);
      // Simulate gear shifts
      const gearRatio = (absSpeed % 18) / 18;
      const baseFreq = vehicleType === 'infernus' ? 68 : vehicleType === 'sanchez' ? 82 : 46;
      const targetFreq = baseFreq + gearRatio * 75 + absSpeed * 1.1;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
      this.engineGain.gain.setTargetAtTime(0.11, this.ctx.currentTime, 0.08);
    } else {
      this.engineGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.08);
    }

    if (policeNearby) {
      this.sirenPhase += 0.09;
      const sirenFreq = 680 + Math.sin(this.sirenPhase) * 240;
      this.sirenOsc.frequency.setTargetAtTime(sirenFreq, this.ctx.currentTime, 0.03);
      this.sirenGain.gain.setTargetAtTime(0.07, this.ctx.currentTime, 0.1);
    } else {
      this.sirenGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.1);
    }
  }

  /* ------------------- IN-VEHICLE RADIO SEQUENCER ------------------- */
  startRadio() {
    this.init();
    if (this.radioTimer) clearInterval(this.radioTimer);
    this.radioPlaying = true;
    const station = this.radioStations[this.currentStationIndex];
    if (station.id === 'off') return;

    this.beatStep = 0;
    this.radioTimer = setInterval(() => {
      if (!this.radioPlaying || !this.ctx) return;
      const st = this.radioStations[this.currentStationIndex];
      if (st.id === 'off') return;
      this.playRadioBeatStep(st.id, this.beatStep);
      this.beatStep = (this.beatStep + 1) % 16;
    }, 155); // ~96 BPM West Coast groove
  }

  stopRadio() {
    this.radioPlaying = false;
    if (this.radioTimer) {
      clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
  }

  nextStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % this.radioStations.length;
    this.playMenuHover();
    if (this.radioPlaying) {
      this.startRadio();
    }
    return this.radioStations[this.currentStationIndex];
  }

  playRadioBeatStep(stationId, step) {
    const now = this.ctx.currentTime;

    // Kick on 0, 6, 8, 14
    if (step === 0 || step === 6 || step === 8) {
      const k = this.ctx.createOscillator();
      const kg = this.ctx.createGain();
      k.type = 'sine';
      k.frequency.setValueAtTime(115, now);
      k.frequency.exponentialRampToValueAtTime(36, now + 0.11);
      kg.gain.setValueAtTime(0.18, now);
      kg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      k.connect(kg);
      kg.connect(this.masterGain);
      k.start(now);
      k.stop(now + 0.13);
    }

    // Snare on 4 and 12
    if (step === 4 || step === 12) {
      this.playNoiseBurst(0.08, 1800, 0.08);
    }

    // Station specific melody/bass
    if (stationId === 'rls') {
      // Radio Los Santos: G-Funk high whine + deep D-minor bass
      const bassMap = { 0: 73.42, 3: 73.42, 6: 87.31, 8: 65.41, 11: 65.41, 14: 82.41 };
      if (bassMap[step]) {
        const b = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        b.type = 'triangle';
        b.frequency.setValueAtTime(bassMap[step], now);
        bg.gain.setValueAtTime(0.14, now);
        bg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        b.connect(bg);
        bg.connect(this.masterGain);
        b.start(now);
        b.stop(now + 0.15);
      }
      const leadMap = { 0: 587.33, 2: 698.46, 4: 659.25, 8: 587.33, 12: 880.0 };
      if (leadMap[step]) {
        const l = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        l.type = 'sine';
        l.frequency.setValueAtTime(leadMap[step], now);
        lg.gain.setValueAtTime(0.07, now);
        lg.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        l.connect(lg);
        lg.connect(this.masterGain);
        l.start(now);
        l.stop(now + 0.24);
      }
    } else if (stationId === 'kdst') {
      // K-DST: Classic 70s Rock guitar power chords
      const rockMap = { 0: 146.83, 2: 146.83, 4: 174.61, 6: 196.0, 8: 220.0, 12: 196.0 };
      if (rockMap[step]) {
        const g = this.ctx.createOscillator();
        const gg = this.ctx.createGain();
        g.type = 'sawtooth';
        g.frequency.setValueAtTime(rockMap[step], now);
        gg.gain.setValueAtTime(0.08, now);
        gg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        g.connect(gg);
        gg.connect(this.masterGain);
        g.start(now);
        g.stop(now + 0.15);
      }
    } else if (stationId === 'bounce' || stationId === 'playback') {
      // Funky slap bassline
      const funkMap = { 0: 98.0, 2: 196.0, 5: 116.5, 8: 130.8, 10: 146.8, 14: 116.5 };
      if (funkMap[step]) {
        const f = this.ctx.createOscillator();
        const fg = this.ctx.createGain();
        f.type = 'square';
        f.frequency.setValueAtTime(funkMap[step], now);
        fg.gain.setValueAtTime(0.07, now);
        fg.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        f.connect(fg);
        fg.connect(this.masterGain);
        f.start(now);
        f.stop(now + 0.12);
      }
    }
  }
}

window.saAudio = new SAAudioEngine();
