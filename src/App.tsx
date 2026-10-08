import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AssumptionsModal } from './components/common/AssumptionsModal';
import { HeroSection } from './components/landing/HeroSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { CapabilitiesSection } from './components/landing/CapabilitiesSection';
import { WhySolarSection } from './components/landing/WhySolarSection';
import { ProcessStepsSection } from './components/landing/ProcessStepsSection';
import { AssessmentWizard } from './components/assessment/AssessmentWizard';
import { ResultsDashboard } from './components/dashboard/ResultsDashboard';
import { FinalSolarPlanReport } from './components/report/FinalSolarPlanReport';
import { AdvisorChatDrawer } from './components/advisor/AdvisorChatDrawer';
import { AssessmentHistoryModal } from './components/history/AssessmentHistoryModal';
import { SolarPlan } from './types/solar';
import { solarPlanStorageService } from './services/storageService';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'assessment' | 'results' | 'report'>('landing');
  const [activePlan, setActivePlan] = useState<SolarPlan | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);

  // Load latest plan on initial render if one exists in storage
  useEffect(() => {
    solarPlanStorageService.getAllSolarPlans().then((plans) => {
      if (plans.length > 0) {
        setActivePlan(plans[0]);
      }
    });
  }, []);

  const handlePlanGenerated = (plan: SolarPlan) => {
    setActivePlan(plan);
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoryPlan = (plan: SolarPlan) => {
    setActivePlan(plan);
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdvisor={() => setIsAdvisorOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAssumptions={() => setIsAssumptionsOpen(true)}
        hasActivePlan={Boolean(activePlan)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <div className="space-y-0 animate-fadeIn">
            <HeroSection
              onStartAssessment={() => {
                setCurrentView('assessment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAdvisor={() => setIsAdvisorOpen(true)}
            />
            <HowItWorksSection
              onStartAssessment={() => {
                setCurrentView('assessment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <CapabilitiesSection />
            <WhySolarSection />
            <ProcessStepsSection
              onStartAssessment={() => {
                setCurrentView('assessment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentView === 'assessment' && (
          <div className="animate-fadeIn">
            <AssessmentWizard
              onPlanGenerated={handlePlanGenerated}
              onCancel={() => {
                setCurrentView(activePlan ? 'results' : 'landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentView === 'results' && activePlan && (
          <div className="animate-fadeIn">
            <ResultsDashboard
              plan={activePlan}
              onGoToReport={() => {
                setCurrentView('report');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAdvisor={() => setIsAdvisorOpen(true)}
              onOpenAssumptions={() => setIsAssumptionsOpen(true)}
              onRestartAssessment={() => {
                setCurrentView('assessment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {currentView === 'report' && activePlan && (
          <div className="animate-fadeIn">
            <FinalSolarPlanReport
              plan={activePlan}
              onBackToDashboard={() => {
                setCurrentView('results');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAssumptions={() => setIsAssumptionsOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* AI Solar Advisor Chat Drawer */}
      <AdvisorChatDrawer
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        currentPlan={activePlan || undefined}
      />

      {/* Saved Assessments History Modal */}
      <AssessmentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectPlan={handleSelectHistoryPlan}
      />

      {/* Calculation Assumptions Modal */}
      <AssumptionsModal
        isOpen={isAssumptionsOpen}
        onClose={() => setIsAssumptionsOpen(false)}
      />
    </div>
  );
}
