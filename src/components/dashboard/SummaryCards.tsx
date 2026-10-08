import React from 'react';
import {
  Sun,
  Zap,
  IndianRupee,
  Gift,
  Clock,
  Leaf,
  Info,
} from 'lucide-react';
import { SolarPlan } from '../../types/solar';

interface SummaryCardsProps {
  plan: SolarPlan;
  onOpenAssumptions: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  plan,
  onOpenAssumptions,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Recommended System */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-amber-400 transition-colors">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider">
            System Size
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {plan.recommendedSystemKw} <span className="text-sm font-bold text-slate-500">kW</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            On-Grid Solar System
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-medium">
          ~{Math.round(plan.recommendedSystemKw * 9.3)} m² roof needed
        </div>
      </div>

      {/* 2. Annual Generation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-amber-400 transition-colors">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider">
            Annual Gen.
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {plan.annualGenerationKwh.toLocaleString('en-IN')}{' '}
            <span className="text-sm font-bold text-slate-500">units</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            ~{plan.monthlyGenerationKwh} units / month
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-600 font-medium">
          ~{Math.round((plan.annualGenerationKwh / (plan.monthlyConsumptionKwh * 12)) * 100)}% power offset
        </div>
      </div>

      {/* 3. Annual Savings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-emerald-400 transition-colors">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider">
            Annual Savings
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            ₹{plan.annualSavings.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            ~₹{Math.round(plan.annualSavings / 12).toLocaleString('en-IN')} / month
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
          Saved from DISCOM bill
        </div>
      </div>

      {/* 4. Estimated Subsidy */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-2xs space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-800">
          <span className="text-xs font-bold uppercase tracking-wider">
            Subsidy
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center">
            <Gift className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">
            ₹{plan.subsidy.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-800 font-medium mt-0.5">
            PM Surya Ghar DBT
          </p>
        </div>
        <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 font-medium">
          Direct to bank account
        </div>
      </div>

      {/* 5. Payback Period */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-amber-400 transition-colors">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider">
            Payback
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {plan.paybackYears}{' '}
            <span className="text-sm font-bold text-slate-500">Years</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Break-even milestone
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 text-[11px] text-blue-700 font-medium">
          Net: ₹{plan.netInvestment.toLocaleString('en-IN')}
        </div>
      </div>

      {/* 6. CO2 Reduction */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between hover:border-emerald-400 transition-colors">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-xs font-bold uppercase tracking-wider">
            CO₂ Offset
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-emerald-800 tracking-tight">
            {(plan.co2ReductionKg / 1000).toFixed(1)}{' '}
            <span className="text-sm font-bold text-slate-500">Tonnes/yr</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            ~{plan.environmentalImpact.equivalentTreesPlanted} trees planted
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-medium">
          Clean Indian Grid
        </div>
      </div>
    </div>
  );
};
