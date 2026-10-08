import React from 'react';
import {
  Printer,
  Sun,
  MapPin,
  Building,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Share2,
  Download,
  Info,
} from 'lucide-react';
import { SolarPlan } from '../../types/solar';
import { DocumentChecklist } from './DocumentChecklist';

interface FinalSolarPlanReportProps {
  plan: SolarPlan;
  onBackToDashboard: () => void;
  onOpenAssumptions: () => void;
}

export const FinalSolarPlanReport: React.FC<FinalSolarPlanReportProps> = ({
  plan,
  onBackToDashboard,
  onOpenAssumptions,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden pb-4 border-b border-slate-200">
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Download / Print Solar Plan</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-12 space-y-10 print:shadow-none print:border-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Sun className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
                Surya<span className="text-amber-500">Sathi</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              Rooftop Solar Feasibility & Adoption Report
            </p>
          </div>

          <div className="sm:text-right text-xs text-slate-500 space-y-0.5">
            <p className="font-mono font-bold text-slate-900">Ref: #{plan.id}</p>
            <p>
              Generated:{' '}
              {new Date(plan.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-emerald-700 font-semibold">PM Surya Ghar Aligned</p>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs sm:text-sm">
            1. Executive Summary & Recommended Sizing
          </h2>
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 text-sm leading-relaxed">
            {plan.recommendation}
          </div>
        </div>

        {/* Section 2: Home & Rooftop Profile */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs sm:text-sm">
            2. Household & Rooftop Site Profile
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Location</span>
              <p className="font-bold text-slate-900 text-sm">
                {plan.location.city}, {plan.location.state}
              </p>
              <p className="text-slate-500">{plan.location.pincode || 'Pincode on file'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">DISCOM / Grid</span>
              <p className="font-bold text-slate-900 text-sm truncate">
                {plan.location.discomName || 'State Electricity Board'}
              </p>
              <p className="text-slate-500">Net Metering Eligible</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Monthly Need</span>
              <p className="font-bold text-slate-900 text-sm">
                {plan.monthlyConsumptionKwh} kWh / month
              </p>
              <p className="text-slate-500">~₹{plan.monthlyBillAmount.toLocaleString('en-IN')} / month bill</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Terrace Area</span>
              <p className="font-bold text-slate-900 text-sm">
                {plan.roofAnalysis?.usableAreaSqFt || Math.round(plan.recommendedSystemKw * 100)} sq.ft
              </p>
              <p className="text-emerald-700 font-semibold">
                {plan.roofAnalysis?.suitability || 'Suitable'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Technical Sizing & Generation Specs */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs sm:text-sm">
            3. Solar Plant Engineering Specifications
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Plant Capacity</span>
              <p className="font-extrabold text-slate-900 text-base">
                {plan.recommendedSystemKw} kWp
              </p>
              <p className="text-slate-500">Grid-Tied On-Grid</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Estimated Panels</span>
              <p className="font-extrabold text-slate-900 text-base">
                {Math.ceil((plan.recommendedSystemKw * 1000) / 540)} Modules
              </p>
              <p className="text-slate-500">540W Mono PERC</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Annual Generation</span>
              <p className="font-extrabold text-slate-900 text-base">
                {plan.annualGenerationKwh.toLocaleString('en-IN')} kWh
              </p>
              <p className="text-slate-500">~{plan.monthlyGenerationKwh} kWh / month</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider">Annual CO₂ Offset</span>
              <p className="font-extrabold text-emerald-700 text-base">
                {(plan.co2ReductionKg / 1000).toFixed(2)} Tonnes
              </p>
              <p className="text-slate-500">{plan.environmentalImpact.equivalentTreesPlanted} trees equiv.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Financial Statement & PM Surya Ghar Subsidy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs sm:text-sm">
              4. Financial Investment, Subsidy & Payback
            </h2>
            <button
              onClick={onOpenAssumptions}
              className="text-xs text-amber-700 hover:underline print:hidden flex items-center gap-1 font-semibold"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Assumptions</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-3.5">Component</th>
                  <th className="p-3.5 text-right">Estimated Amount (INR)</th>
                  <th className="p-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3.5 font-medium text-slate-900">
                    Gross Turnkey Capital Cost ({plan.recommendedSystemKw} kW @ ₹52,000/kW)
                  </td>
                  <td className="p-3.5 text-right font-bold text-slate-900">
                    ₹{plan.installationCost.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-slate-500 text-xs">
                    Panels, Inverter, Structure, Cables & Net Metering kit
                  </td>
                </tr>
                <tr className="bg-amber-50/50">
                  <td className="p-3.5 font-bold text-amber-900">
                    Less: PM Surya Ghar Central Direct Subsidy (DBT)
                  </td>
                  <td className="p-3.5 text-right font-bold text-amber-900">
                    - ₹{plan.subsidy.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-amber-800 text-xs">
                    Credited directly to consumer bank account by MNRE
                  </td>
                </tr>
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-3.5">
                    Estimated Net Out-of-Pocket Household Investment
                  </td>
                  <td className="p-3.5 text-right text-base text-amber-400">
                    ₹{plan.netInvestment.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-slate-300 text-xs">
                    One-time capital outlay
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-slate-900">
                    First Year Estimated Electricity Bill Savings
                  </td>
                  <td className="p-3.5 text-right font-bold text-emerald-700">
                    + ₹{plan.annualSavings.toLocaleString('en-IN')} / year
                  </td>
                  <td className="p-3.5 text-slate-500 text-xs">
                    Based on state residential slab tariffs
                  </td>
                </tr>
                <tr className="bg-emerald-50/50">
                  <td className="p-3.5 font-bold text-emerald-900">
                    Estimated Simple Payback Period
                  </td>
                  <td className="p-3.5 text-right font-bold text-emerald-900 text-base">
                    ~{plan.paybackYears} Years
                  </td>
                  <td className="p-3.5 text-emerald-800 text-xs">
                    Free electricity for the remaining 21+ years of panel life
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-slate-900">
                    25-Year Cumulative Net Wealth Saved
                  </td>
                  <td className="p-3.5 text-right font-black text-slate-900">
                    ₹{plan.financialBreakdown.twentyFiveYearSavings.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-slate-500 text-xs">
                    Includes 3.5% grid inflation and inverter replacement
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Step-by-Step Next Steps Roadmap */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs sm:text-sm">
            5. Recommended Next Steps for {plan.location.city} Homeowners
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {plan.nextSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {step.stepNumber}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {step.officialPortalUrl && (
                  <a
                    href={step.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline pt-2 border-t border-slate-200/60"
                  >
                    <span>{step.actionLabel || 'Visit Portal'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Document Checklist */}
        <DocumentChecklist documents={plan.documents} />

        {/* Document Footer Disclaimer */}
        <div className="pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-1.5 leading-relaxed">
          <p>
            <strong>Planning Estimate Disclaimer:</strong> These are planning estimates, not a final engineering quotation or guaranteed subsidy calculation. SuryaSathi provides preliminary feasibility based on Ministry of New and Renewable Energy (MNRE) guidelines and CEA carbon factor baselines. Actual electricity generation varies with seasonal weather, azimuth orientation, tilt angle, soiling, and DISCOM net-metering interconnection approval.
          </p>
          <p>
            National Portal for Rooftop Solar:{' '}
            <a
              href="https://pmsuryaghar.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-amber-700 underline"
            >
              https://pmsuryaghar.gov.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
