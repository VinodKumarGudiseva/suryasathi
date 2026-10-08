import React from 'react';
import { Sparkles, ArrowRight, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import { SolarPlan } from '../../types/solar';

interface RecommendationNarrativeProps {
  plan: SolarPlan;
  onGoToReport: () => void;
  onOpenAdvisor: () => void;
}

export const RecommendationNarrative: React.FC<RecommendationNarrativeProps> = ({
  plan,
  onGoToReport,
  onOpenAdvisor,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-slate-900">
            Personalized Engineering Recommendation
          </h3>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
          Optimal Size: {plan.recommendedSystemKw} kW
        </span>
      </div>

      <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
        {plan.recommendation}
      </p>

      {plan.reasonForRecommendation && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Sizing Rationale: </strong>
          {plan.reasonForRecommendation}
        </div>
      )}

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-slate-700">
            <strong>{plan.recommendedSystemKw} kW Inverter</strong> matching connected load
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-slate-700">
            Max <strong>₹{plan.subsidy.toLocaleString('en-IN')}</strong> DBT subsidy claimable
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-slate-700">
            <strong>{plan.paybackYears} Years</strong> estimated break-even period
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onOpenAdvisor}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm border border-indigo-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Advisor About This Sizing</span>
        </button>

        <button
          onClick={onGoToReport}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>View Full Plan & Document Checklist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
