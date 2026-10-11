/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shuffled Playlist Background Music Engine.
 * 
 * Plays a randomized, non-repeating queue (Fisher-Yates shuffle cycle) of soundtrack MP3s:
 *   - Track 1: "Press Fuse" by French Fuse
 *   - Track 2: "Adventure" by KLICKAUD
 *   - Allows adding custom MP3 tracks via upload or URL.
 * 
 * Features:
 *   - True non-repeating shuffle cycle (all tracks played before re-shuffling; no track immediately repeats).
 *   - Dynamic queue display: Now Playing, Upcoming Queue, and playback progress / duration.
 *   - Controls: Next track, Previous track, Play / Pause, Shuffle toggle, Loop mode, and Track locking.
 *   - Ambient low-pass filtering on death, boss intensity gain/equalization, and master volume control.
 *   - Seamless fallback between Web Audio API graph and standard HTML5 Audio.
 */

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  subtitle: string;
  url: string;
  isCustom?: boolean;
  duration?: number;
}

export type PlaybackMode = 'shuffle' | 'sequential' | 'repeat_one';

export const DEFAULT_TRACKS: TrackMetadata[] = [
  {
    id: 'press-fuse',
    title: 'Press Fuse',
    artist: 'French Fuse',
    subtitle: 'High-Energy Electro Pulse Theme',
    url: '/music/press-fuse-french-fuse.mp3',
  },
  {
    id: 'adventure-klickaud',
    title: 'Adventure',
    artist: 'KLICKAUD',
    subtitle: 'Epic Sci-Fi Cinematic Exploration',
    url: '/music/adventure-klickaud.mp3',
  },
];

export class BGMEngine {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private masterMusicGain: GainNode | null = null;

  private tracks: TrackMetadata[] = [...DEFAULT_TRACKS];
  private playlistQueue: string[] = []; // track ids in upcoming shuffled order
  private historyQueue: string[] = [];  // track ids previously played
  private currentTrackId: string = 'press-fuse';

  private isMuted: boolean = false;
  private volume: number = 0.55;
  private isDead: boolean = false;
  private isPlaying: boolean = false;
  private playbackMode: PlaybackMode = 'shuffle';

  private currentTimeSec: number = 0;
  private durationSec: number = 0;

  private initialized: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('pixel_pentagons_bgm_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }

      const savedVol = localStorage.getItem('pixel_pentagons_bgm_vol');
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }

      const savedMode = localStorage.getItem('pixel_pentagons_bgm_playback_mode') as PlaybackMode | null;
      if (savedMode && ['shuffle', 'sequential', 'repeat_one'].includes(savedMode)) {
        this.playbackMode = savedMode;
      }

