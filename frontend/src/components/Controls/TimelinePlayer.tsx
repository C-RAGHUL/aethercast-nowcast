import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Zap, Clock } from 'lucide-react';
import { TimelineStep } from '../../types/nowcast';

interface TimelinePlayerProps {
  currentLeadTime: number;
  onLeadTimeChange: (leadTime: number) => void;
  timelineSteps: TimelineStep[];
  isLoading?: boolean;
}

const STEPS = [0, 15, 30, 45, 60, 75, 90, 105, 120];

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  currentLeadTime,
  onLeadTimeChange,
  timelineSteps,
  isLoading = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 4x
  const timerRef = useRef<number | null>(null);

  const currentIndex = STEPS.indexOf(currentLeadTime);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentStepData = timelineSteps.find((s) => s.lead_time_min === currentLeadTime);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(400, 1400 / playbackSpeed);
    timerRef.current = window.setInterval(() => {
      onLeadTimeChange(STEPS[(safeIndex + 1) % STEPS.length]);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, safeIndex, playbackSpeed, onLeadTimeChange]);

  const handlePrev = () => {
    const nextIdx = (safeIndex - 1 + STEPS.length) % STEPS.length;
    onLeadTimeChange(STEPS[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (safeIndex + 1) % STEPS.length;
    onLeadTimeChange(STEPS[nextIdx]);
  };

  const cycleSpeed = () => {
    if (playbackSpeed === 1) setPlaybackSpeed(2);
    else if (playbackSpeed === 2) setPlaybackSpeed(4);
    else setPlaybackSpeed(1);
  };

  const getRiskBadgeColor = (risk?: string) => {
    switch (risk) {
      case 'extreme': return 'bg-purple-950/80 border-purple-500 text-purple-300';
      case 'high': return 'bg-red-950/80 border-red-500 text-red-300';
      case 'medium': return 'bg-orange-950/80 border-orange-500 text-orange-300';
      default: return 'bg-yellow-950/80 border-yellow-500 text-yellow-300';
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-center justify-between gap-3 select-none z-20 w-full max-w-2xl">
      {/* Playback Controls & Status */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handlePrev}
          title="Previous 15 min step"
          className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? "Pause Nowcast Animation" : "Play 0-120min Forecast"}
          className={`p-2.5 rounded-lg font-bold flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
        </button>

        <button
          onClick={handleNext}
          title="Next 15 min step"
          className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={cycleSpeed}
          title="Toggle Playback Speed"
          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700/60"
        >
          {playbackSpeed}x
        </button>

        {/* Lead time badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="flex items-center space-x-1.5 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-sm font-semibold text-cyan-300">
              {currentLeadTime === 0 ? "LIVE (T+0m)" : `+${currentLeadTime} MIN NOWCAST`}
            </span>
          </div>

          {currentStepData && (
            <div className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-mono text-xs font-medium uppercase ${getRiskBadgeColor(currentStepData.overall_risk)}`}>
              <Zap className="w-3 h-3" />
              <span>{currentStepData.overall_risk} Risk</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrubbing Track & Time Stops */}
      <div className="flex-1 w-full max-w-2xl px-2">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={STEPS.length - 1}
            step={1}
            value={safeIndex}
            onChange={(e) => onLeadTimeChange(STEPS[parseInt(e.target.value)])}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
          />
        </div>

        {/* Tick labels */}
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
          {STEPS.map((step, idx) => {
            const isActive = step === currentLeadTime;
            return (
              <button
                key={step}
                onClick={() => onLeadTimeChange(step)}
                className={`transition-colors flex flex-col items-center ${
                  isActive
                    ? 'text-cyan-400 font-bold scale-110'
                    : 'hover:text-slate-200'
                }`}
              >
                <span className={`w-1 h-1.5 rounded-full mb-1 ${isActive ? 'bg-cyan-400' : 'bg-slate-700'}`}></span>
                <span>{step === 0 ? 'Now' : `+${step}m`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset to current time */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onLeadTimeChange(0)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 font-mono text-xs border border-slate-700/60 transition-colors"
          title="Reset to T+0 current observation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset (T+0)</span>
        </button>
      </div>
    </div>
  );
};
