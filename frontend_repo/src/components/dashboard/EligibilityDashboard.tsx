import { useBBN } from "@/context/BBNContext";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

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
  const { queryResponse } = useBBN();
  const { t } = useI18n();

  const eligibleSchemes = queryResponse?.eligible_schemes || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="p-6 rounded-3xl bg-card border border-border">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          <CheckCircle2 className="text-success" size={22} />
          {t("eligible_schemes", "Eligible Schemes")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("eligible_only_note", "Showing only schemes you are eligible for.")}
        </p>
      </div>

      <div className="space-y-4">
        {eligibleSchemes.length === 0 && (
          <div className="p-5 rounded-2xl bg-card border border-border text-sm text-muted-foreground">
            {t("no_eligible_schemes", "No eligible schemes found for your current profile.")}
          </div>
        )}

        {eligibleSchemes.map((scheme) => {
          const { line1, line2 } = schemeSummaryLines(scheme, t);
          return (
            <div key={scheme.id || scheme.title} className="p-5 rounded-2xl bg-card border border-border">
              <p className="text-base font-bold text-foreground">{scheme.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {line1}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {line2}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
