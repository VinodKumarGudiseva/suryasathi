import React, { useState } from 'react';
import { BarChart3, Sun, Info } from 'lucide-react';
import { SolarPlan } from '../../types/solar';

interface GenerationChartProps {
  plan: SolarPlan;
}

export const GenerationChart: React.FC<GenerationChartProps> = ({ plan }) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Use the exact monthly generation array from the calculation engine so annual sum === monthly sum
  const monthlyData = plan.monthlyGeneration && plan.monthlyGeneration.length === 12
    ? plan.monthlyGeneration
    : [
        { month: 'Jan', kwh: Math.round((plan.annualGenerationKwh * 0.95) / 12), isMonsoon: false, isPeakSummer: false },
        { month: 'Feb', kwh: Math.round((plan.annualGenerationKwh * 1.05) / 12), isMonsoon: false, isPeakSummer: false },
        { month: 'Mar', kwh: Math.round((plan.annualGenerationKwh * 1.15) / 12), isMonsoon: false, isPeakSummer: true },
        { month: 'Apr', kwh: Math.round((plan.annualGenerationKwh * 1.20) / 12), isMonsoon: false, isPeakSummer: true },
        { month: 'May', kwh: Math.round((plan.annualGenerationKwh * 1.25) / 12), isMonsoon: false, isPeakSummer: true },
        { month: 'Jun', kwh: Math.round((plan.annualGenerationKwh * 0.95) / 12), isMonsoon: true, isPeakSummer: false },
        { month: 'Jul', kwh: Math.round((plan.annualGenerationKwh * 0.75) / 12), isMonsoon: true, isPeakSummer: false },
        { month: 'Aug', kwh: Math.round((plan.annualGenerationKwh * 0.75) / 12), isMonsoon: true, isPeakSummer: false },
        { month: 'Sep', kwh: Math.round((plan.annualGenerationKwh * 0.90) / 12), isMonsoon: false, isPeakSummer: false },
        { month: 'Oct', kwh: Math.round((plan.annualGenerationKwh * 1.05) / 12), isMonsoon: false, isPeakSummer: false },
        { month: 'Nov', kwh: Math.round((plan.annualGenerationKwh * 1.02) / 12), isMonsoon: false, isPeakSummer: false },
        { month: 'Dec', kwh: Math.round((plan.annualGenerationKwh * 0.98) / 12), isMonsoon: false, isPeakSummer: false },
      ];

  const maxKwh = Math.max(...monthlyData.map((d) => d.kwh), 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Estimated Monthly Solar Generation
            </h3>
            <p className="text-xs text-slate-500">
              Accounts for summer peaks & monsoon cloud cover in {plan.location.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            Clear Sun
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
            Monsoon Months
          </span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="h-56 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2 border-b border-slate-100">
        {monthlyData.map((d, i) => {
          const heightPercent = Math.round((d.kwh / maxKwh) * 85);
          const isHovered = hoveredMonth === i;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHoveredMonth(i)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 z-20 px-2 py-1 bg-slate-900 text-white rounded-md text-[11px] font-semibold whitespace-nowrap shadow-lg">
                  {d.month}: {d.kwh} units
                </div>
              )}

              {/* Bar */}
              <div
                className={`w-full max-w-[32px] rounded-t-md transition-all duration-200 ${
                  d.isMonsoon
                    ? 'bg-sky-400 group-hover:bg-sky-500'
                    : 'bg-gradient-to-t from-amber-500 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500'
                } ${isHovered ? 'ring-2 ring-amber-300 scale-y-105' : ''}`}
                style={{ height: `${heightPercent}%` }}
              />

              {/* Month label */}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-2">
                {d.month}
              </span>
            </div>
          );
        })}
      </div>

      {/* Insight Note */}
      <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>
          Daily average generation is approx{' '}
          <strong className="text-slate-800">
            {Math.round((plan.annualGenerationKwh / 365) * 10) / 10} kWh/day
          </strong>
          . Under net-metering, extra power produced during peak summer months banks in your DISCOM account to offset monsoon draw.
        </span>
      </div>
    </div>
  );
};
