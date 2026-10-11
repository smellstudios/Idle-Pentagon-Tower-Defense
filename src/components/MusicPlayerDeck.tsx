/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Volume2, 
  VolumeX, 
  Sliders, 
  ListMusic, 
  Upload, 
  RotateCcw, 
  Music,
  Radio,
  Repeat,
  Repeat1
} from 'lucide-react';
import { bgmEngine, TrackMetadata, PlaybackMode } from '../game/bgm';
import { soundEngine } from '../game/sound';

interface Props {
  bgmMuted: boolean;
  onUpdateSettings: (settings: { bgmMuted: boolean }) => void;
}

export const MusicPlayerDeck: React.FC<Props> = ({ bgmMuted, onUpdateSettings }) => {
  const [playbackState, setPlaybackState] = useState(() => bgmEngine.getPlaybackState());
  const [volumePercent, setVolumePercent] = useState(() => Math.round(bgmEngine.getVolume() * 100));
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = bgmEngine.subscribe(() => {
      setPlaybackState(bgmEngine.getPlaybackState());
    });
    return unsubscribe;
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = () => {
    soundEngine.playTabSwitch();
    if (playbackState.isPlaying) {
      bgmEngine.pauseBGM();
    } else {
      if (bgmMuted) {
        onUpdateSettings({ bgmMuted: false });
        bgmEngine.setMute(false);
      }
      bgmEngine.startBGM();
    }
  };

  const handleToggleMute = () => {
    soundEngine.playTabSwitch();
    const nextMuted = !bgmMuted;
    bgmEngine.setMute(nextMuted);
    onUpdateSettings({ bgmMuted: nextMuted });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolumePercent(val);
    bgmEngine.setVolume(val / 100);
  };

  const handleNext = () => {
    soundEngine.playTabSwitch();
    bgmEngine.playNextTrack(false);
  };

  const handlePrev = () => {
    soundEngine.playTabSwitch();
    bgmEngine.playPrevTrack();
  };

  const handleToggleMode = () => {
    soundEngine.playTabSwitch();
    const modes: PlaybackMode[] = ['shuffle', 'sequential', 'repeat_one'];
    const curIdx = modes.indexOf(playbackState.playbackMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    bgmEngine.setPlaybackMode(nextMode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      bgmEngine.addCustomTrack(file, url);
      soundEngine.playTechUnlock();
    }
  };

  const currentTrack = playbackState.currentTrack;
  const progressPercent = playbackState.duration > 0 
    ? Math.min(100, (playbackState.currentTime / playbackState.duration) * 100) 
    : 0;

  return (
    <div className="rounded-xl bg-gradient-to-b from-purple-950/40 via-zinc-900/80 to-zinc-950 border border-purple-500/30 p-3 sm:p-4 space-y-3 shadow-xl">
      {/* Top Banner: Now Playing with Vinyl Disk Visualizer */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated Vinyl / Turntable Disc */}
          <div className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-purple-900 via-zinc-900 to-indigo-900 border-2 border-purple-500/60 flex items-center justify-center shadow-lg shadow-purple-950/50">
            <div className={`w-8 h-8 rounded-full border border-purple-400/40 flex items-center justify-center ${
              playbackState.isPlaying && !bgmMuted ? 'animate-[spin_4s_linear_infinite]' : ''
            }`}>
              <Radio className="w-4 h-4 text-purple-300" />
            </div>
            <div className="absolute inset-0 rounded-full border border-white/10" />
          </div>

          {/* Track Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                {playbackState.playbackMode === 'shuffle' ? 'SHUFFLE ACTIVE' : playbackState.playbackMode === 'repeat_one' ? 'REPEAT ONE' : 'SEQUENTIAL'}
              </span>
              {playbackState.isPlaying && !bgmMuted && (
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-400 font-bold">PLAYING</span>
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-black text-white truncate font-mono mt-0.5">
              {currentTrack?.title || 'No Track'}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-purple-300/80 truncate font-mono">
              {currentTrack?.artist || 'Unknown Artist'} • {currentTrack?.subtitle}
            </p>
          </div>
        </div>

        {/* Master Mute Button */}
        <button
          onClick={handleToggleMute}
          className={`shrink-0 px-2.5 py-1.5 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            bgmMuted
              ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-rose-950/50 shadow-sm'
              : 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
          }`}
          title={bgmMuted ? 'Unmute BGM' : 'Mute BGM'}
        >
          {bgmMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{bgmMuted ? 'MUTED' : 'UNMUTED'}</span>
        </button>
      </div>

      {/* Progress Bar & Seek Scrub */}
      <div className="space-y-1">
        <div 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (playbackState.duration > 0) {
              bgmEngine.seek(pos * playbackState.duration);
            }
          }}
          className="relative h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden cursor-pointer group border border-white/5"
        >
          <div 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 opacity-0 group-hover:opacity-100 bg-white/20 w-full transition-opacity" 
          />
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
          <span>{formatTime(playbackState.currentTime)}</span>
          <span className="text-zinc-500">Non-Repeating Shuffle Cycle</span>
          <span>{formatTime(playbackState.duration)}</span>
        </div>
      </div>

      {/* Transport Controls Deck */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Mode toggler */}
        <button
          onClick={handleToggleMode}
          title={`Switch Mode (Current: ${playbackState.playbackMode})`}
          className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            playbackState.playbackMode === 'shuffle'
              ? 'bg-purple-900/60 border-purple-500 text-purple-200'
              : playbackState.playbackMode === 'repeat_one'
              ? 'bg-indigo-900/60 border-indigo-500 text-indigo-200'
              : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
          }`}
        >
          {playbackState.playbackMode === 'shuffle' ? (
            <Shuffle className="w-3.5 h-3.5 text-purple-400" />
          ) : playbackState.playbackMode === 'repeat_one' ? (
            <Repeat1 className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Repeat className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="hidden sm:inline text-[10px] font-bold">
            {playbackState.playbackMode === 'shuffle' ? 'Shuffle' : playbackState.playbackMode === 'repeat_one' ? 'Repeat 1' : 'Sequential'}
          </span>
        </button>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Previous track"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`p-2.5 sm:px-4 sm:py-2.5 rounded-xl border font-mono text-xs font-black flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg ${
              playbackState.isPlaying && !bgmMuted
                ? 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-white shadow-purple-900/60'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-zinc-200'
            }`}
            title={playbackState.isPlaying ? 'Pause music' : 'Play music'}
          >
            {playbackState.isPlaying && !bgmMuted ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span className="hidden sm:inline">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span className="hidden sm:inline">PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Next shuffled track (Never repeats until queue cycles)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Queue / Playlist toggle */}
        <button
          onClick={() => {
            soundEngine.playTabSwitch();
            setIsQueueOpen(!isQueueOpen);
          }}
          className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            isQueueOpen
              ? 'bg-indigo-950/80 border-indigo-400 text-indigo-200'
              : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
          }`}
          title="Toggle Playlist & Queue view"
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden sm:inline">
            Queue ({bgmEngine.getAllTracks().length})
          </span>
        </button>
      </div>

      {/* Volume Slider Bar */}
      <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 shrink-0">
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Volume</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volumePercent}
          onChange={handleVolumeChange}
          className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
        />
        <span className="text-[11px] font-mono font-bold text-purple-300 w-9 text-right shrink-0">
          {volumePercent}%
        </span>
      </div>

      {/* Expandable Shuffled Playlist & Queue Drawer */}
      {isQueueOpen && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
              <Music className="w-3 h-3 text-cyan-400" />
              Playlist & Upcoming Shuffled Queue
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-950/40 hover:bg-purple-950/70 px-2 py-1 rounded border border-purple-800/50 cursor-pointer"
                title="Add your own MP3 file to playlist"
              >
                <Upload className="w-2.5 h-2.5" />
                Add MP3
              </button>
              <button
                onClick={() => {
                  soundEngine.playTabSwitch();
                  bgmEngine.resetToDefaultPlaylist();
                }}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 bg-zinc-800/60 hover:bg-zinc-800 px-2 py-1 rounded border border-zinc-700/60 cursor-pointer"
                title="Reset to default 2 MP3 tracks"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,audio/mpeg,audio/mp3"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* List of tracks */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {bgmEngine.getAllTracks().map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    bgmEngine.playTrackById(track.id);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-950/60 border-purple-500/70 text-white shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 w-3.5 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCurrent && playbackState.isPlaying && !bgmMuted
                          ? 'bg-emerald-400 animate-pulse'
                          : isCurrent
                          ? 'bg-purple-400'
                          : 'bg-zinc-700'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate text-[11px] flex items-center gap-1.5">
                        <span>{track.title}</span>
                        {isCurrent && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold border border-purple-400/40">
                            NOW PLAYING
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-zinc-400 truncate">
                        {track.artist} • {track.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {track.isCustom ? 'Custom' : 'Official MP3'}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[9px] font-mono text-zinc-500 text-center pt-1">
            ✦ Shuffled non-repeating algorithm cycles all tracks once before next randomization.
          </p>
        </div>
      )}
    </div>
  );
};
