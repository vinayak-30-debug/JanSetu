import {
  Home, FileText, ChevronDown, ChevronRight,
  HeartPulse, Heart, Landmark, GraduationCap,
  Phone, Mail, HelpCircle, MessageCircle, ListChecks
} from "lucide-react";
import { useState } from "react";
import { useBBN } from "@/context/BBNContext";
import { mockProfile } from "@/lib/api";
import { useI18n } from "@/hooks/use-i18n";

const quickLinks = [
  { icon: HeartPulse, label: "Health Insurance", color: "text-primary-light" },
  { icon: Heart, label: "Ration Benefits", color: "text-destructive" },
  { icon: Landmark, label: "Pension Scheme", color: "text-accent" },
  { icon: GraduationCap, label: "Education Aid", color: "text-success" },
];

export function LeftSidebar() {
  const [eligibilityOpen, setEligibilityOpen] = useState(true);
  const [quickLinksOpen, setQuickLinksOpen] = useState(true);
  const {
    userProfile: profile,
    isAssistedMode,
    toggleAssistedMode,
    activeTab,
    setActiveTab,
    runQuery,
    setSelectedScheme,
    selectedScheme,
    llmMode,
    isLLMModeLoading,
    llmModeError,
    updateLLMMode
  } = useBBN();
  const { t } = useI18n();

  const displayProfile = profile || mockProfile;

  return (
    <aside className={`w-[280px] shrink-0 h-full gradient-sidebar flex flex-col min-h-0 overflow-hidden transition-all py-4 ${isAssistedMode ? 'scale-105 origin-left' : ''}`}>
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab("Dashboard")}
            className={`sidebar-nav-item flex items-center justify-center gap-2 w-full px-2 py-2.5 rounded-lg text-sidebar-foreground sidebar-section-head ${
              activeTab === "Dashboard"
                ? "sidebar-nav-item-active bg-sidebar-accent/45"
                : "bg-sidebar-accent/30 hover:bg-sidebar-accent/50"
            }`}
          >
            <Home size={16} />
            <span className="truncate">{t("dashboard", "Dashboard")}</span>
          </button>
          <button
            onClick={() => setActiveTab("All Schemes")}
            className={`sidebar-nav-item flex items-center justify-center gap-2 w-full px-2 py-2.5 rounded-lg text-sidebar-foreground sidebar-section-head ${
              activeTab === "All Schemes"
                ? "sidebar-nav-item-active bg-sidebar-accent/45"
                : "bg-sidebar-accent/30 hover:bg-sidebar-accent/50"
            }`}
          >
            <ListChecks size={16} />
            <span className="truncate">{t("all_schemes", "All Schemes")}</span>
          </button>
        </div>
      </div>

      <div className="px-4 mt-5">
        <button
          onClick={() => setEligibilityOpen(!eligibilityOpen)}
          className="sidebar-nav-item flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sidebar-foreground/80 sidebar-section-head hover:bg-sidebar-accent/35 transition-colors"
        >
          <span className="flex items-center gap-3">
            <FileText size={18} />
            {t("eligibility", "Eligibility")}
          </span>
          <ChevronDown size={16} className={`transition-transform ${eligibilityOpen ? "rotate-0" : "-rotate-90"}`} />
        </button>
        {eligibilityOpen && (
          <div className={`ml-6 mt-1.5 space-y-1.5 text-primary-light animate-fade-in ${isAssistedMode ? 'text-sm' : 'text-xs'}`}>
            <div className="flex justify-between py-1.5 px-2">
              <span>{t("age", "Age")}:</span>
              <span className="text-sidebar-foreground sidebar-item-text">{displayProfile.age || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1.5 px-2">
              <span>{t("state", "State")}:</span>
              <span className="text-sidebar-foreground sidebar-item-text">{displayProfile.state || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1.5 px-2">
              <span>{t("caste", "Caste Category")}:</span>
              <span className="text-sidebar-foreground sidebar-item-text">{displayProfile.caste || "N/A"}</span>
            </div>
            <div className="flex justify-between py-1.5 px-2">
              <span>{t("ration_card", "Ration Card")}:</span>
              <span className="text-sidebar-foreground sidebar-item-text">{displayProfile.ration_card}</span>
            </div>
            <div className="flex justify-between py-1.5 px-2">
              <span>{t("monthly_income", "Monthly Income")}:</span>
              <span className="text-sidebar-foreground sidebar-item-text">Rs {displayProfile.monthly_income.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 px-2">
              <span>{t("annual_income", "Annual Income")}:</span>
              <span className="text-sidebar-foreground sidebar-item-text">Rs {Number(displayProfile.annual_income ?? (Number(displayProfile.monthly_income || 0) * 12)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1.5 px-2">
              <span>{t("occupation", "Occupation")}:</span>
              <span className="text-sidebar-foreground sidebar-item-text">{displayProfile.occupation}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 mt-5">
        <button
          onClick={() => setQuickLinksOpen(!quickLinksOpen)}
          className="sidebar-nav-item flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sidebar-foreground/80 sidebar-section-head hover:bg-sidebar-accent/35 transition-colors"
        >
          <span className="flex items-center gap-3">
            <MessageCircle size={18} />
            {t("quick_links", "Quick Links")}
          </span>
          <ChevronDown size={16} className={`transition-transform ${quickLinksOpen ? "rotate-0" : "-rotate-90"}`} />
        </button>
        {quickLinksOpen && (
          <div className="mt-1 space-y-1 animate-fade-in">
            {quickLinks.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                onClick={() => {
                  setSelectedScheme({
                    id: `quick-${label.toLowerCase().replace(/\s+/g, "-")}`,
                    title: `${label} Claim`,
                    category:
                      label === "Health Insurance" ? "Healthcare" :
                      label === "Pension Scheme" ? "Pension" :
                      label === "Education Aid" ? "Education" : "General",
                    description: `Simulation context for ${label}`,
                    coverage: "N/A",
                    due_date: "N/A",
                    eligible: false,
                  });
                  setActiveTab("Dashboard");
                  runQuery(`Show me ${label} schemes`);
                }}
                className={`sidebar-nav-item flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sidebar-foreground transition-all group ${
                  selectedScheme?.title?.toLowerCase() === `${label} claim`.toLowerCase()
                    ? "sidebar-nav-item-active bg-sidebar-accent/50"
                    : "bg-sidebar-accent/30 hover:bg-sidebar-accent/50"
                } ${isAssistedMode ? 'py-3 text-base' : 'sidebar-item-text'}`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={isAssistedMode ? 20 : 18} className={color} />
                  {label === "Health Insurance"
                    ? t("health_insurance", "Health Insurance")
                    : label === "Ration Benefits"
                      ? t("ration_benefits", "Ration Benefits")
                      : label === "Pension Scheme"
                        ? t("pension_scheme", "Pension Scheme")
                        : t("education_aid", "Education Aid")}
                </span>
                <ChevronRight size={16} className="text-primary-light opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 mt-5">
        <button
          onClick={toggleAssistedMode}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${isAssistedMode ? 'bg-primary/20 text-sidebar-foreground' : 'text-primary-light hover:bg-sidebar-accent/20'}`}
        >
          <div className={`w-3 h-3 rounded-full ${isAssistedMode ? 'bg-success animate-pulse' : 'bg-muted-foreground/30'}`} />
          <span className="text-xs font-semibold">{t("assisted_mode", "Assisted Mode")}: {isAssistedMode ? t("on", "ON") : t("off", "OFF")}</span>
        </button>
      </div>

      <div className="px-4 mt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-primary-light/70 px-1 mb-2">
          AI Mode
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateLLMMode("online")}
            disabled={isLLMModeLoading}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              llmMode === "online"
                ? "bg-sidebar-accent/60 text-sidebar-foreground"
                : "bg-sidebar-accent/30 text-primary-light hover:bg-sidebar-accent/45"
            } ${isLLMModeLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Online
          </button>
          <button
            onClick={() => updateLLMMode("offline")}
            disabled={isLLMModeLoading}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              llmMode === "offline"
                ? "bg-sidebar-accent/60 text-sidebar-foreground"
                : "bg-sidebar-accent/30 text-primary-light hover:bg-sidebar-accent/45"
            } ${isLLMModeLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Offline
          </button>
        </div>
        <p className="mt-2 text-[10px] text-primary-light/70">
          Current: {llmMode.toUpperCase()}
        </p>
        {llmModeError && (
          <p className="mt-1 text-[10px] text-destructive">{llmModeError}</p>
        )}
      </div>

      <div className="px-4 pb-2">
        <button className={`w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-elevated ${isAssistedMode ? 'text-lg' : 'text-sm'}`}>
          <HelpCircle size={isAssistedMode ? 22 : 18} />
          {t("get_help", "Get Help")}
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="px-4 pb-2 mt-2">
        <div className="flex items-center gap-3 text-primary-light/60">
          <Phone size={14} />
          <Mail size={14} />
          <span className="ml-auto text-[10px]">© JANSETU 2026</span>
        </div>
        <p className="mt-2 text-[10px] text-primary-light/55 leading-relaxed">
          {t("secure_footer", "Secure • Aadhaar encrypted • Govt-compliant architecture")}
        </p>
      </div>
    </aside>
  );
}

