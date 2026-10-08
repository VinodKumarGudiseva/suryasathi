import React from 'react';
import {
  FileText,
  Printer,
  Sparkles,
  MapPin,
  Calendar,
  Building,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SolarPlan } from '../../types/solar';
import { SummaryCards } from './SummaryCards';
import { GenerationChart } from './GenerationChart';
import { FinancialCharts } from './FinancialCharts';
import { EnvironmentalImpactCard } from './EnvironmentalImpactCard';
import { RecommendationNarrative } from './RecommendationNarrative';

interface ResultsDashboardProps {
  plan: SolarPlan;
  onGoToReport: () => void;
  onOpenAdvisor: () => void;
  onOpenAssumptions: () => void;
  onRestartAssessment: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  plan,
  onGoToReport,
  onOpenAdvisor,
  onOpenAssumptions,
  onRestartAssessment,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <span>Rooftop Solar Feasibility Assessment</span>
            <span>•</span>
            <span className="text-slate-600">ID: {plan.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Solar Feasibility for {plan.location.city}, {plan.location.state}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {plan.location.city}, {plan.location.state}
              {plan.location.pincode ? ` (${plan.location.pincode})` : ''}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              DISCOM: {plan.location.discomName || 'State Grid'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(plan.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRestartAssessment}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recalculate</span>
          </button>

          <button
            onClick={onGoToReport}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Printable Plan</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <SummaryCards plan={plan} onOpenAssumptions={onOpenAssumptions} />

      {/* Personalized Engineering Narrative */}
      <RecommendationNarrative
        plan={plan}
        onGoToReport={onGoToReport}
        onOpenAdvisor={onOpenAdvisor}
      />

      {/* Rooftop Suitability Snapshot if available */}
      {plan.roofAnalysis && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                plan.roofAnalysis.suitability === 'Suitable'
                  ? 'bg-emerald-600'
                  : 'bg-amber-500'
              }`}
            >
              {plan.roofAnalysis.suitability === 'Suitable' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  Rooftop Suitability: {plan.roofAnalysis.suitability}
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                  CV Verified
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {plan.roofAnalysis.explanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 shrink-0">
            <span>Usable: {plan.roofAnalysis.usableAreaSqFt} sq.ft</span>
            <span>•</span>
            <span>Max Panels: {plan.roofAnalysis.estimatedPanelCount}</span>
            <span>•</span>
            <span className="text-emerald-700">Max kW: {plan.roofAnalysis.estimatedCapacityKw} kW</span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GenerationChart plan={plan} />
        <FinancialCharts plan={plan} />
      </div>

      {/* Environmental Impact Card */}
      <EnvironmentalImpactCard impact={plan.environmentalImpact} />
    </div>
  );
};
