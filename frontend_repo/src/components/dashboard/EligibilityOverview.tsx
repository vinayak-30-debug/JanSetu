import { Building2, CircleSlash2, FileCheck, ShieldCheck, Waves } from "lucide-react";
import { useBBN } from "@/context/BBNContext";
import { mockQueryResponse } from "@/lib/api";
import avatarImg from "@/assets/avatar-assistant.png";
import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";

export function EligibilityOverview() {
  const [showAllEligible, setShowAllEligible] = useState(false);
  const { queryResponse, isAssistedMode, openSchemeDetails } = useBBN();
  const { t } = useI18n();
  const { eligible_policies, explanation } = queryResponse || mockQueryResponse;
  const notEligibleCount = queryResponse?.not_eligible_schemes?.length || 0;
  const eligibleSchemes = queryResponse?.eligible_schemes || [];
  const eligibleCentralCount = eligibleSchemes.filter((s) => (s.scheme_scope || "").toLowerCase() === "central").length;
  const eligibleStateCount = eligibleSchemes.filter((s) => (s.scheme_scope || "").toLowerCase() === "state").length;
  const notEligibleCentralCount = (queryResponse?.not_eligible_schemes || []).filter((s) => (s.scheme_scope || "").toLowerCase() === "central").length;
  const notEligibleStateCount = (queryResponse?.not_eligible_schemes || []).filter((s) => (s.scheme_scope || "").toLowerCase() === "state").length;
  return (
    <div className={`relative overflow-hidden glass-card-hover premium-card p-6 mb-7 animate-fade-in transition-all ${isAssistedMode ? 'p-8' : ''}`} style={{ animationDelay: "0.1s" }}>
      {/* Subtle Ashoka Chakra watermark */}
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-8 -bottom-12 w-52 h-52 opacity-[0.08]"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-500" />
        <circle cx="100" cy="100" r="8" fill="currentColor" className="text-slate-500" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2="100"
            y2="28"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-500"
            transform={`rotate(${i * 15} 100 100)`}
          />
        ))}
      </svg>

      <h3 className={`section-title mb-5 ${isAssistedMode ? 'text-2xl' : ''}`}>{t("eligibility_overview", "Eligibility Overview")}</h3>
      <div className="flex flex-wrap items-center gap-2.5 mb-4 text-xs">
        <span className="metric-pill bg-success/10 text-success">
          <ShieldCheck className="metric-pill-icon" />
          {t("eligible", "Eligible")}: <span className="number-pop">{eligible_policies}</span>
        </span>
        <span className="metric-pill bg-info/10 text-info">
          <Building2 className="metric-pill-icon" />
          {t("central", "Central")}: <span className="number-pop">{eligibleCentralCount}</span>
        </span>
        <span className="metric-pill bg-primary/10 text-primary">
          <Waves className="metric-pill-icon" />
          {t("state", "State")}: <span className="number-pop">{eligibleStateCount}</span>
        </span>
        <span className="metric-pill bg-destructive/10 text-destructive">
          <CircleSlash2 className="metric-pill-icon" />
          {t("not_eligible", "Not Eligible")}: <span className="number-pop">{notEligibleCount}</span>
        </span>
        <span className="metric-pill bg-muted text-muted-foreground">
          <Building2 className="metric-pill-icon" />
          {t("central", "Central")}: <span className="number-pop">{notEligibleCentralCount}</span>
        </span>
        <span className="metric-pill bg-muted text-muted-foreground">
          <Waves className="metric-pill-icon" />
          {t("state", "State")}: <span className="number-pop">{notEligibleStateCount}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Eligible Schemes */}
        <div className={`flex-1 min-w-[180px] bg-muted/50 rounded-xl p-5 ${isAssistedMode ? 'p-6' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCheck size={isAssistedMode ? 24 : 16} className="text-primary" />
            </div>
            <span className={`card-title ${isAssistedMode ? 'text-lg' : ''}`}>{t("eligible_schemes", "Eligible Schemes")}</span>
            <span className={`ml-auto metric-strong number-pop ${isAssistedMode ? 'text-4xl' : ''}`}>{eligible_policies}</span>
          </div>

          {(queryResponse?.eligible_schemes?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(showAllEligible ? queryResponse?.eligible_schemes : queryResponse?.eligible_schemes.slice(0, 4)).map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => openSchemeDetails(s)}
                  className="scheme-chip bg-primary/10 text-primary px-2.5 py-1 hover:bg-primary/20 transition-colors"
                >
                  {s.title} [{s.scheme_scope || `${t("state", "State")}/${t("central", "Central")}`}]
                </button>
              ))}
              {queryResponse?.eligible_schemes.length && queryResponse.eligible_schemes.length > 4 && !showAllEligible && (
                <button
                  type="button"
                  onClick={() => setShowAllEligible(true)}
                  className="scheme-chip text-primary underline underline-offset-2"
                >
                  +{queryResponse.eligible_schemes.length - 4} {t("view_more", "more (View more)")}
                </button>
              )}
              {queryResponse?.eligible_schemes.length && queryResponse.eligible_schemes.length > 4 && showAllEligible && (
                <button
                  type="button"
                  onClick={() => setShowAllEligible(false)}
                  className="scheme-chip text-muted-foreground underline underline-offset-2"
                >
                  {t("show_less", "Show less")}
                </button>
              )}
            </div>
          )}

          <div className="w-full h-2 bg-border rounded-full overflow-hidden mt-3">
            <div className="h-full rounded-full gradient-primary progress-fill progress-smooth" style={{ width: `${(eligible_policies / 10) * 100}%` }} />
          </div>
        </div>

        {/* Speech Bubble + Avatar */}
        <div className="flex items-center gap-3">
          <div className={`bg-muted/50 rounded-xl px-4 py-3 body-copy text-[#4c5c5b] relative ${isAssistedMode ? 'text-lg max-w-[300px]' : 'max-w-[180px]'}`}>
            {explanation}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-transparent border-l-muted/50" />
          </div>
          <img src={avatarImg} alt="AI Assistant" className={`rounded-full object-cover ring-2 ring-primary-light/30 ${isAssistedMode ? 'w-24 h-24' : 'w-16 h-16'}`} />
        </div>
      </div>

    </div>
  );
}
