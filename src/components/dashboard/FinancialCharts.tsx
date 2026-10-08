import React, { useState } from 'react';
import { IndianRupee, TrendingUp, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SolarPlan } from '../../types/solar';

interface FinancialChartsProps {
  plan: SolarPlan;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ plan }) => {
  const [viewHorizon, setViewHorizon] = useState<10 | 25>(10);
  const { financialBreakdown } = plan;

  const cashflows = financialBreakdown.yearlyCashflows.slice(0, viewHorizon);
  const maxCumulative = Math.max(...cashflows.map((c) => Math.abs(c.cumulativeSavings)), 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Financial Payback & Cumulative Wealth
            </h3>
            <p className="text-xs text-slate-500">
              Break-even reached at Year {plan.paybackYears} • Cumulative bill savings thereafter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewHorizon(10)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewHorizon === 10
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            10-Year View
          </button>
          <button
            onClick={() => setViewHorizon(25)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewHorizon === 25
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            25-Year Lifespan
          </button>
        </div>
      </div>

      {/* Capital Cost vs Subsidy Waterfall Bar */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Investment Waterfall</span>
          <span className="text-emerald-700">
            You Save {Math.round((plan.subsidy / plan.installationCost) * 100)}% Upfront via DBT
          </span>
        </div>

        {/* Visual stack bar */}
        <div className="h-6 w-full rounded-xl overflow-hidden flex text-[10px] font-bold text-white shadow-2xs">
          <div
            className="bg-amber-500 flex items-center justify-center truncate px-2"
            style={{
              width: `${(plan.subsidy / plan.installationCost) * 100}%`,
            }}
            title={`Govt Subsidy: ₹${plan.subsidy.toLocaleString('en-IN')}`}
          >
            Govt Subsidy: ₹{plan.subsidy.toLocaleString('en-IN')}
          </div>
          <div
            className="bg-slate-800 flex items-center justify-center truncate px-2"
            style={{
              width: `${(plan.netInvestment / plan.installationCost) * 100}%`,
            }}
            title={`Your Net Cost: ₹${plan.netInvestment.toLocaleString('en-IN')}`}
          >
            Net Out-of-Pocket: ₹{plan.netInvestment.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
          <span>Benchmark Gross: ₹{plan.installationCost.toLocaleString('en-IN')}</span>
          <span className="text-amber-800 font-semibold">PM Surya Ghar Subsidy: ₹{plan.subsidy.toLocaleString('en-IN')}</span>
          <span className="text-slate-900 font-bold">Your Net Capital: ₹{plan.netInvestment.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Cumulative Cashflow visualization */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Cumulative Net Savings (After deducting initial investment & maintenance)</span>
          <span className="font-semibold text-emerald-700">
            Year {viewHorizon} Total: ₹{cashflows[cashflows.length - 1].cumulativeSavings.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
          {cashflows.map((c) => {
            const isNegative = c.cumulativeSavings < 0;
            const isBreakeven = !isNegative && (c.year === Math.ceil(plan.paybackYears));

            return (
              <div
                key={c.year}
                className={`p-2 rounded-xl text-center border transition-all ${
                  isBreakeven
                    ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400'
                    : isNegative
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-500 block">
                  Yr {c.year}
                </span>
                <span
                  className={`text-xs font-black block mt-1 ${
                    isNegative ? 'text-slate-500' : 'text-emerald-700'
                  }`}
                >
                  {isNegative ? '-' : '+'}₹{Math.abs(Math.round(c.cumulativeSavings / 1000))}k
                </span>
                {isBreakeven && (
                  <span className="text-[9px] font-bold text-amber-900 bg-amber-200 px-1 rounded-sm mt-1 inline-block">
                    Payback!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
