import React, { useState } from 'react';
import { Check, Home, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { StepHomeDetails } from './StepHomeDetails';
import { StepBillUpload } from './StepBillUpload';
import { StepRoofUpload } from './StepRoofUpload';
import { StepAnalyzing } from './StepAnalyzing';
import { BillData, RoofAnalysis, SolarPlan } from '../../types/solar';
import { solarCalculationService } from '../../services/solarCalculationService';
import { solarPlanStorageService } from '../../services/storageService';

interface AssessmentWizardProps {
  onPlanGenerated: (plan: SolarPlan) => void;
  onCancel: () => void;
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  onPlanGenerated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  // Form State
  const [homeDetails, setHomeDetails] = useState({
    state: '',
    city: '',
    pincode: '',
    monthlyConsumptionKwh: 0,
    monthlyBillAmount: 0,
  });

  const [billData, setBillData] = useState<BillData | undefined>(undefined);
  const [roofAnalysis, setRoofAnalysis] = useState<RoofAnalysis | undefined>(undefined);
  const [customRoofAreaSqM, setCustomRoofAreaSqM] = useState<number | undefined>(undefined);

  const stepsList = [
    { num: 1, title: 'Home Details', icon: Home },
    { num: 2, title: 'Bill OCR', icon: FileText },
    { num: 3, title: 'Roof CV', icon: ImageIcon },
    { num: 4, title: 'Analysis', icon: Sparkles },
  ];

  // Step 1 Complete
  const handleHomeDetailsNext = (data: typeof homeDetails) => {
    setHomeDetails(data);
    setCurrentStep(2);
  };

  // Step 2 Complete
  const handleBillUploadNext = (
    extracted?: BillData,
    consumption?: number,
    billAmount?: number
  ) => {
    if (extracted) {
      setBillData(extracted);
    }
    if (consumption) {
      setHomeDetails((prev) => ({
        ...prev,
        monthlyConsumptionKwh: consumption,
        monthlyBillAmount: billAmount || prev.monthlyBillAmount,
      }));
    }
    setCurrentStep(3);
  };

  // Step 3 Complete
  const handleRoofUploadNext = (
    analysis?: RoofAnalysis,
    areaSqM?: number
  ) => {
    if (analysis) {
      setRoofAnalysis(analysis);
    }
    if (areaSqM) {
      setCustomRoofAreaSqM(areaSqM);
    }
    setCurrentStep(4);
  };

  // Step 4 Complete -> Calculate & save plan
  const handleAnalysisComplete = async () => {
    const plan = await solarCalculationService.calculateSolarPlan({
      location: {
        state: homeDetails.state,
        city: homeDetails.city,
        pincode: homeDetails.pincode,
      },
      monthlyConsumptionKwh: homeDetails.monthlyConsumptionKwh,
      monthlyBillAmount: homeDetails.monthlyBillAmount,
      roofAreaSqM: customRoofAreaSqM || roofAnalysis?.usableAreaSqM,
      billData,
      roofAnalysis,
    });

    // Save to local storage service (DynamoDB adapter ready)
    await solarPlanStorageService.saveSolarPlan(plan);
    onPlanGenerated(plan);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header & Cancel Button */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs uppercase tracking-wider text-amber-600 font-bold">
            Solar Adoption Assessment
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Check Your Rooftop Solar Potential
          </h1>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Progress Stepper Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          {/* Connector line behind */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-500 transition-all duration-300 -z-0"
            style={{
              width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%`,
            }}
          />

          {stepsList.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const Icon = st.icon;

            return (
              <div key={st.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isCurrent
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-md scale-105'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-semibold mt-2 hidden sm:block ${
                    isCurrent ? 'text-amber-700' : isCompleted ? 'text-emerald-800' : 'text-slate-500'
                  }`}
                >
                  {st.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10">
        {currentStep === 1 && (
          <StepHomeDetails
            initialData={homeDetails}
            onNext={handleHomeDetailsNext}
          />
        )}

        {currentStep === 2 && (
          <StepBillUpload
            initialBillData={billData}
            initialConsumption={homeDetails.monthlyConsumptionKwh}
            initialBillAmount={homeDetails.monthlyBillAmount}
            onNext={handleBillUploadNext}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <StepRoofUpload
            initialRoofAnalysis={roofAnalysis}
            onNext={handleRoofUploadNext}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <StepAnalyzing
            locationCity={homeDetails.city}
            locationState={homeDetails.state}
            onComplete={handleAnalysisComplete}
          />
        )}
      </div>
    </div>
  );
};
