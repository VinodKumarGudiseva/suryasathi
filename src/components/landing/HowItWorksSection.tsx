import React from 'react';
import { UploadCloud, Cpu, Award, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC<{ onStartAssessment: () => void }> = ({
  onStartAssessment,
}) => {
  const steps = [
    {
      step: '01',
      icon: UploadCloud,
      title: 'Upload Bill & Terrace Photo',
      description:
        'Upload your recent electricity bill (PDF/JPG) and a photo of your terrace or simply enter your monthly kWh consumption and city.',
      badge: 'OCR & Computer Vision',
    },
    {
      step: '02',
      icon: Cpu,
      title: 'Solar Intelligence Engine',
      description:
        'Our deterministic calculation engine models your roof area, state solar insolation, DISCOM tariff slab, and PM Surya Ghar subsidy bracket.',
      badge: 'Accurate & Transparent',
    },
    {
      step: '03',
      icon: Award,
      title: 'Personalized Solar Plan & Next Steps',
      description:
        'Receive recommended kW sizing, 25-year financial ROI, document checklist, and step-by-step guidance for DISCOM net metering.',
      badge: 'DISCOM & DBT Ready',
    },
  ];

  return (
    <section className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs uppercase tracking-wider text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple 3-step journey to clean solar energy
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            No complicated jargon or pushy sales calls. Get an honest, transparent engineering
            feasibility assessment in less than 3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative bg-slate-50/70 hover:bg-white rounded-2xl p-7 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all group space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-300 group-hover:text-amber-500 transition-colors">
                    {item.step}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="inline-block text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={onStartAssessment}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Start Your Assessment Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
