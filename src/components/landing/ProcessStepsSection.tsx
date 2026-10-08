import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const ProcessStepsSection: React.FC<{ onStartAssessment: () => void }> = ({
  onStartAssessment,
}) => {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-amber-50/40 border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-wider text-amber-700 font-bold bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
            Get Started in 3 Minutes
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to find your rooftop solar potential?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Take the quick guided assessment. Discover your recommended system capacity, central subsidy eligibility, and payback period.
          </p>
        </div>

        <div className="inline-flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onStartAssessment}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Check My Solar Potential</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Free Preliminary Report</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PM Surya Ghar DBT Subsidy Aligned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Downloadable / Printable Plan</span>
          </div>
        </div>
      </div>
    </section>
  );
};
