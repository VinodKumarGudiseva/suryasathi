import React from 'react';
import { Leaf, TreePine, Car, Flame, Award } from 'lucide-react';
import { EnvironmentalImpact } from '../../types/solar';

interface EnvironmentalImpactCardProps {
  impact: EnvironmentalImpact;
}

export const EnvironmentalImpactCard: React.FC<EnvironmentalImpactCardProps> = ({
  impact,
}) => {
  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              Environmental Impact & Decarbonization
            </h3>
            <p className="text-xs text-emerald-300">
              Grounded in Central Electricity Authority (CEA) Indian Grid Baseline
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          Clean Energy Champion
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
        {/* Metric 1: Annual CO2 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <Leaf className="w-3.5 h-3.5" />
            <span>Annual CO₂ Offset</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {impact.annualCO2ReductionKg.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-emerald-200">kg</span>
          </div>
          <p className="text-[11px] text-slate-300">
            {(impact.annualCO2ReductionKg / 1000).toFixed(2)} tonnes / year
          </p>
        </div>

        {/* Metric 2: Trees */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <TreePine className="w-3.5 h-3.5" />
            <span>Trees Equivalent</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {impact.equivalentTreesPlanted}{' '}
            <span className="text-xs font-normal text-emerald-200">trees</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Absorbed annually
          </p>
        </div>

        {/* Metric 3: Car Travel */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <Car className="w-3.5 h-3.5" />
            <span>Petrol Car Offset</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {impact.equivalentCarKmOffset.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-emerald-200">km</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Tailpipe emissions avoided
          </p>
        </div>

        {/* Metric 4: Coal displaced */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <Flame className="w-3.5 h-3.5" />
            <span>Coal Saved</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {impact.coalSavedTonnesAnnual}{' '}
            <span className="text-xs font-normal text-emerald-200">tonnes</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Thermal power displaced
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-300 gap-2">
        <span>25-Year Lifetime Carbon Abatement:</span>
        <span className="font-bold text-emerald-300 text-sm">
          ~{impact.twentyFiveYearCO2ReductionTonnes} Metric Tonnes of CO₂
        </span>
      </div>
    </div>
  );
};
