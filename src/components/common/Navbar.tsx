import React from 'react';
import { Sun, Sparkles, FileText, History, HelpCircle, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'assessment' | 'results' | 'report';
  onNavigate: (view: 'landing' | 'assessment' | 'results' | 'report') => void;
  onOpenAdvisor: () => void;
  onOpenHistory: () => void;
  onOpenAssumptions: () => void;
  hasActivePlan: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAdvisor,
  onOpenHistory,
  onOpenAssumptions,
  hasActivePlan,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                Surya<span className="text-amber-500">Sathi</span>
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                PM Surya Ghar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              Rooftop Solar Adoption Assistant
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {hasActivePlan && (
            <button
              onClick={() => onNavigate('results')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'results'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Dashboard
            </button>
          )}

          {hasActivePlan && (
            <button
              onClick={() => onNavigate('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'report'
                  ? 'bg-amber-50 text-amber-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Solar Plan</span>
            </button>
          )}

          {/* Past History */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Saved Assessments"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Saved Plans</span>
          </button>

          {/* Transparent Assumptions */}
          <button
            onClick={onOpenAssumptions}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
            title="View Calculation Assumptions"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Assumptions</span>
          </button>

          {/* AI Advisor Button */}
          <button
            onClick={onOpenAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all hover:shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>AI Advisor</span>
          </button>

          {/* Primary CTA */}
          {currentView !== 'assessment' && (
            <button
              onClick={() => onNavigate('assessment')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Check Solar Potential</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
