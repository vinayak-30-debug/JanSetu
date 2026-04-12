import { useEffect } from "react";
import { GlobalHeader } from "@/components/dashboard/GlobalHeader";
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { EligibilityOverview } from "@/components/dashboard/EligibilityOverview";
import { SimulatorGauge } from "@/components/dashboard/SimulatorGauge";
import { RequiredDocuments } from "@/components/dashboard/RequiredDocuments";
import { RecommendedSchemes } from "@/components/dashboard/RecommendedSchemes";
import { EligibilityDashboard } from "@/components/dashboard/EligibilityDashboard";
import { ClaimAssistance } from "@/components/dashboard/ClaimAssistance";
import { OptimizationDashboard } from "@/components/dashboard/OptimizationDashboard";
import { InsightsDashboard } from "@/components/dashboard/InsightsDashboard";
import { SchemeDetailsModal } from "@/components/dashboard/SchemeDetailsModal";
import { ProfileCompletionModal } from "@/components/dashboard/ProfileCompletionModal";
import { ApplyNowPage } from "@/components/dashboard/ApplyNowPage";
import { RTAPanel } from "@/components/dashboard/RTAPanel";
import { AllSchemesPanel } from "@/components/dashboard/AllSchemesPanel";
import { useBBN } from "@/context/BBNContext";

const Index = () => {
  const { activeTab, userProfile, runQuery, isApplying, closeSchemeDetails } = useBBN();

  useEffect(() => {
    closeSchemeDetails();
    if (userProfile && activeTab !== "Dashboard" && activeTab !== "All Schemes") {
      runQuery(`Show me details for ${activeTab}`);
    }
  }, [activeTab, userProfile]);

  const renderDashboardLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <EligibilityOverview />
        <RecommendedSchemes />
      </div>

      <aside className="space-y-6">
        <SimulatorGauge />
        <RTAPanel />
        <RequiredDocuments />
      </aside>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Eligibility":
        return <EligibilityDashboard />;
      case "Claim Assistance":
        return <ClaimAssistance />;
      case "Optimization":
        return <OptimizationDashboard />;
      case "Insights":
        return <InsightsDashboard />;
      case "All Schemes":
        return (
          <div className="max-w-5xl">
            <AllSchemesPanel />
          </div>
        );
      default:
        return renderDashboardLayout();
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans">
      <GlobalHeader />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftSidebar />

        <main className="flex-1 min-h-0 p-6 overflow-y-auto hide-scrollbar">
          {activeTab !== "Eligibility" && activeTab !== "Claim Assistance" && activeTab !== "Insights" && activeTab !== "All Schemes" && (
            <HeroSection showSearch={activeTab !== "Optimization"} />
          )}
          {renderContent()}
        </main>
      </div>

      <SchemeDetailsModal />
      <ProfileCompletionModal />
      {isApplying && <ApplyNowPage />}
    </div>
  );
};

export default Index;

