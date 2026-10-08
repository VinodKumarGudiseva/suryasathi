import React from 'react';
import { TrendingUp, ShieldCheck, SunMedium, Zap } from 'lucide-react';

export const WhySolarSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs uppercase tracking-wider text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Why Rooftop Solar Now
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Protect your family against rising power bills for the next 25 years
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Electricity tariffs across Indian DISCOMs rise by 3% to 6% annually. A rooftop solar system locks in your electricity costs at zero for 25 years while providing an annual financial return exceeding typical fixed deposits.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">25%+ Annual Return on Investment</h4>
                  <p className="text-xs text-slate-600">With a 2.5 to 3.5 year payback, the remaining 21+ years represent pure savings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <SunMedium className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Abundant Tropical Sunlight</h4>
                  <p className="text-xs text-slate-600">India enjoys ~300 sunny days a year with average insolation of 4.5 to 5.5 kWh/m²/day.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">25-Year Performance Warranty</h4>
                  <p className="text-xs text-slate-600">Tier-1 solar PV modules come with manufacturer linear power warranties up to 25 years.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 relative">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-lg text-white">Financial Comparison</span>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-medium border border-amber-500/30">
                    3 kW Rooftop System
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Without Solar (25 Years)</span>
                    <div className="text-2xl font-black text-rose-400">
                      ₹8,50,000+
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cumulative electricity bills paid directly to DISCOM assuming modest 3.5% tariff escalation.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 space-y-2">
                    <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">With Solar (Net Investment)</span>
                    <div className="text-2xl font-black text-emerald-300">
                      ~₹78,000
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      One-time out-of-pocket investment after ₹78,000 PM Surya Ghar DBT subsidy.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
                  <span>Net Estimated 25-Year Wealth Saved:</span>
                  <span className="font-bold text-amber-400 text-sm">~₹7.7 Lakhs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