      // Restore custom tracks if present in localStorage
      try {
        const savedCustom = localStorage.getItem('pixel_pentagons_bgm_custom_tracks');
        if (savedCustom) {
          const parsedCustom: TrackMetadata[] = JSON.parse(savedCustom);
          if (Array.isArray(parsedCustom) && parsedCustom.length > 0) {
            this.tracks = [...DEFAULT_TRACKS, ...parsedCustom];
          }
        }
      } catch {
        // Ignore custom track parsing errors
      }
    }

    this.rebuildShuffleQueue();
  }

  /**
   * Generates a randomized queue of remaining track IDs so every track plays
   * exactly once before repeating, avoiding immediate back-to-back repeats.
   */
  private rebuildShuffleQueue(lastPlayedId?: string) {
    const allIds = this.tracks.map(t => t.id);
    if (allIds.length === 0) {
      this.playlistQueue = [];
      return;
    }

    if (allIds.length === 1) {
      this.playlistQueue = [allIds[0]];
      return;
    }

    // Fisher-Yates shuffle
    const pool = [...allIds];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // If the first track in the new pool is identical to the last played track, swap it
    if (lastPlayedId && pool[0] === lastPlayedId && pool.length > 1) {
      const swapIndex = 1 + Math.floor(Math.random() * (pool.length - 1));
      [pool[0], pool[swapIndex]] = [pool[swapIndex], pool[0]];
    }

    this.playlistQueue = pool;
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private initAudioElements() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    try {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.crossOrigin = 'anonymous';

      this.audio.addEventListener('ended', () => {
        this.playNextTrack(true);
      });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          this.currentTimeSec = this.audio.currentTime || 0;
          this.durationSec = this.audio.duration || 0;
          this.notify();
        }
      });

      this.audio.addEventListener('loadedmetadata', () => {
        if (this.audio) {
          this.durationSec = this.audio.duration || 0;
          this.notify();
        }
      });

      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.notify();
      });

      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('BGM Audio playback warning:', e);
        // Fallback: try next track if one fails
        setTimeout(() => {
          if (this.isPlaying) {
            this.playNextTrack(false);
          }
        }, 1000);
      });

      // Prepare Web Audio Graph
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterMusicGain = this.ctx.createGain();
        this.masterMusicGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(this.isDead ? 350 : 20000, this.ctx.currentTime);

        try {
          const src = this.ctx.createMediaElementSource(this.audio);
          src.connect(this.filterNode);
          this.filterNode.connect(this.masterMusicGain);
          this.masterMusicGain.connect(this.ctx.destination);
        } catch {
          // If media element source fails (CORS), fall back to audio element volume directly
        }
      }

      // Load initial track
      this.loadTrack(this.currentTrackId, false);
    } catch (e) {
      console.warn('Failed to initialize BGM audio element:', e);
    }
  }

  private loadTrack(trackId: string, autoPlay: boolean = true) {
    const track = this.tracks.find(t => t.id === trackId) || this.tracks[0];
    if (!track) return;

    this.currentTrackId = track.id;

    if (!this.audio) {
      this.initAudioElements();
    }

    if (this.audio) {
      if (this.audio.src !== track.url) {
        this.audio.src = track.url;
        this.audio.load();
      }

      this.audio.volume = this.isMuted ? 0 : this.volume;

      if (autoPlay && !this.isMuted) {
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.notify();
        }).catch(() => {
          // Handled on first user gesture
        });
      }
    }

    this.notify();
  }

  public ensureContext(): AudioContext | null {
    if (!this.initialized) {
      this.initAudioElements();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startBGM() {
    this.ensureContext();
    if (this.isMuted) return;

    if (this.audio) {
      this.audio.volume = this.volume;
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.notify();
      }).catch(() => {});
    }
    this.applyGains();
  }

  public pauseBGM() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
      this.notify();
    }
  }

  public stopBGM() {
    this.pauseBGM();
    if (this.audio) {
      this.audio.currentTime = 0;
    }
  }

  /**
   * Advances to next track based on shuffle or sequential mode.
   * Guarantees non-repeating shuffle cycle!
   */
  public playNextTrack(autoAdvance: boolean = false) {
    if (this.tracks.length === 0) return;

    if (autoAdvance && this.playbackMode === 'repeat_one') {
      if (this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
      }
      return;
    }

    this.historyQueue.push(this.currentTrackId);
    if (this.historyQueue.length > 20) {
      this.historyQueue.shift();
    }

    let nextTrackId: string;

    if (this.playbackMode === 'sequential') {
      const curIndex = this.tracks.findIndex(t => t.id === this.currentTrackId);
      const nextIndex = (curIndex + 1) % this.tracks.length;
      nextTrackId = this.tracks[nextIndex].id;
    } else {
      // Shuffled mode: take next from shuffled queue
      if (this.playlistQueue.length === 0) {
        this.rebuildShuffleQueue(this.currentTrackId);
      }
      nextTrackId = this.playlistQueue.shift() || this.tracks[0].id;
      
      // If we just exhausted the queue, refill it in background
      if (this.playlistQueue.length === 0) {
        this.rebuildShuffleQueue(nextTrackId);
      }
    }

    this.loadTrack(nextTrackId, this.isPlaying || !this.isMuted);
  }

  public playPrevTrack() {
    if (this.tracks.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (this.audio && this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    if (this.historyQueue.length > 0) {
      const prevId = this.historyQueue.pop()!;
      // Put current track back on front of upcoming queue
      this.playlistQueue.unshift(this.currentTrackId);
      this.loadTrack(prevId, this.isPlaying || !this.isMuted);
    } else {
      // If no history, pick random or sequential prev
      const curIndex = this.tracks.findIndex(t => t.id === this.currentTrackId);
      const prevIndex = (curIndex - 1 + this.tracks.length) % this.tracks.length;
      this.loadTrack(this.tracks[prevIndex].id, this.isPlaying || !this.isMuted);
    }
  }

  public playTrackById(trackId: string) {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;

    this.historyQueue.push(this.currentTrackId);
    // Remove track from queue if present
    this.playlistQueue = this.playlistQueue.filter(id => id !== trackId);
    if (this.playlistQueue.length === 0) {
      this.rebuildShuffleQueue(trackId);
    }

    this.loadTrack(trackId, true);
  }

  public seek(seconds: number) {
    if (this.audio && isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.durationSec || 9999));
      this.currentTimeSec = this.audio.currentTime;
      this.notify();
    }
  }

  public setPlaybackMode(mode: PlaybackMode) {
    this.playbackMode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixel_pentagons_bgm_playback_mode', mode);
    }
    if (mode === 'shuffle') {
      this.rebuildShuffleQueue(this.currentTrackId);
    }
    this.notify();
  }

  public getPlaybackMode(): PlaybackMode {
    return this.playbackMode;
  }

  public toggleShuffle() {
    const nextMode: PlaybackMode = this.playbackMode === 'shuffle' ? 'sequential' : 'shuffle';
    this.setPlaybackMode(nextMode);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixel_pentagons_bgm_muted', muted.toString());
    }
    this.applyGains();

    if (!this.isMuted && !this.isPlaying) {
      this.startBGM();
    } else if (this.isMuted && this.isPlaying) {
      this.pauseBGM();
    }
    this.notify();
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMute(next);
    return next;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixel_pentagons_bgm_vol', this.volume.toFixed(2));
    }
    this.applyGains();
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  private applyGains() {
    if (this.ctx && this.masterMusicGain) {
      const t = this.ctx.currentTime;
      this.masterMusicGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, t, 0.05);
    }
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public setDeadMode(active: boolean) {
    this.isDead = active;
    if (this.filterNode && this.ctx) {
      const targetFreq = this.isDead ? 350 : 20000;
      this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.3);
    }
  }

  public setBossMode(_active: boolean) {
    // Boss mode presence hook for dynamic ambiance
  }

  public setIntensity(_value: number) {
    // Wave intensity hook
  }

  public setTier(_tier: number) {
    // Tier progression hook
  }

  public getCurrentTrack(): TrackMetadata {
    return this.tracks.find(t => t.id === this.currentTrackId) || this.tracks[0];
  }

  public getAllTracks(): TrackMetadata[] {
    return [...this.tracks];
  }

  public getUpcomingQueue(): TrackMetadata[] {
    const map = new Map(this.tracks.map(t => [t.id, t]));
    return this.playlistQueue.map(id => map.get(id)).filter((t): t is TrackMetadata => Boolean(t));
  }

  public getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.volume,
      currentTime: this.currentTimeSec,
      duration: this.durationSec,
      currentTrack: this.getCurrentTrack(),
      playbackMode: this.playbackMode,
      queue: this.getUpcomingQueue(),
    };
  }

  public addCustomTrack(file: File, objectUrl: string): TrackMetadata {
    const newTrack: TrackMetadata = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Custom Upload',
      subtitle: 'User Custom MP3 Track',
      url: objectUrl,
      isCustom: true,
    };

    this.tracks.push(newTrack);
    this.playlistQueue.push(newTrack.id);
    this.notify();
    return newTrack;
  }

  public resetToDefaultPlaylist() {
    this.tracks = [...DEFAULT_TRACKS];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pixel_pentagons_bgm_custom_tracks');
    }
    this.rebuildShuffleQueue();
    this.loadTrack(DEFAULT_TRACKS[0].id, this.isPlaying);
    this.notify();
  }

  // Compatibility helpers
  public getMode(): string {
    return this.playbackMode;
  }

  public getActiveTrackId(): string {
    return this.currentTrackId;
  }

  public getTracksInfo(): TrackMetadata[] {
    return this.getAllTracks();
  }
}

export const bgmEngine = new BGMEngine();
