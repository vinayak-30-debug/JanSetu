import { useBBN } from "@/context/BBNContext";
import { TrendingUp, Sparkles, Zap, ChevronRight } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));
}

export function OptimizationDashboard() {
  const { queryResponse } = useBBN();
  const { t } = useI18n();

  const monthlyBenefit = toNumber(queryResponse?.monthly_benefit_value);
  const projectedAnnualSavings = monthlyBenefit * 12;
  const approvalLikelihood = Math.max(
    0,
    (queryResponse?.ml_prediction?.approval_likelihood ?? 0) * 100
  );

  const dynamicOptimizations = (queryResponse?.eligible_schemes || [])
    .slice(0, 3)
    .map((scheme) => ({
      title: scheme.title || t("opt_combine_schemes", "Combine Schemes"),
      desc:
        scheme.reason_eligible ||
        scheme.description ||
        t(
          "opt_combine_desc",
          "You can combine PM-Kisan with local state scholarships."
        ),
      impact:
        String(scheme.estimated_benefit || scheme.coverage || "").trim() ||
        t("opt_impact_1", "+₹2,000/mo"),
    }));

  const fallbackOptimizations = [
    {
      title: t("opt_combine_schemes", "Combine Schemes"),
      desc: t(
        "opt_combine_desc",
        "You can combine PM-Kisan with local state scholarships."
      ),
      impact: t("opt_impact_1", "+₹2,000/mo"),
    },
    {
      title: t("opt_family_linking", "Family Linking"),
      desc: t(
        "opt_family_desc",
        "Link family Aadhaar to increase ration allocation."
      ),
      impact: t("opt_impact_2", "+5kg grain"),
    },
    {
      title: t("opt_tax_exemption", "Tax Exemption"),
      desc: t(
        "opt_tax_desc",
        "Optimized for Section 80C based on your current income."
      ),
      impact: t("opt_impact_3", "Saved ₹500"),
    },
  ];

  const optimizations =
    dynamicOptimizations.length > 0 ? dynamicOptimizations : fallbackOptimizations;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {t("optimization_summary", "Optimization Summary")}
        </h2>
        <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20 flex items-center gap-1">
          <Sparkles size={12} /> {t("ai_powered", "AI POWERED")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
          <Zap size={32} className="mb-4" />
          <p className="text-3xl font-bold">
            {projectedAnnualSavings > 0
              ? formatCurrency(projectedAnnualSavings)
              : t("projected_savings_value", "₹12,400")}
          </p>
          <p className="text-sm opacity-80">
            {t("projected_annual_savings", "Projected Annual Savings")}
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 text-success font-bold text-lg mb-1">
            <TrendingUp size={20} /> +{approvalLikelihood.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              "benefit_utilization_improvement",
              "Improvement in benefit utilization this month."
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {optimizations.map((opt, i) => (
          <div
            key={`${opt.title}-${i}`}
            className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{opt.title}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-success">{opt.impact}</p>
              <ChevronRight
                size={14}
                className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

