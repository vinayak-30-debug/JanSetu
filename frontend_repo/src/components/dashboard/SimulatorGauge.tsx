import { useBBN } from "@/context/BBNContext";
import { mockQueryResponse, mockProfile } from "@/lib/api";
import { ShieldPlus, BookOpen, Landmark, HeartPulse } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";

const simulatorBenefits = [
  { label: "Health Insurance Claim", category: "Healthcare", icon: HeartPulse },
  { label: "Ration Benefits Claim", category: "General", icon: ShieldPlus },
  { label: "Pension Scheme Claim", category: "Pension", icon: Landmark },
  { label: "Education Aid Claim", category: "Education", icon: BookOpen },
];

export function SimulatorGauge() {
  const { queryResponse, selectedScheme, setSelectedScheme, runQuery, isLoading, isAssistedMode } = useBBN();
  const { t } = useI18n();
  const selectedBenefitLabel = simulatorBenefits.some((b) => b.label === selectedScheme?.title)
    ? selectedScheme?.title
    : simulatorBenefits[0].label;

  const probability = queryResponse?.ml_prediction.approval_likelihood ?? mockQueryResponse.ml_prediction.approval_likelihood;
  const percent = Math.round(probability * 100);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (probability * circumference);

  const handleSimulate = () => {
    if (selectedScheme) {
      runQuery(`Simulate claim for ${selectedScheme.title}`, true);
    } else {
      runQuery("Simulate health insurance claim", true);
    }
  };

  const handleBenefitChange = (title: string) => {
    const chosen = simulatorBenefits.find((b) => b.label === title);
    if (!chosen) return;

    setSelectedScheme({
      id: `sim-${chosen.label.toLowerCase().replace(/\s+/g, "-")}`,
      title: chosen.label,
      category: chosen.category,
      description: `Simulation context for ${chosen.label}`,
      coverage: "N/A",
      due_date: "N/A",
      eligible: false,
    });
  };

  return (
    <div className={`glass-card-hover premium-card p-6 mb-4 animate-fade-in transition-all ${isAssistedMode ? 'scale-105' : ''}`} style={{ animationDelay: "0.2s" }}>
      <h3 className={`card-title mb-4 ${isAssistedMode ? 'text-xl' : ''}`}>{t("claim_assistance_simulator", "Claim Assistance Simulator")}</h3>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <label className="scheme-chip text-muted-foreground mb-1.5 block">{t("selected_benefit", "Selected Benefit")}</label>
          <Select
            value={selectedBenefitLabel}
            onValueChange={handleBenefitChange}
          >
            <SelectTrigger className="w-full min-w-0 h-11 rounded-xl border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/25 [&>span]:min-w-0 [&>span]:overflow-hidden [&>span]:whitespace-nowrap [&>span_span]:truncate">
              <SelectValue placeholder="Choose benefit" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-primary/20 bg-white/95 backdrop-blur-md shadow-xl">
              {simulatorBenefits.map((benefit) => {
                const Icon = benefit.icon;
                const translatedBenefitLabel = benefit.label === "Health Insurance Claim"
                  ? `${t("health_insurance", "Health Insurance")} ${t("claim", "Claim")}`
                  : benefit.label === "Ration Benefits Claim"
                    ? `${t("ration_benefits", "Ration Benefits")} ${t("claim", "Claim")}`
                    : benefit.label === "Pension Scheme Claim"
                      ? `${t("pension_scheme", "Pension Scheme")} ${t("claim", "Claim")}`
                      : `${t("education_aid", "Education Aid")} ${t("claim", "Claim")}`;
                return (
                  <SelectItem
                    key={benefit.label}
                    value={benefit.label}
                    className="rounded-lg py-2.5 pl-8 pr-3 text-[15px] font-medium transition-colors hover:bg-primary/10 focus:bg-primary/10"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{translatedBenefitLabel}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* SVG Gauge */}
        <div className="relative w-24 h-24 flex-shrink-0 self-center md:self-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`metric-strong ${isAssistedMode ? 'text-3xl' : 'text-[26px]'}`}>{percent}%</span>
            <span className="scheme-chip text-muted-foreground">{t("probability", "Probability")}</span>
          </div>
          <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-success ${isLoading ? 'animate-ping' : 'pulse-live'}`} />
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={isLoading}
        className={`w-full mt-3 py-2.5 rounded-xl gradient-primary claim-cta text-primary-foreground font-bold transition-all hover:opacity-95 disabled:opacity-50 ${isAssistedMode ? 'text-lg py-4' : 'text-sm'
          }`}
      >
        {isLoading ? t("simulating", "SIMULATING...") : t("simulate_claim", "SIMULATE CLAIM")}
      </button>
    </div>
  );
}
