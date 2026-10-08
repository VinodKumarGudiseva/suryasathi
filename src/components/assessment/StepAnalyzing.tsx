import React, { useEffect, useState } from 'react';
import { Sun, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface StepAnalyzingProps {
  onComplete: () => void;
  locationCity: string;
  locationState: string;
}

export const StepAnalyzing: React.FC<StepAnalyzingProps> = ({
  onComplete,
  locationCity,
  locationState,
}) => {
  const stages = [
    `Fetching solar insolation factors for ${locationCity}, ${locationState}...`,
    'Evaluating roof shadow profile & optimal tilt orientation...',
    'Matching PM Surya Ghar: Muft Bijli Yojana subsidy brackets...',
    'Calculating DISCOM tariff savings & 25-year financial payback...',
    'Generating personalized solar plan & document roadmap...',
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
      });
    }, 650);

    return () => clearInterval(interval);
  }, [stages.length, onComplete]);

  return (
    <div className="py-12 sm:py-16 text-center max-w-lg mx-auto space-y-8 animate-fadeIn">
      {/* Animated Solar Spinner */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
          <Sun className="w-12 h-12 animate-spin-slow" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Generating Your Solar Plan
        </h2>
        <p className="text-sm text-slate-500">
          SuryaSathi Solar Intelligence Engine is processing your inputs
        </p>
      </div>

      {/* Progress Checklist */}
      <div className="space-y-3 text-left bg-slate-50 p-5 rounded-2xl border border-slate-200">
        {stages.map((stageText, idx) => {
          const isDone = idx < currentStageIdx;
          const isCurrent = idx === currentStageIdx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs sm:text-sm transition-all ${
                isDone
                  ? 'text-slate-700 font-medium'
                  : isCurrent
                  ? 'text-amber-900 font-bold'
                  : 'text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
              )}
              <span className="truncate">{stageText}</span>
            </div>
          );
        })}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg border border-amber-200 text-xs font-semibold text-amber-800">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span>Grounded in MNRE CERC Benchmarks</span>
      </div>
    </div>
  );
};
