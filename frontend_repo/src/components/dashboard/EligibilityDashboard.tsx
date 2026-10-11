import { useBBN } from "@/context/BBNContext";
import { CheckCircle2, Building2, Waves, ChevronRight, Sparkles } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { Skeleton } from "@/components/dashboard/SkeletonLoader";

function schemeSummaryLines(scheme: any, t: (key: string, fallback: string) => string): { line1: string; line2: string } {
  const description = (scheme?.description || "").trim();
  const coverage = String(scheme?.coverage || "").trim();
  const scope = (scheme?.scheme_scope || "").trim();
  const line1 = description || t("scheme_line_1_fallback", "This scheme supports eligible citizens based on profile criteria.");
  const line2 =
    coverage && coverage !== "N/A"
      ? `${t("benefit", "Benefit")}: ${coverage}`
      : scope
      ? `${t("type", "Type")}: ${scope}`
      : t("scheme_summary_fallback", "Benefit details are available in View Details.");
  return { line1, line2 };
}

export function EligibilityDashboard() {
  const { queryResponse, isLoading, openSchemeDetails, startApplication } = useBBN();
  const { t } = useI18n();

  const eligibleSchemes = queryResponse?.eligible_schemes || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="p-6 rounded-3xl bg-card border border-border">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <div className="p-6 rounded-3xl bg-card border border-border flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            <CheckCircle2 className="text-success" size={22} />
            {t("eligible_schemes", "Eligible Schemes")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("eligible_only_note", "Showing only schemes you are eligible for.")}
          </p>
        </div>
        {eligibleSchemes.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-success/10 border border-success/20">
            <Sparkles size={14} className="text-success" />
            <span className="text-sm font-bold text-success">{eligibleSchemes.length} {t("matches", "matches")}</span>
          </div>
        )}
      </div>

      {/* Scheme cards */}
      <div className="space-y-4">
        {eligibleSchemes.length === 0 && (
          <div className="p-10 rounded-2xl border-2 border-dashed border-border flex flex-col items-center text-center gap-3 text-muted-foreground">
            <CheckCircle2 size={36} className="text-muted-foreground/40" />
            <p className="text-sm font-semibold">{t("no_eligible_schemes", "No eligible schemes found.")}</p>
            <p className="text-xs">{t("try_another_profile", "Try entering an Aadhaar or describing your profile in the search bar.")}</p>
          </div>
        )}

        {eligibleSchemes.map((scheme) => {
          const { line1, line2 } = schemeSummaryLines(scheme, t);
          const isCentral = (scheme.scheme_scope || "").toLowerCase() === "central";
          return (
            <div
              key={scheme.id || scheme.title}
              className="group p-5 rounded-2xl bg-card border border-border premium-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {scheme.title}
                </p>
                <span className={`flex-shrink-0 scheme-chip px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  isCentral
                    ? "bg-primary/10 text-primary"
                    : "bg-info/10 text-info"
                }`}>
                  {isCentral
                    ? <Building2 size={11} />
                    : <Waves size={11} />}
                  {scheme.scheme_scope || `${t("state", "State")}/${t("central", "Central")}`}
                </span>
              </div>

              {/* Description */}
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{line1}</p>
              <p className="mt-1 text-sm font-medium text-foreground/70">{line2}</p>

              {/* Action row */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => openSchemeDetails(scheme)}
                  className="flex-1 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  {t("view_details", "View Details")}
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => startApplication(scheme)}
                  className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity claim-cta shadow-sm"
                >
                  {t("apply_now", "Apply Now")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
