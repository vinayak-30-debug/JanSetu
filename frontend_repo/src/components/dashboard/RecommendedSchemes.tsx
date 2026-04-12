import { useBBN } from "@/context/BBNContext";
import { mockQueryResponse } from "@/lib/api";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function RecommendedSchemes() {
  const { queryResponse, isAssistedMode, userProfile, setSelectedScheme } = useBBN();
  const { t } = useI18n();
  const schemes = queryResponse?.not_eligible_schemes || mockQueryResponse.not_eligible_schemes;
  const centralCount = schemes.filter((s) => (s.scheme_scope || "").toLowerCase() === "central").length;
  const selectedState = (userProfile?.state || "").trim().toLowerCase();
  const stateSchemesRaw = schemes.filter((s) => {
    if ((s.scheme_scope || "").toLowerCase() !== "state") return false;
    const required = (s.required_states || []).map((x) => (x || "").toLowerCase());
    // show only state schemes for the currently selected/input state
    if (!selectedState) return true;
    return required.includes(selectedState);
  });
  const stateSchemes = stateSchemesRaw.filter(
    (s, idx, arr) => arr.findIndex((x) => (x.id || x.title) === (s.id || s.title)) === idx
  );
  const stateCount = stateSchemes.length;

  return (
    <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className={`section-title ${isAssistedMode ? 'text-2xl' : ''}`}>
          {t("not_eligible_schemes", "Not Eligible Schemes")}
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="scheme-chip px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {t("total", "Total")}: {schemes.length}
          </span>
          <span className="scheme-chip px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {t("central", "Central")}: {centralCount}
          </span>
          <span className="scheme-chip px-2.5 py-1 rounded-full bg-info/10 text-info">
            {t("state", "State")}: {stateCount}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {stateSchemes.length === 0 && (
          <div className="p-5 empty-state body-copy text-muted-foreground flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-muted-foreground/80" />
            <span>{t("no_non_eligible", "No non-eligible schemes found for your current profile.")}</span>
          </div>
        )}

        {stateSchemes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedScheme(s)}
            className="w-full text-left p-5 rounded-xl border border-border bg-card premium-card hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="card-title">{s.title}</p>
              <span className={`scheme-chip px-2.5 py-1 rounded-full ${
                (s.scheme_scope || "").toLowerCase() === "central"
                  ? "bg-primary/10 text-primary"
                  : "bg-info/10 text-info"
              }`}>
                {s.scheme_scope || `${t("state", "State")}/${t("central", "Central")}`}
              </span>
            </div>
            <p className="body-copy text-muted-foreground mt-1.5">{t("reason_not_eligible", "Reason Not Eligible")}: {s.reason_not_eligible || t("criteria_mismatch", "Criteria mismatch")}</p>
            <p className="scheme-chip text-muted-foreground mt-2">{t("estimated_benefit", "Estimated Benefit")}: {String(s.estimated_benefit ?? s.coverage ?? 'N/A')}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
