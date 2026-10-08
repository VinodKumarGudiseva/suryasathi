import React from 'react';
import { Sun, ExternalLink, Leaf, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                <Sun className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Surya<span className="text-amber-400">Sathi</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              SuryaSathi is an open AI-powered rooftop solar companion built for Indian households,
              simplifying the journey from terrace assessment and PM Surya Ghar subsidy discovery to DISCOM net-metering readiness.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <Leaf className="w-4 h-4" />
              <span>Supporting India’s target of 500 GW non-fossil capacity by 2030</span>
            </div>
          </div>

          {/* Official Portals */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Official Portals
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="https://pmsuryaghar.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                >
                  <span>PM Surya Ghar Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://mnre.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                >
                  <span>Ministry of New & Renewable Energy</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://solarrooftop.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                >
                  <span>National Rooftop Solar Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Architecture & Stack */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Future AWS Readiness
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Bill OCR: AWS Textract Adapter</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Roof CV: SageMaker Segmentation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>AI Advisor: Amazon Bedrock</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Knowledge: Bedrock Knowledge Base</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Persistence: Amazon DynamoDB</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>
              Disclaimer: Sizing, savings, and subsidy figures are engineering estimates. Actual tariffs depend on DISCOM net-metering regulations.
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Indian Clean Energy Hackathon</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
