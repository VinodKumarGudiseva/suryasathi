import React, { useState } from 'react';
import { MapPin, Zap, IndianRupee, ArrowRight, HelpCircle } from 'lucide-react';
import { INDIAN_STATES_DATA } from '../../data/indianStates';

interface HomeDetailsData {
  state: string;
  city: string;
  pincode: string;
  monthlyConsumptionKwh: number;
  monthlyBillAmount: number;
}

interface StepHomeDetailsProps {
  initialData: HomeDetailsData;
  onNext: (data: HomeDetailsData) => void;
}

export const StepHomeDetails: React.FC<StepHomeDetailsProps> = ({ initialData, onNext }) => {
  const [formData, setFormData] = useState<HomeDetailsData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const selectedStateObj = INDIAN_STATES_DATA.find((s) => s.state === formData.state) || INDIAN_STATES_DATA[0];

  const handleStateChange = (newState: string) => {
    const matchedState = INDIAN_STATES_DATA.find((s) => s.state === newState);
    const newCity = matchedState?.majorCities[0] || '';
    setFormData((prev) => ({
      ...prev,
      state: newState,
      city: newCity,
    }));
  };

  const handleKwhChange = (kwh: number) => {
    // Automatically approximate bill amount using state tariff if bill amount was empty or default
    const tariff = selectedStateObj.averageTariffPerKwh || 7.5;
    const estBill = Math.round(kwh * tariff);
    setFormData((prev) => ({
      ...prev,
      monthlyConsumptionKwh: kwh,
      monthlyBillAmount: prev.monthlyBillAmount > 0 && Math.abs(prev.monthlyBillAmount - prev.monthlyConsumptionKwh * tariff) > 500
        ? prev.monthlyBillAmount
        : estBill,
    }));
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.state.trim()) {
      errs.state = 'Please select your state';
    }
    if (!formData.city.trim()) {
      errs.city = 'Please select or enter your city';
    }
    if (!formData.monthlyConsumptionKwh || formData.monthlyConsumptionKwh < 20) {
      errs.monthlyConsumptionKwh = 'Please enter valid monthly electricity units (min 20 kWh)';
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = 'Pincode should be a 6-digit Indian postal code';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Where is your home located?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Location determines average solar radiation (insolation), local DISCOM rules, and available subsidies.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* State Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            State / Union Territory <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden cursor-pointer"
            >
              {INDIAN_STATES_DATA.map((st) => (
                <option key={st.state} value={st.state}>
                  {st.state}
                </option>
              ))}
            </select>
          </div>
          {errors.state && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.state}</p>}
          <p className="text-[11px] text-slate-500 mt-1">
            Primary DISCOM: {selectedStateObj.discoms[0]}
          </p>
        </div>

        {/* City Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            City / Town <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              list="cities-list"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Pune, Jaipur, Bengaluru"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden"
            />
            <datalist id="cities-list">
              {selectedStateObj.majorCities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
          {errors.city && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.city}</p>}
        </div>

        {/* Pincode (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              PIN Code
            </label>
            <span className="text-[11px] text-slate-600 font-medium">Optional</span>
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              maxLength={6}
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="e.g. 411001"
              className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-hidden"
            />
          </div>
          {errors.pincode && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.pincode}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
          Monthly Electricity Consumption
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Check your last DISCOM power bill or estimate your typical monthly units.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Monthly Units (kWh) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Monthly Units (kWh) <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="number"
                min={20}
                max={5000}
                value={formData.monthlyConsumptionKwh || ''}
                onChange={(e) => handleKwhChange(Number(e.target.value))}
                placeholder="250"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-base font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-600">
                Units / Month
              </span>
            </div>
            {errors.monthlyConsumptionKwh && (
              <p className="text-xs text-rose-600 font-medium">{errors.monthlyConsumptionKwh}</p>
            )}
            <div className="flex gap-2 pt-1">
              {[150, 250, 350, 500].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handleKwhChange(quick)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                    formData.monthlyConsumptionKwh === quick
                      ? 'bg-amber-500 text-white border-amber-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {quick} kWh
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Bill Amount (Optional) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-500" />
                Average Monthly Bill (₹)
              </label>
              <span className="text-[11px] text-slate-600 font-medium">Auto-estimated</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min={0}
                value={formData.monthlyBillAmount || ''}
                onChange={(e) => setFormData({ ...formData, monthlyBillAmount: Number(e.target.value) })}
                placeholder="2100"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-base font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Estimated at average {selectedStateObj.state} residential tariff of ~₹{selectedStateObj.averageTariffPerKwh}/unit.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-4">
        <button
          type="submit"
          className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
        >
          <span>Continue to Bill Upload</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
