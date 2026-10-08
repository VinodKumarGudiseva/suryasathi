import React from 'react';
import { Sun, ArrowRight, Zap, IndianRupee, ShieldCheck, CheckCircle, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onStartAssessment: () => void;
  onOpenAdvisor: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartAssessment,
  onOpenAdvisor,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-amber-50/50 via-white to-slate-50">
      {/* Background Solar Flare / Subtle Glow */}
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline and Call-to-actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Government Scheme Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold shadow-xs">
              <Sun className="w-4 h-4 text-amber-600 animate-spin-slow" />
              <span>Aligned with PM Surya Ghar: Muft Bijli Yojana</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-amber-700 font-medium">Up to ₹78,000 Subsidy</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Your AI-powered <br />
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                rooftop solar companion
              </span>
            </h1>

            {/* Supporting Message */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Understand your rooftop solar potential, savings, subsidy, and next steps in minutes.
              Designed specifically for Indian homes navigating DISCOM net-metering.
            </p>

            {/* Quick Benefits Bullet Points */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Direct ₹78k Subsidy</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Zero Bill Potential</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">3-4 Year Payback</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <button
                onClick={onStartAssessment}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Check My Solar Potential</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenAdvisor}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-2xs transition-all hover:border-slate-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Ask SuryaSathi Advisor</span>
              </button>
            </div>

            {/* Assurance footnote */}
            <p className="text-xs text-slate-500 flex items-center justify-center lg:justify-start gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Free preliminary assessment • No login or phone number required</span>
            </p>
          </div>

          {/* Right Column: Interactive Solar Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Card Decoration */}
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-3xl blur-md opacity-25" />

              <div className="relative rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                      Typical Indian Household
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Standard 3 BHK Rooftop Sizing
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                    3 kW Recommended
                  </span>
                </div>

                {/* Highlight Stats Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Annual Generation
                    </span>
                    <div className="text-xl font-extrabold text-slate-900">
                      ~4,350 <span className="text-xs font-normal text-slate-600">kWh</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      ~360 units / month
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                      Annual Savings
                    </span>
                    <div className="text-xl font-extrabold text-emerald-700">
                      ₹32,600+
                    </div>
                    <span className="text-[11px] text-slate-500">
                      At standard slab rates
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <span className="text-xs text-amber-800 flex items-center gap-1 font-semibold">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      Central Subsidy
                    </span>
                    <div className="text-xl font-extrabold text-amber-900">
                      ₹78,000
                    </div>
                    <span className="text-[11px] text-amber-700">
                      Direct DBT to your bank
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <span className="text-xs text-emerald-800 flex items-center gap-1 font-semibold">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      Payback Period
                    </span>
                    <div className="text-xl font-extrabold text-emerald-900">
                      ~2.4 Years
                    </div>
                    <span className="text-[11px] text-emerald-700">
                      Free power for 20+ yrs
                    </span>
                  </div>
                </div>

                {/* Progress bar preview */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Household Electricity Offset</span>
                    <span className="font-bold text-emerald-600">92% Net Zero</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 w-[92%] rounded-full" />
                  </div>
                </div>

                {/* Interactive button on card */}
                <button
                  onClick={onStartAssessment}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Calculate for My Roof & City</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
