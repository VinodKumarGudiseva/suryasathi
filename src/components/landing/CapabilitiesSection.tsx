import React from 'react';
import {
  FileSearch,
  Scan,
  Calculator,
  IndianRupee,
  MessageSquare,
  ClipboardList,
  Leaf,
  Layers,
} from 'lucide-react';

export const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      icon: FileSearch,
      title: 'Bill Document Extraction',
      desc: 'Parses electricity bills to detect average units consumed, connected load, and tariff slab without manual data entry.',
      tag: 'Textract Adapter',
    },
    {
      icon: Scan,
      title: 'Roof Computer Vision',
      desc: 'Assesses terrace usability, shadow obstruction, orientation, and computes maximum panel capacity.',
      tag: 'SageMaker Adapter',
    },
    {
      icon: Calculator,
      title: 'Solar Sizing Engine',
      desc: 'Right-sizes systems from 1 to 10 kW using state solar radiation factors, ensuring optimal self-consumption.',
      tag: 'Deterministic',
    },
    {
      icon: IndianRupee,
      title: 'PM Surya Ghar Subsidy',
      desc: 'Direct calculation of central financial assistance (up to ₹78,000) and state top-up subsidies.',
      tag: 'DBT Scheme',
    },
    {
      icon: MessageSquare,
      title: 'SuryaSathi AI Advisor',
      desc: 'Context-aware assistant that answers questions on eligibility, net-metering, and technical feasibility.',
      tag: 'Bedrock Ready',
    },
    {
      icon: ClipboardList,
      title: 'Document Checklist',
      desc: 'Provides a tailored checklist of required certificates, property proofs, and DISCOM application forms.',
      tag: 'Application Guide',
    },
    {
      icon: Leaf,
      title: 'Carbon Offset Metrics',
      desc: 'Quantifies environmental benefits using CEA grid emission benchmarks, equivalent trees, and thermal coal displaced.',
      tag: 'CEA Baseline',
    },
    {
      icon: Layers,
      title: 'Modular AWS Architecture',
      desc: 'Built with clean interfaces, ready to wire directly into AWS Textract, SageMaker, DynamoDB, and Bedrock.',
      tag: 'Hackathon Architecture',
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs uppercase tracking-wider text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything an Indian household needs in one place
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Bridging the information gap between confusing DISCOM circulars and homeowners
            ready to switch to solar power.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {cap.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {cap.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
