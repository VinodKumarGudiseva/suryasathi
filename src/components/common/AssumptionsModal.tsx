import React from 'react';
import { X, Info, Shield, CheckCircle2 } from 'lucide-react';
import { DEFAULT_SOLAR_ASSUMPTIONS } from '../../config/solarAssumptions';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Transparent Solar Assumptions
              </h3>
              <p className="text-xs text-slate-500">
                Engineering, benchmark pricing, and PM Surya Ghar subsidy rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm text-slate-700">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-3">
            <Shield className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <div>
                <strong className="font-semibold">Planning Estimate Notice:</strong> {DEFAULT_SOLAR_ASSUMPTIONS.estimateDisclaimer}
              </div>
              <div className="text-amber-800">
                Calculations are deterministic based on MNRE PM Surya Ghar guidelines, CERC benchmark costs, and CEA carbon baselines.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>PM Surya Ghar Subsidies</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-600">
                <li>• 1 kW System: ₹{DEFAULT_SOLAR_ASSUMPTIONS.pmSuryaGharSubsidy.upToOneKw.toLocaleString('en-IN')}</li>
                <li>• 2 kW System: ₹{DEFAULT_SOLAR_ASSUMPTIONS.pmSuryaGharSubsidy.upToTwoKw.toLocaleString('en-IN')}</li>
                <li>• 3 kW+ Residential: ₹{DEFAULT_SOLAR_ASSUMPTIONS.pmSuryaGharSubsidy.threeKwAndAbove.toLocaleString('en-IN')} (Max residential cap)</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Rooftop & Panels</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-600">
                <li>• Area per kW: ~{DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM} m² (~100 sq.ft)</li>
                <li>• Panel Standard: {DEFAULT_SOLAR_ASSUMPTIONS.panelEfficiencyWatts}W Mono PERC / TOPCon</li>
                <li>• System Derate Factor: {DEFAULT_SOLAR_ASSUMPTIONS.systemDerateFactor * 100}% (losses/soiling)</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cost & Financials</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-600">
                <li>• Benchmark Cost: ₹{DEFAULT_SOLAR_ASSUMPTIONS.benchmarkCostPerKw.toLocaleString('en-IN')} / kW (Turnkey)</li>
                <li>• System Lifespan: {DEFAULT_SOLAR_ASSUMPTIONS.systemLifespanYears} Years</li>
                <li>• Tariff Inflation: {DEFAULT_SOLAR_ASSUMPTIONS.annualTariffEscalationRate * 100}% per year</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Environmental Impact</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-600">
                <li>• Grid Emission Factor: {DEFAULT_SOLAR_ASSUMPTIONS.gridEmissionFactorKgPerKwh} kg CO₂ / kWh (CEA Baseline)</li>
                <li>• Tree Sequestration: {DEFAULT_SOLAR_ASSUMPTIONS.co2AbsorptionPerTreeKgPerYear} kg CO₂ / tree / year</li>
                <li>• Thermal Coal Displacement: ~0.65 kg coal / kWh</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
