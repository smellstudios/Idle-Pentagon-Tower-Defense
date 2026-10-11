/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio API sound generator.
 * Clean, warm, non-harsh synthesis with dynamics compression, rate-limiting,
 * pre-cached noise buffers, and smooth anti-click envelopes.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private isMuted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  // Polyphony rate-limiters (in seconds based on ctx.currentTime)
  private lastSoundTimes: Record<string, number> = {};

  private checkCooldown(soundKey: string, cooldownSec: number, ctx: AudioContext): boolean {
    const now = ctx.currentTime;
    const last = this.lastSoundTimes[soundKey] || 0;
    if (now - last < cooldownSec) {
      return false;
    }
    this.lastSoundTimes[soundKey] = now;
    return true;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      // 1.0s warm pink-filtered noise buffer
      const bufferSize = Math.floor(ctx.sampleRate * 1.0);
      this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // 3-pole pink noise filter for warm, pleasant texture without harsh grating hiss
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.22;
      }
    }
    return this.noiseBuffer;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('pixel_pentagons_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  /**
   * Initializes or resumes the AudioContext on first user interaction.
   */
  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();

      // Master Compressor to prevent any digital distortion, clipping, or raspiness
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);

      // SFX gain bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

      // Routing: SFX -> Compressor -> Master -> Destination
      this.sfxGain.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMute(muted: boolean): boolean {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixel_pentagons_muted', this.isMuted.toString());
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixel_pentagons_muted', this.isMuted.toString());
    }

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.05);
    }

    return this.isMuted;
  }

  // =========================================================================
  // UI & ACTION SOUND EFFECTS
  // =========================================================================

  /**
   * Crisp, high-tech click / tap for switching tabs and categories.
   */
  public playTabSwitch() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('tab', 0.05, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.04);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Satisfying energetic chime when purchasing an upgrade.
   */
  public playUpgradeSuccess(basePitchMultiplier?: number) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('upgrade', 0.06, ctx)) return;

    const t = ctx.currentTime;
    const pitchFactor = basePitchMultiplier ?? (0.85 + Math.random() * 0.4);
    const tones = [587.33 * pitchFactor, 880.00 * pitchFactor, 1174.66 * pitchFactor];

    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.035);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.35 - i * 0.05, t + i * 0.035 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.035 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.035);
      osc.stop(t + i * 0.035 + 0.20);
    });
  }

  /**
   * Resonant cosmic chime when unlocking a permanent Tech Tree node or leveling up.
   */
  public playTechUnlock() {
    this.playLevelUp();
  }

  /**
   * Ascending high-pitched success chime.
   */
  public playLevelUp() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('levelup', 0.15, ctx)) return;

    const t = ctx.currentTime;
    const chords = [440, 554.37, 659.25, 880];

    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.045);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.40, t + idx * 0.045 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.045 + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.045);
      osc.stop(t + idx * 0.045 + 0.40);
    });
  }

  /**
   * Sparkly healing chime.
   */
  public playHeal() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('heal', 0.12, ctx)) return;

    const t = ctx.currentTime;
    const notes = [659.25, 830.61, 987.77, 1318.51];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.035);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.20, t + i * 0.035 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.035 + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.035);
      osc.stop(t + i * 0.035 + 0.16);
    });
  }

  /**
   * Crisp, compact, punchy sci-fi laser shot SFX.
   * Dual-layer synthesis: snappy high-tech transient chirp + tight punchy body.
   */
  public playShoot() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('shoot', 0.038, ctx)) return;

    const t = ctx.currentTime;
    
    // 1. High-frequency laser chirp / snappy transient
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    const pitchOffset = (Math.random() - 0.5) * 80;
    osc.frequency.setValueAtTime(1420 + pitchOffset, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.032);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 0.035);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.042);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.045);

    // 2. Tight, compact tactile punch transient
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();

    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(260, t);
    punchOsc.frequency.exponentialRampToValueAtTime(90, t + 0.022);

    punchGain.gain.setValueAtTime(0.0001, t);
    punchGain.gain.linearRampToValueAtTime(0.18, t + 0.002);
    punchGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    punchOsc.connect(punchGain);
    punchGain.connect(this.sfxGain);

    punchOsc.start(t);
    punchOsc.stop(t + 0.028);
  }

  /**
   * Poisonous spray sound with smooth envelope.
   */
  public playPoisonShoot() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('poisonShoot', 0.06, ctx)) return;

    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    filter.Q.setValueAtTime(2.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.14);
  }

  /**
   * Resonant hollow sound for decay skull bullets.
   */
  public playDecayShoot() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('decayShoot', 0.06, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  /**
   * Sharp crystalline ping for shrapnel glass bullets.
   */
  public playShrapnelShoot() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('shrapnel', 0.04, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.045);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.055);
  }

  /**
   * Rocket barrage ignition & launch sound.
   */
  public playRocketLaunch() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('rocketLaunch', 0.08, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Rocket explosion impact.
   */
  public playRocketExplosion() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('explosion', 0.06, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * Continuous sweeping resonant laser beam sweep sfx.
   */
  public playLaserSweep() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('laserSweep', 0.18, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.32);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Kinetic energy shield / orbital projectile deflection sound.
   */
  public playOrbitalBlock() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('block', 0.04, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.06);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * High-voltage electric lightning zap SFX.
   * Fixed: Clean electric pulse without grating square LFOs or raspy "zzz" buzzing.
   */
  public playZap() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('zap', 0.045, ctx)) return;

    const t = ctx.currentTime;

    // 1. Soft electrical snap
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2200, t);
    noiseFilter.Q.setValueAtTime(3.0, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.linearRampToValueAtTime(0.18, t + 0.003);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.05);

    // 2. High-speed frequency chirp (clean sine/triangle arc)
    const osc = ctx.createOscillator();
    const synthGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.04);

    synthGain.gain.setValueAtTime(0.0001, t);
    synthGain.gain.linearRampToValueAtTime(0.22, t + 0.003);
    synthGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(synthGain);
    synthGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Deep mortar impact explosion with lingering rumble.
   */
  public playMortarExplosion() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('mortar', 0.08, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(24, t + 0.38);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  /**
   * Disintegration pop when an enemy is defeated.
   */
  public playEnemyPop(isBoss: boolean = false) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    const cooldown = isBoss ? 0.08 : 0.035;
    if (!this.checkCooldown('enemyPop', cooldown, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isBoss) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.24);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.50, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.30);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.07);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  /**
   * Impact sound when player takes damage.
   */
  public playHitPlayer() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('hitPlayer', 0.10, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.14);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Success fanfare when completing a wave.
   */
  public playWaveComplete() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('waveComplete', 0.2, ctx)) return;

    const t = ctx.currentTime;
    const notes = [349.23, 440.00, 523.25, 698.46];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.065);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.30, t + i * 0.065 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.065 + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.065);
      osc.stop(t + i * 0.065 + 0.26);
    });
  }

  /**
   * Shimmering fanfare for Ascension.
   */
  public playAscension() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('ascension', 0.3, ctx)) return;

    const t = ctx.currentTime;
    const notes = [293.66, 369.99, 440.00, 587.33, 739.99, 880.00];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.40, t + i * 0.05 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.38);
    });
  }

  public playBossSpawn() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('bossSpawn', 0.5, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 1.2);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.55, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.35);
  }

  public playHitKnockback() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('knockback', 0.05, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.10);
  }

  public playFlowOfCalamity() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('calamity', 0.18, ctx)) return;

    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const dt = t + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + i * 20, dt);
      osc.frequency.exponentialRampToValueAtTime(70, dt + 0.08);

      gain.gain.setValueAtTime(0.0001, dt);
      gain.gain.linearRampToValueAtTime(0.18, dt + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, dt + 0.10);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(dt);
      osc.stop(dt + 0.12);
    }
  }

  public playThorns() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('thorns', 0.06, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.05);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playPoison() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('poison', 0.10, ctx)) return;

    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.frequency.exponentialRampToValueAtTime(450, t + 0.12);
    filter.Q.setValueAtTime(2.0, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.linearRampToValueAtTime(0.10, t + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.14);
  }

  public playDropRarity(rarity: string) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('dropRarity', 0.08, ctx)) return;

    const t = ctx.currentTime;
    let baseFreq = 440;
    if (rarity === 'uncommon') baseFreq = 523.25;
    if (rarity === 'rare') baseFreq = 659.25;
    if (rarity === 'epic') baseFreq = 783.99;
    if (rarity === 'legendary') baseFreq = 1046.50;
    if (rarity === 'mythic') baseFreq = 1318.51;

    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + i * 0.06 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.24);
    });
  }

  public playRareDropAcquire() {
    this.playLevelUp();
  }

  /**
   * Deep, smooth bass drop when the player dies.
   */
  public playDeath() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted || !this.sfxGain) return;
    if (!this.checkCooldown('death', 0.5, ctx)) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.7);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.50, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.80);
  }

  /**
   * Celestial fanfare for prestiging / ascending.
   */
  public playPrestige() {
    this.playAscension();
  }

  public startAmbientMenu() {}
  public startAmbientBattle() {}
}

export const soundEngine = new SoundEngine();
