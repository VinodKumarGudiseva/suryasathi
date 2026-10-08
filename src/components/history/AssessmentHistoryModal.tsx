import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Trash2,
  ArrowRight,
  Sun,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
} from 'lucide-react';
import { SolarPlan } from '../../types/solar';
import { solarPlanStorageService } from '../../services/storageService';

interface AssessmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SolarPlan) => void;
}

export const AssessmentHistoryModal: React.FC<AssessmentHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
}) => {
  const [plans, setPlans] = useState<SolarPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      solarPlanStorageService.getAllSolarPlans().then((stored) => {
        setPlans(stored);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await solarPlanStorageService.deleteSolarPlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Saved Solar Assessments
              </h3>
              <p className="text-xs text-slate-500">
                Locally saved solar feasibility plans (DynamoDB adapter ready)
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

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading saved assessments...
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Sun className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No saved plans yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Complete a rooftop assessment to calculate your solar potential, savings, and subsidy.
              </p>
            </div>
          ) : (
            plans.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectPlan(item);
                  onClose();
                }}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/30 transition-all cursor-pointer shadow-2xs space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-black text-xs">
                      {item.recommendedSystemKw} kW System
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      ₹{item.subsidy.toLocaleString('en-IN')} Subsidy
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {item.location.city}, {item.location.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Annual Gen</span>
                    <span className="font-bold text-slate-800">
                      {item.annualGenerationKwh.toLocaleString('en-IN')} kWh
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Annual Savings</span>
                    <span className="font-bold text-emerald-700">
                      ₹{item.annualSavings.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payback</span>
                    <span className="font-bold text-slate-800">
                      {item.paybackYears} Years
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="text-amber-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>View Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
